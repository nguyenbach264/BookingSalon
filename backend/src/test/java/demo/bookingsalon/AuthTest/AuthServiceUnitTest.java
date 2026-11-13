package demo.bookingsalon.AuthTest;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.Request.Business.SendOtpRequest;
import demo.bookingsalon.Payload.Request.Business.VerifyOtpRequest;
import demo.bookingsalon.Repository.AdminRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.AuthService;
import demo.bookingsalon.Service.EmailOtpService;
import demo.bookingsalon.Service.Keycloak.IdentityProviderService;
import demo.bookingsalon.Service.Keycloak.RoleService;
import demo.bookingsalon.Service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceUnitTest {

    @Mock
    private Keycloak keycloak;

    @Mock
    private RealmResource realmResource;

    @Mock
    private UsersResource usersResource;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RoleService roleService;

    @Mock
    private EmailOtpService emailOtpService;

    @Mock
    private UserService userService;

    @Mock
    private IdentityProviderService identityProviderService;

    @Mock
    private StylistRepository stylistRepository;

    @Mock
    private AdminRepository adminRepository;

    @InjectMocks
    private AuthService authService;

    private final String realmName = "bookingsalon";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "realm", realmName);
        ReflectionTestUtils.setField(authService, "clientId", "test-client");
    }

    private void mockKeycloakUsersResource() {
        when(keycloak.realm(realmName)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
    }

    @Test
    @DisplayName("UT-Auth-08: sendRegistrationOtp thành công khi username và email chưa tồn tại")
    void testSendRegistrationOtp_Success() {
        mockKeycloakUsersResource();
        SendOtpRequest request = new SendOtpRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");

        when(usersResource.search("newuser", true)).thenReturn(Collections.emptyList());
        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(usersResource.search(null, null, null, "newuser@example.com", 0, 1)).thenReturn(Collections.emptyList());
        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> authService.sendRegistrationOtp(request));

        verify(emailOtpService, times(1)).generateAndSendOtp("newuser@example.com", "newuser");
    }

    @Test
    @DisplayName("UT-Auth-09: sendRegistrationOtp ném CONFLICT khi username đã tồn tại trong Keycloak")
    void testSendRegistrationOtp_UsernameExists_ThrowsConflict() {
        mockKeycloakUsersResource();
        SendOtpRequest request = new SendOtpRequest();
        request.setUsername("existinguser");
        request.setEmail("test@example.com");

        when(usersResource.search("existinguser", true)).thenReturn(List.of(new UserRepresentation()));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.sendRegistrationOtp(request)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Tên đăng nhập đã được sử dụng"));
        verify(emailOtpService, never()).generateAndSendOtp(anyString(), anyString());
    }

    @Test
    @DisplayName("UT-Auth-10: sendRegistrationOtp ném CONFLICT khi email đã tồn tại trong Database")
    void testSendRegistrationOtp_EmailExistsInDb_ThrowsConflict() {
        mockKeycloakUsersResource();
        SendOtpRequest request = new SendOtpRequest();
        request.setUsername("newuser");
        request.setEmail("duplicate@example.com");

        when(usersResource.search("newuser", true)).thenReturn(Collections.emptyList());
        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(usersResource.search(null, null, null, "duplicate@example.com", 0, 1)).thenReturn(Collections.emptyList());

        User existingUser = new User();
        existingUser.setEmail("duplicate@example.com");
        when(userRepository.findAll()).thenReturn(List.of(existingUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.sendRegistrationOtp(request)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Email này đã được đăng ký"));
        verify(emailOtpService, never()).generateAndSendOtp(anyString(), anyString());
    }

    @Test
    @DisplayName("UT-Auth-11: verifyOtpAndRegister ném BAD_REQUEST khi mã OTP không hợp lệ")
    void testVerifyOtpAndRegister_InvalidOtp_ThrowsBadRequest() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("user@example.com");
        request.setOtp("000000");

        when(emailOtpService.verifyOtp("user@example.com", "000000")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.verifyOtpAndRegister(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Mã OTP không chính xác"));
    }
}

