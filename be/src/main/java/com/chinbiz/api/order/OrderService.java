package com.chinbiz.api.order;

import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** 주문 조회/상태변경 공용 (파트너 admin · 본사 admin 동일 리스트, docs/33) */
@Service
public class OrderService {

    public static final Set<String> STATUSES = Set.of("접수", "입금", "배송완료", "취소");

    private final ShopOrderRepository orderRepo;
    private final OrderDeliveryRepository deliveryRepo;
    private final PartnerRepository partnerRepo;

    public OrderService(ShopOrderRepository orderRepo, OrderDeliveryRepository deliveryRepo, PartnerRepository partnerRepo) {
        this.orderRepo = orderRepo; this.deliveryRepo = deliveryRepo; this.partnerRepo = partnerRepo;
    }

    public Map<String, Object> row(ShopOrder o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", o.getId());
        m.put("orderNo", o.getOrderNo());
        m.put("createdAt", o.getCreatedAt() == null ? null : o.getCreatedAt().toLocalDate().toString());
        m.put("ordererName", o.getOrdererName());
        m.put("productId", o.getProductId());
        m.put("productName", o.getProductName());
        m.put("partnerName", o.getPartnerId() == null ? null : partnerRepo.findById(o.getPartnerId()).map(Partner::getCompanyName).orElse(null));
        m.put("salePrice", o.getSalePrice());
        m.put("quantity", o.getQuantity());
        m.put("totalAmount", o.getTotalAmount());
        m.put("payMethod", o.getPayMethod());
        m.put("status", o.getStatus());
        return m;
    }

    public Map<String, Object> detail(ShopOrder o) {
        Map<String, Object> m = row(o);
        m.put("createdAtFull", o.getCreatedAt() == null ? null : o.getCreatedAt().toString().replace('T', ' ').substring(0, 16));
        m.put("ordererTel", o.getOrdererTel());
        m.put("ordererMobile", o.getOrdererMobile());
        m.put("ordererEmail", o.getOrdererEmail());
        m.put("ordererZipcode", o.getOrdererZipcode());
        m.put("ordererAddress", o.getOrdererAddress());
        m.put("ordererAddressDetail", o.getOrdererAddressDetail());
        List<Map<String, Object>> ds = new ArrayList<>();
        for (OrderDelivery d : deliveryRepo.findByOrderIdOrderByIdAsc(o.getId())) {
            Map<String, Object> dm = new LinkedHashMap<>();
            dm.put("receiverName", d.getReceiverName());
            dm.put("receiverMobile", d.getReceiverMobile());
            dm.put("zipcode", d.getZipcode());
            dm.put("address", d.getAddress());
            dm.put("addressDetail", d.getAddressDetail());
            dm.put("quantity", d.getQuantity());
            ds.add(dm);
        }
        m.put("deliveries", ds);
        return m;
    }

    /** 주문 리스트 — partnerId null 이면 전체(본사). keyword=구매자명/상품명/주문번호, status 필터 */
    public Map<String, Object> list(Long partnerId, String keyword, String status, int page, int size) {
        List<Specification<ShopOrder>> specs = new ArrayList<>();
        if (partnerId != null) specs.add((r, q, cb) -> cb.equal(r.get("partnerId"), partnerId));
        if (status != null && !status.isBlank()) specs.add((r, q, cb) -> cb.equal(r.get("status"), status.trim()));
        if (keyword != null && !keyword.isBlank()) {
            String k = "%" + keyword.trim() + "%";
            specs.add((r, q, cb) -> cb.or(cb.like(r.get("ordererName"), k), cb.like(r.get("productName"), k), cb.like(r.get("orderNo"), k)));
        }
        Specification<ShopOrder> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<ShopOrder> pg = orderRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "id")));
        return Map.of(
                "content", pg.getContent().stream().map(this::row).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages());
    }

    /** 단건 조회 — partnerId 지정 시 본인 파트너 주문만 */
    public ShopOrder find(Long id, Long partnerId) {
        ShopOrder o = orderRepo.findById(id).orElse(null);
        if (o == null || (partnerId != null && !partnerId.equals(o.getPartnerId()))) return null;
        return o;
    }

    public ResponseEntity<?> changeStatus(ShopOrder o, String status) {
        if (o == null) return ResponseEntity.status(404).body(Map.of("message", "주문을 찾을 수 없습니다."));
        if (status == null || !STATUSES.contains(status.trim()))
            return ResponseEntity.badRequest().body(Map.of("message", "주문상태는 접수/입금/배송완료/취소 중 하나여야 합니다."));
        o.setStatus(status.trim());
        orderRepo.save(o);
        return ResponseEntity.ok(detail(o));
    }
}
