package demo.bookingsalon.Configuration;

import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    public WebSocketConfig(NotificationWebSocketHandler notificationWebSocketHandler,
                           WebSocketAuthInterceptor webSocketAuthInterceptor) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }

        registry.addHandler(
                notificationWebSocketHandler,
                "/ws/reviews",
                "/ws/notifications"
        )
        .addInterceptors(webSocketAuthInterceptor)
        .setAllowedOrigins(origins);
    }
}

