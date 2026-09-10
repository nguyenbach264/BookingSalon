package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Data
@Table(name = "bank_transfer_info")
@Entity
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransferInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "bank_transfer_infor_id")
    private UUID id;
@AttributeOverride(name = "id", column = @Column(name = "bank_transfer_infor_id"))
public class BankTransferInfo extends BaseEntity {

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_name")
    private String accountName;

    @Column(name = "account_number")
    private String accountNumber;

    @Builder.Default
    @Column(name = "active")
    private Boolean active;
    private Boolean active = true;
}
