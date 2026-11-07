package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApplyVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String voucherCode;

    @NotNull(message = "Giá trị đơn hàng không được để trống")
    private BigDecimal orderAmount;

    private UUID userId;
}

