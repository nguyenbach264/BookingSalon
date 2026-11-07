package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    @Mapping(target = "isRead", expression = "java(notification != null && notification.isRead())")
    NotificationDTO toNotificationDTO(Notification notification);
}
