package demo.bookingsalon.Configuration;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.boot.autoconfigure.data.redis.RedisConnectionDetails;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.util.StringUtils;

import java.time.Duration;

@Configuration
@ConditionalOnProperty(
        name = "app.redis.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class RedisConfig {

    /**
     * Tùy biến thông số kết nối Redis để loại bỏ lỗi rỗng password (AUTH "")
     * và hỗ trợ dynamic standalone connection details.
     * Khi chạy trong test có @ServiceConnection, Bean này tự động nhường chỗ cho testcontainer.
     */
    @Bean
    @ConditionalOnMissingBean(RedisConnectionDetails.class)
    public RedisConnectionDetails redisConnectionDetails(
            @Value("${spring.data.redis.host:localhost}") String host,
            @Value("${spring.data.redis.port:6379}") int port,
            @Value("${spring.data.redis.password:}") String password,
            @Value("${spring.data.redis.database:0}") int database
    ) {
        return new RedisConnectionDetails() {
            @Override
            public String getUsername() {
                return null;
            }

            @Override
            public String getPassword() {
                return StringUtils.hasText(password) ? password.trim() : null;
            }

            @Override
            public Standalone getStandalone() {
                return Standalone.of(host, port, database);
            }
        };
    }

    /**
     * Cấu hình tối ưu cho Lettuce client:
     * - autoReconnect: tự động kết nối lại khi mạng ổn định.
     * - pingBeforeActivateConnection: ping kiểm tra tính hợp lệ của channel trước khi dùng, tránh socket chết.
     * - keepAlive: bật TCP Keep-Alive để tránh idle connection timeout bị Redis server ngắt kết nối đột ngột.
     * - shutdownQuietPeriod & shutdownTimeout: giải phóng kênh và listener của Netty êm đềm,
     *   ngăn chặn triệt để RejectedExecutionException: event executor terminated khi ứng dụng shutdown.
     */
    @Bean
    public LettuceClientConfigurationBuilderCustomizer lettuceClientConfigurationBuilderCustomizer() {
        return builder -> {
            SocketOptions socketOptions = SocketOptions.builder()
                    .keepAlive(true)
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            ClientOptions clientOptions = ClientOptions.builder()
                    .autoReconnect(true)
                    .pingBeforeActivateConnection(true)
                    .disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS)
                    .socketOptions(socketOptions)
                    .build();

            builder.clientOptions(clientOptions)
                    .shutdownQuietPeriod(Duration.ofMillis(50))
                    .shutdownTimeout(Duration.ofMillis(200));
        };
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();

        template.setConnectionFactory(redisConnectionFactory);

        StringRedisSerializer serializer = new StringRedisSerializer();

        template.setKeySerializer(serializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(serializer);
        template.setHashValueSerializer(serializer);

        template.afterPropertiesSet();

        return template;
    }
}
