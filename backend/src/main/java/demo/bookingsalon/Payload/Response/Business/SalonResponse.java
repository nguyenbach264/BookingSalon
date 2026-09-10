package demo.bookingsalon.Payload.Response.Business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SalonResponse {
    private UUID id;

    private String salonName;

    private String address;

    private LocalDateTime openTime;

    private LocalDateTime closeTime;

    private List<String> images;

    private String phoneNumber;

    private String email;

    private String city;
}
