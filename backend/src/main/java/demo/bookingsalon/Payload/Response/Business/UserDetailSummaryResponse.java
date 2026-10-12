package demo.bookingsalon.Payload.Response.Business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailSummaryResponse {
    private UserResponse user;
    private List<BookingResponse> bookings;
    private List<OrderResponse> orders;
    private long totalBookings;
    private BigDecimal totalBookingSpent;
    private long totalOrders;
    private BigDecimal totalOrderSpent;
}

