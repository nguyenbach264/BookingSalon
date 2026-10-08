package demo.bookingsalon.Configuration;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Data
@Component
public class SepayConfig {
    // Mã định danh doanh nghiệp
    @Value("${sepay.merchant-id:mock_merchant_id}") private String merchantId;

    @Value("${sepay.secret-key:mock_secret_key}") private String secretKey;

    @Value("${sepay.webhook-api-key:mock_webhook_api_key}") private String webhookApiKey;

    @Value("${sepay.env:sandbox}") private String environment;

    // Base url cho API thanh toán
    @Value("${sepay.api-base-url:https://pgapi.sepay.vn}") private String apiBaseUrl;

    // Base URL cho API thanh toán
    public String getApiBaseUrl() {
        if ("production".equalsIgnoreCase(environment)) {
            return apiBaseUrl;
        }
        return "https://pgapi-sandbox.sepay.vn"; // Môi trường sandbox mặc định[reference:7]
    }

    // Tạo header Basic Auth cho mọi request
    public String getBasicAuthHeader() {
        String auth = this.merchantId + ":" + this.secretKey;
        return "Basic " + java.util.Base64.getEncoder().encodeToString(auth.getBytes());
    }
}
