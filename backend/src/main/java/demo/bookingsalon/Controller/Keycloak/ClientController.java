package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.CreateClientRequest;
import demo.bookingsalon.Payload.Request.Keycloak.CreateRoleRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateClientRequest;
import demo.bookingsalon.Payload.Response.Keycloak.ClientResponse;
import demo.bookingsalon.Service.Keycloak.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {
    private final ClientService clientService;

    // ---------- 1. LIST CLIENTS ----------
    @GetMapping
    public ResponseEntity<List<ClientResponse>> listClients() {
        return ResponseEntity.ok(clientService.getClients());
    }

    // ---------- 2. GET CLIENT BY ClientID ----------
    @GetMapping("/{clientId}")
    public ResponseEntity<ClientResponse> getClient(@PathVariable String clientId) {
        return ResponseEntity.ok(clientService.getClientByClientId(clientId));
    }

    // ---------- 4. CREATE CLIENT ----------
    @PostMapping
    public ResponseEntity<ClientResponse> createClient(
            @RequestBody @Valid CreateClientRequest request) {
        ClientResponse created = clientService.createClient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ---------- 5. UPDATE CLIENT ----------
    @PutMapping("/{clientId}")
    public ResponseEntity<ClientResponse> updateClient(
            @PathVariable String clientId,
            @RequestBody @Valid UpdateClientRequest request) {
        return ResponseEntity.ok(clientService.updateClient(clientId, request));
    }

    // ---------- 6. DELETE CLIENT ----------
    @DeleteMapping("/{clientId}")
    public ResponseEntity<Void> deleteClient(@PathVariable String clientId) {
        clientService.deleteClient(clientId);
        return ResponseEntity.noContent().build();
    }

    // ---------- 7. GET CLIENT ROLES ----------
    @GetMapping("/{clientId}/roles")
    public ResponseEntity<List<String>> getClientRoles(@PathVariable String clientId) {
        return ResponseEntity.ok(clientService.getClientRoles(clientId));
    }

    // ---------- 8. CREATE CLIENT ROLE ----------
    @PostMapping("/{clientId}/roles")
    public ResponseEntity<Void> createClientRole(
            @PathVariable String clientId,
            @RequestBody CreateRoleRequest request) {
        clientService.createClientRole(clientId, request.getRoleName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ---------- 9. DELETE CLIENT ROLE ----------
    @DeleteMapping("/{clientId}/roles/{roleName}")
    public ResponseEntity<Void> deleteClientRole(
            @PathVariable String clientId,
            @PathVariable String roleName) {
        clientService.deleteClientRole(clientId, roleName);
        return ResponseEntity.noContent().build();
    }
}
