package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.Map;

@Data
public class UpdateIdentityProviderRequest {
    private String alias;
    private String displayName;
    private Boolean enabled;
    private Boolean trustEmail;
    private Boolean storeToken;
    private Map<String, String> config;
}
