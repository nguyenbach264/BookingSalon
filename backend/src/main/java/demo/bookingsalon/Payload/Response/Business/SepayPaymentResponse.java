package demo.bookingsalon.Payload.Response.Business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SepayPaymentResponse {
    // JSON "order_id" & JAVA "bookingId"
    // OrderId là mã thanh toán do Sepay tạo
    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("payment_url")
    private String paymentUrl;

    @JsonProperty("qr_code")
    private String qrCodeUrl;
}