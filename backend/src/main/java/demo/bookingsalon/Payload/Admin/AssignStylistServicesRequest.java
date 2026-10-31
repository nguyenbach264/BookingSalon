package demo.bookingsalon.Payload.Admin;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignStylistServicesRequest {

    @NotEmpty(message = "Danh sách dịch vụ không được để trống")
    private List<UUID> serviceIds;
}
