package demo.bookingsalon.ReviewTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.ReviewController;
import demo.bookingsalon.Payload.DTO.ReviewDTO;
import demo.bookingsalon.Service.BffSessionService;
import demo.bookingsalon.Service.ReviewService;
import demo.bookingsalon.Utility.SecurityUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ReviewControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReviewService reviewService;

    @MockitoBean
    private SecurityUtils securityUtils;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Review-01: GET /api/reviews trả về 200 OK và danh sách đánh giá")
    void testGetAllReviews_Success() throws Exception {
        ReviewDTO review = ReviewDTO.builder()
                .rating(5)
                .reviewContent("Dịch vụ tuyệt vời!")
                .build();

        when(reviewService.getAllReviews()).thenReturn(List.of(review));

        mockMvc.perform(get("/api/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].rating").value(5))
                .andExpect(jsonPath("$[0].reviewContent").value("Dịch vụ tuyệt vời!"));
    }

    @Test
    @DisplayName("IT-Review-02: GET /api/reviews/product/{productId} trả về 200 OK")
    void testGetReviewsByProductId_Success() throws Exception {
        UUID productId = UUID.randomUUID();
        ReviewDTO review = ReviewDTO.builder()
                .productId(productId)
                .rating(5)
                .reviewContent("Pomade giữ nếp tốt")
                .build();

        when(reviewService.getReviewsByProductId(productId)).thenReturn(List.of(review));

        mockMvc.perform(get("/api/reviews/product/{productId}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].rating").value(5))
                .andExpect(jsonPath("$[0].reviewContent").value("Pomade giữ nếp tốt"));
    }

    @Test
    @DisplayName("IT-Review-03: POST /api/reviews thành công trả về 201 CREATED")
    void testCreateReview_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        ReviewDTO request = ReviewDTO.builder()
                .productId(productId)
                .rating(5)
                .reviewContent("Đóng gói đẹp")
                .build();

        ReviewDTO response = ReviewDTO.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .productId(productId)
                .rating(5)
                .reviewContent("Đóng gói đẹp")
                .build();

        when(securityUtils.getCurrentUserId(any())).thenReturn(userId);
        when(reviewService.createReview(any(ReviewDTO.class), eq(userId))).thenReturn(response);

        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.reviewContent").value("Đóng gói đẹp"));
    }
}

