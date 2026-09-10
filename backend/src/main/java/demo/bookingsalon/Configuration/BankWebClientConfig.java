package demo.bookingsalon.Configuration;

import lombok.Getter;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Getter
@Component
public class BankWebClientConfig {
    // Thằng này tạm thời chưa có hàm nào dùng nó
    @Bean
    public WebClient bankWebClient(SepayConfig sepayConfig) {
        return WebClient.builder()
                .baseUrl(sepayConfig.getApiBaseUrl())
                .defaultHeader("Authorization", "Bearer " + sepayConfig.getBasicAuthHeader())
                .codecs(configurer ->
                        configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                .build();
    }
}
