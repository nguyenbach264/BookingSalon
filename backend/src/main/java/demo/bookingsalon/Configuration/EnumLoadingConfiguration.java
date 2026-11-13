package demo.bookingsalon.Configuration;

import demo.bookingsalon.Enum.OrderStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class to explicitly load OrderStatus enum during Spring startup.
 * This ensures the enum class is properly loaded into the classpath before
 * other beans that depend on it are instantiated.
 */
@Configuration
@ConditionalOnClass(OrderStatus.class)
public class EnumLoadingConfiguration {
    // This configuration ensures OrderStatus is loaded early
    static {
        try {
            Class.forName("demo.bookingsalon.Enum.OrderStatus");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load OrderStatus enum", e);
        }
    }
}
