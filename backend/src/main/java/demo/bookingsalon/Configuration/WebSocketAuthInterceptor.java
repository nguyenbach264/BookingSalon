package demo.bookingsalon.Configuration;

import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.BffSessionService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    public static final String ATTR_USER_ID = "userId";
    public static final String ATTR_STYLIST_ID = "stylistId";
    public static final String ATTR_KEYCLOAK_ID = "keycloakId";

    private final BffSessionService bffSessionService;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;
    private final Optional<JwtDecoder> jwtDecoder;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        // Public endpoint như /ws/reviews cho phép anonymous kết nối để nhận realtime review
        URI uri = request.getURI();
        String path = uri.getPath();
        boolean isNotificationPath = path != null && path.contains("/ws/notifications");

        if (request instanceof ServletServerHttpRequest servletRequest) {
            var httpRequest = servletRequest.getServletRequest();
            HttpSession session = httpRequest.getSession(false);

            String keycloakIdStr = null;
            if (session != null) {
                keycloakIdStr = (String) session.getAttribute(BffSessionService.SESSION_KEYCLOAK_ID);
            }

            // Nếu không có trong session, thử giải mã Access Token từ BFF Session hoặc header Authorization
            if (keycloakIdStr == null) {
                String token = bffSessionService.resolveValidAccessToken(httpRequest);
                if (token == null) {
                    String authHeader = httpRequest.getHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                    }
                }

                if (token != null && jwtDecoder.isPresent()) {
                    try {
                        Jwt jwt = jwtDecoder.get().decode(token);
                        keycloakIdStr = jwt.getSubject();
                    } catch (Exception e) {
                        log.debug("WebSocket handshake JWT decode failed: {}", e.getMessage());
                    }
                }
            }

            if (keycloakIdStr != null) {
                try {
                    UUID keycloakUuid = UUID.fromString(keycloakIdStr);
                    attributes.put(ATTR_KEYCLOAK_ID, keycloakUuid);

                    // Tra cứu xem đây là User hay Stylist trong hệ thống
                    User user = userRepository.findByKeycloakId(keycloakUuid);
                    if (user != null) {
                        attributes.put(ATTR_USER_ID, user.getId());
                    }

                    Optional<Stylist> stylist = stylistRepository.findByKeycloakId(keycloakUuid);
                    if (stylist.isPresent()) {
                        attributes.put(ATTR_STYLIST_ID, stylist.get().getId());
                    }

                    log.info("WebSocket handshake authenticated for Keycloak user: {}, userId: {}, stylistId: {}",
                            keycloakUuid, attributes.get(ATTR_USER_ID), attributes.get(ATTR_STYLIST_ID));
                    return true;
                } catch (Exception e) {
                    log.warn("Invalid keycloak ID format during WebSocket handshake: {}", keycloakIdStr);
                }
            }
        }

        // Nếu là endpoint notifications mà không có phiên xác thực hợp lệ -> từ chối kết nối
        if (isNotificationPath) {
            log.warn("Rejected unauthenticated WebSocket connection attempt to {}", path);
            return false;
        }

        // Endpoint reviews hoặc công khai khác cho phép handshake
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}

