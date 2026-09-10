package demo.bookingsalon.Payload.Request.Keycloak;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoleRequest {
    @NotBlank(message = "Role name is mandatory")
    private String roleName;

    @NotBlank(message = "Role description is mandatory")
    private String roleDescription;
}
