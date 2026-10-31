package demo.bookingsalon.Utility;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiredPaymentScheduler {

    private final PaymentRepository paymentRepository;

    @Scheduled(cron = "0 */5 * * * *") // mỗi 5 phút
    @SchedulerLock(name = "expirePaymentLock", lockAtMostFor = "PT4M", lockAtLeastFor = "PT1M")
    @Transactional
    public void expirePendingPayments() {
        log.info("Running expired payment scheduler...");
        java.time.LocalDateTime cutoffTime = java.time.LocalDateTime.now().minusMinutes(15);
        List<Payment> expiredList = paymentRepository.findByStatusAndCreatedBefore(PaymentStatus.PENDING, cutoffTime)
                .orElse(java.util.Collections.emptyList());

        if (expiredList.isEmpty()) {
            log.info("No expired payments found");
            return;
        }

        for (Payment payment : expiredList) {
            // Kiểm tra lại status để tránh cập nhật đồng thời tại 1 thời điểm
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.transitionTo(PaymentStatus.EXPIRED);
                paymentRepository.save(payment);
                log.info("Expired payment: {}, expired at: {}", payment.getPaymentCode(), payment.getUpdatedAt());
            }
        }
        log.info("Expired {} payments", expiredList.size());
    }
}
