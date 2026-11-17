package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.Notification;
import demo.bookingsalon.dto.NotificationDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    @Mapping(target = "isRead", expression = "java(notification != null && notification.isRead())")
    NotificationDTO toNotificationDTO(Notification notification);
}
