package demo.bookingsalon.Payload.Admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StylistSalaryConfigDTO {

    @NotNull(message = "Lương cơ bản không được để trống")
    @DecimalMin(value = "0.0", message = "Lương cơ bản không được âm")
    private BigDecimal baseSalary;

    @NotNull(message = "Tỷ lệ hoa hồng không được để trống")
    @DecimalMin(value = "0.0", message = "Tỷ lệ hoa hồng không được âm")
    private BigDecimal commissionRate;

    private String workShiftType;
}
