package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.ServiceOffering;
import demo.bookingsalon.dto.ServiceOfferingDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ServiceOfferingMapper {
    ServiceOfferingDTO toServiceOfferingDTO(ServiceOffering serviceOffering);
}
