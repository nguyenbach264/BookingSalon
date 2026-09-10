package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.Data;

@Data
public class AdminEventResponse {
    private String id;

    private Long time;

    private String operationType;

    private String realmId;

    private String clientId;

    private String userId;

    private String ipAddress;

    private String resourceType;

    private String resourcePath;

    private String error;

    /**
     * JSON representation của resource
     */
    private String representation;
}
