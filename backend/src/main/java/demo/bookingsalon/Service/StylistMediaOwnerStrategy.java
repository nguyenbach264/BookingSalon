package demo.bookingsalon.service;

import demo.bookingsalon.entity.Stylist;
import demo.bookingsalon.enums.MediaOwnerType;
import demo.bookingsalon.exception.NotFoundException;
import demo.bookingsalon.repository.StylistRepository;
import demo.bookingsalon.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StylistMediaOwnerStrategy implements MediaOwnerStrategy {

    private final StylistRepository stylistRepository;
    private final SlugGenerator slugGenerator;

    @Override
    public MediaOwnerType supports() {
        return MediaOwnerType.STYLIST;
    }

    @Override
    public MediaOwner resolve(UUID ownerId) {
        Stylist stylist = stylistRepository.findById(ownerId)
                .orElseGet(() -> stylistRepository.findByKeycloakId(ownerId).orElse(null));
        if (stylist == null) {
            throw new NotFoundException("Stylist not found: " + ownerId);
        }
        String name = stylist.getFullName() != null && !stylist.getFullName().isBlank()
                ? stylist.getFullName()
                : stylist.getUsername();
        return new MediaOwner(slugGenerator.generate(name != null ? name : "stylist"));
    }

    @Override
    public void updateOwnerImage(UUID ownerId, String imageUrl, boolean isPrimary) {
        Stylist stylist = stylistRepository.findById(ownerId)
                .orElseGet(() -> stylistRepository.findByKeycloakId(ownerId).orElse(null));
        if (stylist != null) {
            stylist.setAvatarUrl(imageUrl);
            stylistRepository.save(stylist);
        }
    }

    @Override
    public void removeOwnerImage(UUID ownerId, String imageUrl) {
        Stylist stylist = stylistRepository.findById(ownerId)
                .orElseGet(() -> stylistRepository.findByKeycloakId(ownerId).orElse(null));
        if (stylist != null && imageUrl != null && imageUrl.equals(stylist.getAvatarUrl())) {
            stylist.setAvatarUrl(null);
            stylistRepository.save(stylist);
        }
    }
}

