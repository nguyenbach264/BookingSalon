package demo.bookingsalon.Payload.Response.Business;

import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {

    private UUID id;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private UUID salonId;

    private UUID userId;

    private UUID stylistId;

    private Set<UUID> serviceIds;

    private BookingStatus status;

    private PaymentMethod paymentMethod;

    private int totalServices;

    private BigDecimal totalAmount;
}
