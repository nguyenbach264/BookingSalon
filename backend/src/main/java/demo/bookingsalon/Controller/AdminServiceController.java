package demo.bookingsalon.controller;

import demo.bookingsalon.dto.admin.AdminServiceRequest;
import demo.bookingsalon.dto.admin.CreateServiceSuspensionRequest;
import demo.bookingsalon.dto.admin.ServiceSuspensionResponse;
import demo.bookingsalon.dto.ServiceOfferingDTO;
import demo.bookingsalon.service.AdminServiceOfferingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/services")
@RequiredArgsConstructor
@Slf4j
public class AdminServiceController {

    private final AdminServiceOfferingService adminServiceOfferingService;

    @GetMapping
    public ResponseEntity<List<ServiceOfferingDTO>> getAllServices(
            @RequestParam(required = false) UUID salonId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminServiceOfferingService.getAllServices(salonId, categoryId, search));
    }

    @PostMapping
    public ResponseEntity<ServiceOfferingDTO> createService(@Valid @RequestBody AdminServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminServiceOfferingService.createService(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceOfferingDTO> updateService(
            @PathVariable UUID id,
            @Valid @RequestBody AdminServiceRequest request) {
        return ResponseEntity.ok(adminServiceOfferingService.updateService(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable UUID id) {
        adminServiceOfferingService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/suspensions")
    public ResponseEntity<List<ServiceSuspensionResponse>> createSuspension(
            @Valid @RequestBody CreateServiceSuspensionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminServiceOfferingService.createSuspensions(request));
    }

    @GetMapping("/suspensions")
    public ResponseEntity<List<ServiceSuspensionResponse>> getSuspensions(
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false) UUID salonId) {
        return ResponseEntity.ok(adminServiceOfferingService.getSuspensions(serviceId, salonId));
    }

    @PutMapping("/suspensions/{id}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateSuspension(@PathVariable UUID id) {
        adminServiceOfferingService.deactivateSuspension(id);
        return ResponseEntity.ok(Map.of("message", "Đã kích hoạt lại dịch vụ thành công"));
    }
}
