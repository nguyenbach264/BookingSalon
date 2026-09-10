package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.ClientMapper;
import demo.bookingsalon.Payload.Request.Keycloak.CreateClientRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateClientRequest;
import demo.bookingsalon.Payload.Response.Keycloak.ClientResponse;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.ClientResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientService {
    private final Keycloak keycloak;
    private final ClientMapper clientMapper;

    @Value("${keycloak.realm}")
    private String realm;

    public ClientService(Keycloak keycloak, ClientMapper clientMapper) {
        this.keycloak = keycloak;
        this.clientMapper = clientMapper;
    }

    // Get ClientID by ClientName
    public String getUuidByClientId(String clientUUID) {
        List<ClientRepresentation> client = keycloak.realm(realm).clients().findByClientId(clientUUID);
        if (client.isEmpty()) throw new NotFoundException("Client not exists!");
        return client.get(0).getId();
    }

    // ---------- CREATE CLIENT ----------
    public ClientResponse createClient(CreateClientRequest request) {
        ClientRepresentation client = new ClientRepresentation();
        client.setClientId(request.getClientId());
        client.setName(request.getName());
        client.setDescription(request.getDescription());
        client.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        client.setPublicClient(request.getPublicClient() != null ? request.getPublicClient() : true);
        client.setRedirectUris(request.getRedirectUris());
        client.setWebOrigins(request.getWebOrigins());
        client.setProtocol(request.getProtocol() != null ? request.getProtocol() : "openid-connect");
        if (request.getAttributes() != null) {
            client.setAttributes(request.getAttributes());
        }

        Response response = keycloak.realm(realm).clients().create(client);
        if (response.getStatus() != 201) {
            String error = response.readEntity(String.class);
            throw new RuntimeException("Tạo client thất bại: " + error);
        }
        String location = response.getLocation().toString();
        String uuid = location.substring(location.lastIndexOf("/") + 1);
        return getClientByUuid(uuid);
    }

    // ---------- GET CLIENT BY UUID ----------
    public ClientResponse getClientByUuid(String uuid) {
        ClientRepresentation client = keycloak.realm(realm).clients().get(uuid).toRepresentation();
        return clientMapper.toClientResponse(client);
    }

    // ---------- GET CLIENT BY ClinetID ----------
    public ClientResponse getClientByClientId(String clientId) {
        String uuid = getUuidByClientId(clientId);

        ClientRepresentation client = keycloak.realm(realm).clients().get(uuid).toRepresentation();
        return clientMapper.toClientResponse(client);
    }

    // ---------- GET ALL CLIENTS ----------
    public List<ClientResponse> getClients() {
        List<ClientRepresentation> clients;
        clients = keycloak.realm(realm).clients().findAll();
        return clients.stream().map(
                item -> clientMapper.toClientResponse(item)
        ).collect(Collectors.toList());
    }

    // ---------- UPDATE CLIENT ----------
    public ClientResponse updateClient(String clientID, UpdateClientRequest request) {
        String uuid = getUuidByClientId(clientID);

        ClientResource clientResource = keycloak.realm(realm).clients().get(uuid);
        ClientRepresentation client = clientResource.toRepresentation();

        if (request.getName() != null) client.setName(request.getName());
        if (request.getDescription() != null) client.setDescription(request.getDescription());
        if (request.getEnabled() != null) client.setEnabled(request.getEnabled());
        if (request.getPublicClient() != null) client.setPublicClient(request.getPublicClient());
        if (request.getRedirectUris() != null) client.setRedirectUris(request.getRedirectUris());
        if (request.getWebOrigins() != null) client.setWebOrigins(request.getWebOrigins());
        if (request.getAttributes() != null) client.setAttributes(request.getAttributes());

        clientResource.update(client);
        return getClientByUuid(uuid);
    }

    // ---------- DELETE CLIENT ----------
    public void deleteClient(String clientID) {
        String uuid = getUuidByClientId(clientID);
        keycloak.realm(realm).clients().get(uuid).remove();
    }

    // ---------- GET CLIENT ROLES ----------
    public List<String> getClientRoles(String clientID) {
        String uuid = getUuidByClientId(clientID);
        return keycloak.realm(realm).clients().get(uuid).roles().list()
                .stream().map(RoleRepresentation::getName)
                .collect(Collectors.toList());
    }

    // ---------- CREATE CLIENT ROLE ----------
    public void createClientRole(String clientID, String roleName) {
        String uuid = getUuidByClientId(clientID);
        RoleRepresentation role = new RoleRepresentation();
        role.setName(roleName);
        keycloak.realm(realm).clients().get(uuid).roles().create(role);
    }

    // ---------- DELETE CLIENT ROLE ----------
    public void deleteClientRole(String clientID, String roleName) {
        String uuid = getUuidByClientId(clientID);
        keycloak.realm(realm).clients().get(uuid).roles().get(roleName).remove();
    }

    // ---------- MAPPER ----------
//    private ClientResponse mapToClientResponse(ClientRepresentation client) {
//        ClientResponse response = new ClientResponse();
//        response.setId(client.getId());
//        response.setClientId(client.getClientId());
//        response.setName(client.getName());
//        response.setDescription(client.getDescription());
//        response.setEnabled(client.isEnabled());
//        response.setPublicClient(client.isPublicClient());
//        response.setRedirectUris(client.getRedirectUris());
//        response.setWebOrigins(client.getWebOrigins());
//        response.setProtocol(client.getProtocol());
//        response.setAttributes(client.getAttributes());
//        return response;
//    }
}
