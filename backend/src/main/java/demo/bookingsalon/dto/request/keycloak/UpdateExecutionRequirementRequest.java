package demo.bookingsalon.dto.request.keycloak;

import lombok.Data;

@Data
public class UpdateExecutionRequirementRequest {
    private String requirement; // "REQUIRED", "ALTERNATIVE", "DISABLED", "CONDITIONAL"
}
