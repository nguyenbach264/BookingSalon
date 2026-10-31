package demo.bookingsalon.Payload.Admin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoteUserToStylistRequest {

    @NotNull(message = "User ID không được để trống")
    private UUID userId;

    @NotNull(message = "Salon ID không được để trống")
    private UUID salonId;

    private String nickname;

    private String bio;

    @Builder.Default
    private BigDecimal experienceYears = BigDecimal.valueOf(1.0);

    private String specialties;

    @Builder.Default
    private String levelRank = "SENIOR";

    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal commissionRate = BigDecimal.valueOf(30.00);

    @Builder.Default
    private String workShiftType = "FULL_TIME";

    private List<UUID> serviceIds;
}
