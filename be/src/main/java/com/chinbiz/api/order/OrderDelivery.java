package com.chinbiz.api.order;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** 주문 배송지 (docs/33) — 주문 1건에 배송지 N곳, 배송지별 수량 합계 = 주문 수량 */
@Entity
@Table(name = "order_delivery")
public class OrderDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false) private Long orderId;
    @Column(name = "receiver_name", length = 50) private String receiverName;
    @Column(name = "receiver_mobile", length = 20) private String receiverMobile;
    @Column(length = 10) private String zipcode;
    @Column(length = 200) private String address;
    @Column(name = "address_detail", length = 200) private String addressDetail;
    @Column(nullable = false) private int quantity;
    // 송장/화물추적 (docs/33-1) — 파트너 admin 입력, [화물추적] 시 택배사 조회결과로 갱신
    @Column(name = "courier_code", length = 20) private String courierCode;
    @Column(name = "invoice_no", length = 40) private String invoiceNo;
    @Column(name = "delivery_status", length = 20) private String deliveryStatus;
    @Column(name = "tracking_detail", length = 300) private String trackingDetail;
    @Column(name = "tracked_at") private LocalDateTime trackedAt;

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; } public void setOrderId(Long v) { orderId = v; }
    public String getReceiverName() { return receiverName; } public void setReceiverName(String v) { receiverName = v; }
    public String getReceiverMobile() { return receiverMobile; } public void setReceiverMobile(String v) { receiverMobile = v; }
    public String getZipcode() { return zipcode; } public void setZipcode(String v) { zipcode = v; }
    public String getAddress() { return address; } public void setAddress(String v) { address = v; }
    public String getAddressDetail() { return addressDetail; } public void setAddressDetail(String v) { addressDetail = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { quantity = v; }
    public String getCourierCode() { return courierCode; } public void setCourierCode(String v) { courierCode = v; }
    public String getInvoiceNo() { return invoiceNo; } public void setInvoiceNo(String v) { invoiceNo = v; }
    public String getDeliveryStatus() { return deliveryStatus; } public void setDeliveryStatus(String v) { deliveryStatus = v; }
    public String getTrackingDetail() { return trackingDetail; } public void setTrackingDetail(String v) { trackingDetail = v; }
    public LocalDateTime getTrackedAt() { return trackedAt; } public void setTrackedAt(LocalDateTime v) { trackedAt = v; }
}
