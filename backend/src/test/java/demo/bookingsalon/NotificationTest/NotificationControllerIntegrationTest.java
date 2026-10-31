package demo.bookingsalon.NotificationTest;

import demo.bookingsalon.Controller.NotificationController;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import demo.bookingsalon.Service.BffSessionService;
import demo.bookingsalon.Service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
public class NotificationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Notification-01: GET /api/notifications/user/{id} trả về danh sách thông báo")
    void testGetNotificationsByUser_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        NotificationDTO dto = NotificationDTO.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title("Thông báo mới")
                .message("Nội dung thông báo")
                .build();

        when(notificationService.getAllNotificationsByUser(userId)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/notifications/user/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Thông báo mới"));
    }

    @Test
    @DisplayName("IT-Notification-02: GET /api/notifications/{id} trả về chi tiết thông báo")
    void testGetNotificationById_Success() throws Exception {
        UUID notificationId = UUID.randomUUID();
        NotificationDTO dto = NotificationDTO.builder()
                .id(notificationId)
                .title("Chi tiết")
                .message("Nội dung")
                .build();

        when(notificationService.getNotificationById(notificationId)).thenReturn(dto);

        mockMvc.perform(get("/api/notifications/{id}", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.title").value("Chi tiết"));
    }

    @Test
    @DisplayName("IT-Notification-03: PUT /api/notifications/{id}/read đánh dấu thông báo đã đọc")
    void testMarkAsRead_Success() throws Exception {
        UUID notificationId = UUID.randomUUID();
        NotificationDTO dto = NotificationDTO.builder()
                .id(notificationId)
                .isRead(true)
                .build();

        when(notificationService.markNotificationAsRead(notificationId)).thenReturn(dto);

        mockMvc.perform(put("/api/notifications/{id}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));
    }
}
