package demo.bookingsalon.Publisher;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Event.BookingCancelledEvent;
import demo.bookingsalon.Event.BookingCreatedEvent;
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
