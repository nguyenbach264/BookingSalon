package demo.bookingsalon.Controller;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Service.PaymentApplicationService;
import demo.bookingsalon.Service.PaymentWebhookService;
import demo.bookingsalon.Utility.VNPayUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentApplicationService paymentService;
    private final PaymentWebhookService paymentWebhookService;
    private final VnPayConfig vnPayConfig;
    private final demo.bookingsalon.Repository.OrderRepository orderRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @GetMapping
    public ResponseEntity<?> getPayment() {
        return ResponseEntity.ok(paymentService.getPayments());
    }

    @demo.bookingsalon.Security.RateLimit.RateLimit(
        keyPrefix = "payment",
        type = demo.bookingsalon.Security.RateLimit.RateLimitType.IP_OR_USER,
        capacity = 5,
        durationSeconds = 60,
        message = "Bạn đang gửi yêu cầu thanh toán quá nhanh. Vui lòng chờ 1 phút!"
    )
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.checkout(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<?> deletePayment(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(paymentService.deletePayment(id));
    }

    @DeleteMapping("/booking/{id}")
    public ResponseEntity<?> deletePaymentByBookingId(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(paymentService.deleteByBookingId(id));
    }

    @GetMapping("/{paymentCode}/status")
    public ResponseEntity<PaymentResponse> getStatus(@PathVariable String paymentCode) {
        PaymentResponse response = paymentService.getStatus(paymentCode);
        return ResponseEntity.ok(response);
    }

    /**
     * VNPay IPN (Instant Payment Notification) webhook.
     * VNPay sends this server-to-server when payment completes.
     */
    @PostMapping("/webhook/vnpay")
    public ResponseEntity<Map<String, Object>> handleVNPayWebhook(@RequestParam Map<String, String> params) {
        Map<String, Object> response = paymentWebhookService.handleVNPayWebhook(params);
        return ResponseEntity.ok(response);
    }

    /**
     * VNPay Return URL - User is redirected here after payment on VNPay.
     * Verifies signature, updates order status, then redirects to frontend.
     * GET /api/v1/payments/webhook/vnpay/return?vnp_ResponseCode=00&vnp_TxnRef=ORD...
     */
    @GetMapping("/webhook/vnpay/return")
    public void handleVNPayReturn(
            @RequestParam Map<String, String> allParams,
            HttpServletResponse response) throws IOException {

        String vnp_ResponseCode = allParams.get("vnp_ResponseCode");
        String vnp_TxnRef       = allParams.get("vnp_TxnRef");
        String vnp_OrderInfo    = allParams.get("vnp_OrderInfo");
        String vnp_Amount       = allParams.get("vnp_Amount");
        String vnp_SecureHash   = allParams.get("vnp_SecureHash");

        log.info("VNPay return callback: responseCode={}, txnRef={}", vnp_ResponseCode, vnp_TxnRef);

        // 1. Verify signature (prevent spoofed returns)
        boolean signatureValid = VNPayUtil.verifySignature(allParams, vnPayConfig.getSecretKey(), vnp_SecureHash);
        if (!signatureValid) {
            log.warn("VNPay return URL: invalid signature for txnRef={}", vnp_TxnRef);
            response.sendRedirect(frontendBaseUrl + "/payment/result?responseCode=97&error=invalid_signature");
            return;
        }

        // 2. Process payment status update (handles idempotency internally)
        try {
            paymentWebhookService.handleVNPayWebhook(allParams);
        } catch (Exception e) {
            log.warn("VNPay return: webhook processing error (non-fatal): {}", e.getMessage());
        }

        // 3. Redirect to frontend payment result page
        StringBuilder redirectUrl = new StringBuilder(frontendBaseUrl + "/payment/result");
        redirectUrl.append("?responseCode=").append(vnp_ResponseCode != null ? vnp_ResponseCode : "99");
        if (vnp_TxnRef != null)
            redirectUrl.append("&txnRef=").append(URLEncoder.encode(vnp_TxnRef, StandardCharsets.UTF_8));
        if (vnp_Amount != null)
            redirectUrl.append("&amount=").append(vnp_Amount);
        if (vnp_OrderInfo != null)
            redirectUrl.append("&orderInfo=").append(URLEncoder.encode(vnp_OrderInfo, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl.toString());
    }

    /**
     * VNPay Sandbox Simulator - Xử lý giả lập thanh toán từ frontend simulator.
     * Tự động ký hash HMAC-SHA512 hợp lệ và gọi webhook cập nhật trạng thái đơn hàng.
     */
    @PostMapping("/simulator/process")
    public ResponseEntity<Map<String, Object>> processSimulatorPayment(@RequestBody Map<String, String> payload) {
        String vnp_ResponseCode = payload.getOrDefault("vnp_ResponseCode", "00");
        String vnp_TxnRef = payload.get("vnp_TxnRef");
        String vnp_Amount = payload.get("vnp_Amount");
        String vnp_OrderInfo = payload.getOrDefault("vnp_OrderInfo", "Thanh toan don hang " + vnp_TxnRef);
        String vnp_BankCode = payload.getOrDefault("vnp_BankCode", "NCB");
        String vnp_CardType = payload.getOrDefault("vnp_CardType", "ATM");

        String vnp_TransactionNo = String.valueOf(System.currentTimeMillis()).substring(3);
        String vnp_PayDate = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        Map<String, String> params = new java.util.TreeMap<>();
        params.put("vnp_Amount", vnp_Amount != null ? vnp_Amount : "0");
        params.put("vnp_BankCode", vnp_BankCode);
        params.put("vnp_BankTranNo", "VNP" + vnp_TransactionNo);
        params.put("vnp_CardType", vnp_CardType);
        params.put("vnp_OrderInfo", vnp_OrderInfo);
        params.put("vnp_PayDate", vnp_PayDate);
        params.put("vnp_ResponseCode", vnp_ResponseCode);
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_TransactionNo", vnp_TransactionNo);
        params.put("vnp_TransactionStatus", "00".equals(vnp_ResponseCode) ? "00" : "02");
        if (vnp_TxnRef != null) {
            params.put("vnp_TxnRef", vnp_TxnRef);
        }

        // Tạo chữ ký số chuẩn VNPay HMAC-SHA512
        String secureHash = VNPayUtil.generateSignature(params, vnPayConfig.getSecretKey());
        params.put("vnp_SecureHash", secureHash);

        log.info("Processing VNPay Sandbox Simulator payment: txnRef={}, code={}, bank={}", vnp_TxnRef, vnp_ResponseCode, vnp_BankCode);

        // Kích hoạt xử lý webhook đồng bộ đơn hàng / lịch hẹn
        try {
            paymentWebhookService.handleVNPayWebhook(params);
        } catch (Exception e) {
            log.error("Simulator webhook execution error: {}", e.getMessage(), e);
        }

        String redirectUrl = frontendBaseUrl + "/payment/result?responseCode=" + vnp_ResponseCode
                + (vnp_TxnRef != null ? "&txnRef=" + URLEncoder.encode(vnp_TxnRef, StandardCharsets.UTF_8) : "")
                + (vnp_Amount != null ? "&amount=" + vnp_Amount : "")
                + (vnp_OrderInfo != null ? "&orderInfo=" + URLEncoder.encode(vnp_OrderInfo, StandardCharsets.UTF_8) : "");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "responseCode", vnp_ResponseCode,
                "redirectUrl", redirectUrl
        ));
    }

    /**
     * VNPay Sandbox Simulator - Lấy thông tin đơn hàng để hiển thị trên giao diện simulator.
     */
    @GetMapping("/simulator/order-info")
    public ResponseEntity<?> getSimulatorOrderInfo(@RequestParam("txnRef") String txnRef) {
        if (txnRef == null || txnRef.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "txnRef is required"));
        }
        if (txnRef.startsWith("ORD")) {
            var orderOpt = orderRepository.findByVnpayTxnRef(txnRef)
                    .or(() -> orderRepository.findByOrderCode(txnRef));
            if (orderOpt.isPresent()) {
                var order = orderOpt.get();
                return ResponseEntity.ok(Map.of(
                        "type", "ORDER",
                        "orderCode", order.getOrderCode(),
                        "finalAmount", order.getFinalAmount(),
                        "receiverName", order.getReceiverName() != null ? order.getReceiverName() : "",
                        "shippingAddress", order.getShippingAddress() != null ? order.getShippingAddress() : "",
                        "status", order.getStatus().name(),
                        "paymentStatus", order.getPaymentStatus().name()
                ));
            }
        }
        return ResponseEntity.ok(Map.of("type", "UNKNOWN", "txnRef", txnRef));
    }

    /**
     * VNPay Sandbox Simulator - GET redirect fallback
     */
    @GetMapping("/simulator/redirect")
    public void handleSimulatorRedirect(
            @RequestParam Map<String, String> allParams,
            HttpServletResponse response) throws IOException {
        String vnp_ResponseCode = allParams.getOrDefault("vnp_ResponseCode", "00");
        String vnp_TxnRef = allParams.get("vnp_TxnRef");
        String vnp_Amount = allParams.get("vnp_Amount");
        String vnp_OrderInfo = allParams.getOrDefault("vnp_OrderInfo", "Thanh toan don hang " + vnp_TxnRef);
        String vnp_BankCode = allParams.getOrDefault("vnp_BankCode", "NCB");

        String vnp_TransactionNo = String.valueOf(System.currentTimeMillis()).substring(3);
        String vnp_PayDate = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        Map<String, String> params = new java.util.TreeMap<>(allParams);
        params.put("vnp_ResponseCode", vnp_ResponseCode);
        params.put("vnp_BankCode", vnp_BankCode);
        params.put("vnp_BankTranNo", "VNP" + vnp_TransactionNo);
        params.put("vnp_TransactionNo", vnp_TransactionNo);
        params.put("vnp_PayDate", vnp_PayDate);
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_TransactionStatus", "00".equals(vnp_ResponseCode) ? "00" : "02");

        String secureHash = VNPayUtil.generateSignature(params, vnPayConfig.getSecretKey());
        params.put("vnp_SecureHash", secureHash);

        try {
            paymentWebhookService.handleVNPayWebhook(params);
        } catch (Exception e) {
            log.error("Simulator webhook error: {}", e.getMessage());
        }

        StringBuilder redirectUrl = new StringBuilder(frontendBaseUrl + "/payment/result");
        redirectUrl.append("?responseCode=").append(vnp_ResponseCode);
        if (vnp_TxnRef != null)
            redirectUrl.append("&txnRef=").append(URLEncoder.encode(vnp_TxnRef, StandardCharsets.UTF_8));
        if (vnp_Amount != null)
            redirectUrl.append("&amount=").append(vnp_Amount);
        if (vnp_OrderInfo != null)
            redirectUrl.append("&orderInfo=").append(URLEncoder.encode(vnp_OrderInfo, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl.toString());
    }
}