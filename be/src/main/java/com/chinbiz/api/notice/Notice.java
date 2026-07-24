package com.chinbiz.api.notice;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 공지사항 (docs/08). 본사에서 등록, 대상 역할(본부/센터/매니저/버즈)별로 전체공지 또는 특정 본부·센터에 발행.
 */
@Entity
@Table(name = "notice")
public class Notice {

    /** 공지 대상 역할 */
    public enum Target { DIVISION, CENTER, MANAGER, BUZZ }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    /** 공지 대상(본부/센터/매니저/버즈) */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private Target targetType;

    /** 전체공지 여부 */
    @Column(name = "all_flag", nullable = false)
    private boolean allFlag = false;

    /** 대상 ID = 선택한 본부 또는 센터의 center_code.idx (전체공지면 null) */
    @Column(name = "target_id")
    private Long targetId;

    /** 게시 여부 */
    @Column(nullable = false)
    private boolean published = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public String getContent() { return content; }
    public void setContent(String v) { content = v; }
    public Target getTargetType() { return targetType; }
    public void setTargetType(Target v) { targetType = v; }
    public boolean isAllFlag() { return allFlag; }
    public void setAllFlag(boolean v) { allFlag = v; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long v) { targetId = v; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean v) { published = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
