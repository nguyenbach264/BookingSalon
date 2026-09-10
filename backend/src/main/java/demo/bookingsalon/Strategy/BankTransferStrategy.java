package demo.bookingsalon.Strategy;

import demo.bookingsalon.Configuration.SepayConfig;
import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Payload.Request.Business.SepayPaymentRequest;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.SepayPaymentResponse;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Utility.IdempotencyService;
import demo.bookingsalon.Utility.QRCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class BankTransferStrategy implements PaymentStrategy {
    private final SepayConfig sepayConfig;
    private final PaymentRepository paymentRepository;
    private final IdempotencyService idempotencyService;
    private final QRCodeGenerator qrCodeGenerator;

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
                .gatewayTransactionNo(sepayResponse.getOrderId()) // mã sepay trả về
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
        // Giả định bank gửi params: refId, status, txnId, signature...
        String refId = payload.get("refId");
        String status = payload.get("status");
        String txnId = payload.get("txnId");

        // Idempotency
        String idemKey = "bank:cb:" + refId + ":" + txnId;
        if (!idempotencyService.tryLock(idemKey, 86400)) {
            log.info("Duplicate bank callback for refId: {}, ignored", refId);
            return;
        }

        // Get payment and validate status
        Payment payment = paymentRepository.findByPaymentCode(refId)
                .orElseThrow(() -> new PaymentException("Payment not found for refId: " + refId));

        if (payment.getStatus() != PaymentStatus.PROCESSING) {
            log.warn("Payment {} status is {}, skip callback update", refId, payment.getStatus());
            return;
        }

        // Create PaymentTransaction from bank response
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(payment);
        transaction.setMethod(PaymentMethod.BANK_TRANSFER);
        transaction.setTransactionRef(refId);
        transaction.setGatewayTransactionNo(txnId);
        transaction.setGatewayPayload(payload.toString());
        
        if ("SUCCESS".equalsIgnoreCase(status)) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            payment.transitionTo(PaymentStatus.SUCCESS);
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            payment.transitionTo(PaymentStatus.FAILED);
        }
        
        // Save transaction and payment (cascade will persist transaction)
        payment.getTransactions().add(transaction);
        paymentRepository.save(payment);
        
        log.info("Bank callback processed: refId={}, status={}, txnId={}", 
                refId, payment.getStatus(), txnId);
    }


}
