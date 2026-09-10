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

    private boolean enabled;

}
