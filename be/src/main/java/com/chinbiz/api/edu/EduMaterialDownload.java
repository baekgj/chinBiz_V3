package com.chinbiz.api.edu;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 교육자료 다운로드 이력 (docs/32, Insert-Only) — 매니저가 자료 파일을 끝까지 받은 기록.
 * (상품 자료 전체 다운로드 여부) → 매니저 [교육완료] 버튼 활성화 근거.
 */
@Entity
@Table(name = "edu_material_download", indexes = {
        @Index(name = "idx_edu_dl_manager_product", columnList = "manager_id, product_id"),
        @Index(name = "idx_edu_dl_material", columnList = "material_id")
})
public class EduMaterialDownload {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "material_id", nullable = false) private Long materialId;
    @Column(name = "product_id", nullable = false) private Long productId;
    @Column(name = "manager_id", nullable = false) private Long managerId;   // user.id
    @Column(name = "downloaded_at", nullable = false, updatable = false) private LocalDateTime downloadedAt;

    protected EduMaterialDownload() {}

    public EduMaterialDownload(Long materialId, Long productId, Long managerId) {
        this.materialId = materialId; this.productId = productId; this.managerId = managerId;
    }

    @PrePersist void onCreate() { downloadedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getMaterialId() { return materialId; }
    public Long getProductId() { return productId; }
    public Long getManagerId() { return managerId; }
    public LocalDateTime getDownloadedAt() { return downloadedAt; }
}
