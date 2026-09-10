package demo.bookingsalon.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Mapper.ReviewMapper;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import demo.bookingsalon.Repository.ReviewRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final ReviewMapper reviewMapper;

    @Transactional(readOnly = true)
    public List<ReviewDTO> getAllReviews() {
        return reviewRepository.findAll().stream().map(item -> reviewMapper.toReviewDTO(item)).toList();
    }

    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO) {
        Review review = new Review();
        review.setUserId(reviewDTO.getUserId());
        review.setType(reviewDTO.getType());
        review.setReviewContent(reviewDTO.getReviewContent());

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