package demo.bookingsalon.Configuration;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class VnPayConfig {
    @Value("${vnpay.tmn-code:DEMOVNPAY}") private String tmnCode;
    @Value("${vnpay.hash-secret:DEMOHASHSECRETKEY2026}") private String secretKey;
    @Value("${vnpay.pay-url:http://localhost:5173/payment/vnpay-sandbox-simulator}") private String payUrl;
    @Value("${vnpay.return-url:http://localhost:8080/api/v1/payments/webhook/vnpay/return}") private String returnUrl;
    @Value("${vnpay.notify-url:http://localhost:8080/api/v1/payments/webhook/vnpay}") private String notifyUrl; // URL webhook
    @Value("${vnpay.simulator-mode:true}") private boolean simulatorMode;
    @Value("${app.frontend-url:http://localhost:5173}") private String frontendUrl;

    public String getEffectivePayUrl() {
        if (simulatorMode) {
            String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
            return base + "/payment/vnpay-sandbox-simulator";
        }
        return payUrl;
    }
}
