package com.chinbiz.api.agree;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 고객 동의 기록 (docs/27). 홈 상품화면에서 고객(대표자)이 동의/미동의 클릭 시 Insert.
 *  - agree_type : provide(개인정보 3자제공) / marketing(마케팅 활용동의)
 *  - 1차영업 등록 시 (대표자명 + 핸드폰 + provide) 최신 기록으로 sale.agree_check/agree_date 를 채운다.
 */
@Entity
@Table(name = "agree", indexes = @Index(name = "idx_agree_lookup", columnList = "agree_type,name,phone"))
public class Agree {

    public static final String PROVIDE = "provide";
    public static final String MARKETING = "marketing";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agree_type", length = 20, nullable = false) private String agreeType;
    @Column(length = 50) private String name;
    @Column(length = 20) private String phone;
    @Column(length = 120) private String email;
    @Column(length = 400) private String address;
    @Column(name = "agree_check", length = 1, nullable = false) private String agreeCheck = "N";
    @Column(name = "agree_date") private LocalDateTime agreeDate;

    public Long getId() { return id; }
    public String getAgreeType() { return agreeType; } public void setAgreeType(String v) { agreeType = v; }
    public String getName() { return name; } public void setName(String v) { name = v; }
    public String getPhone() { return phone; } public void setPhone(String v) { phone = v; }
    public String getEmail() { return email; } public void setEmail(String v) { email = v; }
    public String getAddress() { return address; } public void setAddress(String v) { address = v; }
    public String getAgreeCheck() { return agreeCheck; } public void setAgreeCheck(String v) { agreeCheck = v; }
    public LocalDateTime getAgreeDate() { return agreeDate; } public void setAgreeDate(LocalDateTime v) { agreeDate = v; }
}
