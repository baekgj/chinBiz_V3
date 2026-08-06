package com.chinbiz.api.notice;

import com.chinbiz.api.org.CenterCode;
import com.chinbiz.api.org.CenterCodeRepository;
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
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 역할별 내 공지사항 조회 (docs/08). 로그인 사용자의 role → 공지대상 + 소속센터 기준 필터.
 *  - 본부:   targetType=DIVISION, 전체 or target_id=sales_center_id
 *  - 센터:   targetType=CENTER,   전체 or target_id=sales_center_id
 *  - 매니저: targetType=MANAGER,  전체 or target_id=manager_center_id
 *  - 버즈:   targetType=BUZZ,     전체 or target_id=sales_center_id
 */
@RestController
@RequestMapping("/api/my/notices")
public class MyNoticeController {

    private final NoticeRepository repo;
    private final UserRepository userRepo;
    private final CenterCodeRepository centerCodeRepository;
    private final com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepo;

    public MyNoticeController(NoticeRepository repo, UserRepository userRepo, CenterCodeRepository centerCodeRepository,
                             com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepo) {
        this.repo = repo; this.userRepo = userRepo; this.centerCodeRepository = centerCodeRepository;
        this.managerCenterRepo = managerCenterRepo;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    private String targetName(Long idx) {
        if (idx == null) return null;
        return centerCodeRepository.findById(idx).map(CenterCode::displayName).orElse(null);
    }

    private Map<String, Object> dto(Notice n, boolean withContent) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        if (withContent) m.put("content", n.getContent());
        m.put("targetType", n.getTargetType().name());
        m.put("allFlag", n.isAllFlag());
        m.put("targetName", n.isAllFlag() ? "전체" : targetName(n.getTargetId()));
        m.put("createdAt", n.getCreatedAt() == null ? null : n.getCreatedAt().toString());
        return m;
    }

    /**
     * 로그인 role → (targetType, myCenterId) 매핑. 해당 없으면 null.
     * as: 뷰 오버라이드. MANAGER가 버즈admin(버즈 뷰)에서 조회할 땐 as=BUZZ → BUZZ 공지(소속센터 기준) 표시.
     */
    private Object[] context(User u, String as) {
        Role r = u.getRole();
        // 매니저는 버즈 뷰에서 BUZZ 공지를 조회 가능 (버즈admin 공지사항)
        if (r == Role.MANAGER && "BUZZ".equalsIgnoreCase(as))
            return new Object[]{ Notice.Target.BUZZ, centersOf(u.getSalesCenterId()) };
        if (r == Role.DIVISION_ADMIN) return new Object[]{ Notice.Target.DIVISION, centersOf(u.getSalesCenterId()) };
        if (r == Role.CENTER_ADMIN)   return new Object[]{ Notice.Target.CENTER,   centersOf(u.getSalesCenterId()) };
        if (r == Role.MANAGER)        return new Object[]{ Notice.Target.MANAGER,  approvedCenters(u.getId()) };
        if (r == Role.BUZZ)           return new Object[]{ Notice.Target.BUZZ,     centersOf(u.getSalesCenterId()) };
        return null;
    }

    private List<Long> centersOf(Long id) { return id == null ? List.of() : List.of(id); }

    /** 매니저의 승인된 활동센터(다중, docs/19) */
    private List<Long> approvedCenters(Long buzzId) {
        return managerCenterRepo.findByBuzzIdAndStatus(buzzId, "Y").stream()
                .map(com.chinbiz.api.buzz.ManagerCenter::getCenterId).toList();
    }

    private Specification<Notice> mySpec(Notice.Target target, List<Long> myCenters) {
        return (r, q, cb) -> cb.and(
                cb.isTrue(r.get("published")),
                cb.equal(r.get("targetType"), target),
                // 전체공지 OR 내 센터(들) 대상
                myCenters.isEmpty()
                        ? cb.isTrue(r.get("allFlag"))
                        : cb.or(cb.isTrue(r.get("allFlag")), r.get("targetId").in(myCenters))
        );
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth,
                                  @RequestParam(required = false) String as,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        User u = me(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Object[] ctx = context(u, as);
        if (ctx == null) return ResponseEntity.ok(Map.of("content", List.of(), "page", 0, "size", size, "totalElements", 0, "totalPages", 0));
        Notice.Target target = (Notice.Target) ctx[0];
        @SuppressWarnings("unchecked")
        List<Long> myCenters = (List<Long>) ctx[1];
        Page<Notice> pg = repo.findAll(mySpec(target, myCenters),
                PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(n -> dto(n, false)).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(Authentication auth, @PathVariable Long id, @RequestParam(required = false) String as) {
        User u = me(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Object[] ctx = context(u, as);
        Notice n = repo.findById(id).orElse(null);
        if (n == null || ctx == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "공지사항을 찾을 수 없습니다."));
        Notice.Target target = (Notice.Target) ctx[0];
        @SuppressWarnings("unchecked")
        List<Long> myCenters = (List<Long>) ctx[1];
        boolean visible = n.isPublished() && n.getTargetType() == target
                && (n.isAllFlag() || myCenters.contains(n.getTargetId()));
        if (!visible) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "공지사항을 찾을 수 없습니다."));
        return ResponseEntity.ok(dto(n, true));
    }
}
