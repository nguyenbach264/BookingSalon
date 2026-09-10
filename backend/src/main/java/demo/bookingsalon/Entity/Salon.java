package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Data
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
    @NotBlank(message = "Salon name is mandatory")
    private String salonName;

    @Column(name = "salon_address")
    @NotBlank(message = "Salon message is mandatory")
    private String address;

    @Column(name = "open_time")
    private LocalDateTime openTime;

    @Column(name = "close_time")
    private LocalDateTime closeTime;

    @Column(name = "images")
    @ElementCollection
    private List<String> images;

    @Column(name = "phone_number")
    @NotBlank(message = "Phone number of salon is mandatory")
    @Pattern(regexp = "^0[3-9]\\d{8}$", message = "Phone number mustn't be blank!")
    private String phoneNumber;

    @Column(name = "email")
    @Email(message = "Email format is incorrect")
    @NotBlank(message = "Email of salon is mandatory")
    private String email;

    @Column(name = "city", nullable = false)
    private String city;

    // Quan hệ 1-N: 1 Salon quản lý nhiều Stylist
    @OneToMany(mappedBy = "salon", cascade = CascadeType.ALL)
    private List<Stylist> stylists;

    @OneToMany(mappedBy = "salon", cascade = CascadeType.ALL)
    private List<ServiceOffering> serviceOfferings;

}
