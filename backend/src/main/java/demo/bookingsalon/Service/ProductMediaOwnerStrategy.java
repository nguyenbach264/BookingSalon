package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductMediaOwnerStrategy implements MediaOwnerStrategy {

    private final ProductRepository productRepository;

    @Override
    public MediaOwnerType supports() {
        return MediaOwnerType.PRODUCT;
    }

    @Override
    public MediaOwner resolve(UUID ownerId) {
        Product product = productRepository.findById(ownerId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + ownerId));

        return new MediaOwner(product.getSlug());
    }

    @Override
    public void updateOwnerImage(UUID ownerId, String imageUrl, boolean isPrimary) {
        productRepository.findById(ownerId).ifPresent(product -> {
            List<String> images = product.getImages();
            if (images == null) {
                images = new ArrayList<>();
                product.setImages(images);
            }
            if (isPrimary || product.getImageUrl() == null || product.getImageUrl().isBlank()) {
                product.setImageUrl(imageUrl);
                images.remove(imageUrl);
                images.add(0, imageUrl);
            } else if (!images.contains(imageUrl)) {
                images.add(imageUrl);
            }
            productRepository.save(product);
        });
    }

    @Override
    public void removeOwnerImage(UUID ownerId, String imageUrl) {
        productRepository.findById(ownerId).ifPresent(product -> {
            if (product.getImages() != null) {
                product.getImages().remove(imageUrl);
            }
            if (imageUrl.equals(product.getImageUrl())) {
                String nextImage = (product.getImages() != null && !product.getImages().isEmpty())
                        ? product.getImages().get(0)
                        : null;
                product.setImageUrl(nextImage);
            }
            productRepository.save(product);
        });
    }
}

