package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.CreateIdentityProviderMapperRequest;
import demo.bookingsalon.Payload.Request.Keycloak.CreateIdentityProviderRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateIdentityProviderRequest;
import demo.bookingsalon.Payload.Response.Keycloak.IdentityProviderMapperResponse;
import demo.bookingsalon.Payload.Response.Keycloak.IdentityProviderResponse;
import demo.bookingsalon.Service.Keycloak.IdentityProviderService;
import jakarta.validation.Valid;
import jakarta.ws.rs.core.Response;
import org.keycloak.representations.idm.IdentityProviderMapperTypeRepresentation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/identity-providers")
public class IdentityProviderController {
    private final IdentityProviderService identityProviderService;

    public IdentityProviderController(IdentityProviderService identityProviderService) {
        this.identityProviderService = identityProviderService;
    }

    // ═══════════════════════════════════════════════════════════════════
    // IDENTITY PROVIDERS
    // ═══════════════════════════════════════════════════════════════════

    // 1. Lấy danh sách tất cả identity providers
    @GetMapping
    public ResponseEntity<List<IdentityProviderResponse>> getAll() {
        return ResponseEntity.ok(identityProviderService.getIdentityProviders());
    }

    // 2. Tìm kiếm identity providers (có phân trang)
    @GetMapping("/search")
    public ResponseEntity<List<IdentityProviderResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") Boolean briefRepresentation,
            @RequestParam(defaultValue = "0") Integer first,
            @RequestParam(defaultValue = "10") Integer max) {
        return ResponseEntity.ok(identityProviderService.findIdentityProviders(
                search, briefRepresentation, first, max));
    }


    // 3. Lấy chi tiết identity provider
    @GetMapping("/{alias}")
    public ResponseEntity<IdentityProviderResponse> getById(@PathVariable String alias) {
        return ResponseEntity.ok(identityProviderService.getIdentityProvider(alias));
    }

    // 4. Tạo identity provider mới
    @PostMapping
    public ResponseEntity<IdentityProviderResponse> create(
            @RequestBody @Valid CreateIdentityProviderRequest request) {
        IdentityProviderResponse created = identityProviderService.createIdentityProvider(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 5. Cập nhật identity provider
    @PutMapping("/{alias}")
    public ResponseEntity<IdentityProviderResponse> update(
            @PathVariable String alias,
            @RequestBody @Valid UpdateIdentityProviderRequest request) {
        return ResponseEntity.ok(identityProviderService.updateIdentityProvider(alias, request));
    }

    // 6. Xóa identity provider
    @DeleteMapping("/{alias}")
    public ResponseEntity<Void> delete(@PathVariable String alias) {
        identityProviderService.deleteIdentityProvider(alias);
        return ResponseEntity.noContent().build();
    }

    // 7. Export identity provider
    @GetMapping("/{alias}/export")
    public ResponseEntity<Response> export(
            @PathVariable String alias,
            @RequestParam(defaultValue = "json") String format) {
        return ResponseEntity.ok(identityProviderService.exportIdentityProvider(alias, format));
    }

    // ═══════════════════════════════════════════════════════════════════
    // IDENTITY PROVIDER MAPPERS
    // ═══════════════════════════════════════════════════════════════════

    // 8. Lấy danh sách mappers của identity provider
    @GetMapping("/{alias}/mappers")
    public ResponseEntity<List<IdentityProviderMapperResponse>> getMappers(
            @PathVariable String alias) {
        return ResponseEntity.ok(identityProviderService.getMappers(alias));
    }

    // 9. Thêm mapper cho identity provider
    @PostMapping("/{alias}/mappers")
    public ResponseEntity<Void> addMapper(
            @PathVariable String alias,
            @RequestBody @Valid CreateIdentityProviderMapperRequest request) {
        identityProviderService.addMapper(alias, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 10. Cập nhật mapper
    @PutMapping("/{alias}/mappers/{mapperId}")
    public ResponseEntity<Void> updateMapper(
            @PathVariable String alias,
            @PathVariable String mapperId,
            @RequestBody @Valid CreateIdentityProviderMapperRequest request) {
        identityProviderService.updateMapper(alias, mapperId, request);
        return ResponseEntity.ok().build();
    }

    // 11. Xóa mapper
    @DeleteMapping("/{alias}/mappers/{mapperId}")
    public ResponseEntity<Void> deleteMapper(
            @PathVariable String alias,
            @PathVariable String mapperId) {
        identityProviderService.deleteMapper(alias, mapperId);
        return ResponseEntity.noContent().build();
    }

    // 12. Lấy danh sách các loại mapper có sẵn
    @GetMapping("/{alias}/mapper-types")
    public ResponseEntity<Map<String, IdentityProviderMapperTypeRepresentation>> getMapperTypes(
            @PathVariable String alias) {
        return ResponseEntity.ok(identityProviderService.getMapperTypes(alias));
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS: TẠO NHANH CÁC PROVIDER PHỔ BIẾN
    // ═══════════════════════════════════════════════════════════════════

    @PostMapping("/google")
    public ResponseEntity<IdentityProviderResponse> createGoogle(
            @RequestParam String clientId,
            @RequestParam String clientSecret,
            @RequestParam(defaultValue = "google") String alias) {
        CreateIdentityProviderRequest request =
                identityProviderService.buildGoogleConfig(alias, clientId, clientSecret);
        return create(request);
    }

    @PostMapping("/facebook")
    public ResponseEntity<IdentityProviderResponse> createFacebook(
            @RequestParam String clientId,
            @RequestParam String clientSecret,
            @RequestParam(defaultValue = "facebook") String alias) {
        CreateIdentityProviderRequest request =
                identityProviderService.buildFacebookConfig(alias, clientId, clientSecret);
        return create(request);
    }

    @PostMapping("/github")
    public ResponseEntity<IdentityProviderResponse> createGithub(
            @RequestParam String clientId,
            @RequestParam String clientSecret,
            @RequestParam(defaultValue = "github") String alias) {
        CreateIdentityProviderRequest request =
                identityProviderService.buildGithubConfig(alias, clientId, clientSecret);
        return create(request);
    }

    @PostMapping("/ldap")
    public ResponseEntity<IdentityProviderResponse> createLdap(
            @RequestParam String connectionUrl,
            @RequestParam String usersDn,
            @RequestParam String bindDn,
            @RequestParam String bindCredential,
            @RequestParam(defaultValue = "ldap") String alias) {
        CreateIdentityProviderRequest request =
                identityProviderService.buildLdapConfig(alias, connectionUrl, usersDn,
                        bindDn, bindCredential);
        return create(request);
    }
}
