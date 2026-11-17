package demo.bookingsalon.dto.response.business;

import demo.bookingsalon.enums.PaymentMethod;
import demo.bookingsalon.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {

    private UUID paymentId;

    private UUID bookingId;

    private UUID salonId;

    private UUID userId;

    private List<PaymentTransactionResponse> paymentTransactions;

    private String paymentCode;

    private String transactionRef;

    private PaymentStatus status;

    private PaymentMethod method;

    private String paymentContent;

    private String paymentUrl;

    private String qrCodeData;

}
