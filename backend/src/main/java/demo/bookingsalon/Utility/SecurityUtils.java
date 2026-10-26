package demo.bookingsalon.Utility;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Trích xuất Keycloak Subject UUID từ Authentication Token
     */
    public UUID getCurrentKeycloakId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null) {
                try {
                    return UUID.fromString(sub);
                } catch (IllegalArgumentException ignored) {}
            }
        }
        return null;
    }

    /**
     * Trích xuất User entity tương ứng từ CSDL dựa trên JWT claims
     */
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null) {
                try {
                    UUID keycloakId = UUID.fromString(sub);
                    User user = userRepository.findByKeycloakId(keycloakId);
                    if (user != null) {
                        return user;
                    }

                    // Fallback theo preferred_username
                    String username = jwt.getClaimAsString("preferred_username");
                    if (username != null && !username.isBlank()) {
                        user = userRepository.findByUsername(username).orElse(null);
                        if (user != null) {
                            user.setKeycloakId(keycloakId);
                            userRepository.save(user);
                            return user;
                        }
                    }

                    // Fallback theo email
                    String email = jwt.getClaimAsString("email");
                    if (email != null && !email.isBlank()) {
                        user = userRepository.findByEmail(email).orElse(null);
                        if (user != null) {
                            user.setKeycloakId(keycloakId);
                            userRepository.save(user);
                            return user;
                        }
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }
        return null;
    }

    /**
     * Trích xuất Primary Key (UUID) của User trong CSDL
     */
    public UUID getCurrentUserId(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return user != null ? user.getId() : null;
    }

    /**
     * Kiểm tra user có Role cụ thể hay không (ví dụ: "ROLE_ADMIN", "ROLE_STYLIST")
     */
    public boolean hasRole(Authentication authentication, String role) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String normalizedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(normalizedRole::equalsIgnoreCase);
    }

    public boolean isAdmin(Authentication authentication) {
        return hasRole(authentication, "ROLE_ADMIN");
    }

    public boolean isStylist(Authentication authentication) {
        return hasRole(authentication, "ROLE_STYLIST");
    }

    /**
     * Kiểm tra người dùng hiện tại có quyền truy cập vào tài nguyên của targetUserId không
     * Nếu không phải ADMIN và không phải chính user sở hữu -> ném AccessDeniedException
     */
    public void validateUserAccess(Authentication authentication, UUID targetUserId) {
        if (isAdmin(authentication)) {
            return;
        }
        UUID currentUserId = getCurrentUserId(authentication);
        if (currentUserId == null || !currentUserId.equals(targetUserId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập hoặc chỉnh sửa tài nguyên của người dùng khác!");
        }
    }
}

