package com.chinbiz.api.edu;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 교육자료 (docs/32) — 본사 [교육관리]-[교육자료 등록]에서 상품별로 업로드한 파일.
 * 파일은 공개 정적경로(/uploads)가 아닌 별도 폴더(app.edu-dir)에 저장 → 인증 다운로드 API 로만 제공.
 * 매니저 [교육관리]에서 해당 상품의 자료를 모두 다운로드해야 [교육완료] 가능.
 */
@Entity
@Table(name = "edu_material", indexes = @Index(name = "idx_edu_material_product", columnList = "product_id"))
public class EduMaterial {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false) private Long productId;
    @Column(nullable = false, length = 200) private String title;                       // 자료명
    @Column(columnDefinition = "TEXT") private String description;                     // 설명(선택)
    @Column(name = "stored_name", nullable = false, length = 100) private String storedName;     // 저장 파일명(uuid.ext)
    @Column(name = "original_name", nullable = false, length = 255) private String originalName; // 원본 파일명(다운로드명)
    @Column(name = "content_type", length = 150) private String contentType;
    @Column(name = "file_size") private Long fileSize;                                  // byte
    @Column(name = "created_by", length = 60) private String createdBy;                 // 등록 관리자 user_id
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getProductId() { return productId; } public void setProductId(Long v) { productId = v; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public String getDescription() { return description; } public void setDescription(String v) { description = v; }
    public String getStoredName() { return storedName; } public void setStoredName(String v) { storedName = v; }
    public String getOriginalName() { return originalName; } public void setOriginalName(String v) { originalName = v; }
    public String getContentType() { return contentType; } public void setContentType(String v) { contentType = v; }
    public Long getFileSize() { return fileSize; } public void setFileSize(Long v) { fileSize = v; }
    public String getCreatedBy() { return createdBy; } public void setCreatedBy(String v) { createdBy = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
