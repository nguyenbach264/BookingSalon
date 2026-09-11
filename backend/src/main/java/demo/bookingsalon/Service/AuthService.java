package demo.bookingsalon.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Entity.Cart;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.RoleApp;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.Request.Business.LoginRequest;
import demo.bookingsalon.Payload.Request.Business.OAuth2TokenRequest;
import demo.bookingsalon.Payload.Request.Business.RegisterRequest;
import demo.bookingsalon.Payload.Request.Business.SendOtpRequest;
import demo.bookingsalon.Payload.Request.Business.VerifyOtpRequest;
import demo.bookingsalon.Payload.Response.Business.AuthResponse;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.Keycloak.RoleService;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

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
        // Kiểm tra username đã tồn tại trong Keycloak hoặc DB chưa
        List<UserRepresentation> existingUser = keycloak.realm(realm).users().search(request.getUsername(), true);
        if (!existingUser.isEmpty() || userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng!");
        }

        // Kiểm tra email đã tồn tại chưa
        List<UserRepresentation> existingEmail = keycloak.realm(realm).users().search(null, null, null, request.getEmail(), 0, 1);
        boolean emailExistsInDb = userRepository.findAll().stream()
                .anyMatch(u -> request.getEmail().equalsIgnoreCase(u.getEmail()));
        if (!existingEmail.isEmpty() || emailExistsInDb) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã được đăng ký tài khoản!");
        }

        // Gửi OTP qua email với rate-limit trong Redis
        emailOtpService.generateAndSendOtp(request.getEmail(), request.getUsername());
    }

    // =====================================================
    // 2. XÁC THỰC OTP VÀ TẠO TÀI KHOẢN MỚI
    // =====================================================
    public AuthResponse verifyOtpAndRegister(VerifyOtpRequest request) {
        // Kiểm tra mã OTP
        boolean valid = emailOtpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hiệu lực!");
        }

        // Đã xác thực OTP hợp lệ -> Tạo tài khoản Keycloak và DB
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername(request.getUsername());
        registerRequest.setPassword(request.getPassword());
        registerRequest.setEmail(request.getEmail());
        registerRequest.setFullName(request.getFullName());
        registerRequest.setPhoneNumber(request.getPhoneNumber());
        registerRequest.setAddress(request.getAddress());
        registerRequest.setAvatarUrl(request.getAvatarUrl());

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

            // Parse payload claims tu Access Token
            String[] parts = accessToken.split("\\.");
            if (parts.length < 2) throw new IllegalStateException("Invalid JWT token format");
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            JsonNode claims = objectMapper.readTree(payload);

            String keycloakId = claims.path("sub").asText();
            String preferredUsername = claims.path("preferred_username").asText(null);
            String email = claims.path("email").asText(null);
            String name = claims.path("name").asText(null);
            String picture = claims.path("picture").asText(null);

            // Đồng bộ hoặc tạo User trong MySQL DB cho tài khoản Google / Keycloak SSO
            User user = userService.syncOrProvisionOAuth2User(
                    UUID.fromString(keycloakId),
                    email,
                    preferredUsername,
                    name,
                    picture
            );

            // Lấy role từ Keycloak
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
                    .avatarUrl(user.getAvatarUrl())
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
    public Map<String, String> getOAuth2Config() {
        Map<String, String> config = new HashMap<>();
        config.put("serverUrl", keycloakServerUrl);
        config.put("realm", realm);
        config.put("clientId", frontendClientId);
        config.put("authUrl", keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/auth");
        return config;
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
            newUser = User.builder()
                    .keycloakId(UUID.fromString(keycloakId))
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .address(request.getAddress())
                    .avatarUrl(request.getAvatarUrl())
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

        // Tự động đăng nhập ngay sau khi đăng ký
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
    // 8. LOGOUT — Revoke refresh token tại Keycloak
    // =====================================================
    public void logout(String refreshToken) {
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
            log.info("Refresh token revoked successfully");
        } catch (Exception ex) {
            log.warn("Failed to revoke refresh token at Keycloak: {}", ex.getMessage());
        }
    }

    // =====================================================
    // 9. GET ME — Lấy thông tin user hiện tại từ DB
    // =====================================================
    public AuthResponse.UserInfo getMe(String keycloakId) {
        User user = userRepository.findByKeycloakId(UUID.fromString(keycloakId));
        if (user == null) throw new NotFoundException("Không tìm thấy thông tin người dùng");

        List<String> roles = roleService.getUserRealmRoles(user.getKeycloakId());
        String role = roles.stream()
                .filter(r -> r.equals("ADMIN") || r.equals("STYLIST") || r.equals("USER"))
                .findFirst()
                .orElse("USER");

        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .role(role)
                .build();
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================
    private AuthResponse buildAuthResponse(String keycloakTokenJson, String username) {
        try {
            JsonNode root = objectMapper.readTree(keycloakTokenJson);
            String accessToken = root.path("access_token").asText();
            String refreshToken = root.path("refresh_token").asText();
            long expiresIn = root.path("expires_in").asLong(300);
            long refreshExpiresIn = root.path("refresh_expires_in").asLong(1800);

            User user = userRepository.findByUsername(username).orElse(null);
            AuthResponse.UserInfo userInfo = null;
            if (user != null) {
                List<String> roles = roleService.getUserRealmRoles(user.getKeycloakId());
                String role = roles.stream()
                        .filter(r -> r.equals("ADMIN") || r.equals("STYLIST") || r.equals("USER"))
                        .findFirst()
                        .orElse("USER");

                userInfo = AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .keycloakId(user.getKeycloakId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .phoneNumber(user.getPhoneNumber())
                        .avatarUrl(user.getAvatarUrl())
                        .role(role)
                        .build();
            }

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
}