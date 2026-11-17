package demo.bookingsalon.strategy;

import demo.bookingsalon.entity.Payment;
import demo.bookingsalon.entity.PaymentTransaction;
import demo.bookingsalon.enums.PaymentMethod;
import demo.bookingsalon.dto.request.business.CreatePaymentRequest;
import demo.bookingsalon.dto.response.business.PaymentResponse;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentStrategy {

    PaymentMethod getType();

    void verifyCallback(Map<String, String> payload);

    PaymentTransaction generatePayment(Payment payment, CreatePaymentRequest createPaymentRequest);

    PaymentResponse refund(Payment payment, BigDecimal amount);
}
