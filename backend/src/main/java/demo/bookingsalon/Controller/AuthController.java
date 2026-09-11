package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.Request.Business.LoginRequest;
import demo.bookingsalon.Payload.Request.Business.OAuth2TokenRequest;
import demo.bookingsalon.Payload.Request.Business.RegisterRequest;
import demo.bookingsalon.Payload.Request.Business.SendOtpRequest;
import demo.bookingsalon.Payload.Request.Business.VerifyOtpRequest;
import demo.bookingsalon.Payload.Response.Business.AuthResponse;
import demo.bookingsalon.Service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login — Đăng nhập trực tiếp qua username & password
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // POST /api/auth/register/send-otp — Gửi mã OTP xác thực qua email (rate-limit 60s)
    @PostMapping("/register/send-otp")
    public ResponseEntity<Map<String, String>> sendRegisterOtp(@RequestBody @Valid SendOtpRequest request) {
        authService.sendRegistrationOtp(request);
        return ResponseEntity.ok(Map.of(
                "message", "Mã xác thực OTP đã được gửi tới email của bạn.",
                "email", request.getEmail()
        ));
    }

    // POST /api/auth/register/verify-otp — Xác thực mã OTP và hoàn tất tạo tài khoản
    @PostMapping("/register/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtpAndRegister(@RequestBody @Valid VerifyOtpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.verifyOtpAndRegister(request));
    }

    // POST /api/auth/register — Đăng ký trực tiếp (nếu không qua OTP)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // POST /api/auth/oauth2/callback — Authorization Code Flow + PKCE (Google / Keycloak SSO)
    @PostMapping("/oauth2/callback")
    public ResponseEntity<AuthResponse> oauth2Callback(@RequestBody @Valid OAuth2TokenRequest request) {
        return ResponseEntity.ok(authService.handleOAuth2Callback(request));
    }

    // GET /api/auth/oauth2/config — Lấy thông tin cấu hình OIDC/OAuth2 cho frontend
    @GetMapping("/oauth2/config")
    public ResponseEntity<Map<String, Object>> getOAuth2Config() {
        return ResponseEntity.ok(authService.getOAuth2Config());
    }

    // GET /api/auth/oauth2/google-status — Kiểm tra trạng thái Google IDP trong Keycloak
    @GetMapping("/oauth2/google-status")
    public ResponseEntity<Map<String, Object>> getGoogleStatus() {
        return ResponseEntity.ok(authService.getGoogleIdpStatus());
    }

    // POST /api/auth/oauth2/setup-google — Cấu hình nhanh Google IDP vào Keycloak
    @PostMapping("/oauth2/setup-google")
    public ResponseEntity<Map<String, Object>> setupGoogle(@RequestBody Map<String, String> body) {
        String clientId = body.get("clientId");
        String clientSecret = body.get("clientSecret");
        if (clientId == null || clientSecret == null || clientId.isBlank() || clientSecret.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "clientId và clientSecret không được để trống!"));
        }
        return ResponseEntity.ok(authService.setupGoogleIdp(clientId, clientSecret));
    }

    // POST /api/auth/refresh-token
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    // POST /api/auth/logout — Revoke token và xoá user session trong Keycloak
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) Map<String, String> body,
                                       @AuthenticationPrincipal Jwt jwt) {
        String refreshToken = body != null ? body.get("refreshToken") : null;
        String keycloakId = body != null ? body.get("keycloakId") : null;
        if (keycloakId == null && jwt != null) {
            keycloakId = jwt.getSubject();
        }
        authService.logout(refreshToken, keycloakId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/auth/me — Yêu cầu Bearer token hợp lệ
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserInfo> getMe(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        return ResponseEntity.ok(authService.getMe(keycloakId));
    }
}