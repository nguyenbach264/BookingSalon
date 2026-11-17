package demo.bookingsalon.dto.request.keycloak;

import lombok.Data;

import java.util.Map;

@Data
public class CreateIdentityProviderMapperRequest {
    private String name;
    private String identityProviderAlias;
    private String identityProviderMapper; // "oidc-username-idp-mapper", "saml-username-idp-mapper", v.v.
    private Map<String, String> config;
}
