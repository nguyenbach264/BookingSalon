package demo.bookingsalon.Service;

import java.time.Instant;

import org.keycloak.admin.client.Keycloak;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BffSessionService {

    public static final String SESSION_ACCESS_TOKEN = "BFF_ACCESS_TOKEN";
    public static final String SESSION_REFRESH_TOKEN = "BFF_REFRESH_TOKEN";
    public static final String SESSION_EXPIRES_AT = "BFF_EXPIRES_AT";
    public static final String SESSION_KEYCLOAK_ID = "BFF_KEYCLOAK_ID";

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final Keycloak keycloak;

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    /**
     * Lưu trữ tokens của Keycloak vào Server-side HttpSession và thiết lập JSESSIONID cookie.
     * Hoàn toàn không gửi access_token hay refresh_token về browser.
     */
    public void saveSessionTokens(HttpServletRequest request,
                                  HttpServletResponse response,
                                  String accessToken,
                                  String refreshToken,
                                  long expiresIn,
                                  Boolean rememberMe,
                                  String keycloakId) {
        HttpSession session = request.getSession(true);

        // Duy trì phiên đăng nhập 30 ngày theo yêu cầu, chỉ hết hạn sau 30 ngày hoặc khi người dùng chủ động đăng xuất
        int sessionTimeoutSeconds = 30 * 24 * 3600;
        session.setMaxInactiveInterval(sessionTimeoutSeconds);

        Instant expiresAt = Instant.now().plusSeconds(Math.max(30, expiresIn));

        session.setAttribute(SESSION_ACCESS_TOKEN, accessToken);
        session.setAttribute(SESSION_REFRESH_TOKEN, refreshToken);
        session.setAttribute(SESSION_EXPIRES_AT, expiresAt);
        if (keycloakId != null) {
            session.setAttribute(SESSION_KEYCLOAK_ID, keycloakId);
        }

        // Thiết lập JSESSIONID cookie với maxAge 30 ngày
        long cookieMaxAge = 30L * 24 * 3600;
        ResponseCookie sessionCookie = ResponseCookie.from("JSESSIONID", session.getId())
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(cookieMaxAge)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie.toString());

        // Dọn dẹp sạch sẽ các cookie token cũ nếu còn tồn tại trên browser
        purgeLegacyTokenCookies(response);

        log.info("BFF Session initialized for user {}, session ID: {}, duration: 30 days",
                keycloakId, session.getId());
    }

    /**
     * Trích xuất Access Token hợp lệ từ Server-side HttpSession.
     * Nếu Access Token đã hết hạn hoặc sắp hết hạn (< 30s), tự động refresh ngầm với Keycloak.
     */
    public String resolveValidAccessToken(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }

        String accessToken = (String) session.getAttribute(SESSION_ACCESS_TOKEN);
        if (accessToken == null || accessToken.isBlank()) {
            return null;
        }

        Instant expiresAt = (Instant) session.getAttribute(SESSION_EXPIRES_AT);
        // Nếu token còn hạn nhiều hơn 30s thì dùng ngay
        if (expiresAt != null && Instant.now().isBefore(expiresAt.minusSeconds(30))) {
            return accessToken;
        }

        // Token sắp hoặc đã hết hạn -> tiến hành refresh ngầm với Keycloak
        synchronized (session) {
            // Kiểm tra lại sau khi vào lock
            Instant currentExpiresAt = (Instant) session.getAttribute(SESSION_EXPIRES_AT);
            String currentAccessToken = (String) session.getAttribute(SESSION_ACCESS_TOKEN);
            if (currentExpiresAt != null && Instant.now().isBefore(currentExpiresAt.minusSeconds(30))) {
                return currentAccessToken;
            }

            String refreshToken = (String) session.getAttribute(SESSION_REFRESH_TOKEN);
            if (refreshToken == null || refreshToken.isBlank()) {
                log.warn("Cannot refresh token in BFF: No refresh token found in session");
                session.invalidate();
                return null;
            }

            try {
                String refreshedAccessToken = refreshSessionTokens(session, refreshToken);
                if (refreshedAccessToken != null) {
                    return refreshedAccessToken;
                }
            } catch (Exception ex) {
                log.warn("Failed to refresh token in BFF session: {}", ex.getMessage());
                session.invalidate();
                return null;
            }
        }

        return null;
    }

    /**
     * Làm mới token với Keycloak và cập nhật lại Server-side HttpSession.
     */
    private String refreshSessionTokens(HttpSession session, String refreshToken) {
        String tokenUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "refresh_token");
        formData.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            formData.add("client_secret", clientSecret);
        }
        formData.add("refresh_token", refreshToken);

        String responseBody = webClientBuilder.build()
                .post()
                .uri(tokenUrl)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String newAccessToken = root.path("access_token").asText();
            String newRefreshToken = root.path("refresh_token").asText(refreshToken);
            long expiresIn = root.path("expires_in").asLong(300);

            session.setAttribute(SESSION_ACCESS_TOKEN, newAccessToken);
            session.setAttribute(SESSION_REFRESH_TOKEN, newRefreshToken);
            session.setAttribute(SESSION_EXPIRES_AT, Instant.now().plusSeconds(Math.max(30, expiresIn)));

            log.info("BFF transparently refreshed Keycloak access token for session {}", session.getId());
            return newAccessToken;
        } catch (Exception e) {
            log.error("Failed to parse refresh token response in BFF", e);
            return null;
        }
    }

    /**
     * Thu hồi token ở Keycloak, huỷ HttpSession và xoá JSESSIONID cookie.
     */
    public void clearSession(HttpServletRequest request, HttpServletResponse response, String fallbackKeycloakId) {
        HttpSession session = request.getSession(false);
        String refreshToken = null;
        String keycloakId = fallbackKeycloakId;

        if (session != null) {
            refreshToken = (String) session.getAttribute(SESSION_REFRESH_TOKEN);
            if (keycloakId == null) {
                keycloakId = (String) session.getAttribute(SESSION_KEYCLOAK_ID);
            }
            try {
                session.invalidate();
            } catch (Exception e) {
                log.warn("Error invalidating session: {}", e.getMessage());
            }
        }

        // Thu hồi token ở Keycloak
        revokeKeycloakSession(refreshToken, keycloakId);

        // Xoá cookie JSESSIONID
        ResponseCookie clearSessionCookie = ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearSessionCookie.toString());

        // Xoá các cookie token cũ nếu có
        purgeLegacyTokenCookies(response);

        log.info("BFF Session cleared successfully for user {}", keycloakId);
    }

    private void revokeKeycloakSession(String refreshToken, String keycloakId) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                String logoutUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/logout";
                MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
                formData.add("client_id", clientId);
                formData.add("client_secret", clientSecret);
                formData.add("refresh_token", refreshToken);

                webClientBuilder.build()
                        .post()
                        .uri(logoutUrl)
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .body(BodyInserters.fromFormData(formData))
                        .retrieve()
                        .bodyToMono(Void.class)
                        .block();
                log.info("BFF revoked refresh token with Keycloak");
            } catch (Exception ex) {
                log.warn("Failed to revoke refresh token at Keycloak: {}", ex.getMessage());
            }
        }

        if (keycloakId != null && !keycloakId.isBlank()) {
            try {
                keycloak.realm(realm).users().get(keycloakId).logout();
                log.info("BFF terminated active Keycloak sessions for user {}", keycloakId);
            } catch (Exception ex) {
                log.warn("Failed to logout user on Keycloak admin client for {}: {}", keycloakId, ex.getMessage());
            }
        }
    }

    private void purgeLegacyTokenCookies(HttpServletResponse response) {
        ResponseCookie clearAccess = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        ResponseCookie clearRefresh = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());
    }
}

