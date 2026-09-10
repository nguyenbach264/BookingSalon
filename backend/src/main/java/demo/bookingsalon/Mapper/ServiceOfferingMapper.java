package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ServiceOfferingMapper {
    ServiceOfferingDTO toServiceOfferingDTO(ServiceOffering serviceOffering);
}
