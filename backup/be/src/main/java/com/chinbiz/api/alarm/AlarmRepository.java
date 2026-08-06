package com.chinbiz.api.alarm;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlarmRepository extends JpaRepository<Alarm, Long> {
    List<Alarm> findByRecipientIdOrderByIdDesc(String recipientId);
    List<Alarm> findByProcessCodeOrderByIdDesc(String processCode);
    /** 미확인 알람 수 */
    long countByRecipientIdAndReadFlag(String recipientId, String readFlag);
    /** 내 미확인 알람 목록 (확인완료 처리용) */
    List<Alarm> findByRecipientIdAndReadFlag(String recipientId, String readFlag);
}
