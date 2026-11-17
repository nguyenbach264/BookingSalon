package demo.bookingsalon.dto.response.business;

import demo.bookingsalon.enums.PaymentMethod;
import demo.bookingsalon.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentTransactionResponse {
    private UUID transactionId;
    private String transactionRef;
    private String gatewayTransactionNo;
    private PaymentMethod method;
    private PaymentStatus status;
    private BigDecimal amount;
    private String bankCode;
    private String gatewayPayload;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
}
