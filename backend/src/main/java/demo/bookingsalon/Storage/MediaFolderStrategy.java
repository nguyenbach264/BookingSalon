package demo.bookingsalon.Storage;


import demo.bookingsalon.Enum.MediaOwnerType;

import java.util.UUID;

public interface MediaFolderStrategy {

    MediaOwnerType supports();

    String buildFolder(
            String slug,
            UUID ownerId
    );
}
