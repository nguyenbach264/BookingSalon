package demo.bookingsalon.Storage;

import demo.bookingsalon.Enum.MediaOwnerType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MediaFolderResolver {

    private final List<MediaFolderStrategy> strategies;

    private Map<MediaOwnerType, MediaFolderStrategy> strategyMap;

    @jakarta.annotation.PostConstruct
    void init() {
        strategyMap = new EnumMap<>(MediaOwnerType.class);
        for (MediaFolderStrategy strategy : strategies) {
            MediaFolderStrategy previous = strategyMap.put(strategy.supports(), strategy);

            if (previous != null) {
                throw new IllegalStateException("Duplicate MediaFolderStrategy for " + strategy.supports());
            }
        }
    }

    public String resolve(MediaOwnerType ownerType, String slug, UUID ownerId) {
        MediaFolderStrategy strategy = strategyMap.get(ownerType);

        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported media owner type: " + ownerType);
        }

        return strategy.buildFolder(slug, ownerId);
    }
}
