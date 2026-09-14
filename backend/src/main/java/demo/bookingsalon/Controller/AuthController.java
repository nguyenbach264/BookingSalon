package demo.bookingsalon.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import demo.bookingsalon.Payload.Request.Business.ForgotPasswordRequest;
import demo.bookingsalon.Payload.Request.Business.LoginRequest;
import demo.bookingsalon.Payload.Request.Business.OAuth2TokenRequest;
import demo.bookingsalon.Payload.Request.Business.RegisterRequest;
import demo.bookingsalon.Payload.Request.Business.ResetPasswordWithOtpRequest;
import demo.bookingsalon.Payload.Request.Business.SendOtpRequest;
import demo.bookingsalon.Payload.Request.Business.VerifyOtpRequest;
import demo.bookingsalon.Payload.Response.Business.AuthResponse;
import demo.bookingsalon.Service.AuthService;
import demo.bookingsalon.Service.BffSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final BffSessionService bffSessionService;

    // POST /api/auth/login — Đăng nhập trực tiếp qua username & password
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request,
                                              HttpServletRequest httpRequest,
                                              HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.login(request);
        String keycloakId = authResponse.getUser() != null && authResponse.getUser().getKeycloakId() != null
                ? authResponse.getUser().getKeycloakId().toString()
                : null;
        bffSessionService.saveSessionTokens(httpRequest, httpResponse,
                authResponse.getAccessToken(), authResponse.getRefreshToken(),
                authResponse.getExpiresIn(), request.getRememberMe(), keycloakId);
        return ResponseEntity.ok(sanitize(authResponse));
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
    public ResponseEntity<AuthResponse> verifyOtpAndRegister(@RequestBody @Valid VerifyOtpRequest request,
                                                             HttpServletRequest httpRequest,
                                                             HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.verifyOtpAndRegister(request);
        String keycloakId = authResponse.getUser() != null && authResponse.getUser().getKeycloakId() != null
                ? authResponse.getUser().getKeycloakId().toString()
                : null;
        bffSessionService.saveSessionTokens(httpRequest, httpResponse,
                authResponse.getAccessToken(), authResponse.getRefreshToken(),
                authResponse.getExpiresIn(), false, keycloakId);
        return ResponseEntity.status(HttpStatus.CREATED).body(sanitize(authResponse));
    }

    // POST /api/auth/register — Đăng ký trực tiếp (nếu không qua OTP)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request,
                                                 HttpServletRequest httpRequest,
                                                 HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.register(request);
        String keycloakId = authResponse.getUser() != null && authResponse.getUser().getKeycloakId() != null
                ? authResponse.getUser().getKeycloakId().toString()
                : null;
        bffSessionService.saveSessionTokens(httpRequest, httpResponse,
                authResponse.getAccessToken(), authResponse.getRefreshToken(),
                authResponse.getExpiresIn(), false, keycloakId);
        return ResponseEntity.status(HttpStatus.CREATED).body(sanitize(authResponse));
    }

    // POST /api/auth/oauth2/callback — Authorization Code Flow + PKCE (Google / Keycloak SSO)
    @PostMapping("/oauth2/callback")
    public ResponseEntity<AuthResponse> oauth2Callback(@RequestBody @Valid OAuth2TokenRequest request,
                                                       HttpServletRequest httpRequest,
                                                       HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.handleOAuth2Callback(request);
        String keycloakId = authResponse.getUser() != null && authResponse.getUser().getKeycloakId() != null
                ? authResponse.getUser().getKeycloakId().toString()
                : null;
        bffSessionService.saveSessionTokens(httpRequest, httpResponse,
                authResponse.getAccessToken(), authResponse.getRefreshToken(),
                authResponse.getExpiresIn(), true, keycloakId);
        return ResponseEntity.ok(sanitize(authResponse));
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
    public ResponseEntity<AuthResponse> refreshToken(HttpServletRequest httpRequest) {
        String token = bffSessionService.resolveValidAccessToken(httpRequest);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(AuthResponse.builder().build());
    }

    // POST /api/auth/logout — BFF xoá session, thu hồi token tại Keycloak và xoá JSESSIONID
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse,
                                       @AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt != null ? jwt.getSubject() : null;
        bffSessionService.clearSession(httpRequest, httpResponse, keycloakId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/auth/me — Yêu cầu Bearer token hoặc access_token cookie hợp lệ
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserInfo> getMe(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        return ResponseEntity.ok(authService.getMe(keycloakId));
    }

    // POST /api/auth/forgot-password/send-otp — Gửi mã OTP xác thực đổi mật khẩu
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<Map<String, String>> sendForgotPasswordOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        authService.sendForgotPasswordOtp(request);
        return ResponseEntity.ok(Map.of(
                "message", "Mã xác thực đặt lại mật khẩu đã được gửi tới email của bạn.",
                "email", request.getEmail()
        ));
    }

    // POST /api/auth/forgot-password/verify-and-reset — Xác thực OTP và đặt mật khẩu mới
    @PostMapping("/forgot-password/verify-and-reset")
    public ResponseEntity<Map<String, String>> verifyAndResetPassword(@RequestBody @Valid ResetPasswordWithOtpRequest request) {
        authService.verifyAndResetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới."));
    }

    private AuthResponse sanitize(AuthResponse response) {
        if (response == null) return null;
        return AuthResponse.builder()
                .expiresIn(response.getExpiresIn())
                .user(response.getUser())
                .build();
    }
}
