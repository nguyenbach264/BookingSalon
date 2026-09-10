package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.Data;

import java.util.Map;

@Data
public class IdentityProviderMapperResponse {
    private String id;
    private String name;
    private String identityProviderAlias;
    private String identityProviderMapper;
    private Map<String, String> config;
}
