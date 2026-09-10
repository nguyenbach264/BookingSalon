package demo.bookingsalon.Service;

public class ProductMediaOwnerStrategy {
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
}

//import demo.bookingsalon.media.enums.MediaOwnerType;
//import demo.bookingsalon.repository.ProductRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Component;
//
//import java.util.UUID;
//
//@Component
//@RequiredArgsConstructor
//public class ProductMediaOwnerStrategy
//        implements MediaOwnerStrategy {
//
//    private final ProductRepository productRepository;
//
//    @Override
//    public MediaOwnerType supports() {
//
//        return MediaOwnerType.PRODUCT;
//    }
//
//    @Override
//    public MediaOwner resolve(UUID ownerId) {
//
//        var product =
//                productRepository.findById(ownerId)
//                        .orElseThrow(() ->
//                                new RuntimeException(
//                                        "Product not found: "
//                                                + ownerId
//                                )
//                        );
//
//        return new MediaOwner(
//                product.getSlug()
//        );
//    }
//}
