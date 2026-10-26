package demo.bookingsalon.ReviewTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Mapper.ReviewMapper;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Repository.ReviewRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceUnitTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private StylistRepository stylistRepository;

    @Mock
    private NotificationWebSocketHandler webSocketHandler;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ReviewMapper reviewMapper;

    @InjectMocks
    private ReviewService reviewService;

    private UUID userId;
    private UUID productId;
    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        productId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .username("reviewer")
                .fullName("Nguyen Reviewer")
                .build();

        testProduct = Product.builder()
                .id(productId)
                .name("Pomade")
                .build();
    }

    @Test
    @DisplayName("UT-Review-01: createReview cho sản phẩm thành công")
    void testCreateReview_Product_Success() {
        ReviewDTO request = ReviewDTO.builder()
                .userId(userId)
                .productId(productId)
                .rating(5)
                .type("PRODUCT")
                .reviewContent("Sản phẩm rất tốt!")
                .build();

        Review savedReview = Review.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .product(testProduct)
                .rating(5)
                .type("PRODUCT")
                .reviewContent("Sản phẩm rất tốt!")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewMapper.toReviewDTO(any(Review.class))).thenReturn(request);

        ReviewDTO result = reviewService.createReview(request, userId);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        assertEquals("Sản phẩm rất tốt!", result.getReviewContent());
        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    @DisplayName("UT-Review-02: createReview ném NotFoundException khi không tìm thấy User")
    void testCreateReview_UserNotFound_ThrowsException() {
        ReviewDTO request = ReviewDTO.builder()
                .userId(userId)
                .productId(productId)
                .rating(5)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> reviewService.createReview(request, userId));
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    @DisplayName("UT-Review-03: getReviewsByProductId trả về danh sách đánh giá")
    void testGetReviewsByProductId_Success() {
        Review review = Review.builder()
                .id(UUID.randomUUID())
                .product(testProduct)
                .rating(4)
                .reviewContent("Khá ổn")
                .build();

        ReviewDTO dto = ReviewDTO.builder()
                .rating(4)
                .reviewContent("Khá ổn")
                .build();

        when(reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)).thenReturn(List.of(review));
        when(reviewMapper.toReviewDTO(review)).thenReturn(dto);

        List<ReviewDTO> result = reviewService.getReviewsByProductId(productId);

        assertEquals(1, result.size());
        assertEquals("Khá ổn", result.get(0).getReviewContent());
    }

    @Test
    @DisplayName("UT-Review-04: deleteReview gọi xóa đánh giá theo ID")
    void testDeleteReview_Success() {
        UUID reviewId = UUID.randomUUID();
        Review review = Review.builder().id(reviewId).build();
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

        assertDoesNotThrow(() -> reviewService.deleteReview(reviewId));
        verify(reviewRepository, times(1)).delete(review);
    }
}
