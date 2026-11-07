package demo.bookingsalon.Storage;

import demo.bookingsalon.Enum.MediaOwnerType;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StylistMediaFolderStrategy implements MediaFolderStrategy {

    private static final String ROOT = "booking-salon";

    @Override
    public MediaOwnerType supports() {
        return MediaOwnerType.STYLIST;
    }

    @Override
    public String buildFolder(String slug, UUID ownerId) {
        return "%s/stylists/%s-%s".formatted(ROOT, slug, ownerId);
    }
}

