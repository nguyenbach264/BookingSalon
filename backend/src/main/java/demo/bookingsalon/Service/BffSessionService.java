package demo.bookingsalon.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
    public static final String SESSION_CLIENT_ID = "BFF_CLIENT_ID";

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final Keycloak keycloak;

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.frontend-client-id:booking-salon-client}")
    private String frontendClientId;

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
        saveSessionTokens(request, response, accessToken, refreshToken, expiresIn, rememberMe, keycloakId, null);
    }

    public void saveSessionTokens(HttpServletRequest request,
                                  HttpServletResponse response,
                                  String accessToken,
                                  String refreshToken,
                                  long expiresIn,
                                  Boolean rememberMe,
                                  String keycloakId,
                                  String targetClientId) {
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
        if (targetClientId != null && !targetClientId.isBlank()) {
            session.setAttribute(SESSION_CLIENT_ID, targetClientId);
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

        log.info("BFF Session initialized for user {}, session ID: {}, duration: 30 days, targetClientId: {}",
                keycloakId, session.getId(), targetClientId);
    }

    private final java.util.concurrent.ConcurrentHashMap<String, Object> sessionLocks = new java.util.concurrent.ConcurrentHashMap<>();

    private Object getSessionLock(String sessionId) {
        return sessionLocks.computeIfAbsent(sessionId, k -> new Object());
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

        // Token sắp hoặc đã hết hạn -> tiến hành refresh ngầm với Keycloak có lock theo Session ID
        Object lock = getSessionLock(session.getId());
        synchronized (lock) {
            // Kiểm tra lại sau khi vào lock: có thể thread khác vừa refresh thành công
            Instant currentExpiresAt = (Instant) session.getAttribute(SESSION_EXPIRES_AT);
            String currentAccessToken = (String) session.getAttribute(SESSION_ACCESS_TOKEN);
            if (currentExpiresAt != null && Instant.now().isBefore(currentExpiresAt.minusSeconds(30)) && currentAccessToken != null) {
                return currentAccessToken;
            }

            String refreshToken = (String) session.getAttribute(SESSION_REFRESH_TOKEN);
            if (refreshToken == null || refreshToken.isBlank()) {
                log.warn("Cannot refresh token in BFF: No refresh token found in session");
                return null;
            }

            try {
                String refreshedAccessToken = refreshSessionTokens(session, refreshToken);
                if (refreshedAccessToken != null) {
                    return refreshedAccessToken;
                }
            } catch (org.springframework.web.reactive.function.client.WebClientResponseException ex) {
                log.warn("Failed to refresh token in BFF session: HTTP {}", ex.getStatusCode());
                // Kiểm tra lại lần nữa: có thể thread khác đã cập nhật token trong khi WebClient đang chạy
                String updatedToken = (String) session.getAttribute(SESSION_ACCESS_TOKEN);
                Instant updatedExpiresAt = (Instant) session.getAttribute(SESSION_EXPIRES_AT);
                if (updatedExpiresAt != null && Instant.now().isBefore(updatedExpiresAt.minusSeconds(30)) && updatedToken != null) {
                    return updatedToken;
                }
                // KHÔNG gọi session.invalidate() để tránh huỷ toàn bộ phiên của người dùng khi gặp race condition
                return null;
            } catch (Exception ex) {
                log.warn("Failed to refresh token in BFF session (transient error): {}", ex.getMessage());
                // Không hủy session khi gặp lỗi tạm thời
                return null;
            }
        }

        return null;
    }

    /**
     * Bắt buộc làm mới Access Token với Keycloak (bỏ qua cache expiresAt).
     * Dùng khi endpoint /api/auth/refresh-token được gọi rõ ràng bởi frontend.
     */
    public String forceRefreshToken(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }

        String refreshToken = (String) session.getAttribute(SESSION_REFRESH_TOKEN);
        if (refreshToken == null || refreshToken.isBlank()) {
            return null;
        }

        Object lock = getSessionLock(session.getId());
        synchronized (lock) {
            try {
                return refreshSessionTokens(session, refreshToken);
            } catch (Exception e) {
                log.warn("forceRefreshToken failed for session {}: {}", session.getId(), e.getMessage());
                // Nếu refresh thất bại nhưng token hiện tại vẫn chưa hết hạn, vẫn trả về token hiện tại
                Instant currentExpiresAt = (Instant) session.getAttribute(SESSION_EXPIRES_AT);
                String currentAccessToken = (String) session.getAttribute(SESSION_ACCESS_TOKEN);
                if (currentExpiresAt != null && Instant.now().isBefore(currentExpiresAt) && currentAccessToken != null) {
                    return currentAccessToken;
                }
                return null;
            }
        }
    }

    /**
     * Làm mới token với Keycloak và cập nhật lại Server-side HttpSession.
     * Thử refresh với client ID ban đầu, nếu lỗi thử tiếp với client fallback.
     */
    private String refreshSessionTokens(HttpSession session, String refreshToken) {
        String tokenUrl = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";
        String storedClientId = (String) session.getAttribute(SESSION_CLIENT_ID);

        // Danh sách các cặp (clientId, clientSecret) để thử refresh
        List<ClientAuthSpec> clientsToTry = new ArrayList<>();
        if (storedClientId != null && !storedClientId.isBlank()) {
            if (storedClientId.equals(frontendClientId)) {
                clientsToTry.add(new ClientAuthSpec(frontendClientId, null));
                clientsToTry.add(new ClientAuthSpec(clientId, clientSecret));
            } else {
                clientsToTry.add(new ClientAuthSpec(clientId, clientSecret));
                clientsToTry.add(new ClientAuthSpec(frontendClientId, null));
            }
        } else {
            clientsToTry.add(new ClientAuthSpec(clientId, clientSecret));
            clientsToTry.add(new ClientAuthSpec(frontendClientId, null));
        }

        Exception lastException = null;
        for (ClientAuthSpec spec : clientsToTry) {
            try {
                MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
                formData.add("grant_type", "refresh_token");
                formData.add("client_id", spec.clientId);
                if (spec.clientSecret != null && !spec.clientSecret.isBlank()) {
                    formData.add("client_secret", spec.clientSecret);
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

                JsonNode root = objectMapper.readTree(responseBody);
                String newAccessToken = root.path("access_token").asText();
                String newRefreshToken = root.path("refresh_token").asText(refreshToken);
                long expiresIn = root.path("expires_in").asLong(300);

                session.setAttribute(SESSION_ACCESS_TOKEN, newAccessToken);
                session.setAttribute(SESSION_REFRESH_TOKEN, newRefreshToken);
                session.setAttribute(SESSION_EXPIRES_AT, Instant.now().plusSeconds(Math.max(30, expiresIn)));
                session.setAttribute(SESSION_CLIENT_ID, spec.clientId);

                log.info("BFF transparently refreshed Keycloak access token for session {} with client {}",
                        session.getId(), spec.clientId);
                return newAccessToken;
            } catch (Exception e) {
                lastException = e;
            }
        }

        if (lastException instanceof RuntimeException runtimeException) {
            throw runtimeException;
        }
        throw new RuntimeException("Failed to refresh token with any configured client", lastException);
    }

    private record ClientAuthSpec(String clientId, String clientSecret) {}

    /**
     * Thu hồi token ở Keycloak, huỷ HttpSession và xoá JSESSIONID cookie.
     */
    public void clearSession(HttpServletRequest request, HttpServletResponse response, String fallbackKeycloakId) {
        HttpSession session = request.getSession(false);
        String refreshToken = null;
        String keycloakId = fallbackKeycloakId;

        if (session != null) {
            sessionLocks.remove(session.getId());
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

