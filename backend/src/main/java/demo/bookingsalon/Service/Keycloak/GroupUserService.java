package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.Request.Keycloak.CreateGroupRequest;
import demo.bookingsalon.Payload.Request.Keycloak.UpdateGroupRequest;
import demo.bookingsalon.Payload.Response.Keycloak.GroupUserResponse;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.GroupResource;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupUserService {
    public final Keycloak keycloak;
    public final UserMapper userMapper;

    @Value("${keycloak.realm}")
    private String realm;

    public GroupUserService(Keycloak keycloak,
                            UserMapper userMapper) {
        this.keycloak = keycloak;
        this.userMapper = userMapper;
    }

    // ---------- CREATE GROUP ----------
    public GroupUserResponse createGroup(CreateGroupRequest request) {
        GroupRepresentation group = new GroupRepresentation();
        group.setName(request.getName());
        if (request.getAttributes() != null) {
            group.setAttributes(request.getAttributes());
        }

        Response response = keycloak.realm(realm).groups().add(group);
        if (response.getStatus() != 201) {
            String error = response.readEntity(String.class);
            throw new RuntimeException("Tạo group thất bại: " + error);
        }
        // Lấy ID từ Location header
        String location = response.getLocation().toString();
        String groupId = location.substring(location.lastIndexOf("/") + 1);
        return getGroupById(groupId);
    }

    // ---------- GET GROUP BY ID ----------
    public GroupUserResponse getGroupById(String groupId) {
        GroupRepresentation group = keycloak.realm(realm).groups().group(groupId).toRepresentation();
        return mapToGroupResponse(group);
    }

    // ---------- GET ALL GROUPS (có phân trang) ----------
    public List<GroupUserResponse> getGroupsByPagination(int first, int max, String search) {
        List<GroupRepresentation> groups;
        if (search != null && !search.isEmpty()) {
            groups = keycloak.realm(realm).groups().groups(search, first, max);
        } else {
            groups = keycloak.realm(realm).groups().groups(first, max);
        }
        return groups.stream().map(this::mapToGroupResponse).collect(Collectors.toList());
    }

    public List<GroupUserResponse> getGroups() {
        List<GroupRepresentation> roots =
                keycloak.realm(realm)
                        .groups()
                        .groups();

        return roots.stream()
                .map(root -> buildTree(root.getId()))
                .toList();
    }

    // ---------- UPDATE GROUP ----------
    public GroupUserResponse updateGroup(String groupId, UpdateGroupRequest request) {
        GroupResource groupResource = keycloak.realm(realm).groups().group(groupId);
        GroupRepresentation group = groupResource.toRepresentation();

        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getAttributes() != null) {
            group.setAttributes(request.getAttributes());
        }
        groupResource.update(group);
        return getGroupById(groupId);
    }

    // ---------- DELETE GROUP ----------
    public void deleteGroup(String groupId) {
        keycloak.realm(realm).groups().group(groupId).remove();
    }

    // ---------- GET MEMBERS OF GROUP ----------
    public List<UserResponse> getGroupMembers(String groupId, int first, int max) {
        List<UserRepresentation> members = keycloak.realm(realm)
                .groups().group(groupId).members(first, max);
        return members.stream().map(
                item -> userMapper.toUserResponseByUserRep(item)
                ).collect(Collectors.toList());
    }

    // ---------- ADD USER TO GROUP ----------
    public void addUserToGroup(String userId, String groupId) {
        keycloak.realm(realm).users().get(userId)
                .joinGroup(groupId);
    }

    // ---------- REMOVE USER FROM GROUP ----------
    public void removeUserFromGroup(String userId, String groupId) {
        keycloak.realm(realm).users().get(userId)
                .leaveGroup(groupId);
    }

    // ---------- GET GROUPS OF A USER ----------
    public List<GroupUserResponse> getUserGroups(String userId) {
        List<GroupRepresentation> groups = keycloak.realm(realm)
                .users().get(userId).groups();
        return groups.stream().map(this::mapToGroupResponse).collect(Collectors.toList());
    }

    // ---------- GET REALM ROLES OF A GROUP ----------
    public List<String> getGroupRealmRoles(String groupId) {
        return keycloak.realm(realm).groups().group(groupId)
                .roles().realmLevel().listAll()
                .stream().map(RoleRepresentation::getName)
                .collect(Collectors.toList());
    }

    // ---------- ADD REALM ROLE TO GROUP ----------
    public void addRealmRoleToGroup(String groupId, String roleName) {
        RoleRepresentation role = keycloak.realm(realm).roles().get(roleName).toRepresentation();
        keycloak.realm(realm).groups().group(groupId)
                .roles().realmLevel().add(Collections.singletonList(role));
    }

    // ---------- REMOVE REALM ROLE FROM GROUP ----------
    public void removeRealmRoleFromGroup(String groupId, String roleName) {
        RoleRepresentation role = keycloak.realm(realm).roles().get(roleName).toRepresentation();
        keycloak.realm(realm).groups().group(groupId)
                .roles().realmLevel().remove(Collections.singletonList(role));
    }

    // ---------- MAPPER: GroupRepresentation -> GroupResponse ----------
    private GroupUserResponse mapToGroupResponse(GroupRepresentation group) {
        GroupUserResponse response = new GroupUserResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setAttributes(group.getAttributes());
        return response;
    }

    private GroupUserResponse buildTree(String groupId) {
        GroupRepresentation group = keycloak.realm(realm)
                .groups()
                .group(groupId)
                .toRepresentation();

        GroupUserResponse response = mapToGroupResponse(group);

        List<GroupUserResponse> children = new ArrayList<>();

        List<GroupRepresentation> subGroups =
                keycloak.realm(realm)
                        .groups()
                        .group(groupId)
                        .getSubGroups(0, 1000, false);

        for (GroupRepresentation child : subGroups) {
            children.add(buildTree(child.getId()));
        }

        response.setChildren(children);

        return response;
    }

}
