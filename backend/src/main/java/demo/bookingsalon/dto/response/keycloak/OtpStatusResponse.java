package demo.bookingsalon.dto.response.keycloak;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OtpStatusResponse {
    private boolean enabled;          // user đã cấu hình OTP hay chưa
    private String credentialId;     // ID của credential OTP nếu có
    private boolean required;         // OTP có bắt buộc trong luồng xác thực không
    private boolean userRequiredAction; // user đang có required action CONFIGURE_TOTP không
}
