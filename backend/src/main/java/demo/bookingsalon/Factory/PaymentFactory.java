package demo.bookingsalon.Factory;

import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Strategy.PaymentStrategy;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymentFactory {
    private final List<PaymentStrategy> strategies;
    private final Map<PaymentMethod, PaymentStrategy> strategyMap = new EnumMap<>(PaymentMethod.class);

    @PostConstruct
    public void init() {
        strategies.forEach(strategy -> {
            if (strategy.getType() != null) {
                strategyMap.put(strategy.getType(), strategy);
            }
        });
    }

    public PaymentStrategy getStrategy(PaymentMethod paymentMethod) {
        PaymentStrategy strategy = strategyMap.get(paymentMethod);

        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported payment method : " + paymentMethod);
        }

        return strategy;
    }
}
