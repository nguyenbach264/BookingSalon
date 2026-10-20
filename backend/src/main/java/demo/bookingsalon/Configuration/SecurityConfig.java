package demo.bookingsalon.Configuration;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;

import demo.bookingsalon.Service.BffSessionService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final BffSessionService bffSessionService;
    private final demo.bookingsalon.Security.RateLimit.IpRateLimitingFilter ipRateLimitingFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();

        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        // Giữ nguyên thuộc tính tên token để CsrfCookieFilter có thể đọc được
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/api/payments/webhook/**",
                    "/api/v1/payments/webhook/**",
                    "/api/v1/payments/simulator/**",
                    "/webhooks/**",
                    "/api/auth/**",
                    "/ws/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**"
                )
            )
            .addFilterBefore(ipRateLimitingFilter, BasicAuthenticationFilter.class)
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation(sessionFixation -> sessionFixation.none())
            )
            .authorizeHttpRequests(auth -> auth
                // Endpoint công khai
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/oauth2/setup-google").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/auth/oauth2/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/auth/oauth2/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh-token").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payments/webhook/**", "/api/v1/payments/webhook/**", "/webhooks/**", "/api/v1/payments/simulator/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/webhooks/**", "/api/v1/payments/simulator/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/v1/payments/webhook/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/products", "/api/product-categories/**", "/api/product-categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/salons/**", "/api/salon/**", "/api/salon", "/api/salons").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/service-offerings/**", "/api/service-offering/**", "/api/service-offering", "/api/service-offerings").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**", "/api/category/**", "/api/category", "/api/categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stylists/**", "/api/stylists").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/booking/stylist/*/booked-slots", "/api/bookings/stylist/*/booked-slots").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/vouchers/available").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/vouchers/apply").permitAll()
                // Yêu cầu đăng nhập chung
                .requestMatchers(HttpMethod.GET,  "/api/auth/me").authenticated()
                .requestMatchers("/api/notifications/**", "/api/notifications").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/payments/**").authenticated()
                .requestMatchers(HttpMethod.GET,  "/api/payments/**").authenticated()
                // ORDERS - permit authenticated for users
                .requestMatchers(HttpMethod.GET,    "/api/orders/**", "/api/orders").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/orders/**", "/api/orders").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/orders/**", "/api/orders").authenticated()
                // BOOKINGS - permit authenticated for users, stylists, admins
                .requestMatchers(HttpMethod.GET,    "/api/booking/**", "/api/bookings/**", "/api/booking", "/api/bookings").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/booking/**", "/api/bookings/**", "/api/booking", "/api/bookings").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/booking/**", "/api/bookings/**", "/api/booking", "/api/bookings").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/booking/*/hard", "/api/bookings/*/hard").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/booking/**", "/api/bookings/**").authenticated()
                // USER PROFILE & VERIFICATION
                .requestMatchers("/api/users/me", "/api/users/me/**").authenticated()
                .requestMatchers(HttpMethod.GET,  "/api/cart/**").hasRole("USER")
                .requestMatchers(HttpMethod.POST, "/api/cart/**").hasRole("USER")
                .requestMatchers(HttpMethod.PUT,  "/api/cart/**").hasRole("USER")
                .requestMatchers(HttpMethod.DELETE, "/api/cart/**").hasRole("USER")
                .requestMatchers(HttpMethod.GET,  "/api/reviews", "/api/reviews/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reviews", "/api/reviews/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/reviews/**", "/api/reviews").hasRole("ADMIN")
                // STYLIST
                .requestMatchers("/api/stylist/**", "/api/stylist").hasRole("STYLIST")
                // ADMIN
                .requestMatchers("/api/admin/**", "/api/admin").hasRole("ADMIN")
                .requestMatchers("/api/vouchers/admin/**", "/api/vouchers/admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/users/**", "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/users/**", "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/users/**", "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**", "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/salons/**", "/api/salon/**", "/api/salons", "/api/salon").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/salons/**", "/api/salon/**", "/api/salons", "/api/salon").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/salons/**", "/api/salon/**", "/api/salons", "/api/salon").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/service-offerings/**", "/api/service-offering/**", "/api/service-offerings", "/api/service-offering").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/service-offerings/**", "/api/service-offering/**", "/api/service-offerings", "/api/service-offering").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/service-offerings/**", "/api/service-offering/**", "/api/service-offerings", "/api/service-offering").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/categories/**", "/api/category/**", "/api/categories", "/api/category").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/categories/**", "/api/category/**", "/api/categories", "/api/category").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**", "/api/category/**", "/api/categories", "/api/category").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/stylists/*/avatar", "/api/stylists/me/avatar").hasAnyRole("ADMIN", "STYLIST")
                .requestMatchers(HttpMethod.POST,   "/api/stylists/**", "/api/stylists").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/stylists/**", "/api/stylists").hasAnyRole("ADMIN", "STYLIST")
                .requestMatchers(HttpMethod.DELETE, "/api/stylists/**", "/api/stylists").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/media/**", "/api/media").hasAnyRole("ADMIN", "STYLIST")
                .requestMatchers(HttpMethod.DELETE, "/api/media/**", "/api/media").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(request -> {
                    // 1. Kiểm tra header Authorization trước (cho Swagger, Postman, external clients)
                    String header = request.getHeader("Authorization");
                    if (header != null && header.startsWith("Bearer ")) {
                        return header.substring(7);
                    }
                    // 2. BFF Pattern: Trích xuất Access Token hợp lệ từ Server-side HttpSession
                    String sessionToken = bffSessionService.resolveValidAccessToken(request);
                    if (sessionToken != null && !sessionToken.isBlank()) {
                        return sessionToken;
                    }
                    return null;
                })
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint((request, response, ex) -> {
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                        "status", 401,
                        "error", "Unauthorized",
                        "message", "Authentication required. Please login.",
                        "timestamp", Instant.now().toString()
                    )));
                })
            )
            .exceptionHandling(ex -> ex
                .accessDeniedHandler((request, response, denied) -> {
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                        "status", 403,
                        "error", "Forbidden",
                        "message", "You do not have permission to access this resource.",
                        "timestamp", Instant.now().toString()
                    )));
                })
            );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = new ArrayList<>(List.of(allowedOrigins.split(",")));
        if (!origins.contains("http://localhost")) origins.add("http://localhost");
        if (!origins.contains("http://localhost:80")) origins.add("http://localhost:80");
        if (!origins.contains("http://localhost:5173")) origins.add("http://localhost:5173");
        if (!origins.contains("http://127.0.0.1")) origins.add("http://127.0.0.1");
        if (!origins.contains("http://127.0.0.1:80")) origins.add("http://127.0.0.1:80");
        if (!origins.contains("http://127.0.0.1:5173")) origins.add("http://127.0.0.1:5173");
        if (!origins.contains("http://localhost:5174")) origins.add("http://localhost:5174");
        if (!origins.contains("http://127.0.0.1:5174")) origins.add("http://127.0.0.1:5174");
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}