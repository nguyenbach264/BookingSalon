package demo.bookingsalon.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Cart;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.RoleApp;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.Request.Business.CreateUserRequest;
import demo.bookingsalon.Payload.Request.Business.UpdateUserRequest;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Payload.Response.Business.UserDetailSummaryResponse;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.Keycloak.RoleService;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final Keycloak keycloak;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final RoleService roleService;
    private final EmailOtpService emailOtpService;
    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
    private final BookingMapper bookingMapper;
    private final OrderService orderService;
    private final demo.bookingsalon.Storage.MediaStorageService mediaStorageService;
    private final demo.bookingsalon.Validation.MediaValidation mediaValidation;

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
        newUser.setEmailVerified(false);
        userRepository.save(newUser);

        return userMapper.toUserResponseByUser(newUser);
    }

    // 2. Tìm user theo id (hỗ trợ cả DB User ID và Keycloak ID)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            user = userRepository.findByKeycloakId(id);
        }
        if (user != null) {
            return userMapper.toUserResponseByUser(user);
        }
        try {
            UserRepresentation userRep = keycloak.realm(realm).users().get(id.toString()).toRepresentation();
            return userMapper.toUserResponseByUserRep(userRep);
        } catch (Exception ex) {
            throw new NotFoundException("Không tìm thấy người dùng với id: " + id);
        }
    }

    public User getUserEntityById(UUID id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            user = userRepository.findByKeycloakId(id);
        }
        return user;
    }

    public UserResponse getUserInDbById(UUID id) {
        User user = userRepository.findByKeycloakId(id);
        if (user == null) {
            user = userRepository.findById(id).orElse(null);
        }
        if (user == null) throw new NotFoundException("User in DB not exist");
        return userMapper.toUserResponseByUser(user);
    }

    // 2.1. Lấy chi tiết hồ sơ người dùng kèm toàn bộ lịch sử đặt lịch và đơn hàng từ DB
    @Transactional(readOnly = true)
    public UserDetailSummaryResponse getUserDetailSummary(UUID id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            user = userRepository.findByKeycloakId(id);
        }
        if (user == null) {
            throw new NotFoundException("Không tìm thấy thông tin khách hàng với ID: " + id);
        }

        UserResponse userResponse = userMapper.toUserResponseByUser(user);
        UUID dbUserId = user.getId();
        String phone = user.getPhoneNumber();
        String email = user.getEmail();

        // 1. Dịch vụ (Bookings) từ Database
        List<Booking> rawBookings = new ArrayList<>(bookingRepository.getBookingByUserId(dbUserId));
        Set<UUID> bookingIds = rawBookings.stream().map(Booking::getId).collect(Collectors.toSet());

        if (phone != null && !phone.isBlank()) {
            List<Booking> allBookings = bookingRepository.findAll();
            for (Booking b : allBookings) {
                if (!bookingIds.contains(b.getId())) {
                    if (phone.equals(b.getCustomerPhone()) || (email != null && email.equalsIgnoreCase(b.getCustomerEmail()))) {
                        rawBookings.add(b);
                        bookingIds.add(b.getId());
                    }
                }
            }
        }

        List<BookingResponse> bookingResponses = rawBookings.stream()
                .map(bookingMapper::toBookingResponse)
                .sorted(Comparator.comparing(
                        BookingResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ).thenComparing(
                        BookingResponse::getStartTime,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        BigDecimal totalBookingSpent = bookingResponses.stream()
                .filter(b -> b.getStatus() != null &&
                        (b.getStatus() == demo.bookingsalon.Enum.BookingStatus.COMPLETED ||
                         b.getStatus() == demo.bookingsalon.Enum.BookingStatus.CONFIRMED))
                .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Sản phẩm (Orders) từ Database
        List<Order> rawOrders = new ArrayList<>(orderRepository.findByUserIdOrderByCreatedAtDesc(dbUserId));
        Set<UUID> orderIds = rawOrders.stream().map(Order::getId).collect(Collectors.toSet());

        if (phone != null && !phone.isBlank()) {
            List<Order> allOrders = orderRepository.findAll();
            for (Order o : allOrders) {
                if (!orderIds.contains(o.getId())) {
                    if (phone.equals(o.getReceiverPhone())) {
                        rawOrders.add(o);
                        orderIds.add(o.getId());
                    }
                }
            }
        }

        List<OrderResponse> orderResponses = rawOrders.stream()
                .map(orderService::mapToOrderResponse)
                .sorted(Comparator.comparing(
                        OrderResponse::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        BigDecimal totalOrderSpent = orderResponses.stream()
                .filter(o -> o.getStatus() != null && o.getStatus() != demo.bookingsalon.Enum.OrderStatus.CANCELLED)
                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() :
                          (o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if ((userResponse.getCity() == null || userResponse.getCity().isBlank()) && !rawOrders.isEmpty()) {
            for (Order o : rawOrders) {
                if (o.getShippingAddress() != null && !o.getShippingAddress().isBlank()) {
                    String[] parts = o.getShippingAddress().split(",\\s*");
                    if (parts.length >= 3) {
                        if (userResponse.getCity() == null || userResponse.getCity().isBlank()) {
                            userResponse.setCity(parts[parts.length - 1].trim());
                        }
                        if (userResponse.getDistrict() == null || userResponse.getDistrict().isBlank()) {
                            userResponse.setDistrict(parts[parts.length - 2].trim());
                        }
                        if (userResponse.getWard() == null || userResponse.getWard().isBlank()) {
                            userResponse.setWard(parts[parts.length - 3].trim());
                        }
                        if (userResponse.getAddress() == null || userResponse.getAddress().isBlank()) {
                            userResponse.setAddress(String.join(", ", Arrays.copyOf(parts, parts.length - 3)).trim());
                        }
                        break;
                    }
                }
            }
        }

        return UserDetailSummaryResponse.builder()
                .user(userResponse)
                .bookings(bookingResponses)
                .orders(orderResponses)
                .totalBookings(bookingResponses.size())
                .totalBookingSpent(totalBookingSpent)
                .totalOrders(orderResponses.size())
                .totalOrderSpent(totalOrderSpent)
                .build();
    }

    // 3. Lấy danh sách toàn bộ user từ database (có đầy đủ thông tin hồ sơ chi tiết)
    public List<UserResponse> getUsers() {
        List<User> dbUsers = userRepository.findAll();

        // Đồng bộ các user từ Keycloak nếu chưa có trong DB
        try {
            List<UserRepresentation> kcUsers = keycloak.realm(realm).users().list();
            java.util.Set<UUID> existingKcIds = dbUsers.stream()
                    .map(User::getKeycloakId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());

            for (UserRepresentation kcUser : kcUsers) {
                try {
                    UUID kId = UUID.fromString(kcUser.getId());
                    if (!existingKcIds.contains(kId)) {
                        User existingByEmail = (kcUser.getEmail() != null && !kcUser.getEmail().isBlank())
                                ? userRepository.findByEmail(kcUser.getEmail()).orElse(null)
                                : null;
                        if (existingByEmail != null) {
                            existingByEmail.setKeycloakId(kId);
                            userRepository.save(existingByEmail);
                            existingKcIds.add(kId);
                        } else {
                            String fullName = ((kcUser.getLastName() != null ? kcUser.getLastName() + " " : "")
                                    + (kcUser.getFirstName() != null ? kcUser.getFirstName() : "")).trim();
                            if (fullName.isBlank()) fullName = kcUser.getUsername();
                            User u = User.builder()
                                    .keycloakId(kId)
                                    .username(kcUser.getUsername())
                                    .email(kcUser.getEmail())
                                    .fullName(fullName)
                                    .emailVerified(Boolean.TRUE.equals(kcUser.isEmailVerified()))
                                    .enabled(Boolean.TRUE.equals(kcUser.isEnabled()))
                                    .build();
                            Cart cart = Cart.builder().user(u).build();
                            u.setCart(cart);
                            User saved = userRepository.save(u);
                            dbUsers.add(saved);
                            existingKcIds.add(kId);
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Lỗi đồng bộ Keycloak user {}: {}", kcUser.getId(), ex.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("Không thể lấy danh sách user từ Keycloak để đồng bộ: {}", ex.getMessage());
        }

        return dbUsers.stream()
                .map(userMapper::toUserResponseByUser)
                .toList();
    }

    // 4. Xóa user (Chức năng admin)
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            user = userRepository.findByKeycloakId(userId);
        }
        UUID keycloakId = (user != null && user.getKeycloakId() != null) ? user.getKeycloakId() : userId;

        // Xóa user trong Keycloak
        try {
            keycloak.realm(realm).users().delete(keycloakId.toString());
        } catch (Exception ex) {
            log.warn("Không thể xóa user trong Keycloak: {}", ex.getMessage());
        }

        // Xóa user trong DB
        if (user != null) {
            userRepository.delete(user);
        }
    }

    // 5. Lấy danh sách user có phân trang (dùng cho Admin Dashboard)
    public List<UserResponse> getUsersByPagination(int first, int max, String search) {
        List<User> list = userRepository.findAll();
        if (search != null && !search.isBlank()) {
            String lower = search.toLowerCase();
            list = list.stream().filter(u ->
                    (u.getUsername() != null && u.getUsername().toLowerCase().contains(lower)) ||
                    (u.getFullName() != null && u.getFullName().toLowerCase().contains(lower)) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(lower)) ||
                    (u.getPhoneNumber() != null && u.getPhoneNumber().contains(lower))
            ).toList();
        }
        int fromIndex = Math.min(first, list.size());
        int toIndex = Math.min(first + max, list.size());
        return list.subList(fromIndex, toIndex).stream()
                .map(userMapper::toUserResponseByUser)
                .toList();
    }

    // 6. Reset Password
    public void resetPassword(UUID id, String newPassword) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            user = userRepository.findByKeycloakId(id);
        }
        UUID keycloakId = (user != null && user.getKeycloakId() != null) ? user.getKeycloakId() : id;

        CredentialRepresentation credentialRepresentation = new CredentialRepresentation();
        credentialRepresentation.setType(CredentialRepresentation.PASSWORD);
        credentialRepresentation.setValue(newPassword);
        credentialRepresentation.setTemporary(false);
        keycloak.realm(realm).users().get(keycloakId.toString()).resetPassword(credentialRepresentation);
    }

    // 7. Update user
    public void updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            user = userRepository.findByKeycloakId(id);
        }
        if (user == null) throw new NotFoundException("User in DB not exist");

        // Update user trong Keycloak
        if (user.getKeycloakId() != null) {
            try {
                UserRepresentation userRepresentation = keycloak.realm(realm).users().get(user.getKeycloakId().toString()).toRepresentation();
                if (userRepresentation != null) {
                    if (request.getEmail() != null && !request.getEmail().isBlank()) {
                        userRepresentation.setEmail(request.getEmail().trim());
                    }
                    if (request.getEnabled() != null) {
                        userRepresentation.setEnabled(request.getEnabled());
                    }
                    if (request.getFullName() != null && !request.getFullName().isBlank()) {
                        String[] name = request.getFullName().trim().split("\\s+");
                        userRepresentation.setFirstName(name[name.length - 1]);
                        if (name.length > 1) {
                            userRepresentation.setLastName(String.join(" ", Arrays.copyOf(name, name.length - 1)));
                        }
                    }
                    if (request.getEmailVerified() != null) {
                        userRepresentation.setEmailVerified(request.getEmailVerified());
                    }
                    keycloak.realm(realm).users().get(user.getKeycloakId().toString()).update(userRepresentation);
                }
            } catch (Exception ex) {
                log.warn("Không thể đồng bộ thay đổi user sang Keycloak: {}", ex.getMessage());
            }
        }

        // Update user trong DB
        if (request.getFullName() != null && !request.getFullName().isBlank())
            user.setFullName(request.getFullName().trim());
        if (request.getEmail() != null && !request.getEmail().isBlank())
            user.setEmail(request.getEmail().trim());
        if (request.getAddress() != null)
            user.setAddress(request.getAddress().trim());
        if (request.getPhoneNumber() != null)
            user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getGender() != null)
            user.setGender(request.getGender().trim());
        if (request.getCity() != null)
            user.setCity(request.getCity().trim());
        if (request.getDistrict() != null)
            user.setDistrict(request.getDistrict().trim());
        if (request.getWard() != null)
            user.setWard(request.getWard().trim());
        if (request.getMembershipTier() != null && !request.getMembershipTier().isBlank())
            user.setMembershipTier(request.getMembershipTier().trim());
        if (request.getEmailVerified() != null)
            user.setEmailVerified(request.getEmailVerified());
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank())
            user.setAvatarUrl(request.getAvatarUrl().trim());
        if (request.getEnabled() != null)
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

    // 9. Đồng bộ hoặc tạo mới user khi đăng nhập qua Google / OAuth2
    public User syncOrProvisionOAuth2User(UUID keycloakId, String email, String username, String fullName, String avatarUrl) {
        User user = userRepository.findByKeycloakId(keycloakId);
        if (user != null) {
            boolean changed = false;
            if (fullName != null && !fullName.isBlank() && !fullName.equals(user.getFullName())) {
                user.setFullName(fullName);
                changed = true;
            }
            if (avatarUrl != null && !avatarUrl.isBlank() && !avatarUrl.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(avatarUrl);
                changed = true;
            }
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
            return user;
        }

        // Kiểm tra theo email nếu đã tồn tại thì liên kết keycloakId
        if (email != null && !email.isBlank()) {
            User existingByEmail = userRepository.findAll().stream()
                    .filter(u -> email.equalsIgnoreCase(u.getEmail()))
                    .findFirst()
                    .orElse(null);
            if (existingByEmail != null) {
                existingByEmail.setKeycloakId(keycloakId);
                existingByEmail.setEmailVerified(true);
                if (fullName != null && !fullName.isBlank() && (existingByEmail.getFullName() == null || existingByEmail.getFullName().isBlank())) {
                    existingByEmail.setFullName(fullName);
                }
                if (avatarUrl != null && !avatarUrl.isBlank() && (existingByEmail.getAvatarUrl() == null || existingByEmail.getAvatarUrl().isBlank())) {
                    existingByEmail.setAvatarUrl(avatarUrl);
                }
                return userRepository.save(existingByEmail);
            }
        }

        // Tạo user mới trong DB
        String resolvedUsername = (username != null && !username.isBlank())
                ? username
                : (email != null ? email.split("@")[0] : "user_" + UUID.randomUUID().toString().substring(0, 8));

        if (userRepository.findByUsername(resolvedUsername).isPresent()) {
            resolvedUsername = resolvedUsername + "_" + UUID.randomUUID().toString().substring(0, 4);
        }

        User newUser = User.builder()
                .keycloakId(keycloakId)
                .username(resolvedUsername)
                .email(email)
                .fullName(fullName != null && !fullName.isBlank() ? fullName : resolvedUsername)
                .avatarUrl(avatarUrl)
                .emailVerified(true)
                .enabled(true)
                .build();

        Cart cart = Cart.builder()
                .user(newUser)
                .build();
        newUser.setCart(cart);

        User savedUser = userRepository.save(newUser);

        try {
            roleService.assignRealmRole(keycloakId, RoleApp.USER.name());
        } catch (Exception e) {
            log.warn("Could not assign default role to OAuth2 user {}: {}", keycloakId, e.getMessage());
        }

        return savedUser;
    }

    // 10. Lấy thông tin cá nhân của người dùng hiện tại
    public UserResponse getCurrentUserProfile(UUID keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId);
        if (user == null) {
            throw new NotFoundException("Không tìm thấy thông tin tài khoản!");
        }
        return userMapper.toUserResponseByUser(user);
    }

    // 11. Cập nhật hồ sơ cá nhân
    public UserResponse updateCurrentUserProfile(UUID keycloakId, UpdateUserRequest request) {
        User user = userRepository.findByKeycloakId(keycloakId);
        if (user == null) {
            throw new NotFoundException("Không tìm thấy thông tin tài khoản!");
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
            // Đồng bộ tên lên Keycloak
            try {
                UserRepresentation userRep = keycloak.realm(realm).users().get(keycloakId.toString()).toRepresentation();
                if (userRep != null) {
                    String[] name = request.getFullName().trim().split("\\s+");
                    userRep.setFirstName(name[name.length - 1]);
                    if (name.length > 1) {
                        userRep.setLastName(String.join(" ", Arrays.copyOf(name, name.length - 1)));
                    }
                    keycloak.realm(realm).users().get(keycloakId.toString()).update(userRep);
                }
            } catch (Exception ex) {
                log.warn("Could not sync name to Keycloak: {}", ex.getMessage());
            }
        }

        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getAddress() != null) user.setAddress(request.getAddress().trim());
        if (request.getGender() != null) user.setGender(request.getGender().trim());
        if (request.getCity() != null) user.setCity(request.getCity().trim());
        if (request.getDistrict() != null) user.setDistrict(request.getDistrict().trim());
        if (request.getWard() != null) user.setWard(request.getWard().trim());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl().trim());

        User saved = userRepository.save(user);
        return userMapper.toUserResponseByUser(saved);
    }

    // 12. Gửi mã OTP xác thực Email
    public void sendEmailVerificationOtp(UUID keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId);
        if (user == null) {
            throw new NotFoundException("Không tìm thấy tài khoản người dùng!");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Tài khoản chưa có địa chỉ email!");
        }
        if (user.isEmailVerified()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Email của bạn đã được xác thực trước đó!");
        }

        emailOtpService.generateAndSendOtp(user.getEmail(), user.getUsername() != null ? user.getUsername() : user.getFullName());
    }

    // 13. Xác thực mã OTP Email
    public boolean verifyUserEmail(UUID keycloakId, String otp) {
        User user = userRepository.findByKeycloakId(keycloakId);
        if (user == null) {
            throw new NotFoundException("Không tìm thấy tài khoản người dùng!");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Tài khoản chưa có địa chỉ email!");
        }

        boolean valid = emailOtpService.verifyOtp(user.getEmail(), otp);
        if (!valid) {
            return false;
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        // Đồng bộ trạng thái emailVerified lên Keycloak
        try {
            UserRepresentation userRep = keycloak.realm(realm).users().get(keycloakId.toString()).toRepresentation();
            if (userRep != null) {
                userRep.setEmailVerified(true);
                keycloak.realm(realm).users().get(keycloakId.toString()).update(userRep);
            }
        } catch (Exception ex) {
            log.warn("Could not sync emailVerified status to Keycloak: {}", ex.getMessage());
        }

        return true;
    }

    // 14. Tải lên và cập nhật ảnh đại diện người dùng
    public String uploadUserAvatar(UUID keycloakId, org.springframework.web.multipart.MultipartFile file) {
        mediaValidation.validate(file);
        User user = userRepository.findByKeycloakId(keycloakId);
        if (user == null) {
            throw new NotFoundException("Không tìm thấy thông tin tài khoản!");
        }

        var uploadResult = mediaStorageService.upload(file, "booking-salon/avatars/users/" + keycloakId);
        user.setAvatarUrl(uploadResult.secureUrl());
        userRepository.save(user);

        try {
            UserRepresentation userRep = keycloak.realm(realm).users().get(keycloakId.toString()).toRepresentation();
            if (userRep != null) {
                userRep.singleAttribute("avatarUrl", uploadResult.secureUrl());
                keycloak.realm(realm).users().get(keycloakId.toString()).update(userRep);
            }
        } catch (Exception ex) {
            log.warn("Could not sync avatarUrl to Keycloak: {}", ex.getMessage());
        }

        return uploadResult.secureUrl();
    }
}


