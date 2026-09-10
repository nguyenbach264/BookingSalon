package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.CreateGroupRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateGroupRequest;
import demo.bookingsalon.Payload.Response.Keycloak.GroupUserResponse;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Service.Keycloak.GroupUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupUserController {
    private final GroupUserService groupUserService;

    public GroupUserController(GroupUserService groupUserService) {
        this.groupUserService = groupUserService;
    }

    // ---------- 1. LIST GROUPS ----------
    @GetMapping
    public ResponseEntity<List<GroupUserResponse>> listGroups() {
        return ResponseEntity.ok(groupUserService.getGroups());
    }

    // ---------- 2. GET GROUP BY ID ----------
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupUserResponse> getGroup(@PathVariable String groupId) {
        return ResponseEntity.ok(groupUserService.getGroupById(groupId));
    }

    // ---------- 3. CREATE GROUP ----------
    @PostMapping
    public ResponseEntity<GroupUserResponse> createGroup(
            @RequestBody @Valid CreateGroupRequest request) {
        GroupUserResponse created = groupUserService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ---------- 4. UPDATE GROUP ----------
    @PutMapping("/{groupId}")
    public ResponseEntity<GroupUserResponse> updateGroup(
            @PathVariable String groupId,
            @RequestBody @Valid UpdateGroupRequest request) {
        return ResponseEntity.ok(groupUserService.updateGroup(groupId, request));
    }

    // ---------- 5. DELETE GROUP ----------
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable String groupId) {
        groupUserService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    // ---------- 6. GET MEMBERS OF A GROUP ----------
    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(
            @PathVariable String groupId,
            @RequestParam(defaultValue = "0") int first,
            @RequestParam(defaultValue = "10") int max) {
        return ResponseEntity.ok(groupUserService.getGroupMembers(groupId, first, max));
    }

    // ---------- 7. ADD USER TO GROUP ----------
    @PostMapping("/{groupId}/users/{userId}")
    public ResponseEntity<Void> addUserToGroup(
            @PathVariable String groupId,
            @PathVariable String userId) {
        groupUserService.addUserToGroup(userId, groupId);
        return ResponseEntity.ok().build();
    }

    // ---------- 8. REMOVE USER FROM GROUP ----------
    @DeleteMapping("/{groupId}/users/{userId}")
    public ResponseEntity<Void> removeUserFromGroup(
            @PathVariable String groupId,
            @PathVariable String userId) {
        groupUserService.removeUserFromGroup(userId, groupId);
        return ResponseEntity.noContent().build();
    }

    // ---------- 9. GET GROUPS OF A USER ----------
    @GetMapping("/users/{userId}")
    public ResponseEntity<List<GroupUserResponse>> getUserGroups(@PathVariable String userId) {
        return ResponseEntity.ok(groupUserService.getUserGroups(userId));
    }

    // ---------- 10. GET REALM ROLES OF GROUP ----------
    @GetMapping("/{groupId}/roles")
    public ResponseEntity<List<String>> getGroupRealmRoles(@PathVariable String groupId) {
        return ResponseEntity.ok(groupUserService.getGroupRealmRoles(groupId));
    }

    // ---------- 11. ADD REALM ROLE TO GROUP ----------
    @PostMapping("/{groupId}/roles/{roleName}")
    public ResponseEntity<Void> addRealmRoleToGroup(
            @PathVariable String groupId,
            @PathVariable String roleName) {
        groupUserService.addRealmRoleToGroup(groupId, roleName);
        return ResponseEntity.ok().build();
    }

    // ---------- 12. REMOVE REALM ROLE FROM GROUP ----------
    @DeleteMapping("/{groupId}/roles/{roleName}")
    public ResponseEntity<Void> removeRealmRoleFromGroup(
            @PathVariable String groupId,
            @PathVariable String roleName) {
        groupUserService.removeRealmRoleFromGroup(groupId, roleName);
        return ResponseEntity.noContent().build();
    }
}
