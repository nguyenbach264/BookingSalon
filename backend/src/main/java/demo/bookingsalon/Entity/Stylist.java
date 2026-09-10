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

    @Column(name = "salary")
    private BigDecimal salary;

    @Column(name = "rating")
    @Builder.Default
    private Double rating = 5.0;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

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

