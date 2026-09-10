package demo.bookingsalon.Configuration;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class VnPayConfig {
    @Value("${vnpay.tmn-code}") private String tmnCode;
    @Value("${vnpay.hash-secret}") private String secretKey;
    @Value("${vnpay.pay-url}") private String payUrl;
    @Value("${vnpay.return-url}") private String returnUrl;
    @Value("${vnpay.notify-url:}") private String notifyUrl;  // URL webhook
}
