package demo.bookingsalon.SalonTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc(addFilters = false)
public class CreateSalonTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Container
    @ServiceConnection
    private static MySQLContainer<?> mySQLContainer = new MySQLContainer<>("mysql:8.4");

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private SalonDTO salonDTO;

    @BeforeEach
    void setup() {
        salonDTO = SalonDTO.builder()
                .salonName("Test Salon")
                .address("123 Test Street")
                .phoneNumber("0901234567")
                .email("salon@test.com")
                .city("Ho Chi Minh")
                .openTime(LocalDateTime.now().withHour(8).withMinute(0))
                .closeTime(LocalDateTime.now().withHour(20).withMinute(0))
                .build();
    }

    @Test
    void testCreateSalon() throws Exception {
        mockMvc.perform(post("/api/salon")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(salonDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.salonName").value("Test Salon"));

    }
}
