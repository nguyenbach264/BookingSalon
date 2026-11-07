package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    ReviewDTO toReviewDTO(Review review);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "productId", target = "product.id")
    Review toReview(ReviewDTO reviewDTO);
}
