package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.List;

@Data
public class FilterEventRequest {
    private String clientId;

    private String userId;

    private String ipAddress;

    private Long fromDate;

    private Long toDate;

    private List<String> types;

    private String resourcePath;

    private Integer first = 0;

    private Integer max = 50;
}
