package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Payload.Admin.*;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Service.AdminStylistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/stylists")
@RequiredArgsConstructor
@Slf4j
public class AdminStylistController {

    private final AdminStylistService adminStylistService;

    @GetMapping
    public ResponseEntity<List<AdminStylistResponse>> getAllStylists(
            @RequestParam(required = false) UUID salonId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminStylistService.getAllStylists(salonId, status, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminStylistResponse> getStylistDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminStylistService.getStylistDetail(id));
    }

    @PostMapping("/promote")
    public ResponseEntity<AdminStylistResponse> promoteUserToStylist(
            @Valid @RequestBody PromoteUserToStylistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminStylistService.promoteUserToStylist(request));
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<Map<String, String>> terminateStylist(
            @PathVariable UUID id,
            @RequestBody(required = false) TerminateStylistRequest request) {
        TerminateStylistRequest req = (request != null) ? request : new TerminateStylistRequest();
        adminStylistService.terminateStylist(id, req);
        return ResponseEntity.ok(Map.of("message", "Cho stylist nghỉ việc thành công"));
    }

    @PostMapping("/{id}/services")
    public ResponseEntity<List<ServiceOfferingDTO>> assignServices(
            @PathVariable UUID id,
            @Valid @RequestBody AssignStylistServicesRequest request) {
        return ResponseEntity.ok(adminStylistService.assignServicesToStylist(id, request.getServiceIds()));
    }

    @DeleteMapping("/{id}/services/{serviceId}")
    public ResponseEntity<Void> removeService(
            @PathVariable UUID id,
            @PathVariable UUID serviceId) {
        adminStylistService.removeServiceFromStylist(id, serviceId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/salary-config")
    public ResponseEntity<AdminStylistResponse> updateSalaryConfig(
            @PathVariable UUID id,
            @Valid @RequestBody StylistSalaryConfigDTO dto) {
        return ResponseEntity.ok(adminStylistService.updateSalaryConfig(id, dto));
    }

    @GetMapping("/{id}/payroll")
    public ResponseEntity<StylistPayrollDTO> calculatePayroll(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(adminStylistService.calculatePayroll(id, startDate, endDate));
    }

    @GetMapping("/eligible-users")
    public ResponseEntity<List<User>> getEligibleUsersForPromotion(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminStylistService.getEligibleUsersForPromotion(search));
    }
}
