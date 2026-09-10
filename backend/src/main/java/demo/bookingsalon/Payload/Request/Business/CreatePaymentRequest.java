package demo.bookingsalon.Payload.Request.Business;

import demo.bookingsalon.Enum.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {
    @NotNull
    private UUID bookingId;

    @NotNull
    @Min(value = 1000)
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;
}
