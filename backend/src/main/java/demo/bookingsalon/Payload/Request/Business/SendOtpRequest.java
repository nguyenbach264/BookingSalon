package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendOtpRequest {

    @NotBlank(message = "Email must not be blank!")
    @Email(message = "Invalid email format!")
    private String email;

    @NotBlank(message = "Username must not be blank!")
    private String username;

    private String phoneNumber;
}