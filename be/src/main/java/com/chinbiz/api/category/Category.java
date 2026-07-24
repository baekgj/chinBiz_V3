package com.chinbiz.api.category;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 상품 카테고리. 대/중/소 분류(level) + 운영상태(status).
 */
@Entity
@Table(name = "category")
public class Category {

    public enum Level { LARGE, MEDIUM, SMALL } // 대/중/소
    public enum Status { ACTIVE, INACTIVE }     // 게시/중지

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Level level = Level.LARGE;

    @Column(nullable = false, length = 60)
    private String name;

    /** 상위 카테고리(중/소 분류용, 선택) */
    @Column(name = "parent_id")
    private Long parentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Level getLevel() { return level; }
    public void setLevel(Level level) { this.level = level; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
