package demo.bookingsalon.storage;


import demo.bookingsalon.enums.MediaOwnerType;

import java.util.UUID;

public interface MediaFolderStrategy {

    MediaOwnerType supports();

    String buildFolder(
            String slug,
            UUID ownerId
    );
}
