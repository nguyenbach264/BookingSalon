package demo.bookingsalon.Payload.Request.Business;

import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateBookingRequest {

    private UUID salonId;

    private UUID userId;

    private UUID stylistId;

    private LocalDateTime startTime;

    private List<UUID> serviceIds;

    private BookingStatus status;

    // TotalService và TotalAmount phải tự tính

}
