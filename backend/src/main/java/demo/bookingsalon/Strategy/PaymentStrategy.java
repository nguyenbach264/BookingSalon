package demo.bookingsalon.Strategy;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentStrategy {

    PaymentMethod getType();

    void verifyCallback(Map<String, String> payload);

    PaymentTransaction generatePayment(Payment payment, CreatePaymentRequest createPaymentRequest);

    PaymentResponse refund(Payment payment, BigDecimal amount);
}
