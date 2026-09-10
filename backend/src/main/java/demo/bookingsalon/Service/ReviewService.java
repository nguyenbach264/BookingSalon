package demo.bookingsalon.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Mapper.ReviewMapper;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Repository.ReviewRepository;
import demo.bookingsalon.Repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final ReviewMapper reviewMapper;

    @Transactional(readOnly = true)
    public List<ReviewDTO> getAllReviews() {
        return reviewRepository.findAll().stream().map(item -> reviewMapper.toReviewDTO(item)).toList();
        return reviewRepository.findAll().stream().map(reviewMapper::toReviewDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByProductId(UUID productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(reviewMapper::toReviewDTO)
                .toList();
    }

    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO) {
        Review review = new Review();
        review.setUserId(reviewDTO.getUserId());
        review.setType(reviewDTO.getType());
        review.setReviewContent(reviewDTO.getReviewContent());
        User user = null;
        if (reviewDTO.getUserId() != null) {
            user = userRepository.findById(reviewDTO.getUserId())
                    .orElse(null);
        }

        Product product = null;
        if (reviewDTO.getProductId() != null) {
            product = productRepository.findById(reviewDTO.getProductId())
                    .orElse(null);
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(reviewDTO.getRating() != null ? reviewDTO.getRating() : 5)
                .type(reviewDTO.getType())
                .reviewContent(reviewDTO.getReviewContent())
                .build();

        Review savedReview = reviewRepository.save(review);
        ReviewDTO response = reviewMapper.toReviewDTO(savedReview);

        broadcastNewReview(response);

        return response;
    }

    private void broadcastNewReview(ReviewDTO response) {
        try {
            WebSocketMessage message = new WebSocketMessage("NEW_REVIEW", response);
            String json = objectMapper.writeValueAsString(message);

            webSocketHandler.broadcast(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot create WebSocket message", e);
        }
    }

    private static class WebSocketMessage {
        private final String type;
        private final Object data;

        public WebSocketMessage(String type, Object data) {
            this.type = type;
            this.data = data;
        }

        public String getType() {
            return type;
        }

        public Object getData() {
            return data;
        }
    }
}