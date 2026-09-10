package demo.bookingsalon.Payload.Request.Business;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserRequest {

    private String fullName;

    private String email;

    private String address;

    @NotBlank
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    private String phoneNumber;

    private String avatarUrl;

    private Boolean enabled;
}
