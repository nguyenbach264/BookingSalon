package demo.bookingsalon.Configuration;

import demo.bookingsalon.Entity.Admin;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Repository.AdminRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.Keycloak.RoleService;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * KeycloakSeeder — provisions seeded users/stylists/admins into Keycloak
 * and writes back the real Keycloak UUID to each DB record.
 *
 * Execution order: @Order(2) — runs AFTER DataSeeder (@Order(1) or default).
 * Safe to re-run: skips any account that already exists in Keycloak by username.
 *
 * Default password for all seeded accounts: BachBarber@2026
 * (Should be changed after first login in production)
 */
@Slf4j
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.keycloak-seeder.enabled", havingValue = "true", matchIfMissing = true)
@Order(2)
@RequiredArgsConstructor
public class KeycloakSeeder implements ApplicationRunner {

    private final Keycloak keycloak;
    private final RoleService roleService;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;
    private final AdminRepository adminRepository;

    @Value("${keycloak.realm}")
    private String realm;

    /** Default password assigned to all seeded demo accounts */
    private static final String DEFAULT_SEED_PASSWORD = "BachBarber@2026";

    // ─────────────────────────────────────────────────────────────────────────
    // Seed accounts to provision (username, email, fullName, role)
    // Must match DataSeeder values exactly.
    // ─────────────────────────────────────────────────────────────────────────
    private record SeedAccount(String username, String email, String fullName, String role) {}

    private static final List<SeedAccount> USER_ACCOUNTS = List.of(
        new SeedAccount("nguyen.van.minh",  "minh.nguyen@gmail.com",  "Nguyễn Văn Minh",  "USER"),
        new SeedAccount("tran.thi.lan",     "lan.tran@gmail.com",     "Trần Thị Lan",     "USER"),
        new SeedAccount("le.van.hung",      "hung.le@hotmail.com",    "Lê Văn Hùng",      "USER"),
        new SeedAccount("pham.thi.hoa",     "hoa.pham@yahoo.com",     "Phạm Thị Hoa",     "USER")
    );

    private static final List<SeedAccount> STYLIST_ACCOUNTS = List.of(
        new SeedAccount("alex.bach",   "alex.bach@bachbarber.vn",  "Alex Bach",      "STYLIST"),
        new SeedAccount("tony.tran",   "tony.tran@bachbarber.vn",  "Tony Trần",      "STYLIST"),
        new SeedAccount("ken.nguyen",  "ken.nguyen@bachbarber.vn", "Ken Nguyễn",     "STYLIST"),
        new SeedAccount("leo.huy",     "leo.huy@bachbarber.vn",    "Leo Huy",        "STYLIST"),
        new SeedAccount("harry.pham",  "harry.pham@bachbarber.vn", "Harry Phạm",     "STYLIST")
    );

