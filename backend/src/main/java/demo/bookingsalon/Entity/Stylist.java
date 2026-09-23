package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stylists")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@AttributeOverride(name = "id", column = @Column(name = "stylist_id"))
public class Stylist extends BaseUser {

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "bio")
    private String bio;

    @Builder.Default
    @Column(name = "experience_years")
    private BigDecimal experienceYears = BigDecimal.valueOf(1.0);

    @Column(name = "specialties")
    private String specialties;

    @Builder.Default
    @Column(name = "level_rank")
    private String levelRank = "SENIOR";

    @Column(name = "salary")
    private BigDecimal salary;

    @Builder.Default
    @Column(name = "rating")
    private Double rating = 5.0;

    @Builder.Default
    @Column(name = "rating_average")
    private BigDecimal ratingAverage = BigDecimal.valueOf(5.00);

    @Builder.Default
    @Column(name = "total_reviews_count")
    private Integer totalReviewsCount = 0;

    @Builder.Default
    @Column(name = "total_served_bookings")
    private Integer totalServedBookings = 0;

    @Builder.Default
    @Column(name = "base_salary")
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "commission_rate")
    private BigDecimal commissionRate = BigDecimal.valueOf(10.00);

    @Builder.Default
    @Column(name = "tip_balance")
    private BigDecimal tipBalance = BigDecimal.ZERO;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Builder.Default
    @Column(name = "work_shift_type")
    private String workShiftType = "FULL_TIME";

    @Builder.Default
    @Column(name = "max_parallel_slots")
    private Integer maxParallelSlots = 1;

    @Column(name = "citizen_id")
    private String citizenId;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_name")
    private String bankName;

    @Builder.Default
    @Column(name = "is_featured")
    private boolean isFeatured = false;

    @Builder.Default
    @Column(name = "status")
    private String status = "ACTIVE";

    @Version
    @Column(name = "version")
    private Long version;

    // Một thợ có thể nhận nhiều lịch đặt
    @OneToMany(mappedBy = "stylist")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    // Một thợ có thể nhận nhiều dịch vụ
    @OneToMany(mappedBy = "stylist", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<StylistService> stylistServices = new ArrayList<>();

    // Thợ làm việc tại Salon nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Salon salon;
}

