package com.chinbiz.api.notice;

import com.chinbiz.api.buzz.SaleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 홈페이지(비로그인) 공개 지표·공지 API. 민감정보 미포함.
 *  - GET /api/public/stats   : 누적 매칭 / 활성 버즈 / 이번 달 신규
 *  - GET /api/public/notices : 최근 공지 5건 (롤링 표시용)
 *  - GET /api/public/notices/list?page=&size=&q= : 공지사항 리스트(게시 공지, 페이징)
 *  - GET /api/public/notices/{id} : 공지사항 상세
 */
@RestController
@RequestMapping("/api/public")
public class PublicSiteController {

    private final SaleRepository saleRepo;
    private final NoticeRepository noticeRepo;
    private final com.chinbiz.api.setting.AppSettingRepository settingRepo;

    public PublicSiteController(SaleRepository saleRepo, NoticeRepository noticeRepo,
                                com.chinbiz.api.setting.AppSettingRepository settingRepo) {
        this.saleRepo = saleRepo; this.noticeRepo = noticeRepo; this.settingRepo = settingRepo;
    }

    /** HOME 검색엔진최적화 메타태그 — 본사 [환경설정]에 등록된 seo_* 값만 노출 (docs/32) */
    @GetMapping("/seo")
    public Map<String, String> seo() {
        Map<String, String> m = new LinkedHashMap<>();
        for (String k : com.chinbiz.api.setting.AppSettingController.SEO_KEYS)
            settingRepo.findById(k).ifPresent(s -> { if (s.getValue() != null && !s.getValue().isBlank()) m.put(k, s.getValue()); });
        return m;
    }

    /** 홈 지표: 누적 영업 매칭 / 활성 버즈(1차영업 1회 이상 신청자) / 이번 달 신규 매칭 */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        long total = saleRepo.count();
        long activeBuzz = saleRepo.countActiveBuzz();
        long month = saleRepo.countByCreatedAtGreaterThanEqual(LocalDate.now().withDayOfMonth(1).atStartOfDay());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalMatches", total);
        m.put("activeBuzz", activeBuzz);
        m.put("monthMatches", month);
        return m;
    }

    private static final Map<String, String> TARGET_LABEL = Map.of(
            "DIVISION", "본부", "CENTER", "센터", "MANAGER", "매니저", "BUZZ", "버즈");

    /** 최근 게시 공지 5건 (제목·대상·등록일) */
    @GetMapping("/notices")
    public List<Map<String, Object>> notices() {
        Specification<Notice> published = (r, q, cb) -> cb.isTrue(r.get("published"));
        return noticeRepo.findAll(published, PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "id")))
                .getContent().stream().map(n -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", n.getId());
                    m.put("title", n.getTitle());
                    m.put("targetLabel", TARGET_LABEL.getOrDefault(n.getTargetType().name(), ""));
                    m.put("createdAt", n.getCreatedAt() == null ? null : n.getCreatedAt().toString());
                    return m;
                }).toList();
    }

    private Map<String, Object> row(Notice n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("targetLabel", TARGET_LABEL.getOrDefault(n.getTargetType().name(), ""));
        m.put("createdAt", n.getCreatedAt() == null ? null : n.getCreatedAt().toString());
        return m;
    }

    /** 공지사항 리스트(HOME /notices) — 게시 공지, 최신순 페이징, 제목 검색 */
    @GetMapping("/notices/list")
    public Map<String, Object> noticeList(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size,
                                          @RequestParam(required = false) String q) {
        Specification<Notice> spec = (r, cq, cb) -> cb.isTrue(r.get("published"));
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim() + "%";
            spec = spec.and((r, cq, cb) -> cb.like(r.get("title"), like));
        }
        var p = noticeRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "id")));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("content", p.getContent().stream().map(this::row).toList());
        m.put("totalElements", p.getTotalElements());
        m.put("totalPages", p.getTotalPages());
        m.put("page", p.getNumber());
        return m;
    }

    /** 공지사항 상세(HOME /notices/{id}) — 게시 공지만. 이전/다음 글 id 포함 */
    @GetMapping("/notices/{id}")
    public Map<String, Object> noticeDetail(@PathVariable Long id) {
        Notice n = noticeRepo.findById(id).filter(Notice::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));
        Map<String, Object> m = row(n);
        m.put("content", n.getContent());
        Specification<Notice> pub = (r, cq, cb) -> cb.isTrue(r.get("published"));
        noticeRepo.findAll(pub.and((r, cq, cb) -> cb.lessThan(r.get("id"), id)), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "id")))
                .stream().findFirst().ifPresent(x -> m.put("prev", row(x)));
        noticeRepo.findAll(pub.and((r, cq, cb) -> cb.greaterThan(r.get("id"), id)), PageRequest.of(0, 1, Sort.by(Sort.Direction.ASC, "id")))
                .stream().findFirst().ifPresent(x -> m.put("next", row(x)));
        return m;
    }
}
