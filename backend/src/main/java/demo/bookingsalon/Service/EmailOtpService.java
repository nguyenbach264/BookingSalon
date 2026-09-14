package demo.bookingsalon.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailOtpService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:nguyenbachvt05@gmail.com}")
    private String fromEmail;

    private static final String OTP_PREFIX = "auth:otp:code:";
    private static final String COOLDOWN_PREFIX = "auth:otp:cooldown:";
    private static final String FORGOT_PREFIX = "auth:otp:forgot:";
    private static final String FORGOT_COOLDOWN_PREFIX = "auth:otp:forgot:cooldown:";
    private static final long OTP_TTL_SECONDS = 300; // 5 phút
    private static final long COOLDOWN_SECONDS = 60; // 60s cooldown

    /**
     * Tạo và gửi mã OTP đăng ký tới email kèm rate-limiting 60s
     */
    public void generateAndSendOtp(String email, String username) {
        String cooldownKey = COOLDOWN_PREFIX + email.toLowerCase();
        Long remainingCooldown = redisTemplate.getExpire(cooldownKey);

        if (remainingCooldown != null && remainingCooldown > 0) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Vui lòng đợi " + remainingCooldown + " giây trước khi gửi lại mã OTP!"
            );
        }

        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        String codeKey = OTP_PREFIX + email.toLowerCase();
        redisTemplate.opsForValue().set(codeKey, otp, Duration.ofSeconds(OTP_TTL_SECONDS));
        redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(COOLDOWN_SECONDS));

        sendHtmlEmail(email, username, otp, "Mã xác thực đăng ký tài khoản 30Shine",
                "Cảm ơn bạn đã đăng ký tài khoản tại <strong>30Shine Salon</strong>. Vui lòng sử dụng mã OTP dưới đây để xác thực địa chỉ email của bạn:");
        log.info("Registration OTP sent to {} successfully", email);
    }

    /**
     * Kiểm tra mã OTP đăng ký
     */
    public boolean verifyOtp(String email, String inputOtp) {
        String codeKey = OTP_PREFIX + email.toLowerCase();
        String storedOtp = redisTemplate.opsForValue().get(codeKey);

        if (storedOtp == null || !storedOtp.equals(inputOtp.trim())) {
            return false;
        }

        redisTemplate.delete(codeKey);
        return true;
    }

    /**
     * Tạo và gửi mã OTP quên mật khẩu tới email kèm rate-limiting 60s
     */
    public void generateAndSendForgotPasswordOtp(String email, String username) {
        String cooldownKey = FORGOT_COOLDOWN_PREFIX + email.toLowerCase();
        Long remainingCooldown = redisTemplate.getExpire(cooldownKey);

        if (remainingCooldown != null && remainingCooldown > 0) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Vui lòng đợi " + remainingCooldown + " giây trước khi gửi lại mã xác thực!"
            );
        }

        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        String codeKey = FORGOT_PREFIX + email.toLowerCase();
        redisTemplate.opsForValue().set(codeKey, otp, Duration.ofSeconds(OTP_TTL_SECONDS));
        redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(COOLDOWN_SECONDS));

        sendHtmlEmail(email, username, otp, "Mã xác thực khôi phục mật khẩu 30Shine",
                "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>30Shine Salon</strong> của bạn. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc thiết lập mật khẩu mới:");
        log.info("Forgot password OTP sent to {} successfully", email);
    }

    /**
     * Kiểm tra mã OTP quên mật khẩu
     */
    public boolean verifyForgotPasswordOtp(String email, String inputOtp) {
        String codeKey = FORGOT_PREFIX + email.toLowerCase();
        String storedOtp = redisTemplate.opsForValue().get(codeKey);

        if (storedOtp == null || !storedOtp.equals(inputOtp.trim())) {
            return false;
        }

        redisTemplate.delete(codeKey);
        return true;
    }

    /**
     * Gửi email HTML sang trọng
     */
    private void sendHtmlEmail(String toEmail, String username, String otp, String subject, String messageBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "30Shine Salon");
            helper.setTo(toEmail);
            helper.setSubject(subject);

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
                        .container { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
                        .header { background: #1b2a4a; padding: 28px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900; }
                        .content { padding: 32px 28px; color: #333333; line-height: 1.6; }
                        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
                        .otp-box { background: #f0f4fc; border: 2px dashed #244383; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
                        .otp-code { font-size: 34px; font-weight: 900; color: #1b2a4a; letter-spacing: 8px; font-family: 'Courier New', monospace; }
                        .expire-note { font-size: 13px; color: #e53e3e; font-weight: 600; margin-top: 8px; }
                        .footer { background: #f8fafc; padding: 18px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>30SHINE SALON</h1>
                        </div>
                        <div class="content">
                            <div class="greeting">Xin chào %s,</div>
                            <p>%s</p>
                            <div class="otp-box">
                                <div class="otp-code">%s</div>
                                <div class="expire-note">Mã xác thực có hiệu lực trong 5 phút</div>
                            </div>
                            <p style="font-size: 13px; color: #666666;">Nếu bạn không thực hiện yêu cầu này, tài khoản của bạn vẫn an toàn, vui lòng bỏ qua email. Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai vì lý do bảo mật.</p>
                        </div>
                        <div class="footer">
                            &copy; 2026 30Shine Salon. All rights reserved.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(username != null && !username.isBlank() ? username : "Quý khách", messageBody, otp);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send OTP email to {}", toEmail, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể gửi email OTP, vui lòng kiểm tra lại địa chỉ email!");
        }
    }
}