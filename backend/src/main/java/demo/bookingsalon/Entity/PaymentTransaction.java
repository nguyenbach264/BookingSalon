package demo.bookingsalon.Entity;

import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@AttributeOverride(name = "id", column = @Column(name = "payment_transaction_id"))
public class PaymentTransaction extends BaseEntity {

    @Column(name = "transaction_ref", nullable = false, unique = true)
    private String transactionRef; // Mã sinh ra gửi cho Gateway (VD: VNPAY txn_ref)

    @Column(name = "gateway_transaction_no")
    private String gatewayTransactionNo; // Mã Gateway trả về (VD: vnp_TransactionNo)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private PaymentStatus status;

    private BigDecimal amount;

    private String bankCode;

    @Column(name = "gateway_payload", columnDefinition = "TEXT")
    private String gatewayPayload; // Log raw payload để đối soát (Audit)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Payment payment;

    @Version
    private Integer version;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;
}

