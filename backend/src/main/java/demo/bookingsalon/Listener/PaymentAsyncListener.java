package demo.bookingsalon.Listener;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Factory.PaymentFactory;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Strategy.PaymentStrategy;
import demo.bookingsalon.Utility.PaymentInitiatedEvent;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentAsyncListener {

    private final PaymentRepository paymentRepository;
    private final PaymentFactory factory;

    @Async("paymentExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional
    public void handlePaymentInit(PaymentInitiatedEvent event) {
        Payment payment = paymentRepository.findById(event.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + event.getPaymentId()));
        log.info("Async processing started for payment: {}", payment.getPaymentCode());

        // Kiểm tra nếu không còn ở PENDING -> bỏ qua
        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.warn("Payment {} status is not PENDING ({}), skip async processing",
                    payment.getPaymentCode(), payment.getStatus());
            return;
        }

        try {
            PaymentStrategy strategy = factory.getStrategy(payment.getPaymentMethod());
            PaymentTransaction tx = strategy.generatePayment(payment, null);
            payment.getTransactions().add(tx);
            // Chuyển sang PROCESSING (nếu strategy không tự set)
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.transitionTo(PaymentStatus.PROCESSING);
            }
            paymentRepository.save(payment);
            log.info("Async processing completed for payment: {}, status: {}",
                    payment.getPaymentCode(), payment.getStatus());
        } catch (Exception e) {
            log.error("Async processing failed for payment: {}", payment.getPaymentCode(), e);
            payment.transitionTo(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }
}
