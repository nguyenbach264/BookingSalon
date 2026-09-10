package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class IdentityProviderResponse {
    private String id;
    private String alias;
    private String providerId;
    private String displayName;
    private Boolean enabled;
    private Boolean trustEmail;
    private Boolean storeToken;
    private Boolean addReadTokenRoleOnCreate;
    private Boolean authenticateByDefault;
    private String firstBrokerLoginFlowAlias;
    private String postBrokerLoginFlowAlias;
    private Map<String, String> config;
    private List<IdentityProviderMapperResponse> mappers;
}
