package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Username mustn't be blank!")
    private String username;

    @NotBlank(message = "Password mustn't be blank!")
    private String password;
}

