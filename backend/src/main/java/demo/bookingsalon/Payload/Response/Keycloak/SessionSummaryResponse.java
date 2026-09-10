package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.Data;

import java.util.List;

@Data
public class SessionSummaryResponse {
    private String userId;
    private String username;
    private int activeSessions;
    private List<SessionResponse> sessions;
}
