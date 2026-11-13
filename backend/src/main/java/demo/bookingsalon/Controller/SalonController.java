package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/salon", "/api/salons"})
@RequiredArgsConstructor
public class SalonController {
    private final SalonService salonService;

    @GetMapping()
    public ResponseEntity<List<SalonDTO>> getSalons() {
        return ResponseEntity.status(HttpStatus.OK).body(salonService.getSalons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSalonById(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(salonService.getSalonById(id));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<SalonDTO>> getSalonByCity(@PathVariable String city) {
        return ResponseEntity.status(HttpStatus.OK).body(salonService.getSalonByCity(city));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<SalonDTO>> getSalonByCityAndOpenTime(
            @RequestParam String city,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime openTime) {
        return ResponseEntity.status(HttpStatus.OK).body(salonService.getSalonByCityAndOpenTime(city, openTime));
    }

    @PostMapping()
    public ResponseEntity<?> createSalon(@RequestBody SalonDTO salonDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salonService.createSalon(salonDTO));
    }

    @PutMapping()
    public ResponseEntity<?> updateSalon(@RequestBody SalonDTO salonDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(salonService.updateSalon(salonDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSalon(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(salonService.deleteSalon(id));
    }
}

