package demo.bookingsalon.Payload.Admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StylistPayrollDTO {
    private UUID stylistId;
    private String stylistName;
    private String stylistPhone;
    private String salonName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal baseSalary;
    private BigDecimal commissionRate;
    private int completedBookingsCount;
    private BigDecimal totalCompletedBookingRevenue;
    private BigDecimal commissionBonus;
    private BigDecimal tipBalance;
    private BigDecimal totalSalary;
    private List<PayrollBookingDetailDTO> bookingDetails;
}
