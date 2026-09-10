package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ClientResponse {
    private String id;
    private String clientId;
    private String name;
    private String description;
    private Boolean enabled;
    private Boolean publicClient;
    private List<String> redirectUris;
    private List<String> webOrigins;
    private Integer accessTokenLifespan;
    private String protocol;
    private Map<String, String> attributes;
    private List<String> clientRoles; // nếu muốn hiển thị roles
}
