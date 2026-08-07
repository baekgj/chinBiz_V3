package com.chinbiz.api.rbac;

import jakarta.persistence.*;

/**
 * 본사 어드민(MASTER_ADMIN) 담당자별 접근 영역(RBAC) — docs/20 Task4.
 * login_id(=user.userId) 1행. areas = 담당영역 CSV(A,B,C,D).
 *  - A: 파트너사 관리 · 상품 관리 · 교육 관리
 *  - B: 조직망 및 영업 관리
 *  - C: 수당 및 정산 관리
 *  - D: 공지사항 · 민원 관리 센터
 * 행이 없으면(=미지정) 슈퍼 관리자로 전체 메뉴 접근.
 */
@Entity
@Table(name = "admin_scope")
public class AdminScope {

    @Id
    @Column(name = "login_id", length = 60, nullable = false)
    private String loginId;

    /** 담당영역 CSV. 예: "A,C" */
    @Column(name = "areas", length = 40)
    private String areas;

    public AdminScope() {}
    public AdminScope(String loginId, String areas) { this.loginId = loginId; this.areas = areas; }

    public String getLoginId() { return loginId; }
    public void setLoginId(String loginId) { this.loginId = loginId; }
    public String getAreas() { return areas; }
    public void setAreas(String areas) { this.areas = areas; }
}
