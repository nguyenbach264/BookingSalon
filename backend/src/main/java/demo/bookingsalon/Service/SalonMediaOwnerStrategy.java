package demo.bookingsalon.Service;

import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Utility.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
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

    @Override
    public void updateOwnerImage(UUID ownerId, String imageUrl, boolean isPrimary) {
        salonRepository.findById(ownerId).ifPresent(salon -> {
            List<String> images = salon.getImages();
            if (images == null) {
                images = new ArrayList<>();
                salon.setImages(images);
            }
            if (isPrimary) {
                images.remove(imageUrl);
                images.add(0, imageUrl);
            } else if (!images.contains(imageUrl)) {
                images.add(imageUrl);
            }
            salonRepository.save(salon);
        });
    }

    @Override
    public void removeOwnerImage(UUID ownerId, String imageUrl) {
        salonRepository.findById(ownerId).ifPresent(salon -> {
            if (salon.getImages() != null) {
                salon.getImages().remove(imageUrl);
                salonRepository.save(salon);
            }
        });
    }
}
