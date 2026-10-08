package demo.bookingsalon.Entity;

import demo.bookingsalon.Enum.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@AttributeOverride(name = "id", column = @Column(name = "booking_id"))
public class Booking extends BaseEntity {

    @Column(name = "booking_code")
    private String bookingCode;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "actual_checkin_time")
    private LocalDateTime actualCheckinTime;

    @Column(name = "actual_checkout_time")
    private LocalDateTime actualCheckoutTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Salon salon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stylist_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Stylist stylist;

    // Quan hệ 1-N: 1 Booking có nhiều BookingDetail
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<BookingDetail> bookingDetails = new ArrayList<>();

    // Quan hệ 1-1: 1 Booking gắn liền với 1 Payment tổng
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Payment payment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Builder.Default
    @Column(name = "subtotal_amount")
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "voucher_code")
    private String voucherCode;

    @Builder.Default
    @Column(name = "loyalty_points_used")
    private Integer loyaltyPointsUsed = 0;

    @Builder.Default
    @Column(name = "loyalty_points_discount")
    private BigDecimal loyaltyPointsDiscount = BigDecimal.ZERO;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "payment_status")
    private String paymentStatus = "UNPAID";

    @Builder.Default
    @Column(name = "payment_method")
    private String paymentMethod = "CASH";

    @Column(name = "seat_chair_number")
    private String seatChairNumber;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "cancelled_by")
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "customer_notes")
    private String customerNotes;

    @Column(name = "stylist_notes")
    private String stylistNotes;

    @Builder.Default
    @Column(name = "is_reviewed")
    private boolean isReviewed = false;

    @Builder.Default
    @Column(name = "booking_source")
    private String bookingSource = "WEB";

    @Version
    @Column(name = "version")
    private Long version;

    @Builder.Default
    @Column(name = "is_deleted")
    private boolean isDeleted = false;
}
