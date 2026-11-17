package demo.bookingsalon.controller;

import demo.bookingsalon.dto.VoucherDTO;
import demo.bookingsalon.dto.request.business.ApplyVoucherRequest;
import demo.bookingsalon.dto.request.business.CreateVoucherRequest;
import demo.bookingsalon.dto.response.business.ApplyVoucherResponse;
import demo.bookingsalon.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    // Admin APIs
    @GetMapping("/admin")
    public ResponseEntity<List<VoucherDTO>> getAllVouchersForAdmin() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping("/admin")
    public ResponseEntity<VoucherDTO> createVoucher(@Valid @RequestBody CreateVoucherRequest request) {
        return ResponseEntity.ok(voucherService.createVoucher(request));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteVoucher(@PathVariable UUID id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }

    // Public / User APIs
    @GetMapping({"/available", "/public"})
    public ResponseEntity<List<VoucherDTO>> getAvailableVouchers(@RequestParam(required = false) UUID userId) {
        return ResponseEntity.ok(voucherService.getAvailableVouchers(userId));
    }

    @demo.bookingsalon.security.ratelimit.RateLimit(
        keyPrefix = "voucher",
        type = demo.bookingsalon.security.ratelimit.RateLimitType.IP_OR_USER,
        capacity = 10,
        durationSeconds = 60,
        message = "Bạn đã thử kiểm tra voucher quá nhiều lần. Vui lòng chờ 1 phút trước khi thử lại!"
    )
    @PostMapping("/apply")
    public ResponseEntity<ApplyVoucherResponse> applyVoucher(@Valid @RequestBody ApplyVoucherRequest request) {
        return ResponseEntity.ok(voucherService.validateAndCalculate(request));
    }
}

