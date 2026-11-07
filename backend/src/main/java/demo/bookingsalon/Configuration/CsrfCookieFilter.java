package demo.bookingsalon.Configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * CsrfCookieFilter nạp CsrfToken vào cookie response cho SPA client.
 * Spring Security 6 tải hoãn (deferred) CsrfToken theo mặc định;
 * gọi getToken() sẽ kích hoạt việc tạo token và ghi vào CookieCsrfTokenRepository.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // Render the token value to cause the cookie to be written to the response
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}

