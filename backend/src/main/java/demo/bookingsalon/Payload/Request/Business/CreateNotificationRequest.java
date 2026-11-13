package demo.bookingsalon.Payload.Request.Business;

import lombok.Data;

import java.util.UUID;

@Data
public class CreateNotificationRequest {
    private UUID salonId;
    private UUID userId;
    private UUID bookingId;
    private String title;
    private String message;
    private String type;
}
