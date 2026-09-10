package demo.bookingsalon.Payload.Response.Business;

import lombok.Data;

import java.util.UUID;

@Data
public class StylistResponse {
    private UUID id;

    private UUID keycloakId;

    private String fullName;

    private String email;

    private String phoneNumber;

    private String address;

    private String avatarUrl;

    private Double rating;

}
