package demo.bookingsalon.Configuration;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.*;
import java.util.stream.Collectors;

public class KeycloakRoleConverter
        implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // 1. Trích xuất Realm Roles (chuẩn hoá chữ hoa và thêm tiền tố ROLE_)
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
            for (Object roleObj : roles) {
                if (roleObj != null) {
                    String role = roleObj.toString().trim().toUpperCase();
                    if (!role.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                    }
                }
            }
        }

        // 2. Trích xuất Client Roles từ resource_access (cho tất cả clients, ví dụ booking-salon-client, booking-salon-admin)
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object clientAccessObj : resourceAccess.values()) {
                if (clientAccessObj instanceof Map<?, ?> clientAccessMap) {
                    Object clientRolesObj = clientAccessMap.get("roles");
                    if (clientRolesObj instanceof Collection<?> clientRoles) {
                        for (Object roleObj : clientRoles) {
                            if (roleObj != null) {
                                String role = roleObj.toString().trim().toUpperCase();
                                if (!role.isBlank()) {
                                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                                }
                            }
                        }
                    }
                }
            }
        }

        return authorities;
    }
}