package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpPolicyRequest {

    private String type;

    private String algorithm;

    private int digits;

    private int period;

    private int lookAheadWindow;

    private int initialCounter;

    private Boolean shouldChangeOTP;
}