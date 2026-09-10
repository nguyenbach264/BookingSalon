package demo.bookingsalon.Entity;

import demo.bookingsalon.Enum.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Builder
@Data
@SuperBuilder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_id")
    private UUID id;
@AttributeOverride(name = "id", column = @Column(name = "booking_id"))
public class Booking extends BaseEntity {

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

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
    private List<BookingDetail> bookingDetails;
    @Builder.Default
    private List<BookingDetail> bookingDetails = new ArrayList<>();

    // Quan hệ 1-1: 1 Booking gắn liền với 1 Payment tổng
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Payment payment;

    @ElementCollection(fetch = FetchType.EAGER)
    private Set<UUID> serviceIds;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    private int totalServices;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Version
    @Column(name = "version")
    private Long version;

}
