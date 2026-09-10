package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.NotificationMapper;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.NotificationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;
    private final BookingMapper bookingMapper;
    private final NotificationMapper notificationMapper;


    public NotificationDTO createNotification(Notification notification) {
        Notification savedNotification = notificationRepository.save(notification);

        Booking booking = bookingRepository.findById(notification.getBookingId())
                .orElseThrow(() -> new NotFoundException("Booking not found for creating notification"));

        BookingResponse bookingResponse = bookingMapper.toBookingResponse(booking);

        NotificationDTO notificationDTO = notificationMapper.toNotificationDTO(notification);
        notificationDTO.setBookingResponse(bookingResponse);

        return notificationDTO;
    }

    public List<NotificationDTO> getAllNotificationsByUser(UUID userId) {
        List<NotificationDTO> result = notificationRepository.findByUserId(userId).stream()
                .map(item -> notificationMapper.toNotificationDTO(item))
                .toList();

        return result;
    }

    public List<NotificationDTO> getAllNotificationsBySalon(UUID salonId) {
        List<NotificationDTO> result = notificationRepository.findBySalonId(salonId).stream()
                .map(item -> notificationMapper.toNotificationDTO(item))
                .toList();

        return result;
    }

    public Notification markNotificationAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Not found notification to mark notification as read"));

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

}
