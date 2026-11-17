package demo.bookingsalon.dto.response.keycloak;

import lombok.Data;

import java.util.Map;

@Data
public class EventResponse {
    private String id;

    private Long time;

    private String type;

    private String realmId;

    private String clientId;

    private String userId;

    private String sessionId;

    private String ipAddress;

    private String error;

    private Map<String, String> details;
}
