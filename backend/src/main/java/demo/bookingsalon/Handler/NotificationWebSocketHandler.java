package demo.bookingsalon.Handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Slf4j
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> allSessions = new CopyOnWriteArraySet<>();
    private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final Map<UUID, Set<WebSocketSession>> stylistSessions = new ConcurrentHashMap<>();

    public NotificationWebSocketHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // CLIENT CONNECT
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        allSessions.add(session);
        log.info("WebSocket client connected: {}", session.getId());

        // Ưu tiên danh tính đã được xác thực an toàn qua WebSocketAuthInterceptor
        UUID authUserId = (UUID) session.getAttributes().get("userId");
        UUID authStylistId = (UUID) session.getAttributes().get("stylistId");

        if (authUserId != null) {
            userSessions.computeIfAbsent(authUserId, k -> new CopyOnWriteArraySet<>()).add(session);
            log.info("Registered authenticated user {} with WebSocket session {}", authUserId, session.getId());
        }

        if (authStylistId != null) {
            stylistSessions.computeIfAbsent(authStylistId, k -> new CopyOnWriteArraySet<>()).add(session);
            log.info("Registered authenticated stylist {} with WebSocket session {}", authStylistId, session.getId());
        }

        // Với public path như /ws/reviews, query params / client-sent IDs không được gán đè quyền nhận tin riêng tư
    }

    // RECEIVE MESSAGE (CLIENT REGISTER / PING)
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode node = objectMapper.readTree(message.getPayload());
            String type = node.path("type").asText("");

            if ("PING".equalsIgnoreCase(type)) {
                session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
            } else if ("REGISTER".equalsIgnoreCase(type) || "AUTH".equalsIgnoreCase(type)) {
                // Chỉ cho phép đăng ký nếu session đã được xác thực danh tính trùng khớp từ Handshake
                UUID authUserId = (UUID) session.getAttributes().get("userId");
                UUID authStylistId = (UUID) session.getAttributes().get("stylistId");

                if (node.hasNonNull("userId") && authUserId != null) {
                    try {
                        UUID claimedUserId = UUID.fromString(node.get("userId").asText());
                        if (authUserId.equals(claimedUserId)) {
                            userSessions.computeIfAbsent(authUserId, k -> new CopyOnWriteArraySet<>()).add(session);
                        } else {
                            log.warn("Session {} attempted to spoof userId {}. Authenticated userId is {}",
                                    session.getId(), claimedUserId, authUserId);
                        }
                    } catch (Exception ignored) {}
                }

                if (node.hasNonNull("stylistId") && authStylistId != null) {
                    try {
                        UUID claimedStylistId = UUID.fromString(node.get("stylistId").asText());
                        if (authStylistId.equals(claimedStylistId)) {
                            stylistSessions.computeIfAbsent(authStylistId, k -> new CopyOnWriteArraySet<>()).add(session);
                        } else {
                            log.warn("Session {} attempted to spoof stylistId {}. Authenticated stylistId is {}",
                                    session.getId(), claimedStylistId, authStylistId);
                        }
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception e) {
            log.debug("Non-JSON message received from session {}: {}", session.getId(), message.getPayload());
        }
    }

    // CLIENT DISCONNECT
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        allSessions.remove(session);

        UUID userId = (UUID) session.getAttributes().get("userId");
        if (userId != null && userSessions.containsKey(userId)) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            sessions.remove(session);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }

        UUID stylistId = (UUID) session.getAttributes().get("stylistId");
        if (stylistId != null && stylistSessions.containsKey(stylistId)) {
            Set<WebSocketSession> sessions = stylistSessions.get(stylistId);
            sessions.remove(session);
            if (sessions.isEmpty()) {
                stylistSessions.remove(stylistId);
            }
        }

        log.info("WebSocket client disconnected: {}, total: {}", session.getId(), allSessions.size());
    }

    // SEND TO SPECIFIC USER
    public void sendToUser(UUID userId, Object payload) {
        if (userId == null) return;
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active WebSocket session for user {}", userId);
            return;
        }

        String json = toJson(payload);
        TextMessage textMessage = new TextMessage(json);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                    log.info("Dispatched WebSocket notification to user {} on session {}", userId, session.getId());
                } catch (IOException e) {
                    log.error("Error sending WebSocket message to user session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    // SEND TO SPECIFIC STYLIST
    public void sendToStylist(UUID stylistId, Object payload) {
        if (stylistId == null) return;
        Set<WebSocketSession> sessions = stylistSessions.get(stylistId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active WebSocket session for stylist {}", stylistId);
            return;
        }

        String json = toJson(payload);
        TextMessage textMessage = new TextMessage(json);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                    log.info("Dispatched WebSocket update to stylist {} on session {}", stylistId, session.getId());
                } catch (IOException e) {
                    log.error("Error sending WebSocket message to stylist session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    // BROADCAST MESSAGE TO ALL
    public void broadcast(Object payload) {
        String json = toJson(payload);
        TextMessage textMessage = new TextMessage(json);
        for (WebSocketSession session : allSessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    log.warn("Cannot broadcast to session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    // BROADCAST STRING (backward compatibility)
    public void broadcast(String message) {
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : allSessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    log.warn("Cannot broadcast to session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    private String toJson(Object object) {
        if (object instanceof String s) return s;
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket message to JSON", e);
            return "{}";
        }
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isBlank()) return params;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0 && idx < pair.length() - 1) {
                params.put(pair.substring(0, idx), pair.substring(idx + 1));
            } else if (idx > 0) {
                params.put(pair.substring(0, idx), "");
            }
        }
        return params;
    }
}