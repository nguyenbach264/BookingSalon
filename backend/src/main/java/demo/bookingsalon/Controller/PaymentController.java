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

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @GetMapping
    public ResponseEntity<?> getPayment() {
        return ResponseEntity.ok(paymentService.getPayments());
    }

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
}