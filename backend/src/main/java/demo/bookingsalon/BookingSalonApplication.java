package demo.bookingsalon;

import demo.bookingsalon.Utility.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@ComponentScan(basePackages = {
        "demo.bookingsalon",
        "demo.bookingsalon.Enum",
        "demo.bookingsalon.Configuration",
        "demo.bookingsalon.Controller"
})
@EnableScheduling
@EnableRetry
@EnableTransactionManagement
public class BookingSalonApplication {

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }

    public static void main(String[] args) {
        // Tự động nạp file .env vào System Properties trước khi Spring Boot khởi động
        DotenvLoader.load();

        SpringApplication.run(BookingSalonApplication.class, args);
    }

}