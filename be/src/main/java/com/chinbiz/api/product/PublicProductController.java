package com.chinbiz.api.product;

import com.chinbiz.api.category.Category;
import com.chinbiz.api.category.CategoryRepository;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 홈페이지(비로그인) 상품 노출용 공개 API.
 * ⚠ CLAUDE.md 가드레일: 단가·마진·수당 등 민감정보는 절대 반환하지 않음.
 *   상품명·파트너·카테고리·설명(요약)·키워드 배지만 노출.
 */
@RestController
@RequestMapping("/api/public")
public class PublicProductController {

    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final CategoryRepository categoryRepo;

    public PublicProductController(ProductRepository productRepo, PartnerRepository partnerRepo, CategoryRepository categoryRepo) {
        this.productRepo = productRepo; this.partnerRepo = partnerRepo; this.categoryRepo = categoryRepo;
    }

    /** HTML 제거 + 공백 정리 후 요약 (설명 노출용) */
    private String plainSnippet(String html, int max) {
        if (html == null) return "";
        String s = html.replaceAll("<[^>]*>", " ").replaceAll("&nbsp;", " ").replaceAll("\\s+", " ").trim();
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }

    /** 대표 상품 목록 (판매중, 인기·추천 우선, 최신순). 민감정보 제외. */
    @GetMapping("/products")
    public List<Map<String, Object>> products(@RequestParam(defaultValue = "4") int limit) {
        Specification<Product> spec = (r, q, cb) -> cb.isTrue(r.get("onSale"));
        Map<Long, String> pn = partnerRepo.findAll().stream()
                .collect(Collectors.toMap(Partner::getId, Partner::getCompanyName, (a, b) -> a));
        Map<Long, String> cn = categoryRepo.findAll().stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));
        // 인기 > 추천 > 최신 순
        Sort sort = Sort.by(Sort.Order.desc("popular"), Sort.Order.desc("recommended"), Sort.Order.desc("id"));
        return productRepo.findAll(spec, PageRequest.of(0, Math.max(1, Math.min(limit, 24)), sort))
                .getContent().stream().map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("name", p.getName());
                    m.put("partnerName", p.getPartnerId() == null ? null : pn.get(p.getPartnerId()));
                    m.put("categoryName", p.getCategoryId() == null ? null : cn.get(p.getCategoryId()));
                    m.put("description", plainSnippet(p.getDescription(), 60));
                    m.put("image1", p.getImage1());
                    m.put("popular", p.isPopular());
                    m.put("recommended", p.isRecommended());
                    return m;
                }).toList();
    }

    /** 상품리스트 페이지용 대분류 카테고리(칩) — LARGE, 게시중 */
    @GetMapping("/categories")
    public List<Map<String, Object>> categories() {
        return categoryRepo.findAll().stream()
                .filter(c -> c.getLevel() == Category.Level.LARGE && c.getStatus() == Category.Status.ACTIVE)
                .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                .map(c -> { Map<String, Object> m = new LinkedHashMap<>(); m.put("id", c.getId()); m.put("name", c.getName()); return m; })
                .toList();
    }

    private Map<String, Object> card(Product p, Map<Long, String> pn, Map<Long, String> cn) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("partnerName", p.getPartnerId() == null ? null : pn.get(p.getPartnerId()));
        m.put("categoryName", p.getCategoryId() == null ? null : cn.get(p.getCategoryId()));
        m.put("description", plainSnippet(p.getDescription(), 70));
        m.put("image1", p.getImage1());
        m.put("popular", p.isPopular());
        m.put("recommended", p.isRecommended());
        return m;
    }

    /** 상품리스트 페이지 — 검색(상품명)·카테고리(대분류+하위)·정렬(latest/popular)·페이징. 민감정보 제외. */
    @GetMapping("/products/list")
    public Map<String, Object> productList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        List<Category> allCats = categoryRepo.findAll();
        Map<Long, String> cn = allCats.stream().collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));
        Map<Long, String> pn = partnerRepo.findAll().stream().collect(Collectors.toMap(Partner::getId, Partner::getCompanyName, (a, b) -> a));

        List<Specification<Product>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> cb.isTrue(r.get("onSale")));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("name"), "%" + keyword.trim() + "%"));
        if (categoryId != null) {
            Set<Long> catIds = descendantCategoryIds(categoryId, allCats);
            specs.add((r, q, cb) -> r.get("categoryId").in(catIds));
        }
        Specification<Product> spec = specs.stream().reduce(Specification::and).orElse(null);

        Sort srt = "popular".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Order.desc("popular"), Sort.Order.desc("recommended"), Sort.Order.desc("id"))
                : Sort.by(Sort.Order.desc("id"));
        Page<Product> pg = productRepo.findAll(spec, PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 48)), srt));
        return Map.of(
                "content", pg.getContent().stream().map(p -> card(p, pn, cn)).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages());
    }

    /** 선택 카테고리 + 모든 하위 카테고리 id 집합 (parent_id 재귀) */
    private Set<Long> descendantCategoryIds(Long rootId, List<Category> all) {
        Set<Long> ids = new HashSet<>(); ids.add(rootId);
        boolean grew = true;
        while (grew) {
            grew = false;
            for (Category c : all) {
                if (c.getParentId() != null && ids.contains(c.getParentId()) && ids.add(c.getId())) grew = true;
            }
        }
        return ids;
    }
}
