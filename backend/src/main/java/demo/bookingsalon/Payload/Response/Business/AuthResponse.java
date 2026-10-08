package demo.bookingsalon.Payload.Response.Business;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;           // seconds until access token expires
    private long refreshExpiresIn;    // seconds until refresh token expires
    private UserInfo user;

    @Data
    @Builder
    public static class UserInfo {
        private UUID id;              // DB primary key
        private UUID keycloakId;
        private String username;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String avatarUrl;
        private String role;          // USER | STYLIST | ADMIN
        private String gender;
        private String address;
        private String city;
        private String district;
        private String ward;
        private String membershipTier;
        private boolean emailVerified;
        private boolean phoneVerified;
        private String voucherCode;
        private java.time.LocalDateTime createdAt;
    }
}

