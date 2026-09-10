package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.Request.Business.CreateUserRequest;
import demo.bookingsalon.Payload.Request.Keycloak.ResetPasswordRequest;
import demo.bookingsalon.Payload.Request.Business.UpdateUserRequest;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Service.Keycloak.RoleService;
import demo.bookingsalon.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final RoleService roleService;

    @GetMapping()
    public List<UserResponse> getUsers() {
        return userService.getUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return userService.getUserById(id);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserInDbByKeycloakId(@PathVariable("id") UUID keycloakId) {
        return ResponseEntity.status(HttpStatus.OK).body(userService.getUserInDbById(keycloakId));
    }

    @GetMapping("/{id}/roles")
    public List<String> getRoles(@PathVariable UUID id) {
        return roleService.getUserRealmRoles(id);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody @Valid CreateUserRequest request) {
        UserResponse userResponse = userService.createUser(request);
        if (userResponse == null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid credential");
        return ResponseEntity.status(HttpStatus.OK).body(userResponse);
    }

    @PutMapping("/{id}")
    public void updateUser(@PathVariable UUID id, @Valid UpdateUserRequest request) {
        userService.updateUser(id, request);
    }

    @PutMapping("/{id}/reset-password")
    public void resetPassword(@PathVariable UUID id, @RequestBody @Valid ResetPasswordRequest resetPasswordRequest) {
        userService.resetPassword(id, resetPasswordRequest.getNewPassword());
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return "Xóa thành công!";
    }

    // Hàm chuyển toàn bộ user keycloak sang db
    @GetMapping("/reverse")
    public ResponseEntity<?> reverseUser() {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(userService.reverseUser());
    }

}
