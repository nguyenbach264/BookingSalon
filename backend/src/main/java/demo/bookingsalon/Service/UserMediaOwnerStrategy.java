package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Utility.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserMediaOwnerStrategy implements MediaOwnerStrategy {

    private final UserRepository userRepository;
    private final SlugGenerator slugGenerator;

    @Override
    public MediaOwnerType supports() {
        return MediaOwnerType.USER;
    }

    @Override
    public MediaOwner resolve(UUID ownerId) {
        User user = userRepository.findById(ownerId)
                .orElseGet(() -> userRepository.findByKeycloakId(ownerId));
        if (user == null) {
            throw new NotFoundException("User not found: " + ownerId);
        }
        String name = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : user.getUsername();
        return new MediaOwner(slugGenerator.generate(name != null ? name : "user"));
    }

    @Override
    public void updateOwnerImage(UUID ownerId, String imageUrl, boolean isPrimary) {
        User user = userRepository.findById(ownerId)
                .orElseGet(() -> userRepository.findByKeycloakId(ownerId));
        if (user != null) {
            user.setAvatarUrl(imageUrl);
            userRepository.save(user);
        }
    }

    @Override
    public void removeOwnerImage(UUID ownerId, String imageUrl) {
        User user = userRepository.findById(ownerId)
                .orElseGet(() -> userRepository.findByKeycloakId(ownerId));
        if (user != null && imageUrl != null && imageUrl.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(null);
            userRepository.save(user);
        }
    }
}

