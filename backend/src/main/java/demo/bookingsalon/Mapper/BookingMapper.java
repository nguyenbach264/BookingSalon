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

    @Mapping(target = "salonId", source = "salon", qualifiedByName = "safeSalonId")
    @Mapping(target = "salonName", source = "salon", qualifiedByName = "safeSalonName")
    @Mapping(target = "salonAddress", source = "salon", qualifiedByName = "safeSalonAddress")
    @Mapping(target = "userId", source = "user", qualifiedByName = "safeUserId")
    @Mapping(target = "stylistId", source = "stylist", qualifiedByName = "safeStylistId")
    @Mapping(target = "stylistName", source = "stylist", qualifiedByName = "safeStylistName")
    @Mapping(target = "serviceIds", source = "bookingDetails", qualifiedByName = "mapServiceIds")
    @Mapping(target = "serviceNames", source = "bookingDetails", qualifiedByName = "mapServiceNames")
    @Mapping(target = "totalServices", source = "bookingDetails", qualifiedByName = "mapTotalServices")
    @Mapping(target = "isReviewed", source = "reviewed")
    @Mapping(target = "createdAt", source = "createdAt")
    BookingResponse toBookingResponse(Booking booking);

    @Named("safeSalonId")
    default UUID safeSalonId(demo.bookingsalon.Entity.Salon salon) {
        try {
            return salon != null ? salon.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Named("safeSalonName")
    default String safeSalonName(demo.bookingsalon.Entity.Salon salon) {
        try {
            return salon != null ? salon.getSalonName() : "Chi nhánh";
        } catch (Exception e) {
            return "Chi nhánh";
        }
    }

    @Named("safeSalonAddress")
    default String safeSalonAddress(demo.bookingsalon.Entity.Salon salon) {
        try {
            return salon != null ? salon.getAddress() : "—";
        } catch (Exception e) {
            return "—";
        }
    }

    @Named("safeUserId")
    default UUID safeUserId(demo.bookingsalon.Entity.User user) {
        try {
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Named("safeStylistId")
    default UUID safeStylistId(demo.bookingsalon.Entity.Stylist stylist) {
        try {
            return stylist != null ? stylist.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Named("safeStylistName")
    default String safeStylistName(demo.bookingsalon.Entity.Stylist stylist) {
        try {
            return stylist != null ? stylist.getFullName() : "Chuyên viên";
        } catch (Exception e) {
            return "Chuyên viên";
        }
    }

    @Named("mapServiceIds")
    default Set<UUID> mapServiceIds(List<BookingDetail> details) {
        if (details == null) return Collections.emptySet();
        return details.stream()
                .map(d -> {
                    try {
                        return d.getServiceOffering() != null ? d.getServiceOffering().getId() : null;
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
    }

    @Named("mapServiceNames")
    default List<String> mapServiceNames(List<BookingDetail> details) {
        if (details == null) return Collections.emptyList();
        return details.stream()
                .map(d -> {
                    try {
                        return d.getServiceOffering() != null ? d.getServiceOffering().getName() : null;
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Named("mapTotalServices")
    default int mapTotalServices(List<BookingDetail> details) {
        return details == null ? 0 : details.size();
    }
}
