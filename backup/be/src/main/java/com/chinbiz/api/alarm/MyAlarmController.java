package com.chinbiz.api.alarm;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 내 알람 (로그인 사용자 공용) — admin 우측 상단 알람 벨. (docs/17)
 *  - GET  /api/my/alarms       : 미확인 수 + 알람 목록(최신순)
 *  - POST /api/my/alarms/read  : 미확인 알람 확인완료 처리(read_flag=Y, read_at=now)
 *  (/api/my/** = 인증 사용자 공용)
 */
@RestController
@RequestMapping("/api/my/alarms")
public class MyAlarmController {

    private final AlarmRepository repo;

    public MyAlarmController(AlarmRepository repo) { this.repo = repo; }

    private Map<String, Object> dto(Alarm a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("processCode", a.getProcessCode());
        m.put("message", a.getMessage());
        m.put("read", "Y".equals(a.getReadFlag()));
        m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt().toString());
        m.put("readAt", a.getReadAt() == null ? null : a.getReadAt().toString());
        return m;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        String me = auth.getName();
        long unread = repo.countByRecipientIdAndReadFlag(me, "N");
        List<Map<String, Object>> items = new ArrayList<>();
        for (Alarm a : repo.findByRecipientIdOrderByIdDesc(me)) {
            items.add(dto(a));
            if (items.size() >= 50) break; // 최근 50건
        }
        return ResponseEntity.ok(Map.of("unread", unread, "items", items));
    }

    /** 확인완료 처리 — 내 미확인 알람 전체를 읽음(read_at=now) */
    @PostMapping("/read")
    public ResponseEntity<?> read(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        String me = auth.getName();
        LocalDateTime now = LocalDateTime.now();
        List<Alarm> unread = repo.findByRecipientIdAndReadFlag(me, "N");
        for (Alarm a : unread) { a.setReadFlag("Y"); a.setReadAt(now); }
        repo.saveAll(unread);
        return ResponseEntity.ok(Map.of("read", unread.size(), "unread", 0));
    }
}
