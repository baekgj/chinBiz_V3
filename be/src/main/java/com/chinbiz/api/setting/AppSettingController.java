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
    public static final String JOIN_FALLBACK_REF = "join_fallback_ref";  // 추천인 미입력/미존재 시 CP 받을 대상 id
    public static final String JOIN_FALLBACK_DEFAULT = "dukebaek";

    // 관리비설정 (본사 [시스템설정]-[관리비설정]) — 매니저/센터 회비, 파트너 입점비 (원)
    public static final String[] FEE_KEYS = {
        "fee_manager_monthly", "fee_manager_yearly",
        "fee_center_monthly", "fee_center_yearly",
        "fee_partner_entry",
        // 회비/입점비 결제 시 상위 조직 수당 (%, 소수 허용) — 결제 공급가액 × % → allowance type=MEMBERSHIP, status=CP
        "fee_reward_manager_center_pct", "fee_reward_manager_division_pct",
        "fee_reward_center_division_pct",
        "fee_reward_partner_division_pct",
    };

    /** 본부/센터 장 중복등록 허용 여부 (Y=허용, N=불가) — [본부ᆞ센터 리스트] 상단 토글 */
    public static final String ORG_DUP_ALLOW = "org_dup_allow";

    private final AppSettingRepository repo;

    public AppSettingController(AppSettingRepository repo) { this.repo = repo; }

    @GetMapping
    public Map<String, String> list() {
        Map<String, String> m = new LinkedHashMap<>();
        repo.findAll().forEach(s -> m.put(s.getCode(), s.getValue()));
        // 누락 키 기본값 채움
        m.putIfAbsent(JOIN_CP_BUZZ, "500");
        m.putIfAbsent(JOIN_CP_REFERRER, "500");
        m.putIfAbsent(JOIN_FALLBACK_REF, JOIN_FALLBACK_DEFAULT);
        for (String k : FEE_KEYS) m.putIfAbsent(k, "0");   // 관리비 기본 0원
        m.putIfAbsent(ORG_DUP_ALLOW, "N");
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
            if (repo.findById(JOIN_FALLBACK_REF).isEmpty()) repo.put(JOIN_FALLBACK_REF, JOIN_FALLBACK_DEFAULT);
            for (String k : FEE_KEYS) if (repo.findById(k).isEmpty()) repo.put(k, "0");
            if (repo.findById(ORG_DUP_ALLOW).isEmpty()) repo.put(ORG_DUP_ALLOW, "N");
        }
    }
}
