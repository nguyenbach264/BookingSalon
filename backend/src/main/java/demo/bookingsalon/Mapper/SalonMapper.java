package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SalonMapper {
    SalonDTO toSalonDTO(Salon salon);

    Salon toSalon(SalonDTO salonDTO);
}
