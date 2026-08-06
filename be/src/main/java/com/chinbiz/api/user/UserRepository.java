package com.chinbiz.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    boolean existsByUserId(String userId);
    Optional<User> findByUserId(String userId);
    List<User> findByRole(Role role);
    List<User> findBySalesCenterId(Long salesCenterId);
    /** 특정 센터(소속) 소속의 특정 역할 회원 — 공지 대상(버즈/센터/본부) 조회 */
    List<User> findByRoleAndSalesCenterId(Role role, Long salesCenterId);
    /** 나를 추천인으로 등록한 회원 (referral_code = 내 userId) */
    List<User> findByReferralCode(String referralCode);
}
