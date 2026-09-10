package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Username mustn't be blank!")
    private String username;

    @NotBlank(message = "Password is mandatory")
    private String password;

    @NotBlank(message = "Password is mandatory")
    private String email;

    private String fullName;

    private String avatarUrl;

    @NotBlank
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    private String phoneNumber;

    private String address;
}
