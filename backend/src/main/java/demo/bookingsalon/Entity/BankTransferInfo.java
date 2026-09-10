package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Data
@Table(name = "bank_transfer_info")
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransferInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "bank_transfer_infor_id")
    private UUID id;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_name")
    private String accountName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "active")
    private Boolean active;
}
