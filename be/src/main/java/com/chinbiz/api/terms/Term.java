package com.chinbiz.api.terms;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 약관/동의서 (본사 [시스템설정]-[약관설정]에서 등록·수정).
 * code 로 조회(공개/관리). content 는 plain text(단락 \n 유지) 저장.
 */
@Entity
@Table(name = "terms")
public class Term {

    @Id
    @Column(name = "code", length = 40)
    private String code;

    @Column(name = "title", length = 120, nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Term() {}
    public Term(String code, String title, int sortOrder) { this.code = code; this.title = title; this.sortOrder = sortOrder; }

    @PreUpdate @PrePersist void touch() { updatedAt = LocalDateTime.now(); }

    public String getCode() { return code; } public void setCode(String v) { code = v; }
    public String getTitle() { return title; } public void setTitle(String v) { title = v; }
    public String getContent() { return content; } public void setContent(String v) { content = v; }
    public Integer getSortOrder() { return sortOrder; } public void setSortOrder(Integer v) { sortOrder = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
