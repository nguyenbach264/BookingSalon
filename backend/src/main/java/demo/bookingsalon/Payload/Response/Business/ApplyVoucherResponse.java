package demo.bookingsalon.Payload.Response.Business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApplyVoucherResponse {

    private boolean valid;

    private String message;

    private String voucherCode;

    private String voucherName;

    private String discountType;

    private BigDecimal discountValue;

    private BigDecimal discountAmount;

    private BigDecimal originalAmount;

    private BigDecimal finalAmount;
}

