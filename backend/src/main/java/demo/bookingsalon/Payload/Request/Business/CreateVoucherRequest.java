package demo.bookingsalon.Payload.Request.Business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String voucherCode;

    @NotBlank(message = "Tên chương trình voucher không được để trống")
    private String voucherName;

    private String description;

    @NotBlank(message = "Loại giảm giá không được để trống")
    private String discountType; // "PERCENT" | "FIXED_AMOUNT"

    @NotNull(message = "Giá trị giảm không được để trống")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    private Integer usageLimitTotal = 1000;

    @Builder.Default
    private Integer usageLimitPerUser = 1;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @Builder.Default
    private Boolean isPublic = true;

    private String termsAndConditions;
}

