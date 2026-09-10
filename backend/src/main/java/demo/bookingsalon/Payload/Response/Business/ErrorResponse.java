package demo.bookingsalon.Payload.Response.Business;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ErrorResponse {
    private String error;

    private int status;

    private LocalDateTime timestamp;

    private String message;
}
