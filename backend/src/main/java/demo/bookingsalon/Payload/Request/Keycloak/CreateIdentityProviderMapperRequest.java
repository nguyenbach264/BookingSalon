package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.Map;

@Data
public class CreateIdentityProviderMapperRequest {
    private String name;
    private String identityProviderAlias;
    private String identityProviderMapper; // "oidc-username-idp-mapper", "saml-username-idp-mapper", v.v.
    private Map<String, String> config;
}
