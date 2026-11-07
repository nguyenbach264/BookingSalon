package demo.bookingsalon.Payload.Admin;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TerminateStylistRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaveDate;

    private String reason;

    private UUID reassignToStylistId;
}
