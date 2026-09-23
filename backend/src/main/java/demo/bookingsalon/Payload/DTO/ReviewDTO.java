package demo.bookingsalon.Payload.DTO;

import lombok.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDTO {
    private UUID id;

    private UUID userId;

    private String username;

    private UUID productId;

    private Integer rating;

    private String type;

    private String reviewContent;

    private UUID bookingId;

    private UUID stylistId;

    private UUID salonId;

    private LocalDateTime createdAt;
}
