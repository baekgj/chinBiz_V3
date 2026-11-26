package com.chinbiz.api.alimtalk;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** 알림톡 발송 이력 (Insert-Only) */
public interface AlimtalkLogRepository extends JpaRepository<AlimtalkLog, Long> {
    Page<AlimtalkLog> findAllByOrderByIdDesc(Pageable p);

    /** 이벤트·참조ID(발송 회원)별 기간 내 발송 건수 — 추천링크 일일 발송 제한 (docs/38) */
    long countByEventCodeAndRefIdAndCreatedAtGreaterThanEqual(String eventCode, Long refId, java.time.LocalDateTime from);
}
