package demo.bookingsalon.Payload.DTO;

import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private UUID id;

    private UUID salonId;

    private UUID userId;

    private UUID bookingId;

    private boolean isRead = false;

    private String type;

    private LocalDateTime createdAt;

    private LocalDateTime expiredAt;

    private BookingResponse bookingResponse;
}
