package demo.bookingsalon.Payload.Response.Keycloak;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpPolicyResponse {
    private String type;

    private String algorithm;

    private int digits;

    private int period;

    private int lookAheadWindow;

    private int initialCounter;
}
