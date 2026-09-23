package demo.bookingsalon.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import demo.bookingsalon.Entity.Admin;
import demo.bookingsalon.Entity.Cart;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.RoleApp;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.Request.Business.ForgotPasswordRequest;
import demo.bookingsalon.Payload.Request.Business.LoginRequest;
import demo.bookingsalon.Payload.Request.Business.OAuth2TokenRequest;
import demo.bookingsalon.Payload.Request.Business.RegisterRequest;
import demo.bookingsalon.Payload.Request.Business.ResetPasswordWithOtpRequest;
import demo.bookingsalon.Payload.Request.Business.SendOtpRequest;
import demo.bookingsalon.Payload.Request.Business.VerifyOtpRequest;
import demo.bookingsalon.Payload.Response.Business.AuthResponse;
import demo.bookingsalon.Repository.AdminRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.Keycloak.IdentityProviderService;
import demo.bookingsalon.Service.Keycloak.RoleService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final Keycloak keycloak;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RoleService roleService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final EmailOtpService emailOtpService;
    private final UserService userService;
    private final IdentityProviderService identityProviderService;
    private final StylistRepository stylistRepository;
    private final AdminRepository adminRepository;

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.public-url}")
    private String keycloakPublicUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    @Value("${keycloak.frontend-client-id:booking-salon-client}")
    private String frontendClientId;

    // =====================================================
    // 1. GỬI MÃ OTP ĐĂNG KÝ QUA EMAIL (RATE-LIMITED 60s)
    // =====================================================
    public void sendRegistrationOtp(SendOtpRequest request) {
        List<UserRepresentation> existingUser = keycloak.realm(realm).users().search(request.getUsername(), true);
        if (!existingUser.isEmpty() || userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng!");
        }

        List<UserRepresentation> existingEmail = keycloak.realm(realm).users().search(null, null, null, request.getEmail(), 0, 1);
        boolean emailExistsInDb = userRepository.findAll().stream()
                .anyMatch(u -> request.getEmail().equalsIgnoreCase(u.getEmail()));
        if (!existingEmail.isEmpty() || emailExistsInDb) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã được đăng ký tài khoản!");
        }

        emailOtpService.generateAndSendOtp(request.getEmail(), request.getUsername());
    }

    // =====================================================
    // 2. XÁC THỰC OTP VÀ TẠO TÀI KHOẢN MỚI
    // =====================================================
    public AuthResponse verifyOtpAndRegister(VerifyOtpRequest request) {
        boolean valid = emailOtpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hiệu lực!");
        }

        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername(request.getUsername());
        registerRequest.setPassword(request.getPassword());
        registerRequest.setEmail(request.getEmail());
        registerRequest.setFullName(request.getFullName());
        registerRequest.setPhoneNumber(request.getPhoneNumber());
        registerRequest.setAddress(request.getAddress());
        registerRequest.setAvatarUrl(resolveAvatar(request.getAvatarUrl(), request.getFullName(), request.getUsername()));

        return register(registerRequest);
    }

    // =====================================================
    // 3. AUTHORIZATION CODE FLOW + PKCE (CHO GOOGLE & KEYCLOAK SSO)
    // =====================================================
    public AuthResponse handleOAuth2Callback(OAuth2TokenRequest request) {
        String tokenUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", frontendClientId);
        formData.add("code", request.getCode());
        formData.add("code_verifier", request.getCodeVerifier());
        formData.add("redirect_uri", request.getRedirectUri());

        String responseBody;
        try {
            responseBody = webClientBuilder.build()
                    .post()
                    .uri(tokenUrl)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), res ->
                            res.bodyToMono(String.class).map(body -> {
                                log.warn("OAuth2 PKCE token exchange failed: {}", body);
                                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Xác thực mã Authorization Code thất bại!");
                            }))
                    .bodyToMono(String.class)
                    .block();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("OAuth2 PKCE token exchange error", ex);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ xác thực tạm thời không khả dụng");
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String accessToken = root.path("access_token").asText();
            String refreshToken = root.path("refresh_token").asText();
            long expiresIn = root.path("expires_in").asLong(300);
            long refreshExpiresIn = root.path("refresh_expires_in").asLong(1800);

            String[] parts = accessToken.split("\\.");
            if (parts.length < 2) throw new IllegalStateException("Invalid JWT token format");
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            JsonNode claims = objectMapper.readTree(payload);

            String keycloakId = claims.path("sub").asText();
            String preferredUsername = claims.path("preferred_username").asText(null);
            String email = claims.path("email").asText(null);
            String name = claims.path("name").asText(null);
            String picture = claims.path("picture").asText(null);
            if (picture == null || picture.isBlank()) {
                picture = claims.path("avatar_url").asText(null);
            }

            User user = userService.syncOrProvisionOAuth2User(
                    UUID.fromString(keycloakId),
                    email,
                    preferredUsername,
                    name,
                    picture
            );

            List<String> roles = roleService.getUserRealmRoles(user.getKeycloakId());
            String role = roles.stream()
                    .filter(r -> r.equals("ADMIN") || r.equals("STYLIST") || r.equals("USER"))
                    .findFirst()
                    .orElse("USER");

            AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                    .id(user.getId())
                    .keycloakId(user.getKeycloakId())
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .avatarUrl(resolveAvatar(user.getAvatarUrl(), user.getFullName(), user.getUsername()))
                    .role(role)
                    .build();

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(expiresIn)
                    .refreshExpiresIn(refreshExpiresIn)
                    .user(userInfo)
                    .build();

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to parse OAuth2 token response", ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể xử lý phản hồi xác thực từ hệ thống");
        }
    }

    // =====================================================
    // 4. LẤY CẤU HÌNH OAUTH2 CHO FRONTEND
    // =====================================================
    public Map<String, Object> getOAuth2Config() {
        Map<String, Object> config = new HashMap<>();
        config.put("serverUrl", keycloakPublicUrl);
        config.put("realm", realm);
        config.put("clientId", frontendClientId);
        config.put("authUrl", keycloakPublicUrl + "/realms/" + realm + "/protocol/openid-connect/auth");
        config.put("googleEnabled", identityProviderService.isGoogleIdpEnabled());
        config.put("googleConfigured", identityProviderService.isGoogleIdpEnabled()
                && identityProviderService.isGoogleIdpConfigured());
        config.put("googleBrokerUrl", keycloakPublicUrl + "/realms/" + realm + "/broker/google/endpoint");
        return config;
    }

    public Map<String, Object> setupGoogleIdp(String clientId, String clientSecret) {
        identityProviderService.initOrUpdateGoogle(clientId, clientSecret);
        return Map.of(
                "message", "Cấu hình Google Identity Provider trong Keycloak thành công!",
                "alias", "google",
                "authorizedRedirectUri", keycloakPublicUrl + "/realms/" + realm + "/broker/google/endpoint"
        );
    }

    public Map<String, Object> getGoogleIdpStatus() {
        boolean configured = identityProviderService.isGoogleIdpConfigured();
        return Map.of(
                "configured", configured,
                "alias", "google",
                "authorizedRedirectUri", keycloakPublicUrl + "/realms/" + realm + "/broker/google/endpoint",
                "message", configured ? "Google IDP đã sẵn sàng" : "Google IDP chưa được cấu hình trong Keycloak"
        );
    }

    // =====================================================
    // 5. ĐĂNG NHẬP TRỰC TIẾP (DIRECT ACCESS GRANT / MODAL FORM)
    // =====================================================
    public AuthResponse login(LoginRequest request) {
        String tokenUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("username", request.getUsername());
        formData.add("password", request.getPassword());

        String responseBody;
        try {
            responseBody = webClientBuilder.build()
                    .post()
                    .uri(tokenUrl)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), res ->
                            res.bodyToMono(String.class).map(body -> {
                                log.warn("Keycloak login rejected: {}", body);
                                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tên đăng nhập hoặc mật khẩu không chính xác");
                            }))
                    .bodyToMono(String.class)
                    .block();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Keycloak token endpoint error", ex);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ xác thực tạm thời không khả dụng");
        }

        return buildAuthResponse(responseBody, request.getUsername());
    }

    // =====================================================
    // 6. ĐĂNG KÝ TRỰC TIẾP (Tạo user Keycloak + lưu DB)
    // =====================================================
    public AuthResponse register(RegisterRequest request) {
        List<UserRepresentation> existing = keycloak.realm(realm).users().search(request.getUsername(), true);
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại!");
        }

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false);

        UserRepresentation userRep = new UserRepresentation();
        userRep.setUsername(request.getUsername());
        userRep.setEmail(request.getEmail());
        String[] nameParts = request.getFullName() != null ? request.getFullName().trim().split("\\s+") : new String[]{};
        if (nameParts.length > 0) {
            userRep.setFirstName(nameParts[nameParts.length - 1]);
            if (nameParts.length > 1)
                userRep.setLastName(String.join(" ", Arrays.copyOf(nameParts, nameParts.length - 1)));
        }
        userRep.setEnabled(true);
        userRep.setEmailVerified(true);
        userRep.setCredentials(Collections.singletonList(credential));

        Response keycloakResponse = keycloak.realm(realm).users().create(userRep);
        if (keycloakResponse.getStatus() != 201) {
            String body = "";
            try { body = keycloakResponse.readEntity(String.class); } catch (Exception ignored) {}
            log.error("Keycloak user creation failed: status={}, body={}", keycloakResponse.getStatus(), body);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo tài khoản trên hệ thống xác thực");
        }

        String keycloakId = CreatedResponseUtil.getCreatedId(keycloakResponse);

        try {
            roleService.assignRealmRole(UUID.fromString(keycloakId), RoleApp.USER.name());
        } catch (Exception ex) {
            log.error("Failed to assign role, rolling back Keycloak user: {}", keycloakId, ex);
            keycloak.realm(realm).users().delete(keycloakId);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể gán quyền cho người dùng");
        }

        User newUser;
        try {
            String resolvedAvatar = resolveAvatar(request.getAvatarUrl(), request.getFullName(), request.getUsername());
            newUser = User.builder()
                    .keycloakId(UUID.fromString(keycloakId))
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .address(request.getAddress())
                    .avatarUrl(resolvedAvatar)
                    .enabled(true)
                    .build();

            Cart cart = Cart.builder()
                    .user(newUser)
                    .build();
            newUser.setCart(cart);

            userRepository.save(newUser);
        } catch (Exception ex) {
            log.error("Failed to save user to DB, rolling back Keycloak user: {}", keycloakId, ex);
            keycloak.realm(realm).users().delete(keycloakId);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu thông tin người dùng vào cơ sở dữ liệu");
        }

        return login(new LoginRequest() {{
            setUsername(request.getUsername());
            setPassword(request.getPassword());
        }});
    }

    // =====================================================
    // 7. REFRESH TOKEN
    // =====================================================
    public AuthResponse refreshToken(String refreshToken) {
        String tokenUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "refresh_token");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("refresh_token", refreshToken);

        String responseBody;
        try {
            responseBody = webClientBuilder.build()
                    .post()
                    .uri(tokenUrl)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), res ->
                            res.bodyToMono(String.class).map(body -> {
                                log.warn("Refresh token rejected: {}", body);
                                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
                            }))
                    .bodyToMono(String.class)
                    .block();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Refresh token error", ex);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ xác thực tạm thời không khả dụng");
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String accessToken = root.path("access_token").asText();
            String[] parts = accessToken.split("\\.");
            if (parts.length < 2) throw new IllegalStateException("Invalid access token format");
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            JsonNode tokenClaims = objectMapper.readTree(payload);
            String username = tokenClaims.path("preferred_username").asText();
            return buildAuthResponse(responseBody, username);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to parse refresh token response", ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể xử lý phản hồi token");
        }
    }

    // =====================================================
    // 8. LOGOUT — Revoke refresh token & xoá sạch user sessions tại Keycloak
    // =====================================================
    public void logout(String refreshToken) {
        logout(refreshToken, null);
    }

    public void logout(String refreshToken, String keycloakId) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String logoutUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/logout";
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("client_id", clientId);
            formData.add("client_secret", clientSecret);
            formData.add("refresh_token", refreshToken);

            try {
                webClientBuilder.build()
                        .post()
                        .uri(logoutUrl)
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .body(BodyInserters.fromFormData(formData))
                        .retrieve()
                        .bodyToMono(Void.class)
                        .block();
                log.info("Refresh token revoked successfully at Keycloak");
            } catch (Exception ex) {
                log.warn("Failed to revoke refresh token at Keycloak: {}", ex.getMessage());
            }
        }

        if (keycloakId != null && !keycloakId.isBlank()) {
            try {
                keycloak.realm(realm).users().get(keycloakId).logout();
                log.info("Terminated all active Keycloak sessions for user {}", keycloakId);
            } catch (Exception ex) {
                log.warn("Failed to terminate user sessions in Keycloak for {}: {}", keycloakId, ex.getMessage());
            }
        }
    }

    // =====================================================
    // 9. GET ME — Lấy thông tin user/stylist/admin hiện tại từ DB
    // =====================================================
    public AuthResponse.UserInfo getMe(String keycloakId) {
        UUID kcUuid = UUID.fromString(keycloakId);
        AuthResponse.UserInfo userInfo = resolveUserInfo(kcUuid, null);
        if (userInfo == null) {
            throw new NotFoundException("Không tìm thấy thông tin người dùng");
        }
        return userInfo;
    }

    // =====================================================
    // 10. QUÊN MẬT KHẨU (GỬI OTP & ĐẶT LẠI MẬT KHẨU)
    // =====================================================
    public void sendForgotPasswordOtp(ForgotPasswordRequest request) {
        List<UserRepresentation> users = keycloak.realm(realm).users().search(null, null, null, request.getEmail(), 0, 1);
        User dbUser = userRepository.findAll().stream()
                .filter(u -> request.getEmail().equalsIgnoreCase(u.getEmail()))
                .findFirst()
                .orElse(null);

        if (users.isEmpty() && dbUser == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản với email này!");
        }

        String username = !users.isEmpty() ? users.get(0).getUsername() : (dbUser != null ? dbUser.getUsername() : request.getEmail());
        emailOtpService.generateAndSendForgotPasswordOtp(request.getEmail(), username);
    }

    public void verifyAndResetPassword(ResetPasswordWithOtpRequest request) {
        boolean valid = emailOtpService.verifyForgotPasswordOtp(request.getEmail(), request.getOtp());
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hiệu lực!");
        }

        List<UserRepresentation> users = keycloak.realm(realm).users().search(null, null, null, request.getEmail(), 0, 1);
        String keycloakId = null;
        if (!users.isEmpty()) {
            keycloakId = users.get(0).getId();
        } else {
            User dbUser = userRepository.findAll().stream()
                    .filter(u -> request.getEmail().equalsIgnoreCase(u.getEmail()))
                    .findFirst()
                    .orElse(null);
            if (dbUser != null && dbUser.getKeycloakId() != null) {
                keycloakId = dbUser.getKeycloakId().toString();
            }
        }

        if (keycloakId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản để đặt lại mật khẩu!");
        }

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getNewPassword());
        credential.setTemporary(false);

        try {
            keycloak.realm(realm).users().get(keycloakId).resetPassword(credential);
            log.info("Password reset successfully in Keycloak for user ID: {}", keycloakId);
        } catch (Exception ex) {
            log.error("Failed to reset password in Keycloak for user ID {}: {}", keycloakId, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đặt lại mật khẩu trên hệ thống");
        }

        try {
            keycloak.realm(realm).users().get(keycloakId).logout();
        } catch (Exception ignored) {}
    }

    // =====================================================
    // 11. COOKIE ATTACHMENT & CLEARING (HTTPONLY COOKIES)
    // =====================================================
    public void attachAuthCookies(HttpServletResponse response, String accessToken, String refreshToken, long expiresIn, long refreshExpiresIn, Boolean rememberMe) {
        boolean isRemember = Boolean.TRUE.equals(rememberMe);
        long maxAge = isRemember ? (30L * 24 * 3600) : -1;

        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken != null ? accessToken : "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken != null ? refreshToken : "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    public void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================
    private String resolveAvatar(String avatarUrl, String fullName, String username) {
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            return avatarUrl;
        }
        String displayName = (fullName != null && !fullName.isBlank()) ? fullName : (username != null ? username : "User");
        try {
            return "https://ui-avatars.com/api/?name=" + URLEncoder.encode(displayName, StandardCharsets.UTF_8.toString()) + "&background=1b2a4a&color=fff";
        } catch (Exception e) {
            return "https://ui-avatars.com/api/?name=User&background=1b2a4a&color=fff";
        }
    }

    private AuthResponse buildAuthResponse(String keycloakTokenJson, String username) {
        try {
            JsonNode root = objectMapper.readTree(keycloakTokenJson);
            String accessToken = root.path("access_token").asText();
            String refreshToken = root.path("refresh_token").asText();
            long expiresIn = root.path("expires_in").asLong(300);
            long refreshExpiresIn = root.path("refresh_expires_in").asLong(1800);

            // Extract keycloakId from JWT sub claim if present
            UUID keycloakId = null;
            try {
                String[] parts = accessToken.split("\\.");
                if (parts.length >= 2) {
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    JsonNode claims = objectMapper.readTree(payload);
                    String sub = claims.path("sub").asText(null);
                    if (sub != null && !sub.isBlank()) {
                        keycloakId = UUID.fromString(sub);
                    }
                }
            } catch (Exception ignored) {}

            AuthResponse.UserInfo userInfo = resolveUserInfo(keycloakId, username);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(expiresIn)
                    .refreshExpiresIn(refreshExpiresIn)
                    .user(userInfo)
                    .build();
        } catch (Exception ex) {
            log.error("Failed to parse Keycloak token response", ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể xử lý phản hồi xác thực");
        }
    }

    private AuthResponse.UserInfo resolveUserInfo(UUID keycloakId, String username) {
        // 1. Try finding in Users (Customers)
        User user = null;
        if (keycloakId != null) {
            user = userRepository.findByKeycloakId(keycloakId);
        }
        if (user == null && username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }
        if (user != null) {
            UUID actualKcId = user.getKeycloakId() != null ? user.getKeycloakId() : keycloakId;
            String role = determineRole(actualKcId, "USER");
            return AuthResponse.UserInfo.builder()
                    .id(user.getId())
                    .keycloakId(actualKcId)
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .avatarUrl(resolveAvatar(user.getAvatarUrl(), user.getFullName(), user.getUsername()))
                    .role(role)
                    .gender(user.getGender())
                    .address(user.getAddress())
                    .city(user.getCity())
                    .district(user.getDistrict())
                    .ward(user.getWard())
                    .membershipTier(user.getMembershipTier())
                    .emailVerified(user.isEmailVerified())
                    .phoneVerified(user.isPhoneVerified())
                    .voucherCode(user.getVoucherCode())
                    .createdAt(user.getCreatedAt())
                    .build();
        }

        // 2. Try finding in Stylists
        Stylist stylist = null;
        if (keycloakId != null) {
            stylist = stylistRepository.findByKeycloakId(keycloakId).orElse(null);
        }
        if (stylist == null && username != null) {
            stylist = stylistRepository.findByUsername(username).orElse(null);
        }
        if (stylist != null) {
            UUID actualKcId = stylist.getKeycloakId() != null ? stylist.getKeycloakId() : keycloakId;
            String role = determineRole(actualKcId, "STYLIST");
            return AuthResponse.UserInfo.builder()
                    .id(stylist.getId())
                    .keycloakId(actualKcId)
                    .username(stylist.getUsername())
                    .fullName(stylist.getFullName())
                    .email(stylist.getEmail())
                    .phoneNumber(stylist.getPhoneNumber())
                    .avatarUrl(resolveAvatar(stylist.getAvatarUrl(), stylist.getFullName(), stylist.getUsername()))
                    .role(role)
                    .build();
        }

        // 3. Try finding in Admins
        Admin admin = null;
        if (keycloakId != null) {
            admin = adminRepository.findByKeycloakId(keycloakId).orElse(null);
        }
        if (admin == null && username != null) {
            admin = adminRepository.findByUsername(username).orElse(null);
        }
        if (admin != null) {
            UUID actualKcId = admin.getKeycloakId() != null ? admin.getKeycloakId() : keycloakId;
            String role = determineRole(actualKcId, "ADMIN");
            return AuthResponse.UserInfo.builder()
                    .id(admin.getId())
                    .keycloakId(actualKcId)
                    .username(admin.getUsername())
                    .fullName(admin.getFullName())
                    .email(admin.getEmail())
                    .phoneNumber(admin.getPhoneNumber())
                    .avatarUrl(resolveAvatar(admin.getAvatarUrl(), admin.getFullName(), admin.getUsername()))
                    .role(role)
                    .build();
        }

        return null;
    }

    private String determineRole(UUID keycloakId, String defaultRole) {
        if (keycloakId == null) return defaultRole;
        try {
            List<String> roles = roleService.getUserRealmRoles(keycloakId);
            if (roles.contains("ADMIN")) return "ADMIN";
            if (roles.contains("STYLIST")) return "STYLIST";
            if (roles.contains("USER")) return "USER";
        } catch (Exception e) {
            log.warn("Could not fetch Keycloak roles for {}: {}", keycloakId, e.getMessage());
        }
        return defaultRole;
    }
}
