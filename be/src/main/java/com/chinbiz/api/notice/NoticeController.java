package com.chinbiz.api.notice;

import com.chinbiz.api.org.CenterCode;
import com.chinbiz.api.org.CenterCodeRepository;
import com.chinbiz.api.push.WebPushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 공지사항 관리 API (본사 MASTER_ADMIN 전용). 대상별 목록 + 등록/상세/수정/삭제.
 */
@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private static final Logger log = LoggerFactory.getLogger(NoticeController.class);

    private final NoticeRepository repo;
    private final CenterCodeRepository centerCodeRepository;
    private final NoticeRecipientResolver recipientResolver;
    private final WebPushService webPushService;

    public NoticeController(NoticeRepository repo, CenterCodeRepository centerCodeRepository,
                            NoticeRecipientResolver recipientResolver, WebPushService webPushService) {
        this.repo = repo;
        this.centerCodeRepository = centerCodeRepository;
        this.recipientResolver = recipientResolver;
        this.webPushService = webPushService;
    }

    private String targetName(Long idx) {
        if (idx == null) return null;
        return centerCodeRepository.findById(idx).map(CenterCode::displayName).orElse(null);
    }

    private Map<String, Object> dto(Notice n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("content", n.getContent());
        m.put("targetType", n.getTargetType().name());
        m.put("allFlag", n.isAllFlag());
        m.put("targetId", n.getTargetId());
        m.put("targetName", n.isAllFlag() ? "전체" : targetName(n.getTargetId()));
        m.put("published", n.isPublished());
        m.put("createdAt", n.getCreatedAt() == null ? null : n.getCreatedAt().toString());
        m.put("updatedAt", n.getUpdatedAt() == null ? null : n.getUpdatedAt().toString());
        return m;
    }

    /** 대상별 목록 (target=DIVISION/CENTER/MANAGER/BUZZ, 페이징) */
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String target,
                                  @RequestParam(required = false) String keyword,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        List<Specification<Notice>> specs = new ArrayList<>();
        Notice.Target t = parseTarget(target);
        if (t != null) specs.add((r, q, cb) -> cb.equal(r.get("targetType"), t));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("title"), "%" + keyword.trim() + "%"));
        Specification<Notice> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<Notice> pg = repo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(this::dto).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(n -> ResponseEntity.ok((Object) dto(n)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "공지사항을 찾을 수 없습니다.")));
    }

    public record NoticeRequest(String title, String content, String targetType,
                                Boolean allFlag, Long targetId, Boolean published) {}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody NoticeRequest req) {
        String err = validate(req);
        if (err != null) return ResponseEntity.badRequest().body(Map.of("message", err));
        Notice n = new Notice();
        apply(n, req);
        repo.save(n);
        // 발행된 공지면 대상 회원에게 웹푸시 발송 (실패해도 공지 저장엔 영향 없음)
        pushIfPublished(n);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto(n));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NoticeRequest req) {
        Notice n = repo.findById(id).orElse(null);
        if (n == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "공지사항을 찾을 수 없습니다."));
        String err = validate(req);
        if (err != null) return ResponseEntity.badRequest().body(Map.of("message", err));
        boolean wasPublished = n.isPublished();
        apply(n, req);
        repo.save(n);
        // 미발행→발행 전환 시에만 푸시 (수정 시마다 중복 발송 방지)
        if (!wasPublished) pushIfPublished(n);
        return ResponseEntity.ok(dto(n));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "공지사항을 찾을 수 없습니다."));
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    private String validate(NoticeRequest req) {
        if (req.title() == null || req.title().isBlank()) return "제목을 입력해 주세요.";
        if (parseTarget(req.targetType()) == null) return "공지 대상을 선택해 주세요.";
        boolean all = req.allFlag() != null && req.allFlag();
        if (!all && req.targetId() == null) return "전체공지가 아니면 대상(본부/센터)을 선택해 주세요.";
        return null;
    }

    private void apply(Notice n, NoticeRequest req) {
        n.setTitle(req.title().trim());
        n.setContent(req.content());
        n.setTargetType(parseTarget(req.targetType()));
        boolean all = req.allFlag() != null && req.allFlag();
        n.setAllFlag(all);
        n.setTargetId(all ? null : req.targetId());
        n.setPublished(req.published() == null || req.published());
    }

    private Notice.Target parseTarget(String s) {
        if (s == null) return null;
        try { return Notice.Target.valueOf(s.trim().toUpperCase()); } catch (Exception e) { return null; }
    }

    /** 발행된 공지면 대상 회원 해석 → 웹푸시 발송. 예외는 격리(공지 저장 트랜잭션과 분리). */
    private void pushIfPublished(Notice n) {
        if (!n.isPublished()) return;
        try {
            List<String> accounts = recipientResolver.resolveAccounts(n);
            if (accounts.isEmpty()) return;
            String body = excerpt(n.getContent(), 80);
            String url = recipientResolver.workspacePath(n.getTargetType());
            webPushService.sendToAccounts(accounts, n.getTitle(), body, url);
        } catch (Exception e) {
            log.warn("[notice] 공지 푸시 발송 실패 noticeId={} : {}", n.getId(), e.getMessage());
        }
    }

    /** HTML 태그 제거 후 앞부분 발췌(푸시 본문용) */
    private String excerpt(String html, int max) {
        if (html == null) return "";
        String text = html.replaceAll("<[^>]*>", " ")
                .replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">")
                .replaceAll("\\s+", " ").trim();
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
