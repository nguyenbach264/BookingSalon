package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Category;
import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Entity.ServiceSalonSuspension;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.Admin.AdminServiceRequest;
import demo.bookingsalon.Payload.Admin.CreateServiceSuspensionRequest;
import demo.bookingsalon.Payload.Admin.ServiceSuspensionResponse;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Repository.CategoryRepository;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import demo.bookingsalon.Repository.ServiceSalonSuspensionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceOfferingService {

    private final ServiceOfferingRepository serviceOfferingRepository;
    private final CategoryRepository categoryRepository;
    private final SalonRepository salonRepository;
    private final ServiceSalonSuspensionRepository suspensionRepository;

    @Transactional(readOnly = true)
    public List<ServiceOfferingDTO> getAllServices(UUID salonId, UUID categoryId, String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<ServiceOffering> services = serviceOfferingRepository.searchAdminServices(salonId, categoryId, cleanSearch);

        LocalDateTime now = LocalDateTime.now();

        return services.stream().map(s -> {
            ServiceOfferingDTO dto = mapToDTO(s);
            UUID checkSalonId = (salonId != null) ? salonId : (s.getSalon() != null ? s.getSalon().getId() : null);
            if (checkSalonId != null) {
                List<ServiceSalonSuspension> activeSuspensions = suspensionRepository.findActiveSuspensionsAt(
                        s.getId(), checkSalonId, now);
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
        }).collect(Collectors.toList());
    }

    @Transactional
    public ServiceOfferingDTO createService(AdminServiceRequest request) {
        Salon salon = salonRepository.findById(request.getSalonId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Salon với ID: " + request.getSalonId()));

        Category category = categoryRepository.findById(request.getCategoryId().toString())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Danh mục với ID: " + request.getCategoryId()));

        ServiceOffering service = ServiceOffering.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .duration(request.getDuration())
                .image(request.getImage() != null ? request.getImage() : "")
                .salon(salon)
                .category(category)
                .rating(5.0)
                .usageCount(0)
                .build();

        ServiceOffering saved = serviceOfferingRepository.save(service);
        return mapToDTO(saved);
    }

    @Transactional
    public ServiceOfferingDTO updateService(UUID serviceId, AdminServiceRequest request) {
        ServiceOffering service = serviceOfferingRepository.findByIdAndDeletedAtIsNull(serviceId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy dịch vụ với ID: " + serviceId));

        if (request.getSalonId() != null && (service.getSalon() == null || !service.getSalon().getId().equals(request.getSalonId()))) {
            Salon salon = salonRepository.findById(request.getSalonId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy Salon với ID: " + request.getSalonId()));
            service.setSalon(salon);
        }

        if (request.getCategoryId() != null && (service.getCategory() == null || !service.getCategory().getId().equals(request.getCategoryId()))) {
            Category category = categoryRepository.findById(request.getCategoryId().toString())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy Danh mục với ID: " + request.getCategoryId()));
            service.setCategory(category);
        }

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setDuration(request.getDuration());
        if (request.getImage() != null) {
            service.setImage(request.getImage());
        }

        ServiceOffering saved = serviceOfferingRepository.save(service);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteService(UUID serviceId) {
        ServiceOffering service = serviceOfferingRepository.findByIdAndDeletedAtIsNull(serviceId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy dịch vụ với ID: " + serviceId));

        service.setDeletedAt(LocalDateTime.now());
        serviceOfferingRepository.save(service);
    }

    @Transactional
    public List<ServiceSuspensionResponse> createSuspensions(CreateServiceSuspensionRequest request) {
        ServiceOffering service = serviceOfferingRepository.findByIdAndDeletedAtIsNull(request.getServiceOfferingId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy dịch vụ với ID: " + request.getServiceOfferingId()));

        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        List<ServiceSuspensionResponse> responses = new ArrayList<>();

        for (UUID salonId : request.getSalonIds()) {
            Salon salon = salonRepository.findById(salonId)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy Salon với ID: " + salonId));

            ServiceSalonSuspension suspension = ServiceSalonSuspension.builder()
                    .serviceOffering(service)
                    .salon(salon)
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .reason(request.getReason())
                    .isActive(true)
                    .build();

            ServiceSalonSuspension saved = suspensionRepository.save(suspension);

            responses.add(ServiceSuspensionResponse.builder()
                    .id(saved.getId())
                    .serviceOfferingId(service.getId())
                    .serviceOfferingName(service.getName())
                    .salonId(salon.getId())
                    .salonName(salon.getSalonName())
                    .startTime(saved.getStartTime())
                    .endTime(saved.getEndTime())
                    .reason(saved.getReason())
                    .isActive(saved.isActive())
                    .createdAt(saved.getCreatedAt())
                    .build());
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public List<ServiceSuspensionResponse> getSuspensions(UUID serviceId, UUID salonId) {
        List<ServiceSalonSuspension> list;
        if (serviceId != null) {
            list = suspensionRepository.findByServiceOfferingId(serviceId);
        } else if (salonId != null) {
            list = suspensionRepository.findBySalonId(salonId);
        } else {
            list = suspensionRepository.findAll();
        }

        return list.stream().map(s -> ServiceSuspensionResponse.builder()
                .id(s.getId())
                .serviceOfferingId(s.getServiceOffering() != null ? s.getServiceOffering().getId() : null)
                .serviceOfferingName(s.getServiceOffering() != null ? s.getServiceOffering().getName() : "")
                .salonId(s.getSalon() != null ? s.getSalon().getId() : null)
                .salonName(s.getSalon() != null ? s.getSalon().getSalonName() : "")
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .reason(s.getReason())
                .isActive(s.isActive())
                .createdAt(s.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public void deactivateSuspension(UUID suspensionId) {
        ServiceSalonSuspension suspension = suspensionRepository.findById(suspensionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi tạm dừng"));
        suspension.setActive(false);
        suspensionRepository.save(suspension);
    }

    private ServiceOfferingDTO mapToDTO(ServiceOffering s) {
        return ServiceOfferingDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .price(s.getPrice())
                .duration(s.getDuration())
                .image(s.getImage())
                .salonId(s.getSalon() != null && s.getSalon().getId() != null ? s.getSalon().getId().toString() : null)
                .categoryId(s.getCategory() != null && s.getCategory().getId() != null ? s.getCategory().getId().toString() : null)
                .build();
    }
}
