package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

@Data
public class UpdateExecutionRequirementRequest {
    private String requirement; // "REQUIRED", "ALTERNATIVE", "DISABLED", "CONDITIONAL"
}
