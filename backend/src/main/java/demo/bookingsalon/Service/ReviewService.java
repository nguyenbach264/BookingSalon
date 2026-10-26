package demo.bookingsalon.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Mapper.ReviewMapper;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Repository.ReviewRepository;
import demo.bookingsalon.Repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final demo.bookingsalon.Repository.BookingRepository bookingRepository;
    private final demo.bookingsalon.Repository.StylistRepository stylistRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final ReviewMapper reviewMapper;

    @Transactional(readOnly = true)
    public List<ReviewDTO> getAllReviews() {
        return reviewRepository.findAll().stream().map(reviewMapper::toReviewDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByProductId(UUID productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(reviewMapper::toReviewDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByUserId(UUID userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(reviewMapper::toReviewDTO)
                .toList();
    }

    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO) {
        return createReview(reviewDTO, reviewDTO.getUserId());
    }

    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO, java.util.UUID authenticatedUserId) {
        java.util.UUID effectiveUserId = authenticatedUserId != null ? authenticatedUserId : reviewDTO.getUserId();
        if (effectiveUserId == null) {
            throw new IllegalArgumentException("Người dùng chưa được xác thực!");
        }

        User user = userRepository.findById(effectiveUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Product product = null;
        if (reviewDTO.getProductId() != null) {
            product = productRepository.findById(reviewDTO.getProductId())
                    .orElse(null);
        }

        if (reviewDTO.getBookingId() != null) {
            demo.bookingsalon.Entity.Booking b = bookingRepository.findById(reviewDTO.getBookingId()).orElse(null);
            if (b != null) {
                // SECURITY CHECK: Chỉ chính khách hàng của booking này mới được đánh giá
                if (b.getUser() != null && !b.getUser().getId().equals(effectiveUserId)) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Bạn không có quyền đánh giá lịch hẹn của người khác!"
                    );
                }
                if (b.getStatus() != demo.bookingsalon.Enum.BookingStatus.COMPLETED) {
                    throw new IllegalStateException("Chỉ có thể gửi đánh giá cho lịch hẹn đã hoàn thành dịch vụ!");
                }
                if (b.isReviewed()) {
                    throw new IllegalStateException("Lịch hẹn này đã được gửi đánh giá trước đó!");
                }
                b.setReviewed(true);
                bookingRepository.save(b);
            }
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .bookingId(reviewDTO.getBookingId())
                .stylistId(reviewDTO.getStylistId())
                .salonId(reviewDTO.getSalonId())
                .rating(reviewDTO.getRating() != null ? reviewDTO.getRating() : 5)
                .type(reviewDTO.getType() != null ? reviewDTO.getType() : "SERVICE")
                .reviewContent(reviewDTO.getReviewContent())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Cập nhật rating và review count thật của Stylist trong CSDL
        if (review.getStylistId() != null) {
            Double avg = reviewRepository.getAverageRatingByStylistId(review.getStylistId());
            Long count = reviewRepository.countByStylistId(review.getStylistId());
            stylistRepository.findById(review.getStylistId()).ifPresent(s -> {
                s.setRatingAverage(avg != null ? java.math.BigDecimal.valueOf(avg).setScale(2, java.math.RoundingMode.HALF_UP) : java.math.BigDecimal.ZERO);
                s.setRating(avg != null ? avg : 0.0);
                s.setTotalReviewsCount(count != null ? count.intValue() : 0);
                stylistRepository.save(s);
            });
        }

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
            log.warn("Cannot serialize WebSocket message for new review notification: {}", e.getMessage());
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

    @Transactional
    public void deleteReview(UUID id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review != null) {
            UUID stylistId = review.getStylistId();
            if (review.getBookingId() != null) {
                bookingRepository.findById(review.getBookingId()).ifPresent(b -> {
                    b.setReviewed(false);
                    bookingRepository.save(b);
                });
            }
            reviewRepository.delete(review);

            // Cập nhật lại rating và review count của Stylist sau khi xóa
            if (stylistId != null) {
                Double avg = reviewRepository.getAverageRatingByStylistId(stylistId);
                Long count = reviewRepository.countByStylistId(stylistId);
                stylistRepository.findById(stylistId).ifPresent(s -> {
                    s.setRatingAverage(avg != null ? java.math.BigDecimal.valueOf(avg).setScale(2, java.math.RoundingMode.HALF_UP) : java.math.BigDecimal.ZERO);
                    s.setRating(avg != null ? avg : 0.0);
                    s.setTotalReviewsCount(count != null ? count.intValue() : 0);
                    stylistRepository.save(s);
                });
            }
        }
    }
}
