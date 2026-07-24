package com.chinbiz.api.product;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 상품. 수당유형(RATE/FIXED), 판매가/총수당, 카테고리·파트너사, 이미지 5개,
 * 7주체 역할별 수당, 상품설명/설치·반품 규정, 판매여부.
 */
@Entity
@Table(name = "product")
public class Product {

    public enum RewardType { RATE, FIXED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type", nullable = false, length = 10)
    private RewardType rewardType = RewardType.RATE;

    @Column(name = "sale_price")
    private Long salePrice = 0L;

    @Column(name = "total_allowance")
    private Long totalAllowance = 0L;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(length = 500) private String image1;
    @Column(length = 500) private String image2;
    @Column(length = 500) private String image3;
    @Column(length = 500) private String image4;
    @Column(length = 500) private String image5;

    // 7주체 역할별 수당 (RATE=%*100 bp 또는 %, FIXED=원). 여기선 정수로 저장.
    @Column(name = "buzz_reward") private Long buzzReward = 0L;
    @Column(name = "chinku_reward") private Long chinkuReward = 0L;
    @Column(name = "manager_reward") private Long managerReward = 0L;
    @Column(name = "sales_center_reward") private Long salesCenterReward = 0L;
    @Column(name = "mgmt_center_reward") private Long mgmtCenterReward = 0L;
    @Column(name = "division_reward") private Long divisionReward = 0L;
    @Column(name = "hq_reward") private Long hqReward = 0L;

    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "install_policy", columnDefinition = "TEXT") private String installPolicy;
    @Column(name = "return_policy", columnDefinition = "TEXT") private String returnPolicy;

    @Column(name = "on_sale", nullable = false) private boolean onSale = true;

    /** 계약(영업) 종료일 — 캘린더 선택. null이면 종료일 없음. (docs/07 상품마켓 D-day 표시 근거) */
    @Column(name = "contract_end_date") private LocalDate contractEndDate;

    /** 설치상품 여부 (체크박스). true=설치형 상품 */
    @Column(name = "install_product", nullable = false) private boolean installProduct = false;

    // 키워드 태그 (마켓 배지). 상품등록 시 선택
    @Column(name = "kw_popular", nullable = false) private boolean popular = false;      // 인기
    @Column(name = "kw_recommended", nullable = false) private boolean recommended = false; // 추천

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public RewardType getRewardType() { return rewardType; }
    public void setRewardType(RewardType v) { rewardType = v; }
    public Long getSalePrice() { return salePrice; }
    public void setSalePrice(Long v) { salePrice = v; }
    public Long getTotalAllowance() { return totalAllowance; }
    public void setTotalAllowance(Long v) { totalAllowance = v; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long v) { categoryId = v; }
    public Long getPartnerId() { return partnerId; }
    public void setPartnerId(Long v) { partnerId = v; }
    public String getImage1() { return image1; } public void setImage1(String v) { image1 = v; }
    public String getImage2() { return image2; } public void setImage2(String v) { image2 = v; }
    public String getImage3() { return image3; } public void setImage3(String v) { image3 = v; }
    public String getImage4() { return image4; } public void setImage4(String v) { image4 = v; }
    public String getImage5() { return image5; } public void setImage5(String v) { image5 = v; }
    public Long getBuzzReward() { return buzzReward; } public void setBuzzReward(Long v) { buzzReward = v; }
    public Long getChinkuReward() { return chinkuReward; } public void setChinkuReward(Long v) { chinkuReward = v; }
    public Long getManagerReward() { return managerReward; } public void setManagerReward(Long v) { managerReward = v; }
    public Long getSalesCenterReward() { return salesCenterReward; } public void setSalesCenterReward(Long v) { salesCenterReward = v; }
    public Long getMgmtCenterReward() { return mgmtCenterReward; } public void setMgmtCenterReward(Long v) { mgmtCenterReward = v; }
    public Long getDivisionReward() { return divisionReward; } public void setDivisionReward(Long v) { divisionReward = v; }
    public Long getHqReward() { return hqReward; } public void setHqReward(Long v) { hqReward = v; }
    public String getDescription() { return description; } public void setDescription(String v) { description = v; }
    public String getInstallPolicy() { return installPolicy; } public void setInstallPolicy(String v) { installPolicy = v; }
    public String getReturnPolicy() { return returnPolicy; } public void setReturnPolicy(String v) { returnPolicy = v; }
    public boolean isOnSale() { return onSale; } public void setOnSale(boolean v) { onSale = v; }
    public LocalDate getContractEndDate() { return contractEndDate; } public void setContractEndDate(LocalDate v) { contractEndDate = v; }
    public boolean isInstallProduct() { return installProduct; } public void setInstallProduct(boolean v) { installProduct = v; }
    public boolean isPopular() { return popular; } public void setPopular(boolean v) { popular = v; }
    public boolean isRecommended() { return recommended; } public void setRecommended(boolean v) { recommended = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
