package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Payload.DTO.UserDTO;
import demo.bookingsalon.Payload.Request.Business.CreateUserRequest;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import org.keycloak.representations.idm.UserRepresentation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUserByUserDTO(UserDTO userDTO);

    User toUserByUserResponse(UserResponse userResponse);

    User toUserByCreateUserRequest(CreateUserRequest userRequest);

    User toUserByUserReponse(UserResponse userResponse);

    UserResponse toUserResponseByUser(User user);

    UserResponse toUserResponseByUserRep(UserRepresentation user);
}
