package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
public class CreateClientRequest {
    private String clientId;
    private String name;
    private String description;
    private Boolean enabled = true;
    private Boolean publicClient = true; // default là public
    private List<String> redirectUris;
    private List<String> webOrigins;
    private Integer accessTokenLifespan;
    private String protocol = "openid-connect";
    private Map<String, String> attributes = new HashMap<>();
}
