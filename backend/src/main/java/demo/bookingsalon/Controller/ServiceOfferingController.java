package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Service.ServiceOfferingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-offering")
@RequiredArgsConstructor
public class ServiceOfferingController {
    private final ServiceOfferingService serviceOfferingService;

    @GetMapping()
    public ResponseEntity<?> getServiceOfferings() {
        return ResponseEntity.status(HttpStatus.OK).body(serviceOfferingService.getServiceOfferings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getServiceOfferingById(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(serviceOfferingService.getServiceOfferingById(id));
    }

//    @GetMapping("/salon/{id}")
//    public ResponseEntity<?> getServiceOfferingBySalonId(@PathVariable String id) {
//        return ResponseEntity.status(HttpStatus.OK).body(serviceOfferingService.getServiceOfferingBySalonId(id));
//    }

    @GetMapping("/salon/list/{ids}")
    public ResponseEntity<?> getServiceOfferingByIds(@RequestParam Set<UUID> ids) {
        return ResponseEntity.status(HttpStatus.OK).body(serviceOfferingService.getServiceOfferingByIds(ids));
    }

    @PostMapping()
    public ResponseEntity<?> createServiceOffering(@RequestBody @Valid ServiceOfferingDTO offeringDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceOfferingService.createServiceOffering(offeringDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateServiceOffering(@RequestBody ServiceOfferingDTO offeringDTO) {
        serviceOfferingService.updateServiceOffering(offeringDTO);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Update service offering successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteServiceOffering(@PathVariable UUID id) {
        serviceOfferingService.deleteServiceOffering(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Delete service offering successfully");
    }
}
