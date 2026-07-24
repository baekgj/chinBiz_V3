package com.chinbiz.api.partner;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PartnerRepository extends JpaRepository<Partner, Long> {
    boolean existsByPartnerId(String partnerId);
    Optional<Partner> findByPartnerId(String partnerId);
}
