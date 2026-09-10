package demo.bookingsalon.Service;

import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Utility.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SalonMediaOwnerStrategy implements MediaOwnerStrategy {

    private final SalonRepository salonRepository;

    private final SlugGenerator slugGenerator;

    @Override
    public MediaOwnerType supports() {

        return MediaOwnerType.SALON;
    }

    @Override
    public MediaOwner resolve(UUID ownerId) {

        var salon = salonRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Salon not found: " + ownerId));

        return new MediaOwner(slugGenerator.generate(salon.getSalonName()));
    }
}
