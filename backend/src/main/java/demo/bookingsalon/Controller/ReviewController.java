package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.DTO.ReviewDTO;
import demo.bookingsalon.Service.ReviewService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@AllArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;
    private final demo.bookingsalon.Utility.SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<?> getAllReviews() {
        return ResponseEntity.status(HttpStatus.OK).body(reviewService.getAllReviews());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getReviewsByUserId(@PathVariable("userId") java.util.UUID userId) {
        return ResponseEntity.status(HttpStatus.OK).body(reviewService.getReviewsByUserId(userId));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getReviewsByProductId(@PathVariable("productId") java.util.UUID productId) {
        return ResponseEntity.status(HttpStatus.OK).body(reviewService.getReviewsByProductId(productId));
    }

    @demo.bookingsalon.Security.RateLimit.RateLimit(
        keyPrefix = "review",
        type = demo.bookingsalon.Security.RateLimit.RateLimitType.USER,
        capacity = 3,
        durationSeconds = 60,
        message = "Bạn đang gửi đánh giá quá nhanh. Vui lòng chờ 1 phút!"
    )
    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestBody ReviewDTO reviewDTO,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID currentUserId = securityUtils.getCurrentUserId(authentication);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("message", "Vui lòng đăng nhập để gửi đánh giá!"));
        }
        reviewDTO.setUserId(currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(reviewDTO, currentUserId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable("id") java.util.UUID id) {
        reviewService.deleteReview(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
