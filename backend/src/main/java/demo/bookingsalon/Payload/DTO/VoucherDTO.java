package demo.bookingsalon.Payload.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VoucherDTO {

    private UUID id;

    private String voucherCode;

    private String voucherName;

    private String description;

    private String discountType; // PERCENT | FIXED_AMOUNT

    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    private BigDecimal minOrderAmount;

    private Integer usageLimitTotal;

    private Integer usageLimitPerUser;

    private Integer usedCount;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private Boolean isActive;

    private Boolean isPublic;

    private String bannerImageUrl;

    private String termsAndConditions;
}

