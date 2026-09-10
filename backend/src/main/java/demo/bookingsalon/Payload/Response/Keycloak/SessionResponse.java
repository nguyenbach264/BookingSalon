package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class SessionResponse {
    private String id;
    private String username;
    private String userId;
    private String ipAddress;
    private String browser;
    private String os;
    private Long startTime;
    private Long lastAccessTime;
    private boolean rememberMe;
    private Map<String, String> clients = new HashMap<>(); // clientId -> session state
}
