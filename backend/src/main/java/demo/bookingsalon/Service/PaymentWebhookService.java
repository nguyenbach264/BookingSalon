package demo.bookingsalon.Service;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Repository.PaymentTransactionRepository;
import demo.bookingsalon.Utility.VNPayUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentWebhookService {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VnPayConfig vnPayConfig;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    /**
     * Xử lý webhook IPN callback từ VNPay.
     * Hỗ trợ cả Booking Payments và Shop Orders.
     * - TxnRef bắt đầu "ORD" → Shop Order
     * - TxnRef khác → Booking Payment
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    @Retryable(
        retryFor = ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2.0)
    )
    public Map<String, Object> handleVNPayWebhook(Map<String, String> params) {
        log.info("Received VNPay IPN webhook callback: {}", params.get("vnp_TxnRef"));

        // 1. Verify signature
        String vnp_SecureHash = params.get("vnp_SecureHash");
        boolean isValidSignature = VNPayUtil.verifySignature(params, vnPayConfig.getSecretKey(), vnp_SecureHash);
        if (!isValidSignature) {
            log.error("Invalid VNPay signature for txnRef: {}", params.get("vnp_TxnRef"));
            return buildResponse(0, "Invalid signature");
        }

        try {
            String vnp_TxnRef = params.get("vnp_TxnRef");
            String vnp_ResponseCode = params.get("vnp_ResponseCode");
            String vnp_TransactionNo = params.get("vnp_TransactionNo");
            String vnp_Amount = params.get("vnp_Amount");
            String vnp_PayDate = params.get("vnp_PayDate");
            String vnp_BankCode = params.get("vnp_BankCode");

            // 2. Route to appropriate handler based on txnRef prefix
            if (vnp_TxnRef != null && vnp_TxnRef.startsWith("ORD")) {
                // Shop Order VNPay callback
                return handleShopOrderVnPayCallback(vnp_TxnRef, vnp_ResponseCode,
                        vnp_Amount, vnp_TransactionNo, vnp_BankCode, vnp_PayDate);
            }

            // Booking Payment VNPay callback
            Payment payment = paymentRepository.findByPaymentCode(vnp_TxnRef)
                    .orElseThrow(() -> new NotFoundException("Payment not found with code: " + vnp_TxnRef));

            // 3. Validate amount
            long callbackAmount = VNPayUtil.parseAmount(vnp_Amount);
            if (callbackAmount != payment.getAmount().longValue()) {
                log.error("Amount mismatch for payment {}: expected {} but got {}",
                        vnp_TxnRef, payment.getAmount(), callbackAmount);
                return buildResponse(0, "Amount mismatch");
            }

            // 4. Create PaymentTransaction record
            LocalDateTime payDate = vnp_PayDate != null
                    ? LocalDateTime.parse(vnp_PayDate, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    : LocalDateTime.now();
            PaymentStatus transactionStatus = "00".equals(vnp_ResponseCode)
                    ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .payment(payment)
                    .method(PaymentMethod.VNPAY)
                    .status(transactionStatus)
                    .gatewayTransactionNo(vnp_TransactionNo)
                    .amount(payment.getAmount())
                    .bankCode(vnp_BankCode)
                    .transactionRef("VNPay callback - " + vnp_TxnRef)
                    .createdAt(payDate)
                    .build();
            paymentTransactionRepository.save(transaction);

            // 5. Process result
            if ("00".equals(vnp_ResponseCode)) {
                return handleBookingPaymentSuccess(payment);
            } else {
                return handleBookingPaymentFailure(payment, vnp_ResponseCode);
            }

        } catch (Exception e) {
            log.error("Error processing VNPay webhook", e);
            return buildResponse(0, "Error processing payment: " + e.getMessage());
        }
    }

    /**
     * Xử lý VNPay callback cho Shop Orders (txnRef bắt đầu bằng "ORD")
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    private Map<String, Object> handleShopOrderVnPayCallback(
            String txnRef, String responseCode,
            String vnpAmount, String transactionNo,
            String bankCode, String payDate) {

        log.info("Processing VNPay callback for Shop Order: txnRef={}, responseCode={}", txnRef, responseCode);

        Order order = orderRepository.findByVnpayTxnRef(txnRef)
                .orElseThrow(() -> new NotFoundException("Shop order not found with VNPay txnRef: " + txnRef));

        if (order.getPaymentStatus() != null && order.getPaymentStatus().isPaid()) {
            log.info("Order {} already paid, ignoring duplicate callback", order.getOrderCode());
            return buildResponse(1, "Already processed");
        }

        if ("00".equals(responseCode)) {
            // Thanh toán thành công
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            log.info("Shop order {} paid successfully via VNPay, txnRef={}", order.getOrderCode(), txnRef);

            // Real-time notification via WebSocket
            try {
                notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                        "type", "ORDER_PAID",
                        "orderCode", order.getOrderCode(),
                        "message", "Thanh toán VNPay thành công cho đơn hàng " + order.getOrderCode()
                ));
            } catch (Exception e) {
                log.warn("Failed to send WebSocket notification for order {}: {}", order.getOrderCode(), e.getMessage());
            }

            return buildResponse(1, "Order payment successful");
        } else {
            // Thanh toán thất bại
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
            log.warn("Shop order {} VNPay payment failed, code={}", order.getOrderCode(), responseCode);

            try {
                notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                        "type", "ORDER_PAYMENT_FAILED",
                        "orderCode", order.getOrderCode(),
                        "message", "Thanh toán VNPay thất bại cho đơn hàng " + order.getOrderCode()
                ));
            } catch (Exception ignored) {}

            return buildResponse(0, "Order payment failed with code: " + responseCode);
        }
    }

    /**
     * Xử lý thanh toán booking thành công
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    private Map<String, Object> handleBookingPaymentSuccess(Payment payment) {
        log.info("Booking payment successful for payment ID: {}", payment.getId());
        payment.transitionTo(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        return buildResponse(1, "Payment processed successfully");
    }

    /**
     * Xử lý thanh toán booking thất bại
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    private Map<String, Object> handleBookingPaymentFailure(Payment payment, String responseCode) {
        log.warn("Booking payment failed for payment ID: {} with code: {}", payment.getId(), responseCode);
        payment.transitionTo(PaymentStatus.FAILED);
        paymentRepository.save(payment);
        return buildResponse(0, "Payment failed with code: " + responseCode);
    }

    /**
     * Verify payment status (dùng khi cần check status từ VNPay)
     */
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public PaymentStatus getPaymentStatus(String paymentCode) {
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        return payment.getStatus();
    }

    /**
     * Build response cho VNPay IPN endpoint.
     * VNPay sẽ retry nếu không nhận được RspCode = 00
     */
    private Map<String, Object> buildResponse(int rspCode, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("RspCode", rspCode == 1 ? "00" : "01");
        response.put("Message", message);
        return response;
    }
}
