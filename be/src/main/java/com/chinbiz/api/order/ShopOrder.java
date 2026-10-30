package com.chinbiz.api.order;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 단순배송상품 주문 (docs/33). HOME 상품상세(카카오 링크 refId·ordNo)에서 [구매하기] → 주문서 입력 → 결제하기.
 * 테이블명 partner_order. 배송지는 order_delivery(1:N, 배송지별 수량).
 * 주문상태: 접수 / 입금 / 배송완료 / 취소.
 */
@Entity
@Table(name = "partner_order")
public class ShopOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", length = 60) private String orderNo;   // 주문번호 (= sale.order_no)
    @Column(name = "sale_id") private Long saleId;                    // 1차 영업 건 (refId)
    @Column(name = "product_id") private Long productId;
    @Column(name = "partner_id") private Long partnerId;              // 공급 파트너사 partner.id
    @Column(name = "product_name", length = 200) private String productName;
    @Column(name = "sale_price") private Long salePrice;              // 주문 시점 판매가(원)
    @Column(nullable = false) private int quantity;                    // 구매수량
    @Column(name = "total_amount") private Long totalAmount;          // 결제금액 = 판매가 × 수량
    @Column(name = "pay_method", length = 10) private String payMethod; // BANK(무통장) / CARD(신용카드 — 현재 비활성)
    @Column(length = 10) private String status = "접수";

    // 주문자 정보
    @Column(name = "orderer_name", length = 50) private String ordererName;
    @Column(name = "orderer_tel", length = 20) private String ordererTel;       // 연락처
    @Column(name = "orderer_mobile", length = 20) private String ordererMobile; // 핸드폰번호
    @Column(name = "orderer_email", length = 120) private String ordererEmail;
    @Column(name = "orderer_zipcode", length = 10) private String ordererZipcode;
    @Column(name = "orderer_address", length = 200) private String ordererAddress;
    @Column(name = "orderer_address_detail", length = 200) private String ordererAddressDetail;

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; if (status == null) status = "접수"; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getOrderNo() { return orderNo; } public void setOrderNo(String v) { orderNo = v; }
    public Long getSaleId() { return saleId; } public void setSaleId(Long v) { saleId = v; }
    public Long getProductId() { return productId; } public void setProductId(Long v) { productId = v; }
    public Long getPartnerId() { return partnerId; } public void setPartnerId(Long v) { partnerId = v; }
    public String getProductName() { return productName; } public void setProductName(String v) { productName = v; }
    public Long getSalePrice() { return salePrice; } public void setSalePrice(Long v) { salePrice = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { quantity = v; }
    public Long getTotalAmount() { return totalAmount; } public void setTotalAmount(Long v) { totalAmount = v; }
    public String getPayMethod() { return payMethod; } public void setPayMethod(String v) { payMethod = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public String getOrdererName() { return ordererName; } public void setOrdererName(String v) { ordererName = v; }
    public String getOrdererTel() { return ordererTel; } public void setOrdererTel(String v) { ordererTel = v; }
    public String getOrdererMobile() { return ordererMobile; } public void setOrdererMobile(String v) { ordererMobile = v; }
    public String getOrdererEmail() { return ordererEmail; } public void setOrdererEmail(String v) { ordererEmail = v; }
    public String getOrdererZipcode() { return ordererZipcode; } public void setOrdererZipcode(String v) { ordererZipcode = v; }
    public String getOrdererAddress() { return ordererAddress; } public void setOrdererAddress(String v) { ordererAddress = v; }
    public String getOrdererAddressDetail() { return ordererAddressDetail; } public void setOrdererAddressDetail(String v) { ordererAddressDetail = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
