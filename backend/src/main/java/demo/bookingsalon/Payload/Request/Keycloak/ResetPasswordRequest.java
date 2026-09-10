package demo.bookingsalon.Payload.Request.Keycloak;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResetPasswordRequest {
    @NotBlank(message = "New password is mandatory")
    private String newPassword;

    private boolean temporary = false;
}
