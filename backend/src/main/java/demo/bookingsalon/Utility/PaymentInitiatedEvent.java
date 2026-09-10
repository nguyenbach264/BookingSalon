package demo.bookingsalon.Utility;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class PaymentInitiatedEvent {
    private final UUID paymentId;
}
