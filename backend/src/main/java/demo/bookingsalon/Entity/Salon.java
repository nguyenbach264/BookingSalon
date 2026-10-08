package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "salons")
@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@AttributeOverride(name = "id", column = @Column(name = "salon_id"))
public class Salon extends BaseEntity {

    @Column(name = "salon_name", nullable = false)
    @NotBlank(message = "Salon name is mandatory")
    private String salonName;

    @Column(name = "salon_address", nullable = false)
    @NotBlank(message = "Salon address is mandatory")
    private String address;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @ElementCollection
    @CollectionTable(name = "salon_images", joinColumns = @JoinColumn(name = "salon_id"))
    @Column(name = "images")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(name = "phone_number", nullable = false)
    @NotBlank(message = "Phone number of salon is mandatory")
    @Pattern(regexp = "^0[2-9]\\d{8,9}$", message = "Phone number format is incorrect!")
    private String phoneNumber;

    @Column(name = "email", nullable = false)
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
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<Stylist> stylists = new ArrayList<>();

    // Quan hệ 1-N: 1 Salon có nhiều ServiceOffering
    @OneToMany(mappedBy = "salon", cascade = CascadeType.ALL)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @Builder.Default
    private List<ServiceOffering> serviceOfferings = new ArrayList<>();
}

