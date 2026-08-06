package com.chinbiz.api.terms;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TermAgreementRepository extends JpaRepository<TermAgreement, Long> {
    /** 이 회원이 해당 약관에 이미 동의했는가 (최초 로그인 판별) */
    boolean existsByLoginIdAndTermCode(String loginId, String termCode);
}
