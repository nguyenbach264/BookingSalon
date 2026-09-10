package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    NotificationDTO toNotificationDTO(Notification notification);
}
