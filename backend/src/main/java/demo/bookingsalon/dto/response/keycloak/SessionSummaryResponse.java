package demo.bookingsalon.dto.response.keycloak;

import lombok.Data;

import java.util.List;

@Data
public class SessionSummaryResponse {
    private String userId;
    private String username;
    private int activeSessions;
    private List<SessionResponse> sessions;
}
