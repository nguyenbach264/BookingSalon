package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.OtpPolicyRequest;
import demo.bookingsalon.Payload.Response.Keycloak.CredentialResponse;
import demo.bookingsalon.Payload.Response.Keycloak.OtpStatusResponse;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.AuthenticationExecutionInfoRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OtpPolicyService {
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    public OtpPolicyService(Keycloak keycloak) {
        this.keycloak = keycloak;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. OTP POLICY
    // ═══════════════════════════════════════════════════════════════════

    public OtpPolicyRequest getOTPPolicy() {
        RealmRepresentation realmRep = keycloak.realm(realm).toRepresentation();
        Map<String, String> attributes = realmRep.getAttributes();
        OtpPolicyRequest policy = new OtpPolicyRequest();
        policy.setType(attributes.getOrDefault("otpPolicyType", "totp"));
        policy.setAlgorithm(attributes.getOrDefault("otpPolicyAlgorithm", "HmacSHA1"));
        policy.setDigits(Integer.parseInt(attributes.getOrDefault("otpPolicyDigits", "6")));
        policy.setPeriod(Integer.parseInt(attributes.getOrDefault("otpPolicyPeriod", "30")));
        policy.setInitialCounter(Integer.parseInt(attributes.getOrDefault("otpPolicyInitialCounter", "0")));
        policy.setShouldChangeOTP(Boolean.parseBoolean(attributes.getOrDefault("otpPolicyShouldChangeOTP", "false")));
        return policy;
    }

    public void updateOTPPolicy(OtpPolicyRequest request) {
        RealmRepresentation realmRep = keycloak.realm(realm).toRepresentation();
        Map<String, String> attributes = realmRep.getAttributes();
        if (attributes == null) {
            attributes = new HashMap<>();
        }
        attributes.put("otpPolicyType", request.getType());
        attributes.put("otpPolicyAlgorithm", request.getAlgorithm());
        attributes.put("otpPolicyDigits", String.valueOf(request.getDigits()));
        attributes.put("otpPolicyPeriod", String.valueOf(request.getPeriod()));
        attributes.put("otpPolicyInitialCounter", String.valueOf(request.getInitialCounter()));
        attributes.put("otpPolicyShouldChangeOTP", String.valueOf(request.getShouldChangeOTP()));
        realmRep.setAttributes(attributes);
        keycloak.realm(realm).update(realmRep);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. USER CREDENTIALS (OTP)
    // ═══════════════════════════════════════════════════════════════════

    public List<CredentialResponse> getUserCredentials(String userId) {
        List<CredentialRepresentation> credentials = keycloak.realm(realm)
                .users().get(userId).credentials();
        return credentials.stream().map(this::mapToCredentialResponse)
                .collect(Collectors.toList());
    }

    public void deleteUserCredential(String userId, String credentialId) {
        keycloak.realm(realm).users().get(userId).removeCredential(credentialId);
    }

    public String getOTPCredentialId(String userId) {
        List<CredentialRepresentation> credentials = keycloak.realm(realm)
                .users().get(userId).credentials();
        return credentials.stream()
                .filter(c -> "totp".equals(c.getType()) || "otp".equals(c.getType()))
                .map(CredentialRepresentation::getId)
                .findFirst()
                .orElse(null);
    }

    public boolean hasOTPConfigured(String userId) {
        return getOTPCredentialId(userId) != null;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. USER REQUIRED ACTIONS (CONFIGURE_TOTP)
    // ═══════════════════════════════════════════════════════════════════

    public void addRequiredActionToUser(String userId, String action) {
        UserResource userResource = keycloak.realm(realm).users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        List<String> actions = user.getRequiredActions();
        if (actions == null) {
            actions = new ArrayList<>();
        }
        if (!actions.contains(action)) {
            actions.add(action);
        }
        user.setRequiredActions(actions);
        userResource.update(user);
    }

    public void removeRequiredActionFromUser(String userId, String action) {
        UserResource userResource = keycloak.realm(realm).users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        List<String> actions = user.getRequiredActions();
        if (actions != null) {
            actions.remove(action);
            user.setRequiredActions(actions);
            userResource.update(user);
        }
    }

    public List<String> getUserRequiredActions(String userId) {
        UserRepresentation user = keycloak.realm(realm).users().get(userId).toRepresentation();
        return user.getRequiredActions() != null ? user.getRequiredActions() : new ArrayList<>();
    }

    public void enableOTPForUser(String userId) {
        addRequiredActionToUser(userId, "CONFIGURE_TOTP");
    }

    public void disableOTPForUser(String userId) {
        removeRequiredActionFromUser(userId, "CONFIGURE_TOTP");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. AUTHENTICATION FLOW OTP EXECUTION
    // ═══════════════════════════════════════════════════════════════════

    public String getOTPExecutionRequirement(String flowAlias) {
        List<AuthenticationExecutionInfoRepresentation> executions =
                keycloak.realm(realm).flows().getExecutions(flowAlias);
        return executions.stream()
                .filter(exec -> "auth-otp-form".equals(exec.getProviderId()))
                .map(AuthenticationExecutionInfoRepresentation::getRequirement)
                .findFirst()
                .orElse(null);
    }

    public void updateOTPExecutionRequirement(String flowAlias, String requirement) {
        List<AuthenticationExecutionInfoRepresentation> executions =
                keycloak.realm(realm).flows().getExecutions(flowAlias);
        AuthenticationExecutionInfoRepresentation otpExecution = executions.stream()
                .filter(exec -> "auth-otp-form".equals(exec.getProviderId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("OTP execution not found in flow: " + flowAlias));
        otpExecution.setRequirement(requirement);
        keycloak.realm(realm).flows().updateExecutions(flowAlias, otpExecution);
    }

    public void enableOTPRequired() {
        updateOTPExecutionRequirement("browser", "REQUIRED");
    }

    public void disableOTPRequired() {
        updateOTPExecutionRequirement("browser", "DISABLED");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. OTP STATUS (tổng hợp)
    // ═══════════════════════════════════════════════════════════════════

    public OtpStatusResponse getOTPStatus(String userId) {
        OtpStatusResponse response = new OtpStatusResponse();
        response.setEnabled(hasOTPConfigured(userId));
        response.setCredentialId(getOTPCredentialId(userId));

        // Kiểm tra user có required action CONFIGURE_TOTP không
        List<String> actions = getUserRequiredActions(userId);
        response.setUserRequiredAction(actions.contains("CONFIGURE_TOTP"));

        // Kiểm tra OTP có bắt buộc trong flow browser không
        String requirement = getOTPExecutionRequirement("browser");
        response.setRequired("REQUIRED".equals(requirement));

        return response;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private CredentialResponse mapToCredentialResponse(CredentialRepresentation cred) {
        CredentialResponse response = new CredentialResponse();
        response.setId(cred.getId());
        response.setType(cred.getType());
        response.setUserLabel(cred.getUserLabel());
        response.setCreatedDate(cred.getCreatedDate());
        response.setTemporary(cred.isTemporary());
        response.setCredentialData(cred.getCredentialData());
        return response;
    }
}
