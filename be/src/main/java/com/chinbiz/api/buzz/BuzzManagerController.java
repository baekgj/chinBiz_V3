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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 매니저(관리매니저) 승급 신청 (docs/07). BUZZ 전용.
 *  - GET  /api/buzz/manager/status              : 내 매니저 신청 상태
 *  - GET  /api/buzz/manager/divisions           : 지역본부 목록 (center_code, center_code IS NULL)
 *  - GET  /api/buzz/manager/centers?divisionIdx : 해당 본부 산하 센터 목록
 *  - POST /api/buzz/manager/apply {divisionIdx, centerId}
 *        → user.manager_center_id=centerId, manager_sdate=오늘, manager_status='I'
 */
@RestController
@RequestMapping("/api/buzz/manager")
public class BuzzManagerController {

    private final UserRepository userRepository;
    private final CenterCodeRepository centerCodeRepository;

    public BuzzManagerController(UserRepository userRepository, CenterCodeRepository centerCodeRepository) {
        this.userRepository = userRepository;
        this.centerCodeRepository = centerCodeRepository;
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

    /** 내 매니저 신청 상태 */
    @GetMapping("/status")
    public ResponseEntity<?> status(Authentication auth) {
        User u = me(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role", u.getRole().name());
        m.put("managerStatus", u.getManagerStatus() == null ? "N" : u.getManagerStatus());
        m.put("managerCenterId", u.getManagerCenterId());
        m.put("managerCenterName", centerName(u.getManagerCenterId()));
        m.put("managerSdate", u.getManagerSdate());
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

    public record ApplyRequest(Long divisionIdx, Long centerId) {}

    /** 매니저 신청 접수 (status N → I) */
    @PostMapping("/apply")
    public ResponseEntity<?> apply(Authentication auth, @RequestBody ApplyRequest req) {
        User u = me(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (u.getRole() != Role.BUZZ)
            return ResponseEntity.badRequest().body(Map.of("message", "버즈회원만 매니저 신청이 가능합니다."));
        String st = u.getManagerStatus() == null ? "N" : u.getManagerStatus();
        if ("I".equals(st)) return ResponseEntity.badRequest().body(Map.of("message", "이미 매니저 신청이 접수되어 심사 중입니다."));
        if ("Y".equals(st)) return ResponseEntity.badRequest().body(Map.of("message", "이미 매니저로 승인되었습니다."));
        if (req.centerId() == null) return ResponseEntity.badRequest().body(Map.of("message", "센터를 선택해 주세요."));
        if (centerCodeRepository.findById(req.centerId()).isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "유효하지 않은 센터입니다."));

        u.setManagerCenterId(req.centerId());
        u.setManagerSdate(LocalDate.now().toString());
        u.setManagerStatus("I");
        userRepository.save(u);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "매니저 신청이 접수되었습니다. 승인까지 기다려 주세요.",
                "managerStatus", "I",
                "managerCenterId", u.getManagerCenterId(),
                "managerCenterName", centerName(u.getManagerCenterId()),
                "managerSdate", u.getManagerSdate()));
    }
}
