package com.chinbiz.api.ad;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * HOME 광고 (docs/32) — 본사 [광고관리]-[광고리스트]/[광고등록].
 *  - 광고게시여부(published) · 광고영역ID(area_id) · 광고위치(position, MAIN=메인화면)
 *  - 광고유형(ad_type) SLIDE=슬라이드형 / BANNER=배너형 / LAYER_POPUP=레이어팝업형
 *  - 등록이미지 수(image_count) — 이미지는 ad_chinbiz_image (sort_order 순)
 */
@Entity
@Table(name = "ad_chinbiz", uniqueConstraints = @UniqueConstraint(name = "uk_ad_area_id", columnNames = "area_id"))
public class Ad {

    public enum Position { MAIN }
    public enum AdType { SLIDE, BANNER, LAYER_POPUP }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100) private String title;                                    // 광고명(관리용)
    @Column(name = "area_id", nullable = false, length = 50) private String areaId; // 광고영역ID
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) private Position position = Position.MAIN;
    @Enumerated(EnumType.STRING)
    @Column(name = "ad_type", nullable = false, length = 20) private AdType adType = AdType.SLIDE;
    @Column(nullable = false) private boolean published = false;                   // 광고게시여부
    @Column(name = "image_count", nullable = false) private int imageCount = 1;    // 등록이미지 수
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public String getAreaId() { return areaId; } public void setAreaId(String v) { areaId = v; }
    public Position getPosition() { return position; } public void setPosition(Position v) { position = v; }
    public AdType getAdType() { return adType; } public void setAdType(AdType v) { adType = v; }
    public boolean isPublished() { return published; } public void setPublished(boolean v) { published = v; }
    public int getImageCount() { return imageCount; } public void setImageCount(int v) { imageCount = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
