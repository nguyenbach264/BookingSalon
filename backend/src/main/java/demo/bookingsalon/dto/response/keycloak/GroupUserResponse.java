package demo.bookingsalon.dto.response.keycloak;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class GroupUserResponse {
    private String id;
    private String name;
    private List<GroupUserResponse> children;
    private Map<String, List<String>> attributes;
    private List<String> realmRoles;
    private List<String> clientRoles;
}
