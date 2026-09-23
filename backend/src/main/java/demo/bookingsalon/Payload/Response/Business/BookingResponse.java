package demo.bookingsalon.Payload.Response.Business;

import demo.bookingsalon.Enum.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {

    private UUID id;

    private String bookingCode;

    private String customerName;

    private String customerPhone;

    private String customerEmail;

    private String customerNotes;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private UUID salonId;

    private String salonName;

    private String salonAddress;

    private UUID userId;

    private UUID stylistId;

    private String stylistName;

    private Set<UUID> serviceIds;

    private BookingStatus status;

    private String paymentMethod;

    private String paymentStatus;

    private int totalServices;

    private BigDecimal subtotalAmount;

    private BigDecimal discountAmount;

    private String voucherCode;

    private BigDecimal totalAmount;

    private boolean isReviewed;
}
