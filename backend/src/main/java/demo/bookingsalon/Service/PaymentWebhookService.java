package demo.bookingsalon.Service;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Repository.BookingRepository;
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
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VnPayConfig vnPayConfig;

    /**
     * Xử lý webhook callback từ VNPay
     * Kiểm tra signature, update payment status, update booking status
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    @Retryable(
        retryFor = ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2.0)
    )
    public Map<String, Object> handleVNPayWebhook(Map<String, String> params) {
        log.info("Received VNPay webhook callback");
        
        // Lấy chữ ký từ callback
        String vnp_SecureHash = params.get("vnp_SecureHash");
        
        // Verify chữ ký
        boolean isValidSignature = VNPayUtil.verifySignature(params, vnPayConfig.getSecretKey(), vnp_SecureHash);
        if (!isValidSignature) {
            log.error("Invalid VNPay signature");
            return buildResponse(0, "Invalid signature");
        }
        
        try {
            String vnp_TxnRef = params.get("vnp_TxnRef");  // Payment code merchant trả về khi đã tạo từ trước gửi
            String vnp_ResponseCode = params.get("vnp_ResponseCode"); // Mã kết quả giao dịch (00-thành công)
            String vnp_TransactionNo = params.get("vnp_TransactionNo"); // Mã giao dịch do VNPay sinh
            String vnp_Amount = params.get("vnp_Amount"); // Số tiền thanh toán (phải chia lại 100 để lấy tiền thật)
            String vnp_PayDate = params.get("vnp_PayDate"); // Thời điểm thanh toán
            String vnp_BankCode = params.get("vnp_BankCode"); // Mã ngân hàng
            
            // Tìm Payment theo paymentCode (vnp_TxnRef)
            Payment payment = paymentRepository.findByPaymentCode(vnp_TxnRef)
                    .orElseThrow(() -> new NotFoundException("Payment not found with code: " + vnp_TxnRef));
            
            // Kiểm tra số tiền
            long callbackAmount = VNPayUtil.parseAmount(vnp_Amount);
            if (callbackAmount != payment.getAmount().longValue()) {
                log.error("Amount mismatch: expected {} but got {}", payment.getAmount(), callbackAmount);
                return buildResponse(0, "Amount mismatch");
            }
            
            // Tạo PaymentTransaction record
            LocalDateTime payDate = LocalDateTime.parse(
                    vnp_PayDate,
                    DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            PaymentStatus transactionStatus = "00".equals(vnp_ResponseCode)
                    ? PaymentStatus.SUCCESS
                    : PaymentStatus.FAILED;
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
            
            // Xử lý theo response code
            if ("00".equals(vnp_ResponseCode)) {
                // Thanh toán thành công
                return handlePaymentSuccess(payment);
            } else {
                // Thanh toán thất bại
                return handlePaymentFailure(payment, vnp_ResponseCode);
            }
            
        } catch (Exception e) {
            log.error("Error processing VNPay webhook", e);
            return buildResponse(0, "Error processing payment: " + e.getMessage());
        }
    }
    
    /**
     * Xử lý thanh toán thành công
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    private Map<String, Object> handlePaymentSuccess(Payment payment) {
        log.info("Payment successful for payment ID: {}", payment.getId());
        
        // Update payment status
        payment.transitionTo(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
        
        // Update booking sang CONFIRMED (Đã xác nhận)
        Booking booking = payment.getBooking();
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
        
        return buildResponse(1, "Payment processed successfully");
    }
    
    /**
     * Xử lý thanh toán thất bại
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    private Map<String, Object> handlePaymentFailure(Payment payment, String responseCode) {
        log.warn("Payment failed for payment ID: {} with code: {}", payment.getId(), responseCode);
        
        // Update payment status
        payment.transitionTo(PaymentStatus.FAILED);
        paymentRepository.save(payment);
        
        // Không cần update booking status vì nó vẫn giữ status hiện tại
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
     * Build response cho VNPay webhook
     * VNPay sẽ retry nếu không nhận được RspCode = 00
     */
    private Map<String, Object> buildResponse(int rspCode, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("RspCode", rspCode == 1 ? "00" : "01");  // 00 = success, 01 = fail
        response.put("Message", message);
        return response;
    }
}
