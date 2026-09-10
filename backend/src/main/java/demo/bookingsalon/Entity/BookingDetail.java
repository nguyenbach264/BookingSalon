package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "booking_details")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_detail_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_offering_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ServiceOffering serviceOffering;

    // RẤT QUAN TRỌNG: Lưu giá của dịch vụ tại THỜI ĐIỂM ĐẶT (tránh sai lệch hóa đơn nếu sau này dịch vụ tăng giá)
    @Column(name = "current_price", nullable = false)
    private BigDecimal currentPrice;
}