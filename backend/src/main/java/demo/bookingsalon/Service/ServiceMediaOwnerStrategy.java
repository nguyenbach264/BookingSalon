package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import demo.bookingsalon.Utility.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ServiceMediaOwnerStrategy implements MediaOwnerStrategy {

    private final ServiceOfferingRepository serviceRepository;

    private final SlugGenerator slugGenerator;

    @Override
    public MediaOwnerType supports() {

        return MediaOwnerType.SERVICE;
    }

    @Override
    public MediaOwner resolve(UUID ownerId) {

        ServiceOffering service = serviceRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Service not found: " + ownerId));

        return new MediaOwner(slugGenerator.generate(service.getName()));
    }
}
