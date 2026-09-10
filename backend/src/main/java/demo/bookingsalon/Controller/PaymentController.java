package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Service.PaymentApplicationService;
import demo.bookingsalon.Service.PaymentWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentApplicationService paymentService;
    private final PaymentWebhookService paymentWebhookService;

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
     * Webhook endpoint để nhận callback từ VNPay
     * POST /api/v1/payments/webhook/vnpay
     * VNPay sẽ gửi callback đến URL này khi thanh toán hoàn tất
     */
    @PostMapping("/webhook/vnpay")
    public ResponseEntity<Map<String, Object>> handleVNPayWebhook(@RequestParam Map<String, String> params) {
        Map<String, Object> response = paymentWebhookService.handleVNPayWebhook(params);
        return ResponseEntity.ok(response);
    }

    /**
     * Return URL endpoint - User được redirect về đây sau khi thanh toán trên VNPay
     * GET /webhooks/vnpay/callback?vnp_ResponseCode=00&vnp_TxnRef=PAY...
     * Frontend xử lý redirect này để hiển thị kết quả thanh toán
     */
    @RequestMapping(path = "/webhooks/vnpay/callback", method = RequestMethod.GET)
    public ResponseEntity<Map<String, Object>> handleVNPayReturn(
            @RequestParam(required = false) String vnp_ResponseCode,
            @RequestParam(required = false) String vnp_TxnRef) {
        
        log.info("VNPay return callback received: responseCode={}, txnRef={}", vnp_ResponseCode, vnp_TxnRef);
        
        Map<String, Object> response = new HashMap<>();
        
        if ("00".equals(vnp_ResponseCode)) {
            response.put("status", "success");
            response.put("message", "Payment successful");
            response.put("paymentCode", vnp_TxnRef);
        } else {
            response.put("status", "failed");
            response.put("message", "Payment failed");
            response.put("responseCode", vnp_ResponseCode);
            response.put("paymentCode", vnp_TxnRef);
        }
        
        return ResponseEntity.ok(response);
    }
}