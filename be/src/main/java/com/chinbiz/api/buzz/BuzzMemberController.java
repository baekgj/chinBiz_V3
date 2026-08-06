package com.chinbiz.api.buzz;

import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 버즈 네트워크 회원 관리 (BUZZ/MANAGER 전용).
 * 내 네트워크 = referral_code 가 로그인 버즈의 userId 인 회원(내가 추천/등록).
 * 회원 등록 시 역할 BUZZ 고정, 추천인(referral_code)을 로그인 버즈로 자동 저장.
 */
@RestController
@RequestMapping("/api/buzz/members")
public class BuzzMemberController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.chinbiz.api.org.CenterMatcher centerMatcher;
    private final com.chinbiz.api.alarm.AlarmService alarmService;

    public BuzzMemberController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                com.chinbiz.api.org.CenterMatcher centerMatcher,
                                com.chinbiz.api.alarm.AlarmService alarmService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.centerMatcher = centerMatcher;
        this.alarmService = alarmService;
    }

    private String meId(Authentication auth) { return auth == null ? null : auth.getName(); }

    private Map<String, Object> dto(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("userId", u.getUserId());
        m.put("name", u.getName());
        m.put("phone", u.getPhone());
        m.put("email", u.getEmail());
        m.put("zipcode", u.getZipcode());
        m.put("address", u.getAddress());
        m.put("addressDetail", u.getAddressDetail());
        m.put("bankName", u.getBankName());
        m.put("accountNumber", u.getAccountNumber());
        m.put("accountHolder", u.getAccountHolder());
        m.put("role", u.getRole().name());
        m.put("status", u.getStatus());
        m.put("referralCode", u.getReferralCode());
        m.put("joinDate", u.getCreatedAt() == null ? null : u.getCreatedAt().toLocalDate().toString());
        return m;
    }

    /** 아이디 중복확인 (user 테이블) */
    @GetMapping("/check-id")
    public Map<String, Object> checkId(@RequestParam String userId) {
        return Map.of("userId", userId, "available", !userRepository.existsByUserId(userId));
    }

    /** 내 네트워크 목록 (검색 + 가입일 범위 + 페이징) */
    @GetMapping
    public ResponseEntity<?> list(
            Authentication auth,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String me = meId(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        List<Specification<User>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> cb.equal(r.get("referralCode"), me));
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim() + "%";
            specs.add((r, q, cb) -> cb.or(cb.like(r.get("userId"), kw), cb.like(r.get("name"), kw)));
        }
        if (from != null && !from.isBlank())
            specs.add((r, q, cb) -> cb.greaterThanOrEqualTo(r.get("createdAt"), LocalDate.parse(from).atStartOfDay()));
        if (to != null && !to.isBlank())
            specs.add((r, q, cb) -> cb.lessThan(r.get("createdAt"), LocalDate.parse(to).plusDays(1).atStartOfDay()));
        Specification<User> spec = specs.stream().reduce(Specification::and).orElse(null);

        Page<User> pg = userRepository.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(this::dto).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(Authentication auth, @PathVariable Long id) {
        String me = meId(auth);
        User u = userRepository.findById(id).orElse(null);
        if (u == null || me == null || !me.equals(u.getReferralCode()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        return ResponseEntity.ok(dto(u));
    }

    public record MemberRequest(
            String userId, String password, String name, String phone, String email,
            String zipcode, String address, String addressDetail,
            String bankName, String accountNumber, String accountHolder, String status) {}

    /** 회원 등록 (역할 BUZZ 고정, 추천인=로그인 버즈 자동 저장) */
    @PostMapping
    public ResponseEntity<?> create(Authentication auth, @RequestBody MemberRequest req) {
        String me = meId(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (isBlank(req.name())) return ResponseEntity.badRequest().body(Map.of("message", "이름을 입력해 주세요."));
        String ve = com.chinbiz.api.common.AccountValidation.createError(req.userId(), req.password());
        if (ve != null) return ResponseEntity.badRequest().body(Map.of("message", ve));
        if (userRepository.existsByUserId(req.userId()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 사용 중인 아이디입니다."));
        User u = new User();
        u.setUserId(req.userId());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setRole(Role.BUZZ);          // 역할 BUZZ 고정
        u.setReferralCode(me);         // 추천인 자동 저장
        apply(u, req);
        // 소속센터(docs/07): 로그인 회원의 sales_center_id 승계 → 없으면 주소 매칭 fallback
        User inviter = userRepository.findByUserId(me).orElse(null);
        Long scid = inviter != null ? inviter.getSalesCenterId() : null;
        if (scid == null) scid = centerMatcher.matchCenterIdx(u.getAddress());
        u.setSalesCenterId(scid);
        userRepository.save(u);
        // [회원추천] 알람 (센터/본부/본사 + 추천인) — docs/16
        try { alarmService.fireMemberReferral(u); } catch (Exception ignore) {}
        return ResponseEntity.status(HttpStatus.CREATED).body(dto(u));
    }

    /** 회원 수정 (내 네트워크만) */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(Authentication auth, @PathVariable Long id, @RequestBody MemberRequest req) {
        String me = meId(auth);
        User u = userRepository.findById(id).orElse(null);
        if (u == null || me == null || !me.equals(u.getReferralCode()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        if (!isBlank(req.password())) u.setPassword(passwordEncoder.encode(req.password()));
        apply(u, req);
        userRepository.save(u);
        return ResponseEntity.ok(dto(u));
    }

    private void apply(User u, MemberRequest req) {
        if (req.name() != null) u.setName(req.name());
        u.setPhone(req.phone());
        u.setEmail(req.email());
        u.setZipcode(req.zipcode());
        u.setAddress(req.address());
        u.setAddressDetail(req.addressDetail());
        u.setBankName(req.bankName());
        u.setAccountNumber(req.accountNumber());
        u.setAccountHolder(req.accountHolder());
        if (!isBlank(req.status())) u.setStatus(req.status());
    }

    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