    private static final List<SeedAccount> ADMIN_ACCOUNTS = List.of(
        new SeedAccount("admin.bach",    "bach@bachbarber.vn",    "Nguyễn Bách",   "ADMIN"),
        new SeedAccount("admin.manager", "manager@bachbarber.vn", "Trần Quản Lý",  "ADMIN")
    );

    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void run(ApplicationArguments args) {
        log.info("🔑 KeycloakSeeder: Starting Keycloak user provisioning and session configuration...");
        configureRealmSessionLifespans();

        int created = 0;
        int skipped = 0;

        // ── USERS ────────────────────────────────────────────────────────────
        for (SeedAccount acct : USER_ACCOUNTS) {
            try {
                UUID kcId = provisionKeycloakUser(acct);
                if (kcId == null) {
                    skipped++;
                    continue;
                }

                // Update keycloak_id in DB
                userRepository.findByUsername(acct.username()).ifPresent(user -> {
                    user.setKeycloakId(kcId);
                    userRepository.save(user);
                    log.info("   ✅ User '{}' → keycloak_id={}", acct.username(), kcId);
                });
                created++;
            } catch (Exception e) {
                log.warn("   ⚠️  Could not provision user '{}': {}", acct.username(), e.getMessage(), e);
            }
        }

        // ── STYLISTS ─────────────────────────────────────────────────────────
        for (SeedAccount acct : STYLIST_ACCOUNTS) {
            try {
                UUID kcId = provisionKeycloakUser(acct);
                if (kcId == null) {
                    skipped++;
                    continue;
                }

                // Update keycloak_id in DB
                stylistRepository.findByUsername(acct.username()).ifPresent(stylist -> {
                    stylist.setKeycloakId(kcId);
                    stylistRepository.save(stylist);
                    log.info("   ✅ Stylist '{}' → keycloak_id={}", acct.username(), kcId);
                });
                created++;
            } catch (Exception e) {
                log.warn("   ⚠️  Could not provision stylist '{}': {}", acct.username(), e.getMessage(), e);
            }
        }

        // ── ADMINS ───────────────────────────────────────────────────────────
        for (SeedAccount acct : ADMIN_ACCOUNTS) {
            try {
                UUID kcId = provisionKeycloakUser(acct);
                if (kcId == null) {
                    skipped++;
                    continue;
                }

                // Update keycloak_id in DB
                adminRepository.findByUsername(acct.username()).ifPresent(admin -> {
                    admin.setKeycloakId(kcId);
                    adminRepository.save(admin);
                    log.info("   ✅ Admin '{}' → keycloak_id={}", acct.username(), kcId);
                });
                created++;
            } catch (Exception e) {
                log.warn("   ⚠️  Could not provision admin '{}': {}", acct.username(), e.getMessage(), e);
            }
        }

        log.info("🎉 KeycloakSeeder done — created/synced={}, skipped={}", created, skipped);
        log.info("🔑 Default password for all seeded accounts: {}", DEFAULT_SEED_PASSWORD);
    }

    /**
     * Creates a user in Keycloak (if not already existing) and assigns their realm role.
     *
     * @return the Keycloak UUID of the created/found user, or null if failed
     */
    private UUID provisionKeycloakUser(SeedAccount acct) {
        // 1. Check if user already exists in Keycloak by EXACT username
        List<UserRepresentation> usersByUsername = keycloak.realm(realm)
                .users()
                .search(acct.username(), true);

        UserRepresentation exactUser = null;
        if (usersByUsername != null) {
            exactUser = usersByUsername.stream()
                    .filter(u -> acct.username().equalsIgnoreCase(u.getUsername()))
                    .findFirst()
                    .orElse(null);
        }

        // If not found by username, check by EXACT email (avoiding substring false matches)
        if (exactUser == null && acct.email() != null) {
            List<UserRepresentation> usersByEmail = keycloak.realm(realm)
                    .users()
                    .search(null, null, null, acct.email(), 0, 10);
            if (usersByEmail != null) {
                exactUser = usersByEmail.stream()
                        .filter(u -> acct.email().equalsIgnoreCase(u.getEmail()))
                        .findFirst()
                        .orElse(null);
            }
        }

        if (exactUser != null) {
            UUID existingId = UUID.fromString(exactUser.getId());
            log.info("   ℹ️  '{}' already exists in Keycloak (id={}), ensuring role...", acct.username(), existingId);

            // Ensure correct role is assigned
            ensureRoleAssigned(existingId, acct.role());

            // Still update DB keycloak_id to point to the real ID
            updateDbKeycloakId(acct, existingId);
            return existingId;
        }

        // 2. Build the Keycloak UserRepresentation
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(DEFAULT_SEED_PASSWORD);
        credential.setTemporary(false);

        UserRepresentation userRep = new UserRepresentation();
        userRep.setUsername(acct.username());
        userRep.setEmail(acct.email());
        userRep.setEnabled(true);
        userRep.setEmailVerified(true);
        userRep.setCredentials(Collections.singletonList(credential));

        // Split fullName into firstName / lastName
        String[] parts = acct.fullName().trim().split("\\s+");
        if (parts.length > 0) {
            // Vietnamese convention: last word is given name
            userRep.setFirstName(parts[parts.length - 1]);
            if (parts.length > 1) {
                userRep.setLastName(String.join(" ", Arrays.copyOf(parts, parts.length - 1)));
            }
        }

        // 3. Create in Keycloak
        Response response = keycloak.realm(realm).users().create(userRep);
        int status = response.getStatus();

        if (status == 409) {
            log.warn("   ⚠️  Conflict creating '{}' (status=409). Skipping.", acct.username());
            return null;
        }

        if (status != 201) {
            String body = "";
            try { body = response.readEntity(String.class); } catch (Exception ignored) {}
            log.error("   ❌ Keycloak creation failed for '{}': status={}, body={}", acct.username(), status, body);
            return null;
        }

        String keycloakId = CreatedResponseUtil.getCreatedId(response);
        UUID kcUuid = UUID.fromString(keycloakId);

        // 4. Assign realm role
        ensureRoleAssigned(kcUuid, acct.role());

        return kcUuid;
    }

