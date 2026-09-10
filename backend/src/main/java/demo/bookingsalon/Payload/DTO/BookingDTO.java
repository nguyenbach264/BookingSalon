package demo.bookingsalon.Payload.DTO;

import demo.bookingsalon.Enum.BookingStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
public class BookingDTO {

    private UUID id;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private UUID salonId;

    private UUID userId;

    private Set<UUID> serviceIds;

    private BookingStatus status = BookingStatus.PENDING;

    private int totalServices;

    private BigDecimal totalPrice;
}
