package demo.bookingsalon;

import demo.bookingsalon.Utility.DotenvLoader;
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
        // Tự động nạp file .env vào System Properties trước khi Spring Boot khởi động
        DotenvLoader.load();

        SpringApplication.run(BookingSalonApplication.class, args);
    }

}