package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateStylistRequest {
    @NotBlank(message = "Username mustn't be blank")
    private String username;

    @NotBlank(message = "Password mustn't be blank")
    private String password;

    @NotBlank(message = "Full name mustn't be blank")
    private String fullName;

    @NotBlank(message = "Email mustn't be blank")
    @Email(message = "Email format is incorrect")
    private String email;

    @NotBlank(message = "Phone number mustn't be blank")
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    private String phoneNumber;

    private String address;

    @CreationTimestamp
    private LocalDateTime joinDate;

    private LocalDateTime leaveDate;

    private boolean enabled;

    private BigDecimal salary;

    private String avatarUrl;

}
