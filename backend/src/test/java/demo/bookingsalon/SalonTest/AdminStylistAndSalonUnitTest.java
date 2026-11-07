package demo.bookingsalon.SalonTest;

import demo.bookingsalon.Controller.AdminStylistController;
import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.Admin.AdminStylistResponse;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Service.AdminStylistService;
import demo.bookingsalon.Service.SalonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminStylistAndSalonUnitTest {

    @Mock
    private SalonRepository salonRepository;

    @Mock
    private StylistRepository stylistRepository;

    @Mock
    private AdminStylistService adminStylistService;

    @InjectMocks
    private SalonService salonService;

    @InjectMocks
    private AdminStylistController adminStylistController;

    private UUID salonId;
    private UUID stylistId;
    private Salon testSalon;
    private Stylist testStylist;

    @BeforeEach
    void setUp() {
        salonId = UUID.randomUUID();
        stylistId = UUID.randomUUID();

        testSalon = Salon.builder()
                .id(salonId)
                .salonName("BachBarber Cau Giay")
                .city("Ha Noi")
                .enabled(true)
                .build();

        testStylist = Stylist.builder()
                .id(stylistId)
                .fullName("Alex Bach")
                .salon(testSalon)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("TC-Salon-01: Admin cập nhật thông tin Salon và chuyển trạng thái Tạm ngưng hoạt động (enabled = false)")
    void testUpdateSalon_ToggleEnabled_ShouldSaveNewStatus() {
        SalonDTO dto = SalonDTO.builder()
                .id(salonId)
                .salonName("BachBarber Cau Giay")
                .city("Ha Noi")
                .enabled(false) // Tạm ngưng
                .build();

        when(salonRepository.findById(salonId)).thenReturn(Optional.of(testSalon));
        when(salonRepository.save(any(Salon.class))).thenAnswer(i -> i.getArgument(0));

        Salon updated = salonService.updateSalon(dto);

        assertNotNull(updated);
        assertFalse(updated.isEnabled(), "Salon phải được chuyển sang trạng thái tạm ngưng (false)");
        verify(salonRepository).save(testSalon);
    }

    @Test
    @DisplayName("TC-Salon-02: Gán thợ vào Salon qua AdminStylistController -> Thành công")
    void testAssignStylistToSalon_Controller_ShouldReturnSuccess() {
        AdminStylistResponse mockResponse = AdminStylistResponse.builder()
                .id(stylistId)
                .fullName("Alex Bach")
                .salonId(salonId)
                .salonName("BachBarber Cau Giay")
                .build();

        when(adminStylistService.assignStylistToSalon(stylistId, salonId)).thenReturn(mockResponse);

        ResponseEntity<AdminStylistResponse> response = adminStylistController.assignSalon(stylistId, Map.of("salonId", salonId));

        assertNotNull(response.getBody());
        assertEquals(salonId, response.getBody().getSalonId());
        verify(adminStylistService).assignStylistToSalon(stylistId, salonId);
    }

    @Test
    @DisplayName("TC-Salon-03: Gỡ thợ ra khỏi Salon (salonId = null) -> Thành công")
    void testRemoveStylistFromSalon_Controller_ShouldReturnSuccess() {
        AdminStylistResponse mockResponse = AdminStylistResponse.builder()
                .id(stylistId)
                .fullName("Alex Bach")
                .salonId(null)
                .salonName(null)
                .build();

        when(adminStylistService.removeStylistFromSalon(stylistId)).thenReturn(mockResponse);

        ResponseEntity<AdminStylistResponse> response = adminStylistController.assignSalon(stylistId, Collections.emptyMap());

        assertNotNull(response.getBody());
        assertNull(response.getBody().getSalonId(), "Stylist sau khi gỡ không còn thuộc salon nào");
        verify(adminStylistService).removeStylistFromSalon(stylistId);
    }

    @Test
    @DisplayName("TC-Salon-04: Cập nhật Salon không tồn tại -> Ném NotFoundException")
    void testUpdateSalon_NotFound_ShouldThrowException() {
        SalonDTO dto = SalonDTO.builder()
                .id(UUID.randomUUID())
                .salonName("Unknown")
                .build();

        when(salonRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> salonService.updateSalon(dto));
    }
}

