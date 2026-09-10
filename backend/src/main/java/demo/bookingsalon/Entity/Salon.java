package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Getter
@Setter
@Table(name = "salons")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Salon {
    @Id
    @Column(name = "salon_id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "salon_name")
    @Column(name = "salon_name", nullable = false)
    @NotBlank(message = "Salon name is mandatory")
    private String salonName;

    @Column(name = "salon_address")
    @NotBlank(message = "Salon message is mandatory")
    @Column(name = "salon_address", nullable = false)
    @NotBlank(message = "Salon address is mandatory")
    private String address;

    @Column(name = "open_time")
    private LocalDateTime openTime;
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalDateTime closeTime;
    private LocalTime closeTime;

    @Column(name = "images")
    @ElementCollection
    private List<String> images;

    @CollectionTable(name = "salon_images", joinColumns = @JoinColumn(name = "salon_id"))
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(name = "phone_number")
    @NotBlank(message = "Phone number of salon is mandatory")
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number format is incorrect!")
    private String phoneNumber;

    @Column(name = "email")
    @Email(message = "Email format is incorrect")
    @NotBlank(message = "Email of salon is mandatory")
    private String email;

    @Column(name = "city", nullable = false)
    private String city;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    // Quan hệ 1-N: 1 Salon quản lý nhiều Stylist
    @OneToMany(mappedBy = "salon", cascade = CascadeType.ALL)
    private List<Stylist> stylists;
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<Stylist> stylists = new ArrayList<>();

    @OneToMany(mappedBy = "salon", cascade = CascadeType.ALL)
    private List<ServiceOffering> serviceOfferings;
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<ServiceOffering> serviceOfferings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
