package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    ReviewDTO toReviewDTO(Review review);

    Review toReview(ReviewDTO reviewDTO);
}
