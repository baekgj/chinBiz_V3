package com.chinbiz.api.org;

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
 * 본부(DIVISION_ADMIN) [센터관리] (docs/37).
 *  - [센터등록]       : 광역본부 → 센터 선택 + 계정정보로 센터(CENTER_ADMIN) 계정 등록.
 *                       user.sales_center_id = 센터 idx (센터장 지정 center_code.fix_idx 는 하지 않음 — 본사에서 지정),
 *                       user.referral_code = 등록 본부장 user_id (= 추천본부 → 센터 관리비 결제 시 수당 수취)
 *  - [추천등록센터List] : referral_code = 본인 user_id 인 CENTER_ADMIN 목록
 *
 *  GET  /api/division/center-mgmt/check-id?loginId=
 *  GET  /api/division/center-mgmt/divisions            : 광역본부(center_code IS NULL) 전체
 *  GET  /api/division/center-mgmt/centers?divisionIdx= : 해당 본부의 센터 전체
 *  POST /api/division/center-mgmt/centers              : 센터 등록
 *  GET  /api/division/center-mgmt/referred             : 추천등록센터 리스트
 */
@RestController
@RequestMapping("/api/division/center-mgmt")
public class DivisionCenterController {

    private final UserRepository userRepo;
    private final PartnerRepository partnerRepo;
    private final CenterCodeRepository centerCodeRepo;
    private final PasswordEncoder passwordEncoder;

    public DivisionCenterController(UserRepository userRepo, PartnerRepository partnerRepo,
                                    CenterCodeRepository centerCodeRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo; this.partnerRepo = partnerRepo;
        this.centerCodeRepo = centerCodeRepo; this.passwordEncoder = passwordEncoder;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    private static ResponseEntity<?> err(HttpStatus s, String msg) { return ResponseEntity.status(s).body(Map.of("message", msg)); }

    private static Map<String, Object> code(CenterCode c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idx", c.getIdx());
        m.put("name", c.displayName());
        m.put("headCode", c.getHeadCode());
        m.put("headName", c.getHeadName());
        m.put("centerCode", c.getCenterCode());
        m.put("centerName", c.getCenterName());
        return m;
    }

    @GetMapping("/check-id")
    public Map<String, Object> checkId(@RequestParam String loginId) {
        boolean taken = userRepo.existsByUserId(loginId) || partnerRepo.existsByPartnerId(loginId);
        return Map.of("loginId", loginId, "available", !taken);
    }

    @GetMapping("/divisions")
    public List<Map<String, Object>> divisions() {
        return centerCodeRepo.findByCenterCodeIsNullOrderByIdxAsc().stream().map(DivisionCenterController::code).toList();
    }

    /** 해당 본부의 센터 전체 (본부 등록은 센터장 지정을 하지 않으므로 센터장 유무와 무관) */
    @GetMapping("/centers")
    public List<Map<String, Object>> centers(@RequestParam Long divisionIdx) {
        CenterCode head = centerCodeRepo.findById(divisionIdx).orElse(null);
        if (head == null || head.getHeadCode() == null) return List.of();
        return centerCodeRepo.findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(head.getHeadCode()).stream()
                .map(DivisionCenterController::code).toList();
    }

    public record CenterRegisterRequest(Long centerIdx, String userId, String password, String name, String phone, String email) {}

    @PostMapping("/centers")
    @Transactional
    public ResponseEntity<?> register(Authentication auth, @RequestBody CenterRegisterRequest req) {
        User me = me(auth);
        if (me == null) return err(HttpStatus.UNAUTHORIZED, "인증 필요");
        if (req.centerIdx() == null) return err(HttpStatus.BAD_REQUEST, "센터를 선택해 주세요.");
        if (req.name() == null || req.name().isBlank()) return err(HttpStatus.BAD_REQUEST, "이름을 입력해 주세요.");
        String ve = AccountValidation.createError(req.userId(), req.password());
        if (ve != null) return err(HttpStatus.BAD_REQUEST, ve);
        if (userRepo.existsByUserId(req.userId()) || partnerRepo.existsByPartnerId(req.userId()))
            return err(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다.");
        CenterCode cc = centerCodeRepo.findById(req.centerIdx()).orElse(null);
        if (cc == null || cc.getCenterCode() == null) return err(HttpStatus.BAD_REQUEST, "센터를 다시 선택해 주세요.");

        User u = new User();
        u.setUserId(req.userId());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setRole(Role.CENTER_ADMIN);
        u.setName(req.name().trim());
        u.setPhone(req.phone());
        u.setEmail(req.email());
        u.setSalesCenterId(cc.getIdx());
        u.setReferralCode(me.getUserId()); // 추천본부 = 등록 본부장 ID
        userRepo.save(u);
        // 센터장 지정(center_code.fix_idx)은 하지 않음 — 본사 [본부ᆞ센터 리스트]에서 별도 지정
        return ResponseEntity.status(HttpStatus.CREATED).body(row(u, cc));
    }

    @GetMapping("/referred")
    public ResponseEntity<?> referred(Authentication auth) {
        User me = me(auth);
        if (me == null) return err(HttpStatus.UNAUTHORIZED, "인증 필요");
        List<Map<String, Object>> list = userRepo.findByReferralCode(me.getUserId()).stream()
                .filter(u -> u.getRole() == Role.CENTER_ADMIN)
                .sorted(Comparator.comparing(User::getId).reversed())
                .map(u -> row(u, u.getSalesCenterId() == null ? null : centerCodeRepo.findById(u.getSalesCenterId()).orElse(null)))
                .toList();
        return ResponseEntity.ok(list);
    }

    private static Map<String, Object> row(User u, CenterCode cc) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("createdAt", u.getCreatedAt() == null ? null : u.getCreatedAt().toString());
        m.put("headCode", cc == null ? null : cc.getHeadCode());
        m.put("headName", cc == null ? null : cc.getHeadName());
        m.put("centerCode", cc == null ? null : cc.getCenterCode());
        m.put("centerName", cc == null ? null : cc.getCenterName());
        m.put("userId", u.getUserId());
        m.put("name", u.getName());
        m.put("phone", u.getPhone());
        return m;
    }
}
