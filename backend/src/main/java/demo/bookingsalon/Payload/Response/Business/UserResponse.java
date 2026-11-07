package demo.bookingsalon.Payload.Response.Business;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;

    private UUID keycloakId;

    private String username;

    private String fullName;

    private String email;

    private String phoneNumber;

    private String address;

    private String gender;

    private String city;

    private String district;

    private String ward;

    private String membershipTier;

    private String avatarUrl;

    private boolean emailVerified;

    private boolean phoneVerified;

    private String voucherCode;

    private java.time.LocalDateTime createdAt;

    private boolean enabled;

}
