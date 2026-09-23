package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@AttributeOverride(name = "id", column = @Column(name = "voucher_id"))
public class Voucher extends BaseEntity {

    @Column(name = "voucher_code", length = 50, nullable = false, unique = true)
    private String voucherCode;

    @Column(name = "voucher_name", length = 255, nullable = false)
    private String voucherName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "discount_type", length = 30, nullable = false)
    private String discountType; // "PERCENT" | "FIXED_AMOUNT"

    @Column(name = "discount_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Builder.Default
    @Column(name = "min_order_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "applicable_scope", length = 30, nullable = false)
    private String applicableScope = "ALL";

    @Column(name = "salon_id")
    private UUID salonId;

    @Builder.Default
    @Column(name = "usage_limit_total", nullable = false)
    private Integer usageLimitTotal = 1000;

    @Builder.Default
    @Column(name = "usage_limit_per_user", nullable = false)
    private Integer usageLimitPerUser = 1;

    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "banner_image_url", length = 500)
    private String bannerImageUrl;

    @Builder.Default
    @Column(name = "min_membership_tier", length = 30, nullable = false)
    private String minMembershipTier = "STANDARD";

    @Builder.Default
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Version
    @Column(name = "version")
    private Long version;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}

