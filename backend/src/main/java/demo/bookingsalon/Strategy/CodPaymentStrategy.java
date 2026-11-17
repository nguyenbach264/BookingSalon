package demo.bookingsalon.strategy;

import demo.bookingsalon.entity.Payment;
import demo.bookingsalon.entity.PaymentTransaction;
import demo.bookingsalon.enums.PaymentMethod;
import demo.bookingsalon.enums.PaymentStatus;
import demo.bookingsalon.dto.request.business.CreatePaymentRequest;
import demo.bookingsalon.dto.response.business.PaymentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class CodPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentTransaction generatePayment(Payment payment, CreatePaymentRequest createPaymentRequest) {
        log.info("Generating COD for payment: {}", payment.getPaymentCode());

        return PaymentTransaction.builder()
                .transactionRef("COD-" + (payment.getId() != null ? payment.getId() : UUID.randomUUID()))
                .method(PaymentMethod.COD)
                .status(PaymentStatus.SUCCESS)
                .payment(payment)
                .gatewayPayload("{\"message\": \"COD payment successful\"}")
                .build();
    }

    @Override
    public PaymentResponse refund(Payment payment, BigDecimal amount) {
        return null;
    }

    @Override
    public PaymentMethod getType() {
        return PaymentMethod.COD;
    }

    @Override
    public void verifyCallback(Map<String, String> payload) {
        throw new UnsupportedOperationException("COD doesn't support Webhooks");
    }
}
