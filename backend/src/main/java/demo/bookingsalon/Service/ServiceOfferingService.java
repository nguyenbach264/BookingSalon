package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.ServiceOfferingMapper;
import demo.bookingsalon.Payload.DTO.CategoryDTO;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceOfferingService {
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ServiceOfferingMapper serviceOfferingMapper;

    public List<ServiceOfferingDTO> getServiceOfferings() {
        List<ServiceOfferingDTO> dtoList = serviceOfferingRepository.findAll().stream()
                .map((service) -> {
                    ServiceOfferingDTO dto = serviceOfferingMapper.toServiceOfferingDTO(service);
                    return dto;
                })
                .sorted(Comparator.comparing(ServiceOfferingDTO::getPrice))
                .toList();
        return dtoList;
    }

    public ServiceOfferingDTO getServiceOfferingById(UUID id) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findById(id).orElseThrow(() ->
                new NotFoundException("Can't query service offering in database"));
        return serviceOfferingMapper.toServiceOfferingDTO(serviceOffering);
    }

//    public List<ServiceOfferingDTO> getServiceOfferingBySalonId(String salonId) {
//        return serviceOfferingRepository.findBySalonId(UUID.fromString(salonId)).stream()
//                .sorted(Comparator.comparing(ServiceOfferingDTO::getPrice)).toList();
//    }

    public List<ServiceOfferingDTO> getServiceOfferingByIds(Set<UUID> ids) {
        return serviceOfferingRepository.findAllById(ids).stream()
                .map((offering) -> {
                    ServiceOfferingDTO dto = serviceOfferingMapper.toServiceOfferingDTO(offering);
                    return dto;
                })
                .sorted(Comparator.comparing(ServiceOfferingDTO::getPrice))
                .toList();
    }

    public ServiceOffering createServiceOffering(ServiceOfferingDTO serviceOfferingDTO) {
        ServiceOffering serviceOffering = new ServiceOffering();
        serviceOffering.setName(serviceOfferingDTO.getName());
        serviceOffering.setDescription(serviceOfferingDTO.getDescription());
        serviceOffering.setImage(serviceOfferingDTO.getImage());
        serviceOffering.setPrice(serviceOfferingDTO.getPrice());
        serviceOffering.setDuration(serviceOfferingDTO.getDuration());

        return serviceOfferingRepository.save(serviceOffering);
    }

    public void updateServiceOffering(ServiceOfferingDTO serviceOfferingDTO) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findById(serviceOfferingDTO.getId())
                .orElseThrow(() -> new NotFoundException("Can't find service offering in database"));

        serviceOffering.setName(serviceOfferingDTO.getName());
        serviceOffering.setDescription(serviceOfferingDTO.getDescription());
        serviceOffering.setImage(serviceOfferingDTO.getImage());
        serviceOffering.setPrice(serviceOfferingDTO.getPrice());
        serviceOffering.setDuration(serviceOfferingDTO.getDuration());

        serviceOfferingRepository.save(serviceOffering);
    }

    public void deleteServiceOffering(UUID id) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Can't find service offering in database"));

        serviceOfferingRepository.delete(serviceOffering);
    }
}
