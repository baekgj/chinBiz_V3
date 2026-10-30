package com.chinbiz.api.order;

import jakarta.persistence.*;

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

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; } public void setOrderId(Long v) { orderId = v; }
    public String getReceiverName() { return receiverName; } public void setReceiverName(String v) { receiverName = v; }
    public String getReceiverMobile() { return receiverMobile; } public void setReceiverMobile(String v) { receiverMobile = v; }
    public String getZipcode() { return zipcode; } public void setZipcode(String v) { zipcode = v; }
    public String getAddress() { return address; } public void setAddress(String v) { address = v; }
    public String getAddressDetail() { return addressDetail; } public void setAddressDetail(String v) { addressDetail = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { quantity = v; }
}
