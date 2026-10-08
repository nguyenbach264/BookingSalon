package demo.bookingsalon.Payload.Admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollBookingDetailDTO {
    private UUID bookingId;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private List<String> serviceNames;
    private BigDecimal totalAmount;
    private BigDecimal bookingCommission;
}
