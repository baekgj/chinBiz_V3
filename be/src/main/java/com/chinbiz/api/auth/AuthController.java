package com.chinbiz.api.auth;

import com.chinbiz.api.auth.dto.LoginRequest;
import com.chinbiz.api.auth.dto.SignupRequest;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 인증 API.
 *  - GET  /api/auth/check-id?userId=  : 아이디 중복확인
 *  - POST /api/auth/signup            : 버즈회원 가입 (role=BUZZ)
 *  - POST /api/auth/login             : 로그인 → JWT 발급
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final com.chinbiz.api.org.CenterMatcher centerMatcher;
    private final com.chinbiz.api.alarm.AlarmService alarmService;
    private final com.chinbiz.api.allowance.AllowanceRepository allowanceRepository;
    private final com.chinbiz.api.setting.AppSettingRepository appSettingRepository;

    public AuthController(UserRepository userRepository, PartnerRepository partnerRepository,
                          JwtUtil jwtUtil, PasswordEncoder passwordEncoder,
                          com.chinbiz.api.org.CenterMatcher centerMatcher,
                          com.chinbiz.api.alarm.AlarmService alarmService,
                          com.chinbiz.api.allowance.AllowanceRepository allowanceRepository,
                          com.chinbiz.api.setting.AppSettingRepository appSettingRepository) {
        this.userRepository = userRepository;
        this.partnerRepository = partnerRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.centerMatcher = centerMatcher;
        this.alarmService = alarmService;
        this.allowanceRepository = allowanceRepository;
        this.appSettingRepository = appSettingRepository;
    }

    /** 현재 로그인 사용자 정보 (JWT 검증됨). 토큰 없거나 무효면 401. */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증이 필요합니다."));
        }
        String loginId = authentication.getName();
        User u = userRepository.findByUserId(loginId).orElse(null);
        if (u != null) {
            return ResponseEntity.ok(Map.of(
                    "userId", u.getUserId(),
                    "name", u.getName(),
                    "role", u.getRole().name(),
                    "salesCenterId", u.getSalesCenterId() == null ? "" : u.getSalesCenterId()
            ));
        }
        // partner 테이블 계정
        Partner p = partnerRepository.findByPartnerId(loginId).orElse(null);
        if (p != null) {
            return ResponseEntity.ok(Map.of(
                    "userId", p.getPartnerId(),
                    "name", p.getCompanyName(),
                    "role", Role.PARTNER.name(),
                    "salesCenterId", ""
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "사용자를 찾을 수 없습니다."));
    }

    /** 아이디 중복확인 */
    @GetMapping("/check-id")
    public Map<String, Object> checkId(@RequestParam String userId) {
        boolean exists = userRepository.existsByUserId(userId);
        return Map.of(
                "userId", userId,
                "available", !exists
        );
    }

    /** 회원가입 (버즈회원) */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        if (userRepository.existsByUserId(req.userId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "이미 사용 중인 아이디입니다."));
        }
        User u = new User();
        u.setUserId(req.userId());
        u.setPassword(passwordEncoder.encode(req.password())); // BCrypt 해시 저장
        u.setName(req.name());
        u.setEmail(req.email());
        u.setPhone(req.phone());
        u.setZipcode(req.zipcode());
        u.setAddress(req.address());
        u.setAddressDetail(req.addressDetail());
        u.setReferralCode(req.referralCode());
        u.setAgreeMarketing(req.agreeMarketing());
        u.setRole(Role.BUZZ);
        // 소속센터 결정 우선순위(docs/07):
        //  ① 입력값(salesCenterId) → ② 추천인이 있으면 추천인의 sales_center_id 승계
        //  → ③ 그래도 없으면 입력 주소(시/구/군)로 center_code 매칭
        Long scid = req.salesCenterId();
        if (scid == null && req.referralCode() != null && !req.referralCode().isBlank()) {
            User referrer = userRepository.findByUserId(req.referralCode().trim()).orElse(null);
            if (referrer != null) scid = referrer.getSalesCenterId();
        }
        if (scid == null) scid = centerMatcher.matchCenterIdx(req.address());
        u.setSalesCenterId(scid);

        // 추천마일리지(docs/18): 추천인 없거나 미존재 → dukebaek 강제. 추천인/가입버즈 모두 CP 지급.
        String refInput = req.referralCode();
        User referrer = (refInput != null && !refInput.isBlank())
                ? userRepository.findByUserId(refInput.trim()).orElse(null) : null;
        String effectiveRefId = referrer != null ? referrer.getUserId() : "dukebaek";
        u.setReferralCode(effectiveRefId); // 강제 지정 반영

        userRepository.save(u);

        // 추천마일리지 CP 지급 (allowance JOIN/CP) — docs/18
        try { grantJoinMileage(u.getUserId(), effectiveRefId); } catch (Exception ignore) {}

        // [회원가입] 알람 발생 (센터/본부/본사 + 추천인) — docs/16
        try { alarmService.fireSignup(u); } catch (Exception ignore) { /* 알람 실패가 가입을 막지 않음 */ }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", u.getId(),
                "userId", u.getUserId(),
                "name", u.getName(),
                "role", u.getRole().name(),
                "message", "회원가입이 완료되었습니다."
        ));
    }

    /** 가입 추천마일리지 CP 지급 — 가입버즈(BUZZ) + 추천인(TOPBUZZ) 각각 JOIN/CP 전표 Insert. */
    private void grantJoinMileage(String joinerId, String referrerId) {
        long buzzCp = appSettingRepository.getLong(com.chinbiz.api.setting.AppSettingController.JOIN_CP_BUZZ, 500);
        long refCp = appSettingRepository.getLong(com.chinbiz.api.setting.AppSettingController.JOIN_CP_REFERRER, 500);
        String orderNo = "join_" + java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "_" + joinerId;
        allowanceRepository.save(joinAllowance(orderNo, com.chinbiz.api.allowance.Allowance.MemberType.BUZZ, joinerId, buzzCp));
        allowanceRepository.save(joinAllowance(orderNo, com.chinbiz.api.allowance.Allowance.MemberType.TOPBUZZ, referrerId, refCp));
    }

    private com.chinbiz.api.allowance.Allowance joinAllowance(String orderNo,
            com.chinbiz.api.allowance.Allowance.MemberType type, String memberId, long amount) {
        com.chinbiz.api.allowance.Allowance a = new com.chinbiz.api.allowance.Allowance();
        a.setType(com.chinbiz.api.allowance.Allowance.Type.JOIN);
        a.setOrderNo(orderNo);
        a.setMemberType(type);
        a.setMemberId(memberId);
        a.setStatus(com.chinbiz.api.allowance.Allowance.Status.CP);
        a.setAmount(amount);
        return a;
    }

    public record AccountFindRequest(String userId, String email, String phone, String newPassword) {}

    private boolean norm(String a, String b) {
        return a != null && b != null && a.trim().equalsIgnoreCase(b.trim()) && !a.trim().isEmpty();
    }

    /** 본인확인: 아이디+이메일(+휴대폰) 일치 여부. user 테이블 → partner 테이블 순. */
    @PostMapping("/verify-account")
    public ResponseEntity<?> verifyAccount(@RequestBody AccountFindRequest req) {
        return ResponseEntity.ok(Map.of("verified", accountMatches(req)));
    }

    private boolean accountMatches(AccountFindRequest req) {
        if (req.userId() == null || req.userId().isBlank()) return false;
        User u = userRepository.findByUserId(req.userId().trim()).orElse(null);
        if (u != null) {
            boolean emailOk = norm(u.getEmail(), req.email());
            boolean phoneOk = (u.getPhone() == null || u.getPhone().isBlank())
                    || (req.phone() != null && !req.phone().isBlank() && u.getPhone().trim().equals(req.phone().trim()));
            return emailOk && phoneOk;
        }
        Partner p = partnerRepository.findByPartnerId(req.userId().trim()).orElse(null);
        if (p != null) return norm(p.getEmail(), req.email());
        return false;
    }

    /** 비밀번호 재설정: 본인확인 후 새 비밀번호(BCrypt) 저장. */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody AccountFindRequest req) {
        if (req.newPassword() == null || req.newPassword().length() < 4)
            return ResponseEntity.badRequest().body(Map.of("message", "새 비밀번호는 4자 이상 입력해 주세요."));
        if (!accountMatches(req))
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "일치하는 계정 정보가 없습니다. 아이디·이메일·휴대폰을 확인해 주세요."));
        User u = userRepository.findByUserId(req.userId().trim()).orElse(null);
        if (u != null) {
            u.setPassword(passwordEncoder.encode(req.newPassword()));
            userRepository.save(u);
        } else {
            Partner p = partnerRepository.findByPartnerId(req.userId().trim()).orElse(null);
            if (p == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "계정을 찾을 수 없습니다."));
            p.setPassword(passwordEncoder.encode(req.newPassword()));
            partnerRepository.save(p);
        }
        return ResponseEntity.ok(Map.of("message", "비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요."));
    }

    /** 로그인 → JWT. user 테이블 우선 조회, 없으면 partner 테이블 조회. */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        // 1) user 테이블
        User u = userRepository.findByUserId(req.userId()).orElse(null);
        if (u != null && passwordEncoder.matches(req.password(), u.getPassword())) {
            return ResponseEntity.ok(tokenBody(u.getUserId(), u.getName(), u.getRole().name()));
        }
        // 2) partner 테이블
        Partner p = partnerRepository.findByPartnerId(req.userId()).orElse(null);
        if (p != null && passwordEncoder.matches(req.password(), p.getPassword())) {
            return ResponseEntity.ok(tokenBody(p.getPartnerId(), p.getCompanyName(), Role.PARTNER.name()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다."));
    }

    private Map<String, Object> tokenBody(String loginId, String name, String role) {
        return Map.of(
                "token", jwtUtil.generateToken(loginId, role),
                "tokenType", "Bearer",
                "expiresInMs", jwtUtil.getExpirationMs(),
                "userId", loginId,
                "name", name,
                "role", role
        );
    }
}
