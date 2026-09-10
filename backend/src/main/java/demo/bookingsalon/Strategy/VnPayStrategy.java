package demo.bookingsalon.Strategy;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Utility.IdempotencyService;
import demo.bookingsalon.Utility.QRCodeGenerator;
import demo.bookingsalon.Utility.VnPaySignatureUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class VnPayStrategy implements PaymentStrategy {
    private final PaymentRepository paymentRepository;
    private final VnPayConfig config;
    private final IdempotencyService idempotencyService;
    private final QRCodeGenerator qrCodeGenerator;

    @Override
    public PaymentMethod getType() {
        return PaymentMethod.VNPAY;
    }

    @Override
    public PaymentTransaction generatePayment(Payment payment, CreatePaymentRequest request) {
        log.info("Initiating VNPay for payment: {}", payment.getPaymentCode());

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getTmnCode());
        params.put("vnp_Amount", String.valueOf(payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", payment.getPaymentCode());
        params.put("vnp_OrderInfo", "Thanh toan don hang " + payment.getBooking().getId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", config.getReturnUrl());
        params.put("vnp_IpAddr", "127.0.0.1"); // Lấy IP thực tế từ HttpServletRequest nếu có

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        params.put("vnp_CreateDate", LocalDateTime.now().format(formatter));
        params.put("vnp_ExpireDate", LocalDateTime.now().plusMinutes(15).format(formatter));

        String query = VnPaySignatureUtil.buildQueryString(params);
        String secureHash = VnPaySignatureUtil.hmacSHA512(config.getSecretKey(), query);
        String paymentUrl = config.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;

        // Generate QR Code từ payment URL
        String qrCodeData = qrCodeGenerator.generateQRCodeAsBase64(paymentUrl);

        PaymentTransaction tx = new PaymentTransaction();
        tx.setPayment(payment);
        tx.setMethod(PaymentMethod.VNPAY);
        tx.setTransactionRef(payment.getPaymentCode());
        tx.setStatus(PaymentStatus.PENDING);
        tx.setAmount(payment.getAmount());
        tx.setCreatedAt(LocalDateTime.now());
        tx.setExpiredAt(LocalDateTime.now().plusMinutes(15));
        
        // Store payment URL & QR Code in transaction (có thể sử dụng field description hoặc tạo field mới)
        tx.setGatewayPayload("VNPay URL: " + paymentUrl);
        
        log.info("VNPay URL generated for payment: {}, QR Code created", payment.getPaymentCode());
        
        // Store QR Code & URL vào Payment entity để trả về response
        payment.setPaymentUrl(paymentUrl);
        payment.setQrCodeData(qrCodeData);
        
        return tx;
    }

    @Override
    public PaymentResponse refund(Payment payment, BigDecimal amount) {
        log.warn("VNPay refund is not implemented yet");
        return null;
    }

    @Override
    @Transactional
    public void verifyCallback(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        String secureHash = params.get("vnp_SecureHash");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        // 1. Validate signature
        Map<String, String> validParams = new TreeMap<>(params);
        validParams.remove("vnp_SecureHash");
        validParams.remove("vnp_SecureHashType");
        String computedHash = VnPaySignatureUtil.hmacSHA512(
                config.getSecretKey(),
                VnPaySignatureUtil.buildQueryString(validParams)
        );
        if (!computedHash.equals(secureHash)) {
            log.error("Invalid VNPay signature for txnRef: {}", txnRef);
            throw new PaymentException("Invalid VNPay signature");
        }

        // 2. Idempotency
        String idemKey = "vnpay:cb:" + txnRef + ":" + transactionNo;
        if (!idempotencyService.tryLock(idemKey, 86400)) {
            log.info("Duplicate VNPay callback for txnRef: {}, ignored", txnRef);
            return;
        }

        // 3. Get payment and validate status
        Payment payment = paymentRepository.findByPaymentCode(txnRef)
                .orElseThrow(() -> new PaymentException("Payment not found: " + txnRef));

        if (payment.getStatus() != PaymentStatus.PROCESSING) {
            log.warn("Payment {} status is {}, skip callback update", txnRef, payment.getStatus());
            return;
        }

        // 4. Create PaymentTransaction from gateway response
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(payment);
        transaction.setMethod(PaymentMethod.VNPAY);
        transaction.setTransactionRef(txnRef);
        transaction.setGatewayTransactionNo(transactionNo);
        transaction.setGatewayPayload(params.toString());
        
        if ("00".equals(responseCode)) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            payment.transitionTo(PaymentStatus.SUCCESS);
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            payment.transitionTo(PaymentStatus.FAILED);
        }
        
        // 5. Save transaction and payment (cascade will persist transaction)
        payment.getTransactions().add(transaction);
        paymentRepository.save(payment);
        
        log.info("VNPay callback processed: txnRef={}, status={}, gatewayTxnNo={}", 
                txnRef, payment.getStatus(), transactionNo);
    }
}
