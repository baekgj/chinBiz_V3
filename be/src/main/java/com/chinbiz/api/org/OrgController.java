package com.chinbiz.api.org;

import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 조직망 관리 API (본사 마스터 어드민 전용). 본부/센터 계정 등록·회원 목록.
 * 본부/센터 계정은 user 테이블에 저장, sales_center_id = center_code.idx.
 */
@RestController
@RequestMapping("/api/org")
public class OrgController {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final CenterCodeRepository centerCodeRepository;
    private final PasswordEncoder passwordEncoder;

    public OrgController(UserRepository userRepository, PartnerRepository partnerRepository,
                         CenterCodeRepository centerCodeRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.partnerRepository = partnerRepository;
        this.centerCodeRepository = centerCodeRepository;
        this.passwordEncoder = passwordEncoder;
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
        m.put("centerCode", c.getCenterCode());
        m.put("headCode", c.getHeadCode());
        return m;
    }

    private Map<String, Object> member(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("userId", u.getUserId());
        m.put("name", u.getName());
        m.put("role", u.getRole().name());
        m.put("phone", u.getPhone());
        m.put("email", u.getEmail());
        m.put("bankName", u.getBankName());
        m.put("accountNumber", u.getAccountNumber());
        m.put("accountHolder", u.getAccountHolder());
        m.put("salesCenterId", u.getSalesCenterId());
        m.put("centerName", centerName(u.getSalesCenterId()));
        m.put("createdAt", u.getCreatedAt() == null ? null : u.getCreatedAt().toString());
        return m;
    }

    /** 아이디 중복확인 (user + partner) */
    @GetMapping("/check-id")
    public Map<String, Object> checkId(@RequestParam String loginId) {
        boolean taken = userRepository.existsByUserId(loginId) || partnerRepository.existsByPartnerId(loginId);
        return Map.of("loginId", loginId, "available", !taken);
    }

    /** 본부 후보 (center_code IS NULL) */
    @GetMapping("/center-codes/divisions")
    public List<Map<String, Object>> divisionCodes() {
        return centerCodeRepository.findByCenterCodeIsNullOrderByIdxAsc().stream().map(this::code).toList();
    }

    /** 센터 후보: 선택한 본부의 sales_center_id(=center_code idx) → head_code → center_code!=null 목록 */
    @GetMapping("/center-codes/centers")
    public ResponseEntity<?> centerCodes(@RequestParam Long divisionIdx) {
        CenterCode head = centerCodeRepository.findById(divisionIdx).orElse(null);
        if (head == null) return ResponseEntity.ok(List.of());
        List<Map<String, Object>> list = centerCodeRepository
                .findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(head.getHeadCode())
                .stream().map(this::code).toList();
        return ResponseEntity.ok(list);
    }

