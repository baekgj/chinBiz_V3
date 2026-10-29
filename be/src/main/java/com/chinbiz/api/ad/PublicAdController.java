package com.chinbiz.api.ad;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** HOME 광고 노출 (docs/32, 공개) — GET /api/public/ads?position=MAIN : 게시중 광고 + 이미지 */
@RestController
@RequestMapping("/api/public/ads")
public class PublicAdController {

    private final AdRepository repo;
    private final AdImageRepository imageRepo;

    public PublicAdController(AdRepository repo, AdImageRepository imageRepo) {
        this.repo = repo; this.imageRepo = imageRepo;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(defaultValue = "MAIN") String position) {
        Ad.Position pos;
        try { pos = Ad.Position.valueOf(position.trim().toUpperCase()); } catch (Exception e) { return List.of(); }
        return repo.findByPositionAndPublishedTrueOrderByIdAsc(pos).stream()
                .map(a -> AdController.detail(a, imageRepo))
                .filter(m -> !((List<?>) m.get("images")).isEmpty())
                .toList();
    }
}
