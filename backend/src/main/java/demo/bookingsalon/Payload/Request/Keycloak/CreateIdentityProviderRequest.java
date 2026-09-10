package demo.bookingsalon.Payload.Request.Keycloak;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class CreateIdentityProviderRequest {
    private String alias;          // Tên định danh duy nhất (vd: google, facebook)
    private String providerId;     // "oidc", "google", "facebook", "github", "ldap", "saml"
    private String displayName;    // Tên hiển thị trên màn hình login
    private Boolean enabled = true;
    private Boolean trustEmail = false;
    private Boolean storeToken = false;
    private Boolean addReadTokenRoleOnCreate = false;
    private Boolean authenticateByDefault = false;
    private Boolean linkOnly = false; // true/false
    private String firstBrokerLoginFlowAlias; // Alias của flow xử lý đăng nhập lần đầu
    private String postBrokerLoginFlowAlias;  // Alias của flow sau khi đăng nhập
    private Map<String, String> config = new HashMap<>(); // Cấu hình riêng cho từng provider
}
