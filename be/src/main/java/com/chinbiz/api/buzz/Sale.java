package com.chinbiz.api.buzz;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 1차 영업 건 (버즈가 등록한 고객 영업). 영업 파이프라인의 기본 단위.
 * 저장 필드: 상품ID·버즈ID·매니저ID(2차 배정) + 고객(B2B) 기본정보 + 영업진행상태 + 메모.
 */
@Entity
@Table(name = "sale")
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", length = 60) private String orderNo; // 주문번호 (수당 원장 연결키)
    @Column(name = "product_id") private Long productId;
    @Column(name = "category_id") private Long categoryId;
    @Column(name = "buzz_id") private Long buzzId;        // 1차 영업자(버즈) user.id
    @Column(name = "manager_id") private Long managerId;  // 2차 배정 매니저 user.id (미배정 null)
    @Column(name = "manager_dated_at") private LocalDateTime managerDatedAt; // 매니저 배정(영업권확보) 일시
    @Column(name = "parent_id") private Long parentId;    // 소속센터 대표 user.id (고객 주소→center_code 매칭)
    @Column(name = "customer_center_id") private Long customerCenterId; // 고객 주소 → center_code.idx (매니저 배정 지역 매칭 기준)

    // 고객(B2B) 기본정보
    @Column(name = "company_name", length = 120) private String companyName;   // 상호명
    @Column(name = "business_number", length = 20) private String businessNumber; // 사업자등록번호
    @Column(name = "ceo_name", length = 50) private String ceoName;            // 대표자명
    @Column(name = "company_phone", length = 20) private String companyPhone;  // 회사 전화번호
    @Column(name = "manager_name", length = 50) private String managerName;    // 담당자명
    @Column(length = 20) private String phone;                                 // 담당자 핸드폰
    @Column(length = 120) private String email;
    @Column(length = 10) private String zipcode;
    @Column(length = 200) private String address;
    @Column(name = "address_detail", length = 200) private String addressDetail;

    @Column(length = 20) private String status = "접수";  // 영업진행상태
    @Column(columnDefinition = "TEXT") private String memo;
    @Column(name = "install_photos", columnDefinition = "TEXT") private String installPhotos; // 현장설치 사진 URL(콤마 구분, docs/25_2)

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; if (status == null) status = "접수"; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getOrderNo() { return orderNo; } public void setOrderNo(String v) { orderNo = v; }
    public Long getProductId() { return productId; } public void setProductId(Long v) { productId = v; }
    public Long getCategoryId() { return categoryId; } public void setCategoryId(Long v) { categoryId = v; }
    public Long getBuzzId() { return buzzId; } public void setBuzzId(Long v) { buzzId = v; }
    public Long getManagerId() { return managerId; } public void setManagerId(Long v) { managerId = v; }
    public LocalDateTime getManagerDatedAt() { return managerDatedAt; } public void setManagerDatedAt(LocalDateTime v) { managerDatedAt = v; }
    public Long getParentId() { return parentId; } public void setParentId(Long v) { parentId = v; }
    public Long getCustomerCenterId() { return customerCenterId; } public void setCustomerCenterId(Long v) { customerCenterId = v; }
    public String getCompanyName() { return companyName; } public void setCompanyName(String v) { companyName = v; }
    public String getBusinessNumber() { return businessNumber; } public void setBusinessNumber(String v) { businessNumber = v; }
    public String getCeoName() { return ceoName; } public void setCeoName(String v) { ceoName = v; }
    public String getCompanyPhone() { return companyPhone; } public void setCompanyPhone(String v) { companyPhone = v; }
    public String getManagerName() { return managerName; } public void setManagerName(String v) { managerName = v; }
    public String getPhone() { return phone; } public void setPhone(String v) { phone = v; }
    public String getEmail() { return email; } public void setEmail(String v) { email = v; }
    public String getZipcode() { return zipcode; } public void setZipcode(String v) { zipcode = v; }
    public String getAddress() { return address; } public void setAddress(String v) { address = v; }
    public String getAddressDetail() { return addressDetail; } public void setAddressDetail(String v) { addressDetail = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public String getMemo() { return memo; } public void setMemo(String v) { memo = v; }
    public String getInstallPhotos() { return installPhotos; } public void setInstallPhotos(String v) { installPhotos = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
