package com.chinbiz.api.setting;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 환경설정 API (본사 [시스템설정]-[환경설정], MASTER_ADMIN).
 *  - GET /api/org/app-settings           : 전체 설정값 맵
 *  - PUT /api/org/app-settings           : {code: value, ...} 저장
 *  기본값 시더 포함(추천마일리지 500/500).
 */
@RestController
@RequestMapping("/api/org/app-settings")
public class AppSettingController {

    public static final String JOIN_CP_BUZZ = "join_cp_buzz";
    public static final String JOIN_CP_REFERRER = "join_cp_referrer";

    private final AppSettingRepository repo;

    public AppSettingController(AppSettingRepository repo) { this.repo = repo; }

    @GetMapping
    public Map<String, String> list() {
        Map<String, String> m = new LinkedHashMap<>();
        repo.findAll().forEach(s -> m.put(s.getCode(), s.getValue()));
        // 누락 키 기본값 채움
        m.putIfAbsent(JOIN_CP_BUZZ, "500");
        m.putIfAbsent(JOIN_CP_REFERRER, "500");
        return m;
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody Map<String, String> body) {
        if (body != null) body.forEach((k, v) -> { if (k != null && v != null) repo.put(k, v.trim()); });
        return ResponseEntity.ok(Map.of("message", "저장되었습니다."));
    }

    /** 기본값 시더 */
    @Component
    @Order(22)
    static class Seeder implements CommandLineRunner {
        private final AppSettingRepository repo;
        Seeder(AppSettingRepository repo) { this.repo = repo; }
        @Override public void run(String... args) {
            if (repo.findById(JOIN_CP_BUZZ).isEmpty()) repo.put(JOIN_CP_BUZZ, "500");
            if (repo.findById(JOIN_CP_REFERRER).isEmpty()) repo.put(JOIN_CP_REFERRER, "500");
        }
    }
}
