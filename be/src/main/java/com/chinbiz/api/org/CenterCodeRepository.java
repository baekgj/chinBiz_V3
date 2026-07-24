package com.chinbiz.api.org;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CenterCodeRepository extends JpaRepository<CenterCode, Long> {
    // 본부 후보: center_code IS NULL
    List<CenterCode> findByCenterCodeIsNullOrderByIdxAsc();
    // 센터 후보: center_code IS NOT NULL AND head_code = ?
    List<CenterCode> findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(String headCode);
    // 본부(center_code IS NULL) — head_code 로 조회
    java.util.Optional<CenterCode> findFirstByHeadCodeAndCenterCodeIsNull(String headCode);
    long count();
}
