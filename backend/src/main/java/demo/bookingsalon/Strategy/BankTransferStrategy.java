package demo.bookingsalon.Strategy;

import demo.bookingsalon.Configuration.SepayConfig;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Request.Business.SepayPaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Payload.Response.Business.SepayPaymentResponse;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Service.NotificationService;
import demo.bookingsalon.Utility.IdempotencyService;
import demo.bookingsalon.Utility.QRCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class BankTransferStrategy implements PaymentStrategy {
    private final SepayConfig sepayConfig;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final IdempotencyService idempotencyService;
    private final QRCodeGenerator qrCodeGenerator;
    private final NotificationService notificationService;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Override
    public PaymentTransaction generatePayment(Payment payment, CreatePaymentRequest createPaymentRequest) {
        log.info("Initiating bank transfer for payment: {}", payment.getPaymentCode());

        SepayPaymentRequest sepayRequest = SepayPaymentRequest.builder()
                .merchantId(sepayConfig.getMerchantId())
                .currency("VND")
                .orderAmount(String.valueOf(createPaymentRequest.getAmount().longValue() * 100))
                .orderDescription("Thanh toan don hang " + payment.getBooking())
                .orderInvoiceNumber(payment.getPaymentCode())
                .successUrl("http://localhost:5173")
                .errorUrl("http://localhost:5173")
                .cancelUrl("http://localhost:5173")
                .build();

        SepayPaymentResponse sepayResponse = qrCodeGenerator.createSepayPayment(sepayRequest);

        PaymentTransaction paymentTransaction = PaymentTransaction.builder()
                .method(PaymentMethod.BANK_TRANSFER)
                .payment(payment)
                .gatewayPayload("Sepay: " + sepayResponse.getPaymentUrl())
                .expiredAt(payment.getCreatedAt().plusMinutes(5))
                .gatewayTransactionNo(sepayResponse.getOrderId())
                .version(1)
                .status(PaymentStatus.PROCESSING)
                .build();

        payment.setPaymentUrl(sepayResponse.getPaymentUrl());
        payment.setQrCodeData(sepayResponse.getQrCodeUrl());

        return paymentTransaction;
    }

    @Override
    public PaymentResponse refund(Payment payment, BigDecimal amount) {
        return null;
    }

    @Override
    public PaymentMethod getType() {
        return PaymentMethod.BANK_TRANSFER;
    }

    @Override
    @Transactional
    public void verifyCallback(Map<String, String> payload) {
        log.info("Processing bank transfer callback payload: {}", payload);

        // 1. Trích xuất mã giao dịch ngân hàng
        String txnId = payload.getOrDefault("txnId",
                payload.getOrDefault("id",
                        payload.getOrDefault("referenceCode", UUID.randomUUID().toString())));
        String status = payload.getOrDefault("status", "SUCCESS");

        // 2. Tìm mã đơn hàng (DH...) hoặc mã thanh toán (PAY... / BB-...)
        String refId = payload.get("refId");
        String content = payload.getOrDefault("content",
                payload.getOrDefault("orderDescription",
                        payload.getOrDefault("description", "")));

        String detectedCode = null;
        if (refId != null && !refId.isBlank()) {
            detectedCode = refId.trim();
        } else if (content != null && !content.isBlank()) {
            Pattern pattern = Pattern.compile("(DH[A-Za-z0-9-]+|PAY[A-Za-z0-9-]+|BB-[A-Za-z0-9-]+)");
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                detectedCode = matcher.group(1);
            }
        }

        if (detectedCode == null || detectedCode.isBlank()) {
            log.warn("Cannot identify order or payment code in bank callback: {}", payload);
            return;
        }

        // 3. Chống Callback trùng lặp bằng Idempotency Lock
        String idemKey = "bank:cb:" + detectedCode + ":" + txnId;
        if (!idempotencyService.tryLock(idemKey, 86400)) {
            log.info("Duplicate bank callback for code: {}, txnId: {}, ignored", detectedCode, txnId);
            return;
        }

        // 4. TRƯỜNG HỢP A: Đơn hàng sản phẩm (Mã bắt đầu bằng "DH")
        if (detectedCode.startsWith("DH")) {
            Optional<Order> orderOpt = orderRepository.findByOrderCode(detectedCode);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                if (order.getPaymentStatus() != null && order.getPaymentStatus().isPaid()) {
                    log.info("Order {} is already PAID. Skipping duplicate processing.", detectedCode);
                    return;
                }

                if ("SUCCESS".equalsIgnoreCase(status) || "in".equalsIgnoreCase(payload.get("transferType"))) {
                    order.setPaymentStatus(PaymentStatus.SUCCESS);
                    order.setStatus(OrderStatus.CONFIRMED);
                    orderRepository.save(order);

                    // Tạo bản ghi Payment & PaymentTransaction lưu lịch sử
                    Payment payment = Payment.builder()
                            .paymentCode("PAY-" + detectedCode)
                            .user(order.getUser())
                            .amount(order.getFinalAmount())
                            .paymentMethod(PaymentMethod.BANK_TRANSFER)
                            .status(PaymentStatus.SUCCESS)
                            .version(1)
                            .transactions(new ArrayList<>())
                            .build();

                    PaymentTransaction transaction = PaymentTransaction.builder()
                            .payment(payment)
                            .method(PaymentMethod.BANK_TRANSFER)
                            .transactionRef("BANK-" + txnId)
                            .gatewayTransactionNo(txnId)
                            .gatewayPayload(payload.toString())
                            .amount(order.getFinalAmount())
                            .status(PaymentStatus.SUCCESS)
                            .build();
                    payment.getTransactions().add(transaction);
                    paymentRepository.save(payment);

                    log.info("Successfully reconciled bank payment for Order: {}", detectedCode);

                    // Bất đồng bộ: Phát thông báo thời gian thực qua WebSocket
                    try {
                        notificationService.notifyOrderPaid(order.getUser().getId(), order.getOrderCode(), order.getFinalAmount());
                        notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                                "type", "ORDER_PAID",
                                "orderCode", order.getOrderCode(),
                                "paymentStatus", "PAID",
                                "status", "CONFIRMED"
                        ));
                        notificationWebSocketHandler.broadcast(Map.of(
                                "type", "ORDER_STATUS_CHANGED",
                                "orderCode", order.getOrderCode(),
                                "status", "CONFIRMED"
                        ));
                    } catch (Exception e) {
                        log.error("Failed to dispatch WebSocket after bank callback: {}", e.getMessage());
                    }
                }
                return;
            }
        }

        // 5. TRƯỜNG HỢP B: Lịch hẹn salon (Mã "PAY..." hoặc Booking code)
        Optional<Payment> paymentOpt = paymentRepository.findByPaymentCode(detectedCode);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                log.info("Payment {} already SUCCESS, skipping duplicate callback", detectedCode);
                return;
            }

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .payment(payment)
                    .method(PaymentMethod.BANK_TRANSFER)
                    .transactionRef(detectedCode)
                    .gatewayTransactionNo(txnId)
                    .gatewayPayload(payload.toString())
                    .amount(payment.getAmount())
                    .status("SUCCESS".equalsIgnoreCase(status) ? PaymentStatus.SUCCESS : PaymentStatus.FAILED)
                    .build();

            if ("SUCCESS".equalsIgnoreCase(status) || "in".equalsIgnoreCase(payload.get("transferType"))) {
                payment.transitionTo(PaymentStatus.SUCCESS);
                if (payment.getBooking() != null) {
                    payment.getBooking().setStatus(BookingStatus.CONFIRMED);
                    payment.getBooking().setPaymentStatus("PAID");
                }
            } else {
                payment.transitionTo(PaymentStatus.FAILED);
            }

            payment.getTransactions().add(transaction);
            paymentRepository.save(payment);
            log.info("Bank callback processed for booking payment: {}", detectedCode);
        }
    }
}
