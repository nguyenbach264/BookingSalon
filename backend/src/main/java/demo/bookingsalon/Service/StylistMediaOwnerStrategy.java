package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Utility.SlugGenerator;
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
}

