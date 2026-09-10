package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stylists")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stylist {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "stylist_id")
    private UUID id;

    @Column(name = "keycloak_id")
    @NotNull(message = "Keycloak ID mustn't be null!")
    private UUID keycloakId;

    @Column(name = "username")
    @NotBlank(message = "Username mustn't be blank!")
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email")
    @NotBlank(message = "Email mustn't be blank")
    @Email(message = "Email format is incorrect")
    private String email;

    @Column(name = "phone_number", nullable = false)
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    private String phoneNumber;

    @Column(name = "stylist_address")
    private String address;

    @Column(name = "join_date")
    @CreationTimestamp
    private LocalDateTime joinDate;

    @Column(name = "leave_date")
    @UpdateTimestamp
    private LocalDateTime leaveDate;

    @Column(name = "enabled")
    private boolean enabled = true;

    @Column(name = "salary")
    private BigDecimal salary;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "rating")
    private Double rating;

    // Một thợ có thể nhận nhiều lịch đặt
    @OneToMany(mappedBy = "stylist")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<Booking> bookings;

    // Một thợ có thể nhận nhiều dịch vụ
    @OneToMany(mappedBy = "stylist", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<StylistService> stylistServices = new ArrayList<>();

    // Thợ làm việc tại Salon nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Salon salon;
}
