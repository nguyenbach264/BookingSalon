package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CredentialResponse {
    private String id;
    private String type; // "password", "totp", "otp", ...
    private String userLabel;
    private Long createdDate;
    private Boolean temporary;
    private String credentialData; // chứa secret, v.v.
}
