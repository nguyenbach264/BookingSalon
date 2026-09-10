package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateSalonRequest {

    @NotBlank(message = "Salon name is mandatory")
    private String salonName;

    @NotBlank(message = "Salon message is mandatory")
    private String address;

    private LocalDateTime openTime;

    private LocalDateTime closeTime;

    private List<String> images;

    @NotBlank(message = "Phone number of salon is mandatory")
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    private String phoneNumber;

    @Email(message = "Email format is incorrect")
    @NotBlank(message = "Email of salon is mandatory")
    private String email;

    private String city;
}
