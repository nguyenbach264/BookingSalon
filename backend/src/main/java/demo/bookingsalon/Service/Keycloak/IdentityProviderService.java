package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.CreateIdentityProviderMapperRequest;
import demo.bookingsalon.Payload.Request.Keycloak.CreateIdentityProviderRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateIdentityProviderRequest;
import demo.bookingsalon.Payload.Response.Keycloak.IdentityProviderMapperResponse;
import demo.bookingsalon.Payload.Response.Keycloak.IdentityProviderResponse;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.IdentityProviderResource;
import org.keycloak.representations.idm.IdentityProviderMapperRepresentation;
import org.keycloak.representations.idm.IdentityProviderMapperTypeRepresentation;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class IdentityProviderService {
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    public IdentityProviderService(Keycloak keycloak) {
        this.keycloak = keycloak;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. QUẢN LÝ IDENTITY PROVIDERS
    // ═══════════════════════════════════════════════════════════════════

    // 1.1. Lấy danh sách tất cả identity providers
    public List<IdentityProviderResponse> getIdentityProviders() {
        List<IdentityProviderRepresentation> providers =
                keycloak.realm(realm).identityProviders().findAll();
        return providers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // 1.2. Lấy danh sách identity providers (có tìm kiếm)
    public List<IdentityProviderResponse> findIdentityProviders(String search,
                                                                Boolean briefRepresentation,
                                                                Integer first,
                                                                Integer max) {
        List<IdentityProviderRepresentation> providers =
                keycloak.realm(realm).identityProviders()
                        .find(search, briefRepresentation, first, max);
        return providers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<IdentityProviderResponse> findAll() {
        List<IdentityProviderRepresentation> providers =
                keycloak.realm(realm).identityProviders().findAll();
        return providers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // 1.3. Lấy chi tiết một identity provider theo alias
    public IdentityProviderResponse getIdentityProvider(String alias) {
        IdentityProviderRepresentation provider =
                keycloak.realm(realm).identityProviders().get(alias).toRepresentation();
        return mapToResponse(provider);
    }

    // 1.4. Tạo identity provider mới
    public IdentityProviderResponse createIdentityProvider(CreateIdentityProviderRequest request) {

        IdentityProviderRepresentation provider = new IdentityProviderRepresentation();

        provider.setAlias(request.getAlias());
        provider.setProviderId(request.getProviderId());
        provider.setDisplayName(request.getDisplayName());

        provider.setEnabled(request.getEnabled() == null || request.getEnabled());

        provider.setTrustEmail(Boolean.TRUE.equals(request.getTrustEmail()));

        provider.setStoreToken(Boolean.TRUE.equals(request.getStoreToken()));

        provider.setLinkOnly(Boolean.TRUE.equals(request.getLinkOnly()));

        if (request.getFirstBrokerLoginFlowAlias() != null) {
            provider.setFirstBrokerLoginFlowAlias(request.getFirstBrokerLoginFlowAlias());
        }

        if (request.getPostBrokerLoginFlowAlias() != null) {
            provider.setPostBrokerLoginFlowAlias(request.getPostBrokerLoginFlowAlias());
        }

        if (request.getConfig() != null) {
            provider.setConfig(new HashMap<>(request.getConfig()));
        }

        log.info("Creating Identity Provider: {}", provider.getAlias());

        try (Response response = keycloak.realm(realm).identityProviders().create(provider)) {
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                String error = response.readEntity(String.class);
                throw new RuntimeException(
                        "Create Identity Provider failed: " + response.getStatus() + " - " + error);
            }
        }

        return getIdentityProvider(request.getAlias());
    }

    // 1.5. Cập nhật identity provider
    public IdentityProviderResponse updateIdentityProvider(String alias,
                                                           UpdateIdentityProviderRequest request) {
        IdentityProviderResource resource = keycloak.realm(realm).identityProviders().get(alias);
        IdentityProviderRepresentation provider = resource.toRepresentation();

        if (request.getAlias() != null) {
            provider.setAlias(request.getAlias());
        }
        if (request.getDisplayName() != null) {
            provider.setDisplayName(request.getDisplayName());
        }
        if (request.getEnabled() != null) {
            provider.setEnabled(request.getEnabled());
        }
        if (request.getTrustEmail() != null) {
            provider.setTrustEmail(request.getTrustEmail());
        }
        if (request.getStoreToken() != null) {
            provider.setStoreToken(request.getStoreToken());
        }
        if (request.getConfig() != null) {
            provider.setConfig(request.getConfig());
        }

        resource.update(provider);
        return getIdentityProvider(request.getAlias() != null ? request.getAlias() : alias);
    }

    // 1.6. Xóa identity provider
    public void deleteIdentityProvider(String alias) {
        keycloak.realm(realm).identityProviders().get(alias).remove();
    }

    // 1.7. Export cấu hình identity provider
    public Response exportIdentityProvider(String alias, String format) {
        // format: "json" hoặc "xml"
        return keycloak.realm(realm).identityProviders().get(alias).export(format);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. QUẢN LÝ IDENTITY PROVIDER MAPPERS
    // ═══════════════════════════════════════════════════════════════════

    // 2.1. Lấy danh sách mappers của identity provider
    public List<IdentityProviderMapperResponse> getMappers(String alias) {
        List<IdentityProviderMapperRepresentation> mappers =
                keycloak.realm(realm).identityProviders().get(alias).getMappers();
        return mappers.stream()
                .map(this::mapToMapperResponse)
                .collect(Collectors.toList());
    }

    // 2.2. Thêm mapper cho identity provider
    public void addMapper(String alias, CreateIdentityProviderMapperRequest request) {
        IdentityProviderMapperRepresentation mapper = new IdentityProviderMapperRepresentation();
        mapper.setName(request.getName());
        mapper.setIdentityProviderMapper(request.getIdentityProviderMapper());
        mapper.setIdentityProviderAlias(request.getIdentityProviderAlias());
        if (request.getConfig() != null) {
            mapper.setConfig(request.getConfig());
        }

        keycloak.realm(realm).identityProviders().get(alias).addMapper(mapper);
        IdentityProviderRepresentation response = keycloak.realm(realm).identityProviders().findAll()
                .stream().filter(item ->
                        request.getIdentityProviderAlias().equals(item.getAlias())
                )
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Alias not exist!"));
    }

    // 2.3. Cập nhật mapper
    public void updateMapper(String alias, String mapperId, CreateIdentityProviderMapperRequest request) {
        IdentityProviderMapperRepresentation mapper = new IdentityProviderMapperRepresentation();
        mapper.setName(request.getName());
        mapper.setIdentityProviderMapper(request.getIdentityProviderMapper());
        if (request.getConfig() != null) {
            mapper.setConfig(request.getConfig());
        }

        keycloak.realm(realm).identityProviders().get(alias).update(mapperId, mapper);
    }

    // 2.4. Xóa mapper
    public void deleteMapper(String alias, String mapperId) {
        keycloak.realm(realm).identityProviders().get(alias).delete(mapperId);
    }

    // 2.5. Lấy danh sách các loại mapper có sẵn
    public Map<String, IdentityProviderMapperTypeRepresentation> getMapperTypes(String alias) {
        return keycloak.realm(realm).identityProviders().get(alias).getMapperTypes();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. HELPER: TẠO CẤU HÌNH CHO CÁC PROVIDER PHỔ BIẾN
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Tạo cấu hình cho Google Identity Provider
     * Yêu cầu: clientId và clientSecret từ Google Cloud Console
     */
    public CreateIdentityProviderRequest buildGoogleConfig(String alias,
                                                           String clientId,
                                                           String clientSecret) {
        CreateIdentityProviderRequest request = new CreateIdentityProviderRequest();
        request.setAlias(alias);
        request.setProviderId("google");
        request.setDisplayName("Google");
        request.setEnabled(true);
        request.setTrustEmail(true);
        request.setStoreToken(true);
        request.setAddReadTokenRoleOnCreate(true);
        request.setFirstBrokerLoginFlowAlias("first broker login");

        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("clientSecret", clientSecret);
        config.put("defaultScope", "email profile");
        config.put("prompt", "consent");
        request.setConfig(config);

        return request;
    }

    /**
     * Tạo cấu hình cho Facebook Identity Provider
     */
    public CreateIdentityProviderRequest buildFacebookConfig(String alias,
                                                             String clientId,
                                                             String clientSecret) {
        CreateIdentityProviderRequest request = new CreateIdentityProviderRequest();
        request.setAlias(alias);
        request.setProviderId("facebook");
        request.setDisplayName("Facebook");
        request.setEnabled(true);
        request.setTrustEmail(true);
        request.setStoreToken(true);
        request.setFirstBrokerLoginFlowAlias("first broker login");

        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("clientSecret", clientSecret);
        config.put("defaultScope", "email public_profile");
        request.setConfig(config);

        return request;
    }

    /**
     * Tạo cấu hình cho GitHub Identity Provider
     */
    public CreateIdentityProviderRequest buildGithubConfig(String alias,
                                                           String clientId,
                                                           String clientSecret) {
        CreateIdentityProviderRequest request = new CreateIdentityProviderRequest();
        request.setAlias(alias);
        request.setProviderId("github");
        request.setDisplayName("GitHub");
        request.setEnabled(true);
        request.setStoreToken(true);
        request.setFirstBrokerLoginFlowAlias("first broker login");

        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("clientSecret", clientSecret);
        config.put("defaultScope", "read:user user:email");
        request.setConfig(config);

        return request;
    }

    /**
     * Tạo cấu hình cho LDAP Identity Provider
     */
    public CreateIdentityProviderRequest buildLdapConfig(String alias,
                                                         String connectionUrl,
                                                         String usersDn,
                                                         String bindDn,
                                                         String bindCredential) {
        CreateIdentityProviderRequest request = new CreateIdentityProviderRequest();
        request.setAlias(alias);
        request.setProviderId("ldap");
        request.setDisplayName("LDAP");
        request.setEnabled(true);
        request.setFirstBrokerLoginFlowAlias("first broker login");

        Map<String, String> config = new HashMap<>();
        config.put("connectionUrl", connectionUrl);
        config.put("usersDn", usersDn);
        config.put("bindDn", bindDn);
        config.put("bindCredential", bindCredential);
        config.put("userObjectClasses", "inetOrgPerson, organizationalPerson");
        config.put("usernameLDAPAttribute", "uid");
        config.put("rdnLDAPAttribute", "uid");
        config.put("uuidLDAPAttribute", "entryUUID");
        config.put("userNameAttribute", "cn");
        config.put("searchScope", "1"); // SUBTREE_SCOPE
        config.put("connectionTimeout", "5000");
        config.put("readTimeout", "5000");
        config.put("authenticationType", "simple");
        config.put("editMode", "WRITABLE");
        config.put("allowKerberosAuthentication", "false");
        config.put("syncRegistrations", "false");
        config.put("usePasswordModifyExtendedOp", "false");
        config.put("authType", "none");
        request.setConfig(config);

        return request;
    }

    /**
     * Tạo cấu hình cho OIDC Identity Provider (dùng cho các provider khác)
     */
    public CreateIdentityProviderRequest buildOidcConfig(String alias,
                                                         String displayName,
                                                         String clientId,
                                                         String clientSecret,
                                                         String authorizationUrl,
                                                         String tokenUrl,
                                                         String userInfoUrl,
                                                         String issuer) {
        CreateIdentityProviderRequest request = new CreateIdentityProviderRequest();
        request.setAlias(alias);
        request.setProviderId("oidc");
        request.setDisplayName(displayName);
        request.setEnabled(true);
        request.setTrustEmail(true);
        request.setStoreToken(true);
        request.setAddReadTokenRoleOnCreate(true);
        request.setFirstBrokerLoginFlowAlias("first broker login");

        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("clientSecret", clientSecret);
        config.put("authorizationUrl", authorizationUrl);
        config.put("tokenUrl", tokenUrl);
        config.put("userInfoUrl", userInfoUrl);
        config.put("issuer", issuer);
        config.put("defaultScope", "openid profile email");
        config.put("validateSignature", "true");
        request.setConfig(config);

        return request;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. MAPPER METHODS
    // ═══════════════════════════════════════════════════════════════════

    private IdentityProviderResponse mapToResponse(IdentityProviderRepresentation provider) {
        IdentityProviderResponse response = new IdentityProviderResponse();
        response.setId(provider.getInternalId());
        response.setAlias(provider.getAlias());
        response.setProviderId(provider.getProviderId());
        response.setDisplayName(provider.getDisplayName());
        response.setEnabled(provider.isEnabled());
        response.setTrustEmail(provider.isTrustEmail());
        response.setStoreToken(provider.isStoreToken());
        response.setAddReadTokenRoleOnCreate(provider.isAddReadTokenRoleOnCreate());
        response.setAuthenticateByDefault(provider.isAuthenticateByDefault());
        response.setFirstBrokerLoginFlowAlias(provider.getFirstBrokerLoginFlowAlias());
        response.setPostBrokerLoginFlowAlias(provider.getPostBrokerLoginFlowAlias());
        response.setConfig(provider.getConfig());

        // Lấy danh sách mappers
        try {
            List<IdentityProviderMapperRepresentation> mappers =
                    keycloak.realm(realm).identityProviders().get(provider.getAlias()).getMappers();
            response.setMappers(mappers.stream()
                    .map(this::mapToMapperResponse)
                    .collect(Collectors.toList()));
        } catch (Exception e) {
            e.getStackTrace();
//            log.warn("Cannot get mappers for provider: {}", provider.getAlias());
            response.setMappers(new ArrayList<>());
        }

        return response;
    }

    private IdentityProviderMapperResponse mapToMapperResponse(IdentityProviderMapperRepresentation mapper) {
        IdentityProviderMapperResponse response = new IdentityProviderMapperResponse();
        response.setId(mapper.getId());
        response.setName(mapper.getName());
        response.setIdentityProviderAlias(mapper.getIdentityProviderAlias());
        response.setIdentityProviderMapper(mapper.getIdentityProviderMapper());
        response.setConfig(mapper.getConfig());
        return response;
    }
}
