package demo.bookingsalon.Controller;

import demo.bookingsalon.Strategy.BankTransferStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/webhooks/bank")
@RequiredArgsConstructor
public class BankWebhookController {

    private final BankTransferStrategy bankStrategy;

    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, String> params) {
        log.info("Received bank callback with params: {}", params);
        try {
            bankStrategy.verifyCallback(params);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Bank callback processing failed", e);
            return ResponseEntity.ok("OK");
        }
    }
}