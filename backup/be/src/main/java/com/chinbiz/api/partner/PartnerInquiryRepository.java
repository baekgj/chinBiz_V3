package com.chinbiz.api.partner;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PartnerInquiryRepository extends JpaRepository<PartnerInquiry, Long> {
    List<PartnerInquiry> findAllByOrderByIdDesc();
    /** 상태별 건수 (대시보드 처리대기: status=NEW) */
    long countByStatus(String status);
}
