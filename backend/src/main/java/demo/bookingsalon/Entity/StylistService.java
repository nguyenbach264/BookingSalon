package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "stylist_services",
        uniqueConstraints = @UniqueConstraint(columnNames = {"stylist_id", "service_offering_id"})
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class StylistService extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stylist_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Stylist stylist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_offering_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ServiceOffering serviceOffering;
}

