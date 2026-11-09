package demo.bookingsalon.Configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * Cấu hình Distributed Session qua Redis cho BFF Pattern.
 * Đảm bảo cookie JSESSIONID được đồng bộ thống nhất giữa trình duyệt và Redis Session.
 */
@Configuration
@ConditionalOnClass(CookieSerializer.class)
public class SessionConfig {

    @Bean
    public CookieSerializer cookieSerializer(@Value("${app.cookie.secure:false}") boolean cookieSecure) {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        if (cookieSecure) {
            serializer.setSameSite("None");
            serializer.setUseSecureCookie(true);
        } else {
            serializer.setSameSite("Lax");
        }
        return serializer;
    }
}
