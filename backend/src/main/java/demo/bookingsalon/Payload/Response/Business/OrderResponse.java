package demo.bookingsalon.Payload.Response.Business;

import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String note;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
    private BankTransferDetails bankTransferDetails;
    private String vnpayUrl;  // URL redirect sang VNPay (chỉ có khi paymentMethod = VNPAY)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private UUID orderDetailId;
        private UUID productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BankTransferDetails {
        private String bankName;
        private String bankBin;
        private String accountNo;
        private String accountName;
        private BigDecimal amount;
        private String transferContent;
        private String qrCodeUrl;
    }
}

