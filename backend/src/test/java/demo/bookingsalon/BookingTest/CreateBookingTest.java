package demo.bookingsalon.BookingTest;

import demo.bookingsalon.Repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

@ExtendWith(MockitoExtension.class)
@RequiredArgsConstructor
public class CreateBookingTest {
    @Mock
    private BookingRepository bookingRepository;


    @BeforeEach
    void setup() {
        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = LocalDateTime.now().plusMinutes(180);

    }

    @Test
    public void createBookingSuccessTest() {

    }
}
