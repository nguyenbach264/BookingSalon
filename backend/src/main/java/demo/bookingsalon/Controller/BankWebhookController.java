package demo.bookingsalon.Controller;

import demo.bookingsalon.Strategy.BankTransferStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/webhooks/bank")
@RequiredArgsConstructor
public class BankWebhookController {

    private final BankTransferStrategy bankStrategy;

    @PostMapping("/callback")
    public ResponseEntity<String> callbackPost(@RequestBody Map<String, String> params) {
        log.info("Received bank POST callback with params: {}", params);
        try {
            bankStrategy.verifyCallback(params);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Bank POST callback processing failed", e);
            return ResponseEntity.ok("OK");
        }
    }

    @GetMapping("/callback")
    public ResponseEntity<String> callbackGet(@RequestParam Map<String, String> params) {
        log.info("Received bank GET callback with params: {}", params);
        try {
            bankStrategy.verifyCallback(params);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Bank GET callback processing failed", e);
            return ResponseEntity.ok("OK");
        }
    }
}