package demo.bookingsalon.service;


import demo.bookingsalon.enums.MediaOwnerType;

import java.util.UUID;

public interface MediaOwnerStrategy {

    MediaOwnerType supports();

    MediaOwner resolve(UUID ownerId);

    default void updateOwnerImage(UUID ownerId, String imageUrl, boolean isPrimary) {
    }

    default void removeOwnerImage(UUID ownerId, String imageUrl) {
    }
}
