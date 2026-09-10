package demo.bookingsalon.Storage;

import demo.bookingsalon.Enum.MediaOwnerType;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ServiceMediaFolderStrategy implements MediaFolderStrategy {

    private static final String ROOT = "booking-salon";

    @Override
    public MediaOwnerType supports() {
        return MediaOwnerType.SERVICE;
    }

    @Override
    public String buildFolder(String slug, UUID ownerId) {

        return "%s/services/%s-%s".formatted(ROOT, slug, ownerId);
    }
}