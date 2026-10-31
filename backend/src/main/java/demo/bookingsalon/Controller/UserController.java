package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.Request.Keycloak.ResetPasswordRequest;
import demo.bookingsalon.Payload.Request.Business.UpdateUserRequest;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Payload.Response.Common.PageResponse;
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

    @PostMapping(value = "/me/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<java.util.Map<String, String>> uploadMyAvatar(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (jwt == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        String avatarUrl = userService.uploadUserAvatar(keycloakId, file);
        return ResponseEntity.ok(java.util.Map.of("avatarUrl", avatarUrl));
    }

    @GetMapping
    public List<UserResponse> getUsers() {
        return userService.getUsers();
    }

    @PostMapping("/sync")
    public ResponseEntity<java.util.Map<String, Object>> syncUsersFromKeycloak() {
        int count = userService.syncUsersFromKeycloak();
        return ResponseEntity.ok(java.util.Map.of("message", "Đồng bộ thành công " + count + " người dùng từ Keycloak!"));
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return userService.getUserById(id);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<demo.bookingsalon.Payload.Response.Business.UserDetailSummaryResponse> getUserDetailSummary(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserDetailSummary(id));
    }

    @GetMapping("/keycloak/{id}")
    public ResponseEntity<UserResponse> getUserByKeycloakId(@PathVariable("id") UUID keycloakId) {
        return ResponseEntity.ok(userService.getUserInDbById(keycloakId));
    }

    @GetMapping("/{id}/roles")
    public List<String> getRoles(@PathVariable UUID id) {
        demo.bookingsalon.Entity.User user = userService.getUserEntityById(id);
        UUID keycloakId = (user != null && user.getKeycloakId() != null) ? user.getKeycloakId() : id;
        return roleService.getUserRealmRoles(keycloakId);
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
    public ResponseEntity<?> getUsersByPagination(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "0") int first,
            @RequestParam(defaultValue = "20") int max,
            @RequestParam(required = false) String search) {
        if (page != null || size != null) {
            int p = page != null ? page : (max > 0 ? first / max : 0);
            int s = size != null ? size : max;
            return ResponseEntity.ok(userService.getUsersPage(p, s, search));
        }
        return ResponseEntity.ok(userService.getUsersByPagination(first, max, search));
    }

    @GetMapping("/page")
    public ResponseEntity<PageResponse<UserResponse>> getUsersPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getUsersPage(page, size, search));
    }


    @GetMapping("/reverse")
    public ResponseEntity<String> reverseUser() {
        return ResponseEntity.status(HttpStatus.OK).body(userService.reverseUser());
    }
}