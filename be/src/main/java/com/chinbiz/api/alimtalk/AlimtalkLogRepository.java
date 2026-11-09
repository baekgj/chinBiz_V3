package com.chinbiz.api.alimtalk;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** 알림톡 발송 이력 (Insert-Only) */
public interface AlimtalkLogRepository extends JpaRepository<AlimtalkLog, Long> {
    Page<AlimtalkLog> findAllByOrderByIdDesc(Pageable p);
}
