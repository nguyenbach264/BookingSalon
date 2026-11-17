package demo.bookingsalon.publisher;

import demo.bookingsalon.entity.Booking;
import demo.bookingsalon.entity.Salon;
import demo.bookingsalon.entity.User;
import demo.bookingsalon.event.BookingCancelledEvent;
import demo.bookingsalon.event.BookingCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingEventPublisher {
    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishBookingCreatedEvent(Booking booking, User user, Salon salon) {
        BookingCreatedEvent bookingCreatedEvent = new BookingCreatedEvent();
        bookingCreatedEvent.setUserId(user.getId());
        bookingCreatedEvent.setBookingId(booking.getId());
        bookingCreatedEvent.setEmail(user.getEmail());
        bookingCreatedEvent.setStartTime(booking.getStartTime());
        bookingCreatedEvent.setEndTime(booking.getEndTime());
        bookingCreatedEvent.setSalonName(salon.getSalonName());
        bookingCreatedEvent.setSalonAddress(salon.getAddress());
        bookingCreatedEvent.setTotalAmount(booking.getTotalAmount());
        applicationEventPublisher.publishEvent(bookingCreatedEvent);
    }

    public void publishBookingCancelledEvent(Booking booking) {
        BookingCancelledEvent bookingCancelledEvent = new BookingCancelledEvent();
        bookingCancelledEvent.setBookingId(booking.getId());
        bookingCancelledEvent.setStartTime(booking.getStartTime());
        bookingCancelledEvent.setEndTime(booking.getEndTime());
        bookingCancelledEvent.setTotalAmount(booking.getTotalAmount());
        applicationEventPublisher.publishEvent(bookingCancelledEvent);
    }
}
