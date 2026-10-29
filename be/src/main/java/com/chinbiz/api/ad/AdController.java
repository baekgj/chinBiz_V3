package com.chinbiz.api.ad;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 본사 [광고관리] (docs/32, MASTER_ADMIN)
 *  - GET    /api/ads            : 광고 리스트
 *  - GET    /api/ads/{id}       : 광고 상세(이미지 포함)
 *  - POST   /api/ads            : 광고 등록   {title, areaId, position, adType, published, imageCount, images[]}
 *  - PUT    /api/ads/{id}       : 광고 수정
 *  - DELETE /api/ads/{id}       : 광고 삭제
 *  - POST   /api/ads/upload?adType= (multipart file) : 이미지 업로드 → HOME 폭 리사이징(PC/모바일)
 */
@RestController
@RequestMapping("/api/ads")
public class AdController {

    public static final int MAX_IMAGES = 10;

    private final AdRepository repo;
    private final AdImageRepository imageRepo;
    private final AdImageResizer resizer;

    public AdController(AdRepository repo, AdImageRepository imageRepo, AdImageResizer resizer) {
        this.repo = repo; this.imageRepo = imageRepo; this.resizer = resizer;
    }

    public record ImageReq(String imageUrl, String mobileUrl, String linkUrl, String altText, Integer width, Integer height) {}
    public record AdRequest(String title, String areaId, String position, String adType, Boolean published,
                            Integer imageCount, List<ImageReq> images) {}

    @GetMapping
    public List<Map<String, Object>> list() {
        return repo.findAllByOrderByIdDesc().stream().map(a -> {
            Map<String, Object> m = dto(a);
            List<AdImage> imgs = imageRepo.findByAdIdOrderBySortOrderAsc(a.getId());
            m.put("thumbnail", imgs.isEmpty() ? null : imgs.get(0).getImageUrl());
            m.put("uploadedCount", imgs.size());
            return m;
        }).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).<ResponseEntity<?>>map(a -> ResponseEntity.ok(detail(a, imageRepo)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "광고를 찾을 수 없습니다.")));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody AdRequest req) {
        String err = validate(req, null);
        if (err != null) return ResponseEntity.badRequest().body(Map.of("message", err));
        Ad a = new Ad();
        apply(a, req);
        repo.save(a);
        saveImages(a, req.images());
        return ResponseEntity.status(HttpStatus.CREATED).body(detail(a, imageRepo));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AdRequest req) {
        Ad a = repo.findById(id).orElse(null);
        if (a == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "광고를 찾을 수 없습니다."));
        String err = validate(req, id);
        if (err != null) return ResponseEntity.badRequest().body(Map.of("message", err));
        apply(a, req);
        repo.save(a);
        imageRepo.deleteByAdId(a.getId());
        saveImages(a, req.images());
        return ResponseEntity.ok(detail(a, imageRepo));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "광고를 찾을 수 없습니다."));
        imageRepo.deleteByAdId(id);
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    /** 이미지 업로드 — 광고유형별 HOME 폭으로 리사이징 */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam(defaultValue = "SLIDE") String adType) {
        if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "파일이 비어 있습니다."));
        try {
            AdImageResizer.Result r = resizer.save(file, parseType(adType) == null ? Ad.AdType.SLIDE : parseType(adType));
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("imageUrl", r.url());
            m.put("mobileUrl", r.mobileUrl());
            m.put("width", r.width());
            m.put("height", r.height());
            return ResponseEntity.status(HttpStatus.CREATED).body(m);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "이미지 처리에 실패했습니다."));
        }
    }

    private String validate(AdRequest req, Long selfId) {
        if (req.areaId() == null || req.areaId().isBlank()) return "광고영역ID를 입력해 주세요.";
        if (!req.areaId().trim().matches("[A-Za-z0-9_-]{2,50}")) return "광고영역ID는 영문·숫자·_·- 2~50자로 입력해 주세요.";
        if (parseType(req.adType()) == null) return "광고유형을 선택해 주세요.";
        int count = req.imageCount() == null ? 0 : req.imageCount();
        if (count < 1 || count > MAX_IMAGES) return "등록이미지 수는 1~" + MAX_IMAGES + "개입니다.";
        long uploaded = req.images() == null ? 0 : req.images().stream().filter(i -> i != null && i.imageUrl() != null && !i.imageUrl().isBlank()).count();
        if (uploaded < count) return "등록이미지 " + count + "개를 모두 업로드해 주세요. (현재 " + uploaded + "개)";
        var dup = repo.findByAreaId(req.areaId().trim());
        if (dup.isPresent() && !dup.get().getId().equals(selfId)) return "이미 사용 중인 광고영역ID입니다.";
        return null;
    }

    private void apply(Ad a, AdRequest req) {
        a.setTitle(req.title() == null || req.title().isBlank() ? null : req.title().trim());
        a.setAreaId(req.areaId().trim());
        a.setPosition(Ad.Position.MAIN); // 현재 광고위치는 메인화면만
        a.setAdType(parseType(req.adType()));
        a.setPublished(req.published() != null && req.published());
        a.setImageCount(req.imageCount());
    }

    private void saveImages(Ad a, List<ImageReq> images) {
        List<AdImage> out = new ArrayList<>();
        int order = 0;
        for (ImageReq i : images) {
            if (i == null || i.imageUrl() == null || i.imageUrl().isBlank()) continue;
            if (order >= a.getImageCount()) break;
            AdImage img = new AdImage();
            img.setAdId(a.getId());
            img.setSortOrder(++order);
            img.setImageUrl(i.imageUrl());
            img.setMobileUrl(blankToNull(i.mobileUrl()));
            img.setLinkUrl(blankToNull(i.linkUrl()));
            img.setAltText(blankToNull(i.altText()));
            img.setWidth(i.width());
            img.setHeight(i.height());
            out.add(img);
        }
        imageRepo.saveAll(out);
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    static Ad.AdType parseType(String s) {
        if (s == null) return null;
        try { return Ad.AdType.valueOf(s.trim().toUpperCase()); } catch (Exception e) { return null; }
    }

    static Map<String, Object> dto(Ad a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("title", a.getTitle());
        m.put("areaId", a.getAreaId());
        m.put("position", a.getPosition().name());
        m.put("adType", a.getAdType().name());
        m.put("published", a.isPublished());
        m.put("imageCount", a.getImageCount());
        m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt().toString());
        m.put("updatedAt", a.getUpdatedAt() == null ? null : a.getUpdatedAt().toString());
        return m;
    }

    static Map<String, Object> detail(Ad a, AdImageRepository imageRepo) {
        Map<String, Object> m = dto(a);
        m.put("images", imageRepo.findByAdIdOrderBySortOrderAsc(a.getId()).stream().map(i -> {
            Map<String, Object> o = new LinkedHashMap<>();
            o.put("imageUrl", i.getImageUrl());
            o.put("mobileUrl", i.getMobileUrl());
            o.put("linkUrl", i.getLinkUrl());
            o.put("altText", i.getAltText());
            o.put("width", i.getWidth());
            o.put("height", i.getHeight());
            return o;
        }).toList());
        return m;
    }
}
