package com.chinbiz.api.agree;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AgreeRepository extends JpaRepository<Agree, Long> {
    /** 동의구분 + 이름 + 연락처의 최신 기록 */
    Optional<Agree> findFirstByAgreeTypeAndNameAndPhoneOrderByIdDesc(String agreeType, String name, String phone);
}
