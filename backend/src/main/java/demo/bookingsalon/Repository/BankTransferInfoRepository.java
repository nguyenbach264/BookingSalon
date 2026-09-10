package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.BankTransferInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BankTransferInfoRepository extends JpaRepository<BankTransferInfo, UUID> {

    Optional<BankTransferInfo> findFirstByActiveTrue();
}
