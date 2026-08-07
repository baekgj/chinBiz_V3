package com.chinbiz.api.rbac;

import com.chinbiz.api.common.AccountValidation;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 본사 어드민 RBAC 담당자 지정 (docs/20 Task4). 슈퍼 관리자(=미지정 MASTER_ADMIN)만 사용.
 *  - GET  /api/rbac/admin-scopes           : MASTER_ADMIN 사용자별 담당영역 목록
 *  - POST /api/rbac/admin-scopes/register  : 담당자(MASTER_ADMIN) 신규 등록 body {userId,password,name,email,phone,areas?}
 *  - PUT  /api/rbac/admin-scopes/{userId}  : 담당영역 지정/변경 body {areas:["A","C"]} (빈 배열=삭제=슈퍼)
 *  - DELETE /api/rbac/admin-scopes/{userId}: 지정 삭제(슈퍼로 복귀)
 */
@RestController
@RequestMapping("/api/rbac/admin-scopes")
public class AdminScopeController {

    private static final Set<String> VALID = Set.of("A", "B", "C", "D");

    private final AdminScopeRepository scopeRepo;
    private final UserRepository userRepo;
    private final PartnerRepository partnerRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminScopeController(AdminScopeRepository scopeRepo, UserRepository userRepo,
                                PartnerRepository partnerRepo, PasswordEncoder passwordEncoder) {
        this.scopeRepo = scopeRepo;
        this.userRepo = userRepo;
        this.partnerRepo = partnerRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /** CSV → 정렬된 영역 리스트 */
    public static List<String> parse(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        List<String> out = new ArrayList<>();
        for (String p : csv.split(",")) {
            String v = p.trim().toUpperCase();
            if (VALID.contains(v) && !out.contains(v)) out.add(v);
        }
        Collections.sort(out);
        return out;
    }

    /** 특정 로그인ID의 담당영역(없으면 빈 리스트=슈퍼) */
    public List<String> areasOf(String loginId) {
        return scopeRepo.findById(loginId).map(s -> parse(s.getAreas())).orElse(List.of());
    }

    /** 슈퍼 관리자(=담당영역 미지정 MASTER_ADMIN)만 RBAC 관리 가능. 아니면 403. */
    private ResponseEntity<?> requireSuper(Authentication auth) {
        if (auth == null || auth.getName() == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증이 필요합니다."));
        User me = userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null || me.getRole() != Role.MASTER_ADMIN || !areasOf(me.getUserId()).isEmpty())
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "담당자 지정은 슈퍼 관리자만 변경할 수 있습니다."));
        return null;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        ResponseEntity<?> deny = requireSuper(auth);
        if (deny != null) return deny;
        List<Map<String, Object>> rows = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            if (u.getRole() != Role.MASTER_ADMIN) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", u.getUserId());
            m.put("name", u.getName());
            m.put("areas", areasOf(u.getUserId()));
            m.put("status", normStatus(u.getStatus()));
            rows.add(m);
        }
        rows.sort((a, b) -> String.valueOf(a.get("userId")).compareTo(String.valueOf(b.get("userId"))));
        return ResponseEntity.ok(Map.of("content", rows));
    }

    /** body.areas → 유효 영역(A~D) 정렬 리스트 */
    private static List<String> parseAreas(Object raw) {
        List<String> areas = new ArrayList<>();
        if (raw instanceof List<?> l)
            for (Object o : l) {
                String v = String.valueOf(o).trim().toUpperCase();
                if (VALID.contains(v) && !areas.contains(v)) areas.add(v);
            }
        Collections.sort(areas);
        return areas;
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : String.valueOf(v).trim();
    }

    /** null/blank/기타 → ACTIVE, "STOP"만 STOP */
    private static String normStatus(String s) {
        return "STOP".equalsIgnoreCase(s == null ? null : s.trim()) ? "STOP" : "ACTIVE";
    }

    /** 담당자 운영 상태 변경 — 슈퍼 관리자만. ACTIVE=운영 / STOP=중지. 본인 중지 불가. */
    @PutMapping("/{userId}/status")
    @Transactional
    public ResponseEntity<?> setStatus(@PathVariable String userId, @RequestBody Map<String, Object> body, Authentication auth) {
        ResponseEntity<?> deny = requireSuper(auth);
        if (deny != null) return deny;
        User u = userRepo.findByUserId(userId).orElse(null);
        if (u == null || u.getRole() != Role.MASTER_ADMIN)
            return ResponseEntity.badRequest().body(Map.of("message", "MASTER_ADMIN 담당자만 상태를 변경할 수 있습니다."));
        String status = normStatus(str(body, "status"));
        if ("STOP".equals(status) && userId.equals(auth.getName()))
            return ResponseEntity.badRequest().body(Map.of("message", "본인 계정은 중지할 수 없습니다."));
        u.setStatus(status);
        userRepo.save(u);
        return ResponseEntity.ok(Map.of("userId", userId, "status", status,
                "message", "STOP".equals(status) ? "담당자를 중지했습니다." : "담당자를 운영 상태로 변경했습니다."));
    }

    /** 담당자 등록용 아이디 중복확인 (user+partner 양쪽). 슈퍼 관리자만. */
    @GetMapping("/check-id")
    public ResponseEntity<?> checkId(@RequestParam String userId, Authentication auth) {
        ResponseEntity<?> deny = requireSuper(auth);
        if (deny != null) return deny;
        String id = userId == null ? "" : userId.trim();
        boolean taken = userRepo.existsByUserId(id) || partnerRepo.findByPartnerId(id).isPresent();
        return ResponseEntity.ok(Map.of("userId", id, "available", !taken));
    }

    /** 담당자(MASTER_ADMIN) 신규 등록 — 슈퍼 관리자만. 등록 후 선택 영역(areas) 지정. */
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body, Authentication auth) {
        ResponseEntity<?> deny = requireSuper(auth);
        if (deny != null) return deny;

        String userId = str(body, "userId");
        String password = str(body, "password");
        String err = AccountValidation.createError(userId, password);
        if (err != null) return ResponseEntity.badRequest().body(Map.of("message", err));
        String name = str(body, "name");
        if (name == null || name.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "담당자 이름을 입력해 주세요."));
        // 아이디 중복(user + partner 양쪽)
        if (userRepo.existsByUserId(userId) || partnerRepo.findByPartnerId(userId).isPresent())
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 사용 중인 아이디입니다."));

        User u = new User();
        u.setUserId(userId);
        u.setPassword(passwordEncoder.encode(password)); // BCrypt
        u.setName(name);
        u.setEmail(str(body, "email"));
        u.setPhone(str(body, "phone"));
        u.setRole(Role.MASTER_ADMIN);
        userRepo.save(u);

        List<String> areas = parseAreas(body.get("areas"));
        if (!areas.isEmpty()) scopeRepo.save(new AdminScope(userId, String.join(",", areas)));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "userId", userId, "name", name, "role", Role.MASTER_ADMIN.name(), "areas", areas,
                "message", "담당자가 등록되었습니다."));
    }

    @PutMapping("/{userId}")
    @Transactional
    public ResponseEntity<?> set(@PathVariable String userId, @RequestBody Map<String, Object> body, Authentication auth) {
        ResponseEntity<?> deny = requireSuper(auth);
        if (deny != null) return deny;
        User u = userRepo.findByUserId(userId).orElse(null);
        if (u == null || u.getRole() != Role.MASTER_ADMIN)
            return ResponseEntity.badRequest().body(Map.of("message", "MASTER_ADMIN 사용자만 담당자로 지정할 수 있습니다."));
        List<String> areas = parseAreas(body.get("areas"));
        // 자기 자신 잠금 방지: 슈퍼가 본인 계정을 제한하면 RBAC 관리(환경설정) 접근 불가 → 차단
        if (!areas.isEmpty() && userId.equals(auth.getName()))
            return ResponseEntity.badRequest().body(Map.of("message", "본인 계정은 담당영역을 지정할 수 없습니다. (슈퍼 관리자 권한 유지)"));
        if (areas.isEmpty()) {
            scopeRepo.deleteById(userId); // 미지정 = 슈퍼
        } else {
            AdminScope s = scopeRepo.findById(userId).orElse(new AdminScope(userId, null));
            s.setAreas(String.join(",", areas));
            scopeRepo.save(s);
        }
        return ResponseEntity.ok(Map.of("userId", userId, "areas", areas));
    }

    @DeleteMapping("/{userId}")
    @Transactional
    public ResponseEntity<?> clear(@PathVariable String userId, Authentication auth) {
        ResponseEntity<?> deny = requireSuper(auth);
        if (deny != null) return deny;
        scopeRepo.deleteById(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "areas", List.of()));
    }
}
