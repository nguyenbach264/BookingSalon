package demo.bookingsalon.Exception;

public class InvalidRedirectUriException extends RuntimeException {
    public InvalidRedirectUriException(String message) {
        super(message);
    }
}
