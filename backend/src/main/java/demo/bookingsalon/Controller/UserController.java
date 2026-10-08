package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.Request.Keycloak.ResetPasswordRequest;
import demo.bookingsalon.Payload.Request.Business.UpdateUserRequest;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Service.Keycloak.RoleService;
import demo.bookingsalon.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * UserController - quan ly user (danh cho ADMIN).
 * Luu y: Dang ky moi -> POST /api/auth/register, Dang nhap -> /api/auth/login
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RoleService roleService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {
        if (jwt == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(userService.getCurrentUserProfile(keycloakId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
                                                        @RequestBody UpdateUserRequest request) {
        if (jwt == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(userService.updateCurrentUserProfile(keycloakId, request));
    }

    @PostMapping("/me/send-verify-email")
    public ResponseEntity<?> sendVerifyEmailOtp(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {
        if (jwt == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        userService.sendEmailVerificationOtp(keycloakId);
        return ResponseEntity.ok(java.util.Map.of("message", "Mã xác thực OTP đã được gửi tới email của bạn!"));
    }

    @PostMapping("/me/verify-email")
    public ResponseEntity<?> verifyEmailOtp(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
                                            @RequestBody java.util.Map<String, String> body) {
        if (jwt == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        String otp = body.get("otp");
        if (otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Vui lòng nhập mã OTP!"));
        }
        boolean success = userService.verifyUserEmail(keycloakId, otp);
        if (!success) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Mã OTP không chính xác hoặc đã hết hạn!"));
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Xác thực email thành công!"));
    }

    @GetMapping
    public List<UserResponse> getUsers() {
        return userService.getUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return userService.getUserById(id);
    }

    @GetMapping("/keycloak/{id}")
    public ResponseEntity<UserResponse> getUserByKeycloakId(@PathVariable("id") UUID keycloakId) {
        return ResponseEntity.ok(userService.getUserInDbById(keycloakId));
    }

    @GetMapping("/{id}/roles")
    public List<String> getRoles(@PathVariable UUID id) {
        return roleService.getUserRealmRoles(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateUser(@PathVariable UUID id,
                                           @RequestBody @Valid UpdateUserRequest request) {
        userService.updateUser(id, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable UUID id,
                                              @RequestBody @Valid ResetPasswordRequest request) {
        userService.resetPassword(id, request.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/paginated")
    public ResponseEntity<List<UserResponse>> getUsersByPagination(
            @RequestParam(defaultValue = "0") int first,
            @RequestParam(defaultValue = "20") int max,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getUsersByPagination(first, max, search));
    }

    @GetMapping("/reverse")
    public ResponseEntity<String> reverseUser() {
        return ResponseEntity.status(HttpStatus.OK).body(userService.reverseUser());
    }
}