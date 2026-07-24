package com.chinbiz.api.org;

import jakarta.persistence.*;

/**
 * 본부/센터 지역코드 마스터 (원본 chin4 `center_code` 테이블 재사용).
 *  - center_code == null  → 본부(총괄본부) 후보 (표시명 = head_name)
 *  - center_code != null  → 센터 후보 (표시명 = center_name, 소속 본부 = head_name)
 *  - head_code : 본부↔센터 그룹 연결키. user.sales_center_id 에 idx 를 저장.
 */
@Entity
@Table(name = "center_code")
public class CenterCode {

    @Id
    private Long idx; // 원본 테이블은 auto-increment 아님(기존 데이터), 매핑만.

    @Column(name = "head_code", length = 40)
    private String headCode;

    @Column(name = "head_name", length = 255)
    private String headName;

    @Column(name = "center_code", length = 40)
    private String centerCode;

    @Column(name = "center_name", length = 255)
    private String centerName;

    @Column(name = "Head_code_idx")
    private Integer headCodeIdx;

    @Column(length = 255)
    private String status;

    /** 매칭 시(市) 키 (예: 서울시, 부천시, 광명시, 가평군) */
    @Column(name = "match_key", length = 255)
    private String matchKey;

    /** 매칭 보조키 — 구명 또는 동 목록(콤마 구분) (예: 권선구 / '심곡본동, 소사본동, ...') */
    @Column(name = "search_key", length = 255)
    private String searchKey;

    public Long getIdx() { return idx; }
    public String getMatchKey() { return matchKey; }
    public String getSearchKey() { return searchKey; }
    public String getHeadCode() { return headCode; }
    public String getHeadName() { return headName; }
    public String getCenterCode() { return centerCode; }
    public String getCenterName() { return centerName; }
    public Integer getHeadCodeIdx() { return headCodeIdx; }
    public String getStatus() { return status; }

    /** 표시명: 본부면 head_name, 센터면 center_name */
    public String displayName() {
        return centerCode == null ? headName : centerName;
    }
}