    /** 본부 계정 목록 (센터 등록 시 본부 선택용) */
    @GetMapping("/divisions")
    public List<Map<String, Object>> divisions() {
        return userRepository.findByRole(Role.DIVISION_ADMIN).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("salesCenterId", u.getSalesCenterId());
            m.put("centerName", centerName(u.getSalesCenterId()));
            return m;
        }).toList();
    }

    /** 회원 목록 (페이징) */
    @GetMapping("/members")
    public Map<String, Object> members(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        Page<User> pg = userRepository.findAll(PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return Map.of(
                "content", pg.getContent().stream().map(this::member).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()
        );
    }

    @GetMapping("/members/{id}")
    public ResponseEntity<?> getMember(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> ResponseEntity.ok((Object) member(u)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다.")));
    }

    // ───────── 조직 관리 트리 (B-3) : 본부 ▸ 센터 ▸ 버즈/매니저 ─────────

    /** 트리 최상위: 본부(DIVISION_ADMIN) 목록 */
    @GetMapping("/tree/divisions")
    public List<Map<String, Object>> treeDivisions() {
        return userRepository.findByRole(Role.DIVISION_ADMIN).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("salesCenterId", u.getSalesCenterId());
            m.put("centerName", centerName(u.getSalesCenterId()));
            return m;
        }).toList();
    }

    /** 본부 하위 센터(CENTER_ADMIN) 목록: 본부 head_code 그룹의 센터 계정 */
    @GetMapping("/tree/centers")
    public List<Map<String, Object>> treeCenters(@RequestParam Long divisionId) {
        User div = userRepository.findById(divisionId).orElse(null);
        if (div == null || div.getSalesCenterId() == null) return List.of();
        CenterCode head = centerCodeRepository.findById(div.getSalesCenterId()).orElse(null);
        if (head == null) return List.of();
        // 이 본부(head_code) 산하의 센터 center_code idx 집합
        var centerIdxs = centerCodeRepository
                .findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(head.getHeadCode())
                .stream().map(CenterCode::getIdx).collect(java.util.stream.Collectors.toSet());
        return userRepository.findByRole(Role.CENTER_ADMIN).stream()
                .filter(u -> u.getSalesCenterId() != null && centerIdxs.contains(u.getSalesCenterId()))
                .map(u -> {
                    Long scid = u.getSalesCenterId();
                    long buzz = userRepository.findBySalesCenterId(scid).stream().filter(x -> x.getRole() == Role.BUZZ).count();
                    long mgr = userRepository.findBySalesCenterId(scid).stream().filter(x -> x.getRole() == Role.MANAGER).count();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getName());
                    m.put("salesCenterId", scid);
                    m.put("centerName", centerName(scid));
                    m.put("buzzCount", buzz);
                    m.put("managerCount", mgr);
                    return m;
                }).toList();
    }

    /** 센터 하위 버즈/매니저 목록: sales_center_id == centerIdx */
    @GetMapping("/tree/members")
    public List<Map<String, Object>> treeMembers(@RequestParam Long centerIdx) {
        return userRepository.findBySalesCenterId(centerIdx).stream()
                .filter(u -> u.getRole() == Role.BUZZ || u.getRole() == Role.MANAGER)
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getName());
                    m.put("role", u.getRole().name());
                    m.put("phone", u.getPhone());
                    return m;
                }).toList();
    }

    public record OrgMemberRequest(
            String role, String userId, String password, String name, String phone, String email,
            String bankName, String accountNumber, String accountHolder, Long salesCenterId) {}

    /** 본부/센터 계정 등록 */
    @PostMapping("/members")
    public ResponseEntity<?> create(@RequestBody OrgMemberRequest req) {
        Role role = parseOrgRole(req.role());
        if (role == null) return ResponseEntity.badRequest().body(Map.of("message", "역할은 본부(DIVISION_ADMIN) 또는 센터(CENTER_ADMIN)여야 합니다."));
        if (isBlank(req.name())) return ResponseEntity.badRequest().body(Map.of("message", "이름을 입력해 주세요."));
        String ve = com.chinbiz.api.common.AccountValidation.createError(req.userId(), req.password());
        if (ve != null) return ResponseEntity.badRequest().body(Map.of("message", ve));
        if (userRepository.existsByUserId(req.userId()) || partnerRepository.existsByPartnerId(req.userId()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 사용 중인 아이디입니다."));
        User u = new User();
        u.setUserId(req.userId());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setRole(role);
        apply(u, req);
        userRepository.save(u);
        return ResponseEntity.status(HttpStatus.CREATED).body(member(u));
    }

    /** 회원 정보 수정 (password 비우면 유지) */
    @PutMapping("/members/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody OrgMemberRequest req) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        if (!isBlank(req.password())) u.setPassword(passwordEncoder.encode(req.password()));
        if (req.role() != null) { Role r = parseOrgRole(req.role()); if (r != null) u.setRole(r); }
        apply(u, req);
        userRepository.save(u);
        return ResponseEntity.ok(member(u));
    }

    private void apply(User u, OrgMemberRequest req) {
        if (req.name() != null) u.setName(req.name());
        u.setPhone(req.phone());
        u.setEmail(req.email());
        u.setBankName(req.bankName());
        u.setAccountNumber(req.accountNumber());
        u.setAccountHolder(req.accountHolder());
        if (req.salesCenterId() != null) u.setSalesCenterId(req.salesCenterId());
    }

    private Role parseOrgRole(String s) {
        if ("DIVISION_ADMIN".equals(s) || "본부".equals(s)) return Role.DIVISION_ADMIN;
        if ("CENTER_ADMIN".equals(s) || "센터".equals(s)) return Role.CENTER_ADMIN;
        return null;
    }

    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
