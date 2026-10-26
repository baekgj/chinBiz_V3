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

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    /** 본부/센터 장 중복등록 허용 여부 — 정책 고정: 중복등록 불가 (리스트 상단 토글 제거, app_setting org_dup_allow 무시) */
    private boolean dupAllowed() {
        return false;
    }

    /** 등록 선택 가능 여부: 허용이면 항상, 불가면 미할당이거나 본인(selfId)에게 할당된 코드만 */
    private boolean selectable(CenterCode c, Long selfId) {
        return dupAllowed() || c.getFixIdx() == null || c.getFixIdx().equals(selfId);
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
        m.put("fixIdx", c.getFixIdx());
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

    /** 본부 후보 (center_code IS NULL). available=true 면 중복등록 정책 적용(불가 시 본부장 미할당만, selfId 본인 할당 포함) */
    @GetMapping("/center-codes/divisions")
    public List<Map<String, Object>> divisionCodes(@RequestParam(defaultValue = "false") boolean available,
                                                   @RequestParam(required = false) Long selfId) {
        return centerCodeRepository.findByCenterCodeIsNullOrderByIdxAsc().stream()
                .filter(c -> !available || selectable(c, selfId)).map(this::code).toList();
    }

    /** 센터 후보: 선택한 본부의 sales_center_id(=center_code idx) → head_code → center_code!=null 목록 */
    @GetMapping("/center-codes/centers")
    public ResponseEntity<?> centerCodes(@RequestParam Long divisionIdx,
                                         @RequestParam(defaultValue = "false") boolean available,
                                         @RequestParam(required = false) Long selfId) {
        CenterCode head = centerCodeRepository.findById(divisionIdx).orElse(null);
        if (head == null) return ResponseEntity.ok(List.of());
        List<Map<String, Object>> list = centerCodeRepository
                .findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(head.getHeadCode())
                .stream().filter(c -> !available || selectable(c, selfId)).map(this::code).toList();
        return ResponseEntity.ok(list);
    }

    /** 본부 계정 목록 (센터 등록 시 본부 선택용) */
    @GetMapping("/divisions")
    public List<Map<String, Object>> divisions() {
        return userRepository.findByRole(Role.DIVISION_ADMIN).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("userId", u.getUserId());
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

    public record CascadeCenterRequest(Long salesCenterId) {}

    /** 하위추천회원 소속센터 일괄변경 — 대상 회원 + 그를 (직·간접) 추천으로 가입한 모든 하위 버즈회원의
     *  sales_center_id 를 지정 센터로 변경. (referral_code = 상위 userId 체인을 BFS 탐색) */
    @PostMapping("/members/{id}/cascade-center")
    public ResponseEntity<?> cascadeCenter(@PathVariable Long id, @RequestBody CascadeCenterRequest req) {
        User root = userRepository.findById(id).orElse(null);
        if (root == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        if (req.salesCenterId() == null) return ResponseEntity.badRequest().body(Map.of("message", "변경할 센터를 선택해 주세요."));

        // 대상 회원 + 하위 추천 체인 수집 (referral_code 그래프 BFS, 사이클 방지)
        List<User> targets = new ArrayList<>();
        Set<Long> visited = new HashSet<>();
        Deque<User> queue = new ArrayDeque<>();
        queue.add(root); visited.add(root.getId());
        while (!queue.isEmpty()) {
            User cur = queue.poll();
            targets.add(cur);
            if (cur.getUserId() == null) continue;
            for (User child : userRepository.findByReferralCode(cur.getUserId())) {
                if (child.getId() != null && visited.add(child.getId())) queue.add(child);
            }
        }
        targets.forEach(u -> u.setSalesCenterId(req.salesCenterId()));
        userRepository.saveAll(targets);
        return ResponseEntity.ok(Map.of(
                "message", targets.size() + "명(본인 포함)의 소속센터가 변경되었습니다.",
                "count", targets.size(),
                "salesCenterId", req.salesCenterId(),
                "centerName", centerName(req.salesCenterId())));
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
        String taken = assignConflict(req.salesCenterId(), null);
        if (taken != null) return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", taken));
        apply(u, req);
        userRepository.save(u);
        bindFix(u, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(member(u));
    }

    /** 회원 정보 수정 (password 비우면 유지) */
    @PutMapping("/members/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody OrgMemberRequest req) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        if (!isBlank(req.password())) u.setPassword(passwordEncoder.encode(req.password()));
        if (req.role() != null) { Role r = parseOrgRole(req.role()); if (r != null) u.setRole(r); }
        String taken = assignConflict(req.salesCenterId(), u.getId());
        if (taken != null) return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", taken));
        Long before = u.getSalesCenterId();
        apply(u, req);
        userRepository.save(u);
        bindFix(u, before);
        return ResponseEntity.ok(member(u));
    }

    /** 중복등록 불가 정책에서 해당 코드가 다른 계정에 이미 할당돼 있으면 메시지, 아니면 null */
    private String assignConflict(Long codeIdx, Long selfId) {
        if (codeIdx == null) return null;
        CenterCode c = centerCodeRepository.findById(codeIdx).orElse(null);
        if (c == null || selectable(c, selfId)) return null;
        return c.getCenterCode() == null ? "이미 본부장이 할당된 본부입니다." : "이미 센터장이 할당된 센터입니다.";
    }

    /** 본부/센터 저장 후 center_code.fix_idx = user.id. 코드가 바뀌었으면 이전 코드의 본인 할당 해제 */
    private void bindFix(User u, Long beforeCodeIdx) {
        if (u.getRole() != Role.DIVISION_ADMIN && u.getRole() != Role.CENTER_ADMIN) return;
        if (beforeCodeIdx != null && !beforeCodeIdx.equals(u.getSalesCenterId())) {
            centerCodeRepository.findById(beforeCodeIdx).ifPresent(c -> {
                if (u.getId().equals(c.getFixIdx())) { c.setFixIdx(null); centerCodeRepository.save(c); }
            });
        }
        if (u.getSalesCenterId() != null) {
            centerCodeRepository.findById(u.getSalesCenterId()).ifPresent(c -> {
                c.setFixIdx(u.getId());
                centerCodeRepository.save(c);
            });
        }
    }

    // ───────── 본부ᆞ센터 리스트 : center_code ↔ 본부장/센터장(fix_idx) 할당 관리 ─────────

    /** 코드 행 + 할당 계정 정보 (ID/이름/연락처) */
    private Map<String, Object> slot(CenterCode c) {
        Map<String, Object> m = code(c);
        User u = c.getFixIdx() == null ? null : userRepository.findById(c.getFixIdx()).orElse(null);
        m.put("assigneeId", u == null ? null : u.getId());
        m.put("assigneeUserId", u == null ? null : u.getUserId());
        m.put("assigneeName", u == null ? null : u.getName());
        m.put("assigneePhone", u == null ? null : u.getPhone());
        return m;
    }

    @GetMapping("/org-list/divisions")
    public Map<String, Object> orgListDivisions() {
        return Map.of("content", centerCodeRepository.findByCenterCodeIsNullOrderByIdxAsc().stream().map(this::slot).toList());
    }

    @GetMapping("/org-list/centers")
    public List<Map<String, Object>> orgListCenters(@RequestParam Long divisionIdx) {
        CenterCode head = centerCodeRepository.findById(divisionIdx).orElse(null);
        if (head == null) return List.of();
        return centerCodeRepository.findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(head.getHeadCode())
                .stream().map(this::slot).toList();
    }

    /** [등록] 팝업 후보: 본부 코드 → 본부(DIVISION_ADMIN) 계정 전체, 센터 코드 → 해당 본부 소속(또는 소속 미지정) 센터(CENTER_ADMIN) 계정.
     *  중복등록 불가면 어느 코드에도 할당되지 않은 계정만, 허용이면 이 코드에 이미 할당된 계정만 제외. */
    @GetMapping("/org-list/{codeIdx}/candidates")
    public ResponseEntity<?> orgListCandidates(@PathVariable Long codeIdx) {
        CenterCode c = centerCodeRepository.findById(codeIdx).orElse(null);
        if (c == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "코드를 찾을 수 없습니다."));
        boolean isDivision = c.getCenterCode() == null;
        boolean dup = dupAllowed();
        List<Map<String, Object>> list = userRepository.findByRole(isDivision ? Role.DIVISION_ADMIN : Role.CENTER_ADMIN).stream()
                .filter(u -> isDivision || belongsToHead(u.getSalesCenterId(), c.getHeadCode()))
                .filter(u -> !u.getId().equals(c.getFixIdx()))
                .filter(u -> dup || !centerCodeRepository.existsByFixIdx(u.getId()))
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("userId", u.getUserId());
                    m.put("name", u.getName());
                    m.put("phone", u.getPhone());
                    m.put("centerName", centerName(u.getSalesCenterId()));
                    return m;
                }).toList();
        return ResponseEntity.ok(list);
    }

    /** 센터 계정이 해당 본부(head_code) 소속인지 — 소속 미지정(null)도 후보로 포함 */
    private boolean belongsToHead(Long salesCenterId, String headCode) {
        if (salesCenterId == null) return true;
        return centerCodeRepository.findById(salesCenterId)
                .map(x -> headCode != null && headCode.equals(x.getHeadCode())).orElse(true);
    }

    public record AssignRequest(Long userId) {}

    /** [등록]: center_code.fix_idx = user.id, user.sales_center_id = codeIdx */
    @PostMapping("/org-list/{codeIdx}/assign")
    public ResponseEntity<?> orgListAssign(@PathVariable Long codeIdx, @RequestBody AssignRequest req) {
        CenterCode c = centerCodeRepository.findById(codeIdx).orElse(null);
        if (c == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "코드를 찾을 수 없습니다."));
        User u = req == null || req.userId() == null ? null : userRepository.findById(req.userId()).orElse(null);
        Role need = c.getCenterCode() == null ? Role.DIVISION_ADMIN : Role.CENTER_ADMIN;
        if (u == null || u.getRole() != need)
            return ResponseEntity.badRequest().body(Map.of("message", need == Role.DIVISION_ADMIN ? "본부 계정을 선택해 주세요." : "센터 계정을 선택해 주세요."));
        if (!dupAllowed()) {
            if (c.getFixIdx() != null && !c.getFixIdx().equals(u.getId()))
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 할당된 코드입니다. 먼저 삭제해 주세요."));
            if (centerCodeRepository.findByFixIdx(u.getId()).stream().anyMatch(x -> !x.getIdx().equals(codeIdx)))
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 다른 본부/센터에 할당된 계정입니다."));
        }
        c.setFixIdx(u.getId());
        centerCodeRepository.save(c);
        u.setSalesCenterId(codeIdx);
        userRepository.save(u);
        return ResponseEntity.ok(slot(c));
    }

    /** [삭제]: center_code.fix_idx 와 할당 계정의 user.sales_center_id 해제 */
    @DeleteMapping("/org-list/{codeIdx}/assign")
    public ResponseEntity<?> orgListUnassign(@PathVariable Long codeIdx) {
        CenterCode c = centerCodeRepository.findById(codeIdx).orElse(null);
        if (c == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "코드를 찾을 수 없습니다."));
        if (c.getFixIdx() != null) {
            userRepository.findById(c.getFixIdx()).ifPresent(u -> {
                if (codeIdx.equals(u.getSalesCenterId())) { u.setSalesCenterId(null); userRepository.save(u); }
            });
            c.setFixIdx(null);
            centerCodeRepository.save(c);
        }
        return ResponseEntity.ok(slot(c));
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
