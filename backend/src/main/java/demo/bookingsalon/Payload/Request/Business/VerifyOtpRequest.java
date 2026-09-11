package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "OTP code must not be blank!")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits!")
    private String otp;

    @NotBlank(message = "Username must not be blank!")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Password must not be blank!")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Email must not be blank!")
    @Email(message = "Invalid email format!")
    private String email;

    private String fullName;

    private String avatarUrl;

    @NotBlank(message = "Phone number must not be blank!")
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Invalid Vietnamese phone number!")
    private String phoneNumber;

    private String address;
}