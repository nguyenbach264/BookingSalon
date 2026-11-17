package demo.bookingsalon.dto.response.keycloak;

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
