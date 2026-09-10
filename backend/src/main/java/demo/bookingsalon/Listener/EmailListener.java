package demo.bookingsalon.Listener;

import demo.bookingsalon.Event.BookingCancelledEvent;
import demo.bookingsalon.Event.BookingCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailListener {
    private final JavaMailSender mailSender;

    // Async gửi email khi booking thành công
    @EventListener
    @Async
    public void sendSuccessfulEmail(BookingCreatedEvent bookingCreatedEvent) {
        log.info("Processing async booking confirmation: {}", bookingCreatedEvent.getBookingId());
        try {
            createSuccessfulEmail(bookingCreatedEvent);
        } catch (Exception ex) {
            log.error("Failed to send booking confirmation email to: {}", bookingCreatedEvent.getEmail());
        }
    }

    private void createSuccessfulEmail(BookingCreatedEvent bookingCreatedEvent) {
        SimpleMailMessage simpleMail = new SimpleMailMessage();
        simpleMail.setTo(bookingCreatedEvent.getEmail());
        simpleMail.setSubject("Book salon successfully!");
        simpleMail.setText(String.format(
                "Your booking confirmed!\n" +
                        "Booking ID: %s\n" +
                        "Salon: %s\n" +
                        "Address: %s\n" +
                        "Start time: %s\n" +
                        "End time: %s\n" +
                        "Total amount: %s\n",
                bookingCreatedEvent.getBookingId(), bookingCreatedEvent.getSalonName(),
                bookingCreatedEvent.getSalonAddress(), bookingCreatedEvent.getStartTime(),
                bookingCreatedEvent.getEndTime(), bookingCreatedEvent.getTotalAmount()
                ));
        mailSender.send(simpleMail);
        log.info("Sent confirmation email to: {}", bookingCreatedEvent.getEmail());
    }

    // Async gửi email khi cancel booking
    @EventListener
    @Async
    public void sendCancelledEmail(BookingCancelledEvent bookingCancelledEvent) {
        log.info("Processing async booking cancellation: {}", bookingCancelledEvent.getBookingId());
        try {
            createCancelledEmail(bookingCancelledEvent);
        } catch (Exception ex) {
            log.error("Failed to send booking cancelled email to: {}", bookingCancelledEvent.getEmail());
        }
    }

    private void createCancelledEmail(BookingCancelledEvent bookingCancelledEvent) {
        SimpleMailMessage simpleMail = new SimpleMailMessage();
        simpleMail.setTo(bookingCancelledEvent.getEmail());
        simpleMail.setSubject("Cancel booking salon successfully!");
        simpleMail.setText(String.format(
                "Your booking confirmed!\n" +
                        "Booking ID: %s\n" +
                        "Start time: %s\n" +
                        "End time: %s\n" +
                        "Total amount: %s\n",
                bookingCancelledEvent.getBookingId(), bookingCancelledEvent.getStartTime(),
                bookingCancelledEvent.getEndTime(), bookingCancelledEvent.getTotalAmount()
        ));
        mailSender.send(simpleMail);
        log.info("Sent cancellation email to: {}", bookingCancelledEvent.getEmail());
    }
}
