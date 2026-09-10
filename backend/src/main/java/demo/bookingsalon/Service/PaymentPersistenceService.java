package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentPersistenceService {
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;

    public Payment getPaymentId(UUID paymentId) {
        return paymentRepository.findById(paymentId).orElseThrow(() ->
                new NotFoundException("Payment not found"));
    }

    public Payment createPayment(Payment payment) {
        log.info("Saving new payment for booking: {}", payment.getBooking());
        return paymentRepository.save(payment);
    }

    public PaymentTransaction createPaymentTransaction(Payment payment,
                                                       PaymentMethod paymentMethod,
                                                       String transactionRef) {
        PaymentTransaction paymentTransaction = PaymentTransaction.builder()
                .payment(payment)
                .method(paymentMethod)
                .createdAt(LocalDateTime.now())
                .transactionRef(transactionRef)
                .status(PaymentStatus.PENDING)
                .build();
        return transactionRepository.save(paymentTransaction);
    }

    public String updatePayment(UUID paymentId, PaymentMethod paymentMethod) {
        Payment payment = getPaymentId(paymentId);
        payment.setPaymentMethod(paymentMethod);
        paymentRepository.save(payment);
        return "Update payment successfully";
    }
}
