package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UpdateClientRequest {
    private String name;
    private String description;
    private Boolean enabled;
    private Boolean publicClient;
    private List<String> redirectUris;
    private List<String> webOrigins;
    private Integer accessTokenLifespan;
    private Map<String, String> attributes;
}
