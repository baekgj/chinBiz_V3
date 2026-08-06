package com.chinbiz.api.buzz;

import com.chinbiz.api.org.CenterCode;
import com.chinbiz.api.org.CenterCodeRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 매니저(관리매니저) 승급 신청 (docs/07, docs/19 다중센터). BUZZ 전용.
 *  - 활동센터를 최대 3개까지 선택 → manager_center 테이블에 센터별 1행 저장(status I).
 *  - 승인은 각 센터(센터admin)가 개별 처리 → 해당 행 status Y.
 *  - user.manager_* 필드는 denormalized 대표값(승인/신청 대표센터)으로 동기화(공지/알람 라우팅 호환).
 */
@RestController
@RequestMapping("/api/buzz/manager")
public class BuzzManagerController {

    private static final int MAX_CENTERS = 3;

    private final UserRepository userRepository;
    private final CenterCodeRepository centerCodeRepository;
    private final ManagerCenterRepository managerCenterRepository;
    private final com.chinbiz.api.alarm.AlarmService alarmService;

    public BuzzManagerController(UserRepository userRepository, CenterCodeRepository centerCodeRepository,
                                 ManagerCenterRepository managerCenterRepository,
                                 com.chinbiz.api.alarm.AlarmService alarmService) {
        this.userRepository = userRepository;
        this.centerCodeRepository = centerCodeRepository;
        this.managerCenterRepository = managerCenterRepository;
        this.alarmService = alarmService;
    }

    private User me(Authentication auth) {
        if (auth == null) return null;
        return userRepository.findByUserId(auth.getName()).orElse(null);
    }

    private String centerName(Long idx) {
        if (idx == null) return null;
        return centerCodeRepository.findById(idx).map(CenterCode::displayName).orElse(null);
    }

    private Map<String, Object> code(CenterCode c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idx", c.getIdx());
        m.put("name", c.displayName());
        m.put("headName", c.getHeadName());
        m.put("centerName", c.getCenterName());
        return m;
    }

    /** 내 매니저 신청 상태 (manager_center 기준 종합 + 센터별 내역) */
    @GetMapping("/status")
    public ResponseEntity<?> status(Authentication auth) {
        User u = me(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        List<ManagerCenter> rows = managerCenterRepository.findByBuzzId(u.getId());
        boolean anyY = rows.stream().anyMatch(r -> "Y".equals(r.getStatus()));
        boolean anyI = rows.stream().anyMatch(r -> "I".equals(r.getStatus()));
        String overall = anyY ? "Y" : anyI ? "I" : "N";

        List<Map<String, Object>> centers = new ArrayList<>();
        Long primary = null;
        for (ManagerCenter r : rows) {
            if (primary == null && "Y".equals(r.getStatus())) primary = r.getCenterId();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("centerId", r.getCenterId());
            m.put("centerName", centerName(r.getCenterId()));
            m.put("status", r.getStatus());
            m.put("applyDate", r.getApplyDate() == null ? null : r.getApplyDate().toString());
            m.put("approveDate", r.getApproveDate() == null ? null : r.getApproveDate().toString());
            centers.add(m);
        }
        if (primary == null && !rows.isEmpty()) primary = rows.get(0).getCenterId();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role", u.getRole().name());
        m.put("managerStatus", overall);
        m.put("managerCenterId", primary);
        m.put("managerCenterName", centerName(primary));
        m.put("centers", centers);
        return ResponseEntity.ok(m);
    }

    /** 지역본부 목록 */
    @GetMapping("/divisions")
    public List<Map<String, Object>> divisions() {
        return centerCodeRepository.findByCenterCodeIsNullOrderByIdxAsc().stream().map(this::code).toList();
    }

    /** 선택한 본부 산하 센터 목록 */
    @GetMapping("/centers")
    public ResponseEntity<?> centers(@RequestParam Long divisionIdx) {
        CenterCode head = centerCodeRepository.findById(divisionIdx).orElse(null);
        if (head == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(centerCodeRepository
                .findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(head.getHeadCode())
                .stream().map(this::code).toList());
    }

    public record ApplyRequest(Long divisionIdx, List<Long> centerIds) {}

    /** 매니저 신청 접수 — 최대 3개 센터를 manager_center 에 저장(status I) */
    @PostMapping("/apply")
    public ResponseEntity<?> apply(Authentication auth, @RequestBody ApplyRequest req) {
        User u = me(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (u.getRole() != Role.BUZZ)
            return ResponseEntity.badRequest().body(Map.of("message", "버즈회원만 매니저 신청이 가능합니다."));
        if (managerCenterRepository.existsByBuzzIdAndStatus(u.getId(), "I"))
            return ResponseEntity.badRequest().body(Map.of("message", "이미 매니저 신청이 접수되어 심사 중입니다."));
        if (managerCenterRepository.existsByBuzzIdAndStatus(u.getId(), "Y"))
            return ResponseEntity.badRequest().body(Map.of("message", "이미 매니저로 승인되었습니다."));

        // 센터ID 검증 (1~3개, 중복 제거, 유효 센터)
        List<Long> ids = new ArrayList<>();
        if (req.centerIds() != null) for (Long id : req.centerIds()) if (id != null && !ids.contains(id)) ids.add(id);
        if (ids.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "활동 센터를 1개 이상 선택해 주세요."));
        if (ids.size() > MAX_CENTERS) return ResponseEntity.badRequest().body(Map.of("message", "활동 센터는 최대 " + MAX_CENTERS + "개까지 선택할 수 있습니다."));
        for (Long id : ids) if (centerCodeRepository.findById(id).isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "유효하지 않은 센터가 포함되어 있습니다."));

        LocalDate today = LocalDate.now();
        for (Long id : ids) managerCenterRepository.save(new ManagerCenter(u.getId(), id, today, "I"));

        // [매니저신청] 알람 (신청한 각 센터) — docs/16·19
        try { alarmService.fireManagerApply(u); } catch (Exception ignore) {}

        List<Map<String, Object>> centers = ids.stream().map(id -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("centerId", id); m.put("centerName", centerName(id)); return m;
        }).toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", ids.size() + "개 센터에 매니저 신청이 접수되었습니다. 승인까지 기다려 주세요.",
                "managerStatus", "I", "centers", centers, "managerSdate", today.toString()));
    }
}
