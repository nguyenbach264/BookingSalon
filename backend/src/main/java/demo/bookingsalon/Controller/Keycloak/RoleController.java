package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.CreateRoleRequest;
import demo.bookingsalon.Service.Keycloak.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/roles")
public class RoleController {
    private final RoleService roleService;

    // Gán role cho user
    @PostMapping("/user/{userId}/role")
    public ResponseEntity<Void> assignRole(
            @PathVariable UUID userId,
            @RequestBody String role) {
        roleService.assignRealmRole(userId, role);
        return ResponseEntity.ok().build();
    }

    // Xóa role khỏi user
    @DeleteMapping("/{userId}/{roleName}")
    public ResponseEntity<Void> removeRole(
            @PathVariable UUID userId,
            @PathVariable String roleName) {
        roleService.removeRealmRole(userId, roleName);
        return ResponseEntity.noContent().build();
    }

    // Lấy danh sách roles của user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<String>> getUserRoles(@PathVariable UUID userId) {
        return ResponseEntity.ok(roleService.getUserRealmRoles(userId));
    }

    // Lấy toàn bộ roles của realm
    @GetMapping()
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRealmRoles());
    }

    @PostMapping()
    public ResponseEntity<Void> createRole(@RequestBody @Valid CreateRoleRequest request) {
        roleService.createRealmRole(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Xóa role khỏi realm
    @DeleteMapping("/{roleName}")
    public ResponseEntity<Void> deleteRole(@PathVariable String roleName) {
        roleService.deleteRealmRole(roleName);
        return ResponseEntity.noContent().build();
    }
}
