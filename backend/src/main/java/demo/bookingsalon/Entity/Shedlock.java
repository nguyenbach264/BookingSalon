package demo.bookingsalon.Entity;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Shedlock {
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "lock_until", nullable = false)
    private LocalDateTime lockUntil;

    @Column(name = "lock_at", nullable = false)
    private LocalDateTime lockAt;

    @Column(name = "lock_by", nullable = false)
    private String lockBy;
}
