package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CreateGroupRequest {
    private String name;
    private Map<String, List<String>> attributes;
}
