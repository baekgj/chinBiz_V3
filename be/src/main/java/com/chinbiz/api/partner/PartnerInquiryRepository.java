package com.chinbiz.api.partner;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PartnerInquiryRepository extends JpaRepository<PartnerInquiry, Long> {
    List<PartnerInquiry> findAllByOrderByIdDesc();
}
