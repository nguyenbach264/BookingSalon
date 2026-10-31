package demo.bookingsalon.Payload.Response.Business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingStatisticsResponse {
    private long pending;        // Đang chờ xác nhận
    private long confirmed;      // Đã xác nhận
    private long completed;      // Đã hoàn thành
    private long cancelled;      // Đã hủy
    private long total;          // Tổng cộng

    public long getPendingCount() { return pending; }
    public long getConfirmedCount() { return confirmed; }
    public long getCompletedCount() { return completed; }
    public long getCancelledCount() { return cancelled; }
    public long getTotalCount() { return total; }
}
