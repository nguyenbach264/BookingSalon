package demo.bookingsalon.Service;

import demo.bookingsalon.Enum.MediaOwnerType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MediaOwnerResolver {

    private final List<MediaOwnerStrategy> strategies;

    private Map<MediaOwnerType, MediaOwnerStrategy> strategyMap;

    @jakarta.annotation.PostConstruct
    void init() {
        strategyMap = new EnumMap<>(MediaOwnerType.class);

        for (MediaOwnerStrategy strategy : strategies) {
            MediaOwnerStrategy previous = strategyMap.put(strategy.supports(), strategy);
            if (previous != null) {
                throw new IllegalStateException("Duplicate MediaOwnerStrategy for " + strategy.supports());
            }
        }
    }

    public MediaOwner resolve(MediaOwnerType ownerType, UUID ownerId) {

        MediaOwnerStrategy strategy = strategyMap.get(ownerType);

        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported media owner type: " + ownerType);
        }

        return strategy.resolve(ownerId);
    }
}
