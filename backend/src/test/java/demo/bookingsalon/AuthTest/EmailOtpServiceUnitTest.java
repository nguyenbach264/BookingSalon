package demo.bookingsalon.AuthTest;

import demo.bookingsalon.Service.EmailOtpService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailOtpServiceUnitTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailOtpService emailOtpService;

    private final String testEmail = "bach.test@example.com";
    private final String testUsername = "bachtest";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailOtpService, "fromEmail", "test-salon@example.com");
    }

    @Test
    @DisplayName("UT-Auth-01: generateAndSendOtp gửi OTP thành công khi không vướng cooldown")
    void testGenerateAndSendOtp_Success() {
        when(redisTemplate.getExpire(contains("cooldown"))).thenReturn(-2L);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        assertDoesNotThrow(() -> emailOtpService.generateAndSendOtp(testEmail, testUsername));

        verify(valueOperations, times(2)).set(anyString(), anyString(), any(Duration.class));
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("UT-Auth-02: generateAndSendOtp ném TOO_MANY_REQUESTS khi cooldown còn hiệu lực")
    void testGenerateAndSendOtp_CooldownActive_ThrowsException() {
        when(redisTemplate.getExpire(contains("cooldown"))).thenReturn(45L);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                emailOtpService.generateAndSendOtp(testEmail, testUsername)
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
        assertTrue(exception.getReason().contains("45 giây"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("UT-Auth-03: verifyOtp trả về true và xoá key Redis khi OTP khớp")
    void testVerifyOtp_ValidOtp_ReturnsTrue() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:otp:code:" + testEmail.toLowerCase())).thenReturn("123456");

        boolean result = emailOtpService.verifyOtp(testEmail, "123456");

        assertTrue(result);
        verify(redisTemplate, times(1)).delete("auth:otp:code:" + testEmail.toLowerCase());
    }

    @Test
    @DisplayName("UT-Auth-04: verifyOtp trả về false khi OTP không khớp")
    void testVerifyOtp_InvalidOtp_ReturnsFalse() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:otp:code:" + testEmail.toLowerCase())).thenReturn("123456");

        boolean result = emailOtpService.verifyOtp(testEmail, "999999");

        assertFalse(result);
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    @DisplayName("UT-Auth-05: verifyOtp trả về false khi OTP đã hết hạn hoặc không tồn tại trong Redis")
    void testVerifyOtp_ExpiredOrMissing_ReturnsFalse() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:otp:code:" + testEmail.toLowerCase())).thenReturn(null);

        boolean result = emailOtpService.verifyOtp(testEmail, "123456");

        assertFalse(result);
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    @DisplayName("UT-Auth-06: generateAndSendForgotPasswordOtp thành công khi không vướng cooldown")
    void testGenerateAndSendForgotPasswordOtp_Success() {
        when(redisTemplate.getExpire(contains("forgot:cooldown"))).thenReturn(null);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        assertDoesNotThrow(() -> emailOtpService.generateAndSendForgotPasswordOtp(testEmail, testUsername));

        verify(valueOperations, times(2)).set(anyString(), anyString(), any(Duration.class));
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("UT-Auth-07: verifyForgotPasswordOtp trả về true và xoá key Redis khi OTP khớp")
    void testVerifyForgotPasswordOtp_Success() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:otp:forgot:" + testEmail.toLowerCase())).thenReturn("654321");

        boolean result = emailOtpService.verifyForgotPasswordOtp(testEmail, "654321");

        assertTrue(result);
        verify(redisTemplate, times(1)).delete("auth:otp:forgot:" + testEmail.toLowerCase());
    }
}

