package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateNotificationRequest {
    @NotBlank
    private UUID salonId;

    @NotBlank
    private UUID userId;

    @NotBlank
    private UUID bookingId;

    private String type;
}
