package demo.bookingsalon.Storage;

import demo.bookingsalon.Enum.MediaOwnerType;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserMediaFolderStrategy implements MediaFolderStrategy {

    private static final String ROOT = "booking-salon";

    @Override
    public MediaOwnerType supports() {
        return MediaOwnerType.USER;
    }

    @Override
    public String buildFolder(String slug, UUID ownerId) {
        return "%s/users/%s-%s".formatted(ROOT, slug, ownerId);
    }
}

