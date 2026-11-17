package demo.bookingsalon.dto.request.business;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuth2TokenRequest {

    @NotBlank(message = "Authorization code must not be blank!")
    private String code;

    @NotBlank(message = "Code verifier must not be blank!")
    private String codeVerifier;

    @NotBlank(message = "Redirect URI must not be blank!")
    private String redirectUri;
}