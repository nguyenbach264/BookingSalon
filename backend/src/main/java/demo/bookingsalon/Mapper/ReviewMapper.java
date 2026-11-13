package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user", target = "username", qualifiedByName = "resolveUsername")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    ReviewDTO toReviewDTO(Review review);

    @Named("resolveUsername")
    default String resolveUsername(User user) {
        if (user == null) return "Khách hàng";
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return "Khách hàng";
    }

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "productId", target = "product.id")
    Review toReview(ReviewDTO reviewDTO);
}