    /**
     * Assigns a realm role to a Keycloak user if not already assigned,
     * and cleans up conflicting roles if needed.
     */
    private void ensureRoleAssigned(UUID keycloakUserId, String roleName) {
        try {
            List<String> currentRoles = keycloak.realm(realm)
                    .users()
                    .get(keycloakUserId.toString())
                    .roles()
                    .realmLevel()
                    .listAll()
                    .stream()
                    .map(r -> r.getName())
                    .toList();

            // Clean up accidental ADMIN role from stylists
            if ("STYLIST".equals(roleName) && currentRoles.contains("ADMIN")) {
                roleService.removeRealmRole(keycloakUserId, "ADMIN");
                log.info("   🧹 Removed incorrect ADMIN role from stylist {}", keycloakUserId);
            }

            if (!currentRoles.contains(roleName)) {
                roleService.assignRealmRole(keycloakUserId, roleName);
                log.info("   🏷️  Assigned role '{}' to {}", roleName, keycloakUserId);
            } else {
                log.info("   🏷️  Role '{}' already assigned to {}", roleName, keycloakUserId);
            }
        } catch (Exception e) {
            log.warn("   ⚠️  Could not assign role '{}' to {}: {}", roleName, keycloakUserId, e.getMessage());
        }
    }

    /**
     * Update keycloak_id in the correct DB table when a user already existed in Keycloak.
     * This bridges existing Keycloak accounts to the seeded DB rows.
     */
    private void updateDbKeycloakId(SeedAccount acct, UUID kcId) {
        switch (acct.role()) {
            case "USER" -> userRepository.findByUsername(acct.username()).ifPresent(u -> {
                u.setKeycloakId(kcId);
                userRepository.save(u);
            });
            case "STYLIST" -> stylistRepository.findByUsername(acct.username()).ifPresent(s -> {
                s.setKeycloakId(kcId);
                stylistRepository.save(s);
            });
            case "ADMIN" -> adminRepository.findByUsername(acct.username()).ifPresent(a -> {
                a.setKeycloakId(kcId);
                adminRepository.save(a);
            });
        }
    }

    /**
     * Cấu hình thời hạn phiên SSO và refresh token trên Keycloak Realm lên 30 ngày (2,592,000s)
     */
    private void configureRealmSessionLifespans() {
        try {
            org.keycloak.admin.client.resource.RealmResource realmRes = keycloak.realm(realm);
            org.keycloak.representations.idm.RealmRepresentation rep = realmRes.toRepresentation();
            int thirtyDaysSeconds = 30 * 24 * 3600;
            rep.setAccessTokenLifespan(thirtyDaysSeconds);
            rep.setAccessTokenLifespanForImplicitFlow(thirtyDaysSeconds);
            rep.setSsoSessionIdleTimeout(thirtyDaysSeconds);
            rep.setSsoSessionMaxLifespan(thirtyDaysSeconds);
            rep.setClientSessionIdleTimeout(thirtyDaysSeconds);
            rep.setClientSessionMaxLifespan(thirtyDaysSeconds);
            rep.setSsoSessionIdleTimeoutRememberMe(thirtyDaysSeconds);
            rep.setSsoSessionMaxLifespanRememberMe(thirtyDaysSeconds);
            realmRes.update(rep);
            log.info("   🔑 KeycloakSeeder: Realm '{}' Access Token, SSO Session & Refresh Token lifespan configured to 30 days.", realm);
        } catch (Exception e) {
            log.warn("   ⚠️  Could not configure realm session lifespan in Keycloak: {}", e.getMessage());
        }
    }
}

