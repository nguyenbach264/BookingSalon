package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.RoleApp;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.Request.Business.CreateUserRequest;
import demo.bookingsalon.Payload.Request.Business.UpdateUserRequest;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.Keycloak.RoleService;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.usertype.UserVersionType;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final Keycloak keycloak;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final RoleService roleService;

    @Value("${keycloak.realm}")
    private String realm;

    // 0. Tìm user theo username
    public UserResponse getUserByUsername(String username) {
        List<UserRepresentation> users = keycloak.realm(realm).users().search(username, true);
        return users.isEmpty() ? null : userMapper.toUserResponseByUserRep(users.getFirst());
    }

    // 1. Tạo user mới
    public UserResponse createUser(CreateUserRequest userRequest) {
        if (getUserByUsername(userRequest.getUsername()) != null)
            throw new NotFoundException("User was existed!");

        // Thêm mới User vào Keycloak
        CredentialRepresentation credentialRepresentation = new CredentialRepresentation();
        credentialRepresentation.setType(CredentialRepresentation.PASSWORD);
        credentialRepresentation.setValue(userRequest.getPassword());
        credentialRepresentation.setTemporary(false);

        UserRepresentation user = new UserRepresentation();
        user.setUsername(userRequest.getUsername());
        user.setEmail(userRequest.getEmail());
        String[] name = userRequest.getFullName().trim().split("\\s+");
        user.setFirstName(name[name.length - 1]);
        if (name.length > 1) user.setLastName(String.join(" ", Arrays.copyOf(name, name.length - 1)));
        user.setEnabled(true);
        user.setEmailVerified(false);
        user.setCredentials(Collections.singletonList(
                credentialRepresentation
        ));

        Response response = keycloak.realm(realm).users().create(user);
        if (response.getStatus() != 201) {
            String body = "";
            try {
                body = response.readEntity(String.class);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            throw new RuntimeException("Status = " + response.getStatus() + ", Body = " + body);
        }

        String userId = CreatedResponseUtil.getCreatedId(response);

        // Gán role cho user
        roleService.assignRealmRole(UUID.fromString(userId), RoleApp.USER.name());

        // Thêm mới User vào DB
        User newUser = userMapper.toUserByCreateUserRequest(userRequest);
        newUser.setKeycloakId(UUID.fromString(userId));
        userRepository.save(newUser);

        return userMapper.toUserResponseByUser(newUser);
    }

    // 2. Tìm user theo id
    public UserResponse getUserById(UUID id) {
        UserRepresentation user = keycloak.realm(realm).users().get(id.toString()).toRepresentation();
        return userMapper.toUserResponseByUserRep(user);
    }

    public UserResponse getUserInDbById(UUID id) {
        User user = userRepository.findByKeycloakId(id);
        if (user == null) throw new NotFoundException("User in DB not exist");
        return userMapper.toUserResponseByUser(userRepository.findByKeycloakId(id));
    }

    public List<UserResponse> getUsers() {
        List<UserRepresentation> list = keycloak.realm(realm).users().list();
        return list.stream()
                .map(userMapper::toUserResponseByUserRep)
                .toList();
    }

    // 4. Xóa user (Chức năng admin)
    public void deleteUser(UUID userId) {
        UserRepresentation userRepresentation = keycloak.realm(realm).users().get(userId.toString()).toRepresentation();
        if (userRepresentation == null) throw new NotFoundException("User in Keycloak not exist");

        // Xóa user trong Keycloak
        keycloak.realm(realm).users().delete(userId.toString());

        // Xóa user trong DB
        User user = userRepository.findByKeycloakId(UUID.fromString(userId.toString()));
        if (user == null) throw new NotFoundException("User in DB not exist");
        userRepository.delete(user);
    }

    // 5. Lấy danh sách user có phân trang (dùng cho Admin Dashboard)
    public List<UserResponse> getUsersByPagination(int first, int max, String search) {
        List<UserRepresentation> users;
        if (search != null && !search.isEmpty()) {
            users = keycloak.realm(realm).users().search(search, first, max);
        } else {
            users = keycloak.realm(realm).users().list(first, max);
        }
        return users.stream().map(item -> userMapper.toUserResponseByUserRep(item)).toList();
    }

    // 6. Reset Password
    public void resetPassword(UUID id, String newPassword) {
        CredentialRepresentation credentialRepresentation = new CredentialRepresentation();
        credentialRepresentation.setType(CredentialRepresentation.PASSWORD);
        credentialRepresentation.setValue(newPassword);
        credentialRepresentation.setTemporary(false);
        keycloak.realm(realm).users().get(id.toString()).resetPassword(credentialRepresentation);
    }

    // 7. Update user
    public void updateUser(UUID id, UpdateUserRequest request) {
        // Update user trong Keycloak
        UserRepresentation userRepresentation = keycloak.realm(realm).users().get(id.toString()).toRepresentation();
        if (userRepresentation == null) throw new NotFoundException("User in Keycloak not exist");
        userRepresentation.setEmail(request.getEmail() );
        userRepresentation.setEnabled(request.getEnabled());
        String[] name = request.getFullName().trim().split("\\s+");
        userRepresentation.setFirstName(name[name.length - 1]);
        if (name.length > 1) userRepresentation.setLastName(String.join(" ", Arrays.copyOf(name, name.length - 1)));
        keycloak.realm(realm).users().get(id.toString()).update(userRepresentation);

        // Update user trong DB
        User user = userRepository.findByKeycloakId(UUID.fromString(userRepresentation.getId()));
        if (user == null) throw new NotFoundException("User in DB not exist");

        if (request.getFullName() != null && !request.getFullName().isEmpty())
            user.setFullName(request.getFullName());
        if (request.getEmail() != null && !request.getEmail().isEmpty())
            user.setEmail(request.getEmail());
        if (request.getAddress() != null && !request.getAddress().isEmpty())
            user.setAddress(request.getAddress());
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty())
            user.setPhoneNumber(request.getPhoneNumber());
        user.setEnabled(request.getEnabled());
        userRepository.save(user);
    }

    // 8. Lấy toàn bộ user từ keycloak rồi fill vào DB
    public String reverseUser() {
        List<UserResponse> users = getUsers();
        List<User> userDB = users.stream().map(
                item -> {
                    User user = new User();
                    user.setKeycloakId(item.getId());
                    user.setUsername(item.getUsername() );
                    user.setFullName(item.getFullName() );
                    user.setEmail(item.getEmail() );
                    user.setPhoneNumber(item.getPhoneNumber() );
                    user.setAddress(item.getAddress() );
                    user.setEnabled(item.isEnabled() );
                    return user;
                }
        ).toList();
        System.out.println(userDB);
        try {
            userRepository.saveAll(userDB);
            System.out.println("Save successfully!!!");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "Reverse succesfully";
    }

}


