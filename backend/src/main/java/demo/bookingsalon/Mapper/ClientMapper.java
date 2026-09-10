package demo.bookingsalon.Mapper;

import demo.bookingsalon.Payload.Response.Keycloak.ClientResponse;
import org.keycloak.representations.idm.ClientRepresentation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ClientMapper {
    ClientResponse toClientResponse(ClientRepresentation clientRepresentation);
}
