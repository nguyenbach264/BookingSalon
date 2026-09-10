package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.OtpPolicyRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateExecutionRequirementRequest;
import demo.bookingsalon.Payload.Response.Keycloak.CredentialResponse;
import demo.bookingsalon.Payload.Response.Keycloak.OtpStatusResponse;
import demo.bookingsalon.Service.Keycloak.OtpPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/otp")
public class OtpPolicyController {
    private final OtpPolicyService otpService;

    // ═══════════════════════════════════════════════════════════════════
    // OTP POLICY
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping()
    public ResponseEntity<OtpPolicyRequest> getOTPPolicy() {
        return ResponseEntity.ok(otpService.getOTPPolicy());
    }

    @PutMapping()
    public ResponseEntity<Void> updateOTPPolicy(@RequestBody @Valid OtpPolicyRequest request) {
        otpService.updateOTPPolicy(request);
        return ResponseEntity.ok().build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // USER CREDENTIALS
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/users/{userId}/credentials")
    public ResponseEntity<List<CredentialResponse>> getUserCredentials(@PathVariable String userId) {
        return ResponseEntity.ok(otpService.getUserCredentials(userId));
    }

    @DeleteMapping("/users/{userId}/credentials/{credentialId}")
    public ResponseEntity<Void> deleteUserCredential(
            @PathVariable String userId,
            @PathVariable String credentialId) {
        otpService.deleteUserCredential(userId, credentialId);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // USER REQUIRED ACTIONS (CONFIGURE_TOTP)
    // ═══════════════════════════════════════════════════════════════════

    @PostMapping("/users/{userId}/enable")
    public ResponseEntity<Void> enableOTPForUser(@PathVariable String userId) {
        otpService.enableOTPForUser(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}/disable")
    public ResponseEntity<Void> disableOTPForUser(@PathVariable String userId) {
        otpService.disableOTPForUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/required-actions")
    public ResponseEntity<List<String>> getUserRequiredActions(@PathVariable String userId) {
        return ResponseEntity.ok(otpService.getUserRequiredActions(userId));
    }

    // ═══════════════════════════════════════════════════════════════════
    // AUTHENTICATION FLOW OTP EXECUTION
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/flow/{flowAlias}/otp-requirement")
    public ResponseEntity<String> getOTPRequirement(@PathVariable String flowAlias) {
        String requirement = otpService.getOTPExecutionRequirement(flowAlias);
        return ResponseEntity.ok(requirement);
    }

    @PutMapping("/flow/{flowAlias}/otp-requirement")
    public ResponseEntity<Void> updateOTPRequirement(
            @PathVariable String flowAlias,
            @RequestBody @Valid UpdateExecutionRequirementRequest request) {
        otpService.updateOTPExecutionRequirement(flowAlias, request.getRequirement());
        return ResponseEntity.ok().build();
    }

    // Tiện ích: bật/tắt OTP bắt buộc toàn realm (flow browser)
    @PostMapping("/realm/otp-required")
    public ResponseEntity<Void> enableOTPRequired() {
        otpService.enableOTPRequired();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/realm/otp-required")
    public ResponseEntity<Void> disableOTPRequired() {
        otpService.disableOTPRequired();
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // OTP STATUS (tổng hợp cho user)
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/users/{userId}/status")
    public ResponseEntity<OtpStatusResponse> getOTPStatus(@PathVariable String userId) {
        return ResponseEntity.ok(otpService.getOTPStatus(userId));
    }
}
