package com.chinbiz.api.ad;

import jakarta.persistence.*;

/**
 * 광고 이미지 (docs/32) — ad_chinbiz 1 : N. 업로드 시 HOME 폭에 맞춰 리사이징된 PC/모바일 2종 URL 저장.
 */
@Entity
@Table(name = "ad_chinbiz_image", indexes = @Index(name = "idx_ad_image_ad", columnList = "ad_id"))
public class AdImage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ad_id", nullable = false) private Long adId;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(name = "image_url", nullable = false, length = 500) private String imageUrl;   // PC (HOME 폭)
    @Column(name = "mobile_url", length = 500) private String mobileUrl;                   // 모바일 폭
    @Column(name = "link_url", length = 500) private String linkUrl;                       // 클릭 이동(선택)
    @Column(name = "alt_text", length = 200) private String altText;                       // 대체텍스트(SEO·접근성)
    @Column private Integer width;
    @Column private Integer height;

    public Long getId() { return id; }
    public Long getAdId() { return adId; } public void setAdId(Long v) { adId = v; }
    public int getSortOrder() { return sortOrder; } public void setSortOrder(int v) { sortOrder = v; }
    public String getImageUrl() { return imageUrl; } public void setImageUrl(String v) { imageUrl = v; }
    public String getMobileUrl() { return mobileUrl; } public void setMobileUrl(String v) { mobileUrl = v; }
    public String getLinkUrl() { return linkUrl; } public void setLinkUrl(String v) { linkUrl = v; }
    public String getAltText() { return altText; } public void setAltText(String v) { altText = v; }
    public Integer getWidth() { return width; } public void setWidth(Integer v) { width = v; }
    public Integer getHeight() { return height; } public void setHeight(Integer v) { height = v; }
}
