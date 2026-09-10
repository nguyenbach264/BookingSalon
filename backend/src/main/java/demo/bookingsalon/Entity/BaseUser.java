package demo.bookingsalon.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class BaseUser extends BaseEntity {

    @Column(name = "keycloak_id")
    private UUID keycloakId;

    @Column(name = "username", unique = true, nullable = false)
    @NotBlank(message = "Username mustn't be blank!")
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email")
    @Email(message = "Email format is incorrect")
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;
}

