package com.chinbiz.api.notice;

import com.chinbiz.api.buzz.SaleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 홈페이지(비로그인) 공개 지표·공지 API. 민감정보 미포함.
 *  - GET /api/public/stats   : 누적 매칭 / 활성 버즈 / 이번 달 신규
 *  - GET /api/public/notices : 최근 공지 5건 (롤링 표시용)
 */
@RestController
@RequestMapping("/api/public")
public class PublicSiteController {

    private final SaleRepository saleRepo;
    private final NoticeRepository noticeRepo;

    public PublicSiteController(SaleRepository saleRepo, NoticeRepository noticeRepo) {
        this.saleRepo = saleRepo; this.noticeRepo = noticeRepo;
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
}
