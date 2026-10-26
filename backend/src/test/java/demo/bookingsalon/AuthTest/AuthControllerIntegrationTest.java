package demo.bookingsalon.AuthTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.AuthController;
import demo.bookingsalon.Payload.Request.Business.LoginRequest;
import demo.bookingsalon.Payload.Request.Business.SendOtpRequest;
import demo.bookingsalon.Payload.Request.Business.VerifyOtpRequest;
import demo.bookingsalon.Payload.Response.Business.AuthResponse;
import demo.bookingsalon.Service.AuthService;
import demo.bookingsalon.Service.BffSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Auth-01: POST /api/auth/login thành công trả về HTTP 200 và thông tin User")
    void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("Password123!");

        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(UUID.randomUUID())
                .keycloakId(UUID.randomUUID())
                .username("testuser")
                .email("testuser@example.com")
                .role("USER")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-access-token")
                .refreshToken("mock-refresh-token")
                .expiresIn(3600)
                .user(userInfo)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("testuser"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    @DisplayName("IT-Auth-02: POST /api/auth/register/send-otp thành công trả về HTTP 200 và message")
    void testSendRegisterOtp_Success() throws Exception {
        SendOtpRequest request = new SendOtpRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");

        doNothing().when(authService).sendRegistrationOtp(any(SendOtpRequest.class));

        mockMvc.perform(post("/api/auth/register/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("IT-Auth-03: POST /api/auth/register/verify-otp thành công trả về HTTP 200")
    void testVerifyOtpAndRegister_Success() throws Exception {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("Password123!");
        request.setOtp("123456");
        request.setPhoneNumber("0912345678");

        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(UUID.randomUUID())
                .username("newuser")
                .email("newuser@example.com")
                .role("USER")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock-token")
                .user(userInfo)
                .build();

        when(authService.verifyOtpAndRegister(any(VerifyOtpRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.username").value("newuser"));
    }
}
