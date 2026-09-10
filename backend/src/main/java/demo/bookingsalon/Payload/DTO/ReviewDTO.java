package demo.bookingsalon.Payload.DTO;

import lombok.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDTO {
    private UUID userId;

    private String type;

    private String reviewContent;
}
