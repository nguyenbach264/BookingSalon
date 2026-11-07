package demo.bookingsalon.Payload.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private UUID id;

    private UUID salonId;

    private UUID userId;

    private UUID bookingId;

    private UUID orderId;

    private String title;

    private String message;

    @JsonProperty("isRead")
    @Builder.Default
    private boolean isRead = false;

    private String type;

    private Object data;

    private LocalDateTime createdAt;

    private LocalDateTime readAt;

    private LocalDateTime expiredAt;

    private BookingResponse bookingResponse;

    private OrderResponse orderResponse;

    @JsonProperty("isRead")
    public boolean isRead() {
        return isRead;
    }

    @JsonProperty("isRead")
    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }
}
