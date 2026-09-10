package demo.bookingsalon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableScheduling
@EnableRetry
@EnableTransactionManagement
public class BookingSalonApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingSalonApplication.class, args);
    }

}
