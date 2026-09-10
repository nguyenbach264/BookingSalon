package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.CreateRoleRequest;
import jakarta.ws.rs.WebApplicationException;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    // 1. Gán role cho user (VD: gán role "USER" sau khi đăng ký)
    public void assignRealmRole(UUID userId, String roleName) {
        try {
            // 1. Lấy đối tượng role từ realm
            RoleRepresentation role = keycloak.realm(realm).roles().get(roleName).toRepresentation();

            // 2. Gán role cho user
            keycloak.realm(realm).users().get(userId.toString()).roles().realmLevel()
                    .add(Collections.singletonList(role));

        } catch (WebApplicationException e) {
            // Log chi tiết lỗi để debug
            System.err.println("Lỗi khi gán role: " + e.getMessage());
            if (e.getResponse() != null) {
                System.err.println("Status: " + e.getResponse().getStatus());
                System.err.println("Body: " + e.getResponse().readEntity(String.class));
            }
            throw new RuntimeException("Gán role thất bại: " + e.getMessage(), e);
        }
    }

    // 2. Lấy role của user
    public List<String> getUserRealmRoles(UUID userId) {
        return keycloak.realm(realm).users().get(userId.toString()).roles().realmLevel().listAll()
                .stream().map(RoleRepresentation::getName)
                .collect(Collectors.toList());
    }

    // 3. Tạo mới Role
    public void createRealmRole(CreateRoleRequest request) {
        // Tạo role trong Keycloak
        RoleRepresentation role = new RoleRepresentation();
        role.setName(request.getRoleName());
        role.setDescription(request.getRoleDescription());

        keycloak.realm(realm).roles().create(role);
    }

    // 4. Xóa role của user
    public void removeRealmRole(UUID userId, String roleName) {
        RoleRepresentation role = keycloak.realm(realm).roles().get(roleName).toRepresentation();
        keycloak.realm(realm).users().get(userId.toString()).roles().realmLevel()
                .remove(Collections.singletonList(role));
    }

    // 5. Xóa 1 Role trong Realm
    public void deleteRealmRole(String roleName) {
        keycloak.realm(realm).roles().get(roleName).remove();
    }

    // Optional: quản lý roles toàn cục
    public List<String> getAllRealmRoles() {
        return keycloak.realm(realm).roles().list()
                .stream().map(RoleRepresentation::getName)
                .collect(Collectors.toList());
    }
}
