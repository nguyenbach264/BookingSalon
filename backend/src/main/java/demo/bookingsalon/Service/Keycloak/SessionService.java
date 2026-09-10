package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Payload.Response.Keycloak.SessionResponse;
import demo.bookingsalon.Payload.Response.Keycloak.SessionSummaryResponse;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.idm.UserSessionRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SessionService {
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    public SessionService(Keycloak keycloak) {
        this.keycloak = keycloak;
    }

    // ---------- Lấy tất cả session của realm (phân trang) ----------
    public List<SessionResponse> getAllSessions(int first, int max) {
        List<SessionResponse> allSessions = new ArrayList<>();

        keycloak.realm(realm).clients().findAll().forEach(client -> {
            List<UserSessionRepresentation> clientSessions = keycloak.realm(realm)
                    .clients().get(client.getId()).getUserSessions(first, max);

            allSessions.addAll(clientSessions.stream()
                    .map(this::mapToSessionResponse)
                    .collect(Collectors.toList()));
        });
        return allSessions;
    }

    // ---------- Lấy session của một user ----------
    public List<SessionResponse> getUserSessions(String userId) {
        List<UserSessionRepresentation> sessions = keycloak.realm(realm)
                .users().get(userId).getUserSessions();
        return sessions.stream().map(this::mapToSessionResponse).collect(Collectors.toList());
    }

    // ---------- Lấy session của một client ----------
    public List<SessionResponse> getClientSessions(String clientUuid, int first, int max) {
        List<UserSessionRepresentation> sessions = keycloak.realm(realm)
                .clients().get(clientUuid).getUserSessions(first, max);

        return sessions.stream()
                .map(this::mapToSessionResponse)
                .collect(Collectors.toList());
    }

    // ---------- Lấy số lượng session active của một client ----------
    public int getClientSessionCount(String clientUuid) {
        Map<String, Integer> sessionCountMap = keycloak.realm(realm)
                .clients().get(clientUuid).getApplicationSessionCount();

        return sessionCountMap.values().stream()
                .mapToInt(Integer::intValue)
                .sum();
    }

    // ---------- Xóa (logout) một session cụ thể ----------
    public void logoutSession(String sessionId) {
        keycloak.realm(realm).deleteSession(sessionId, false);
    }

    // ---------- Logout user khỏi tất cả session (force logout) ----------
    public void logoutUserSessions(String userId) {
        keycloak.realm(realm).users().get(userId).logout();
    }

    // ---------- Logout tất cả session của một client ----------
    public void logoutClientSessions(String clientId) {
        var sessions = keycloak.realm(realm)
                .clients().get(clientId).getUserSessions(0, 1000);

        if (sessions != null) {
            sessions.forEach(session -> logoutSession(session.getId()));
        }
    }

    // ---------- Lấy tóm tắt session của một user ----------
    public SessionSummaryResponse getUserSessionSummary(String userId) {
        List<SessionResponse> sessions = getUserSessions(userId);
        UserRepresentation user = keycloak.realm(realm).users().get(userId).toRepresentation();
        SessionSummaryResponse summary = new SessionSummaryResponse();
        summary.setUserId(userId);
        summary.setUsername(user.getUsername());
        summary.setActiveSessions(sessions.size());
        summary.setSessions(sessions);
        return summary;
    }

    // ---------- MAPPER ----------
    private SessionResponse mapToSessionResponse(UserSessionRepresentation session) {
        SessionResponse response = new SessionResponse();
        response.setId(session.getId());
        response.setUsername(session.getUsername());
        response.setUserId(session.getUserId());
        response.setIpAddress(session.getIpAddress());
        response.setStartTime(session.getStart());
        response.setLastAccessTime(session.getLastAccess());
        response.setRememberMe(session.isRememberMe());

        // Null-safe get clients
        if (session.getClients() != null) {
            response.setClients(session.getClients());
        }

        return response;
    }
}
