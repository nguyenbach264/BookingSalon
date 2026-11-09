package demo.bookingsalon.Service;


import demo.bookingsalon.Enum.MediaOwnerType;

import java.util.UUID;

public interface MediaOwnerStrategy {

    MediaOwnerType supports();

    MediaOwner resolve(UUID ownerId);

    default void updateOwnerImage(UUID ownerId, String imageUrl, boolean isPrimary) {
    }

    default void removeOwnerImage(UUID ownerId, String imageUrl) {
    }
}
