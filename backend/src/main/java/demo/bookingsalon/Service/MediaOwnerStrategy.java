package demo.bookingsalon.Service;


import demo.bookingsalon.Enum.MediaOwnerType;

import java.util.UUID;

public interface MediaOwnerStrategy {

    MediaOwnerType supports();

    MediaOwner resolve(UUID ownerId);
}
