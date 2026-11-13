package demo.bookingsalon.Configuration;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {
    @Value("${cloudinary.cloud-name:bzlhomeu}")
    private String cloudName;

    @Value("${cloudinary.api-key:866635999876245}")
    private String apiKey;

    @Value("${cloudinary.api-secret:FbbjoMXTZ9Nq0JUExp6XyRSpMWU}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {

        Map<String, String> config = new HashMap<>();

        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);

        return new Cloudinary(config);
    }
}

