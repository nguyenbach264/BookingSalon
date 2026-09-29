package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Entity.ServiceSalonSuspension;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.ServiceOfferingMapper;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import demo.bookingsalon.Repository.ServiceSalonSuspensionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServiceOfferingService {
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ServiceOfferingMapper serviceOfferingMapper;
    private final ServiceSalonSuspensionRepository suspensionRepository;

    public List<ServiceOfferingDTO> getServiceOfferings() {
        return getServiceOfferings(null);
    }

    public List<ServiceOfferingDTO> getServiceOfferings(UUID salonId) {
        LocalDateTime now = LocalDateTime.now();
        return serviceOfferingRepository.findByDeletedAtIsNull().stream()
                .map(service -> {
                    ServiceOfferingDTO dto = serviceOfferingMapper.toServiceOfferingDTO(service);
                    UUID checkSalonId = (salonId != null) ? salonId : (service.getSalon() != null ? service.getSalon().getId() : null);
                    if (checkSalonId != null) {
                        List<ServiceSalonSuspension> activeSuspensions = suspensionRepository.findActiveSuspensionsAt(
                                service.getId(), checkSalonId, now);
                        if (!activeSuspensions.isEmpty()) {
                            dto.setIsSuspended(true);
                            dto.setSuspensionReason(activeSuspensions.get(0).getReason());
                        } else {
                            dto.setIsSuspended(false);
                        }
                    } else {
                        dto.setIsSuspended(false);
                    }
                    return dto;
                })
                .sorted(Comparator.comparing(ServiceOfferingDTO::getPrice))
                .toList();
    }

    public ServiceOfferingDTO getServiceOfferingById(UUID id) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new NotFoundException("Can't query service offering in database"));
        return serviceOfferingMapper.toServiceOfferingDTO(serviceOffering);
    }

    public List<ServiceOfferingDTO> getServiceOfferingByIds(Set<UUID> ids) {
        return serviceOfferingRepository.findAllById(ids).stream()
                .filter(s -> s.getDeletedAt() == null)
                .map(serviceOfferingMapper::toServiceOfferingDTO)
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
        ServiceOffering serviceOffering = serviceOfferingRepository.findByIdAndDeletedAtIsNull(serviceOfferingDTO.getId())
                .orElseThrow(() -> new NotFoundException("Can't find service offering in database"));

        serviceOffering.setName(serviceOfferingDTO.getName());
        serviceOffering.setDescription(serviceOfferingDTO.getDescription());
        serviceOffering.setImage(serviceOfferingDTO.getImage());
        serviceOffering.setPrice(serviceOfferingDTO.getPrice());
        serviceOffering.setDuration(serviceOfferingDTO.getDuration());

        serviceOfferingRepository.save(serviceOffering);
    }

    public void deleteServiceOffering(UUID id) {
        ServiceOffering serviceOffering = serviceOfferingRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new NotFoundException("Can't find service offering in database"));

        serviceOffering.setDeletedAt(LocalDateTime.now());
        serviceOfferingRepository.save(serviceOffering);
    }
}
