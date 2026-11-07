package demo.bookingsalon.BookingTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.BookingController;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Payload.Request.Business.CreateBookingRequest;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Service.BffSessionService;
import demo.bookingsalon.Service.BookingService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
public class BookingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BookingService bookingService;

    @MockitoBean
    private SecurityUtils securityUtils;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Booking-01: GET /api/bookings trả về HTTP 200 và danh sách lịch hẹn")
    void testGetBookings_Success() throws Exception {
        BookingResponse booking = BookingResponse.builder()
                .id(UUID.randomUUID())
                .bookingCode("BB-2026-001")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(150000))
                .build();

        when(bookingService.getBookings()).thenReturn(List.of(booking));

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingCode").value("BB-2026-001"))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("IT-Booking-02: GET /api/bookings/{id} thành công trả về thông tin chi tiết lịch hẹn")
    void testGetBookingById_Success() throws Exception {
        UUID bookingId = UUID.randomUUID();
        BookingResponse booking = BookingResponse.builder()
                .id(bookingId)
                .bookingCode("BB-2026-002")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(200000))
                .build();

        when(bookingService.getBookingById(bookingId)).thenReturn(booking);

        mockMvc.perform(get("/api/bookings/{id}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(bookingId.toString()))
                .andExpect(jsonPath("$.bookingCode").value("BB-2026-002"));
    }

    @Test
    @DisplayName("IT-Booking-03: POST /api/bookings thành công trả về HTTP 201 CREATED")
    void testCreateBooking_Success() throws Exception {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .userId(UUID.randomUUID())
                .stylistId(UUID.randomUUID())
                .salonId(UUID.randomUUID())
                .startTime(LocalDateTime.now().plusDays(1).withHour(14).withMinute(0))
                .serviceIds(List.of(UUID.randomUUID()))
                .customerName("Tran Van B")
                .customerPhone("0987654321")
                .build();

        BookingResponse response = BookingResponse.builder()
                .id(UUID.randomUUID())
                .bookingCode("BB-2026-NEW")
                .status(BookingStatus.PENDING)
                .build();

        when(bookingService.createBooking(any(CreateBookingRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingCode").value("BB-2026-NEW"));
    }

    @Test
    @DisplayName("IT-Booking-04: PUT /api/bookings/{id}/status thành công cập nhật trạng thái trả về 204")
    void testUpdateBookingStatus_Success() throws Exception {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        BookingResponse booking = BookingResponse.builder()
                .id(bookingId)
                .userId(userId)
                .status(BookingStatus.PENDING)
                .build();

        when(bookingService.getBookingById(bookingId)).thenReturn(booking);
        when(securityUtils.isAdmin(any())).thenReturn(true);
        when(bookingService.updateBooking(eq(bookingId), eq(BookingStatus.CONFIRMED))).thenReturn("Updated successfully");

        mockMvc.perform(put("/api/bookings/{id}/status", bookingId)
                        .param("status", "CONFIRMED"))
                .andExpect(status().isNoContent());
    }
}
