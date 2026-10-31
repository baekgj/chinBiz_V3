package com.chinbiz.api.order;

import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 주문관리 (docs/33).
 *  - 파트너 admin [주문관리] : /api/partner/orders  (PARTNER, 본인 상품 주문만)
 *  - 본사 admin [조직망 및 영업관리]-[주문관리] : /api/org/orders (MASTER_ADMIN, 전체)
 */
@RestController
public class OrderAdminController {

    public record StatusRequest(String status) {}

    private final OrderService orderService;
    private final PartnerRepository partnerRepo;

    public OrderAdminController(OrderService orderService, PartnerRepository partnerRepo) {
        this.orderService = orderService; this.partnerRepo = partnerRepo;
    }

    private Long myPartnerId(Authentication auth) {
        return partnerRepo.findByPartnerId(auth.getName()).map(Partner::getId).orElse(-1L);
    }

    private static final Map<String, String> NOT_FOUND = Map.of("message", "주문을 찾을 수 없습니다.");

    // ── 파트너 ──
    @GetMapping("/api/partner/orders")
    public Map<String, Object> partnerList(Authentication auth, @RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return orderService.list(myPartnerId(auth), keyword, status, page, size);
    }

    @GetMapping("/api/partner/orders/{id}")
    public ResponseEntity<?> partnerDetail(Authentication auth, @PathVariable Long id) {
        ShopOrder o = orderService.find(id, myPartnerId(auth));
        return o == null ? ResponseEntity.status(404).body(NOT_FOUND) : ResponseEntity.ok(orderService.detail(o));
    }

    @PutMapping("/api/partner/orders/{id}/status")
    public ResponseEntity<?> partnerStatus(Authentication auth, @PathVariable Long id, @RequestBody StatusRequest req) {
        return orderService.changeStatus(orderService.find(id, myPartnerId(auth)), req.status());
    }

    // 송장/화물추적 (docs/33-1)
    public record InvoiceRequest(String courierCode, String invoiceNo) {}

    @GetMapping("/api/partner/orders/couriers")
    public java.util.List<CourierTracker.Courier> couriers() { return CourierTracker.COURIERS; }

    /** 송장정보 저장 */
    @PutMapping("/api/partner/orders/{id}/deliveries/{deliveryId}/invoice")
    public ResponseEntity<?> partnerInvoice(Authentication auth, @PathVariable Long id, @PathVariable Long deliveryId, @RequestBody InvoiceRequest req) {
        return orderService.saveInvoice(orderService.find(id, myPartnerId(auth)), deliveryId, req.courierCode(), req.invoiceNo(), false);
    }

    /** [화물추적] — 입력한 택배사·송장번호 저장 + 택배사 조회 → 배송상태 갱신 */
    @PostMapping("/api/partner/orders/{id}/deliveries/{deliveryId}/track")
    public ResponseEntity<?> partnerTrack(Authentication auth, @PathVariable Long id, @PathVariable Long deliveryId, @RequestBody InvoiceRequest req) {
        return orderService.saveInvoice(orderService.find(id, myPartnerId(auth)), deliveryId, req.courierCode(), req.invoiceNo(), true);
    }

    // ── 본사 ──
    @GetMapping("/api/org/orders")
    public Map<String, Object> masterList(@RequestParam(required = false) String keyword,
                                          @RequestParam(required = false) String status,
                                          @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return orderService.list(null, keyword, status, page, size);
    }

    @GetMapping("/api/org/orders/{id}")
    public ResponseEntity<?> masterDetail(@PathVariable Long id) {
        ShopOrder o = orderService.find(id, null);
        return o == null ? ResponseEntity.status(404).body(NOT_FOUND) : ResponseEntity.ok(orderService.detail(o));
    }

    @PutMapping("/api/org/orders/{id}/status")
    public ResponseEntity<?> masterStatus(@PathVariable Long id, @RequestBody StatusRequest req) {
        return orderService.changeStatus(orderService.find(id, null), req.status());
    }
}
