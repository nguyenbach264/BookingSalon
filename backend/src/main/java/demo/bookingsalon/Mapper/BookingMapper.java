package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Payload.DTO.BookingDTO;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    Booking toBooking(BookingResponse bookingResponse);

    BookingDTO toBookingDTO(Booking booking);

    @Mapping(target = "salonId", source = "salon.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "stylistId", source = "stylist.id")
    BookingResponse toBookingResponse(Booking booking);
}
