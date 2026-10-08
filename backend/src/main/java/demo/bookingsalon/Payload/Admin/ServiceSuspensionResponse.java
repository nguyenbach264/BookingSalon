package demo.bookingsalon.Payload.Admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceSuspensionResponse {
    private UUID id;
    private UUID serviceOfferingId;
    private String serviceOfferingName;
    private UUID salonId;
    private String salonName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String reason;
    private boolean isActive;
    private LocalDateTime createdAt;
}
