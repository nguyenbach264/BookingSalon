package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.BookingDetail;
import demo.bookingsalon.Payload.DTO.BookingDTO;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    Booking toBooking(BookingResponse bookingResponse);

    BookingDTO toBookingDTO(Booking booking);

    @Mapping(target = "salonId", source = "salon.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "stylistId", source = "stylist.id")
    @Mapping(target = "serviceIds", source = "bookingDetails", qualifiedByName = "mapServiceIds")
    @Mapping(target = "totalServices", source = "bookingDetails", qualifiedByName = "mapTotalServices")
    BookingResponse toBookingResponse(Booking booking);

    @Named("mapServiceIds")
    default Set<UUID> mapServiceIds(List<BookingDetail> details) {
        if (details == null) return Collections.emptySet();
        return details.stream()
                .filter(d -> d.getServiceOffering() != null)
                .map(d -> d.getServiceOffering().getId())
                .collect(Collectors.toSet());
    }

    @Named("mapTotalServices")
    default int mapTotalServices(List<BookingDetail> details) {
        return details == null ? 0 : details.size();
    }
}
