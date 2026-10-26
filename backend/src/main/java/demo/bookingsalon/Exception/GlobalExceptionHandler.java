package demo.bookingsalon.Exception;

import demo.bookingsalon.Payload.Response.Business.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String error, String message) {
        return ResponseEntity.status(status).body(
                ErrorResponse.builder()
                        .timestamp(LocalDateTime.now())
                        .status(status.value())
                        .error(error)
                        .message(message)
                        .build()
        );
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> notFoundException(NotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler(InvalidClientException.class)
    public ResponseEntity<ErrorResponse> invalidClientException(InvalidClientException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Invalid Client", ex.getMessage());
    }

    @ExceptionHandler(InvalidRedirectUriException.class)
    public ResponseEntity<ErrorResponse> invalidRedirectUriException(InvalidRedirectUriException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Invalid Redirect URI", ex.getMessage());
    }

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ErrorResponse> handlePaymentException(PaymentException ex) {
        log.error("Payment error: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Payment Error", ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage());
    }

    @ExceptionHandler({IllegalStateException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBusinessLogicException(RuntimeException ex) {
        log.warn("Business logic validation error: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldError() != null
                ? exception.getBindingResult().getFieldError().getDefaultMessage()
                : "Validation failed";

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", message);
    }

    @ExceptionHandler(QrGenerateException.class)
    public ResponseEntity<ErrorResponse> qrGenerateException(QrGenerateException ex) {
        log.error("Failed to generate QR: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "QR Generate Error", ex.getMessage());
    }

    @ExceptionHandler(MediaValidationException.class)
    public ResponseEntity<ErrorResponse> handleMediaValidation(MediaValidationException ex) {
        log.warn("Media validation error: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Media Validation Error", ex.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        log.warn("Max upload size exceeded: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Max Upload Size Exceeded", "Dung lượng tệp tải lên vượt quá giới hạn cho phép!");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String message = ex.getReason();
        if (status == HttpStatus.UNAUTHORIZED) {
            message = "Tài khoản hoặc mật khẩu không đúng";
        } else if (message == null || message.isBlank()) {
            message = status.getReasonPhrase();
        }
        log.warn("ResponseStatusException [{}]: {}", status, message);
        return buildResponse(status, status.getReasonPhrase(), message);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.warn("Bad credentials error: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", "Tài khoản hoặc mật khẩu không đúng");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception exception) {
        log.error("Unhandled internal server error: ", exception);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên!"
        );
    }
}
