package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.Salon;
import demo.bookingsalon.dto.SalonDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SalonMapper {
    SalonDTO toSalonDTO(Salon salon);

    Salon toSalon(SalonDTO salonDTO);
}
