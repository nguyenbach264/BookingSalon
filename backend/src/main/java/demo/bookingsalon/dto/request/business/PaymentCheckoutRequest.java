package demo.bookingsalon.dto.request.business;

import demo.bookingsalon.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PaymentCheckoutRequest {
    @NotNull
    private UUID bookingId;

    @NotNull
    private PaymentMethod method;
}
