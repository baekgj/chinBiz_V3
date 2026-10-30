package com.chinbiz.api.order;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * HOME 단순배송상품 주문 (docs/33). 카카오 상품링크(refId=sale.id, ordNo=sale.order_no)로 진입한 고객 전용 —
 * refId·ordNo 가 모두 일치하고 상품이 단순배송상품일 때만 조회/주문 가능.
 *  - GET  /api/public/orders/form?refId=&ordNo=      : 주문서 초기값(상품·판매가·주문자 기본값, 기존 주문 id)
 *  - POST /api/public/orders                          : 주문 저장(order + order_delivery)
 *  - GET  /api/public/orders/complete?refId=&ordNo=  : 주문완료(무통장이면 파트너사 입금계좌 포함)
 */
@RestController
@RequestMapping("/api/public/orders")
public class PublicOrderController {

    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final ShopOrderRepository orderRepo;
    private final OrderDeliveryRepository deliveryRepo;
    private final OrderService orderService;

    public PublicOrderController(SaleRepository saleRepo, ProductRepository productRepo, PartnerRepository partnerRepo,
                                 ShopOrderRepository orderRepo, OrderDeliveryRepository deliveryRepo, OrderService orderService) {
        this.saleRepo = saleRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo;
        this.orderRepo = orderRepo; this.deliveryRepo = deliveryRepo; this.orderService = orderService;
    }

    private Sale findSale(Long refId, String ordNo) {
        if (refId == null || ordNo == null || ordNo.isBlank()) return null;
        return saleRepo.findById(refId).filter(s -> ordNo.trim().equals(s.getOrderNo())).orElse(null);
    }

    /** 영업 건의 상품이 판매중 단순배송상품이면 반환 */
    private Product simpleProduct(Sale s) {
        if (s == null || s.getProductId() == null) return null;
        return productRepo.findById(s.getProductId()).filter(p -> p.isSimpleDelivery() && p.isOnSale()).orElse(null);
    }

    private static ResponseEntity<?> notFound() {
        return ResponseEntity.status(404).body(Map.of("message", "주문 가능한 상품 정보를 찾을 수 없습니다."));
    }

    @GetMapping("/form")
    public ResponseEntity<?> form(@RequestParam Long refId, @RequestParam String ordNo) {
        Sale s = findSale(refId, ordNo);
        Product p = simpleProduct(s);
        if (p == null) return notFound();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("orderNo", s.getOrderNo());
        m.put("productId", p.getId());
        m.put("productName", p.getName());
        m.put("salePrice", p.getSalePrice() == null ? 0 : p.getSalePrice());
        m.put("image1", p.getImage1());
        // 주문자 기본값 — 영업 건의 대표자 정보
        m.put("ordererName", s.getCeoName());
        m.put("ordererTel", s.getCompanyPhone());
        m.put("ordererMobile", s.getCeoPhone() != null ? s.getCeoPhone() : s.getPhone());
        m.put("ordererEmail", s.getEmail());
        m.put("ordererZipcode", s.getZipcode());
        m.put("ordererAddress", s.getAddress());
        m.put("ordererAddressDetail", s.getAddressDetail());
        m.put("existingOrderId", orderRepo.findFirstBySaleIdAndOrderNoOrderByIdDesc(s.getId(), s.getOrderNo()).map(ShopOrder::getId).orElse(null));
        return ResponseEntity.ok(m);
    }

    public record DeliveryReq(String receiverName, String receiverMobile, String zipcode, String address, String addressDetail, Integer quantity) {}
    public record OrderReq(Long refId, String ordNo, Long productId, Integer quantity, String payMethod,
                           String ordererName, String ordererTel, String ordererMobile, String ordererEmail,
                           String ordererZipcode, String ordererAddress, String ordererAddressDetail,
                           List<DeliveryReq> deliveries) {}

    private static boolean blank(String v) { return v == null || v.isBlank(); }
    private static String trim(String v) { return v == null ? null : v.trim(); }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody OrderReq req) {
        Sale s = findSale(req.refId(), req.ordNo());
        Product p = simpleProduct(s);
        if (p == null || (req.productId() != null && !req.productId().equals(p.getId()))) return notFound();
        if (orderRepo.findFirstBySaleIdAndOrderNoOrderByIdDesc(s.getId(), s.getOrderNo()).isPresent())
            return ResponseEntity.status(409).body(Map.of("message", "이미 주문이 접수된 건입니다."));

        int qty = req.quantity() == null ? 0 : req.quantity();
        if (qty < 1 || qty > 999) return bad("구매수량을 확인해 주세요.");
        if (!"BANK".equals(req.payMethod())) return bad("현재 무통장 결제만 가능합니다.");
        if (blank(req.ordererName()) || blank(req.ordererMobile()) || blank(req.ordererAddress()))
            return bad("주문자 정보(주문자명·핸드폰번호·주소)를 입력해 주세요.");
        List<DeliveryReq> ds = req.deliveries() == null ? List.of() : req.deliveries();
        if (ds.isEmpty()) return bad("수령인 정보를 입력해 주세요.");
        if (ds.size() > qty) return bad("배송지는 구매수량을 초과할 수 없습니다.");
        int sum = 0;
        for (DeliveryReq d : ds) {
            int dq = d.quantity() == null ? 0 : d.quantity();
            if (blank(d.receiverName()) || blank(d.receiverMobile()) || blank(d.address()))
                return bad("수령인 정보(수령인명·핸드폰번호·주소)를 모두 입력해 주세요.");
            if (dq < 1 || dq > qty) return bad("배송지별 수량은 1 이상, 구매수량 이하로 입력해 주세요.");
            sum += dq;
        }
        if (sum != qty) return bad("배송지별 수량의 합계(" + sum + ")가 구매수량(" + qty + ")과 같아야 합니다.");

        long price = p.getSalePrice() == null ? 0 : p.getSalePrice();
        ShopOrder o = new ShopOrder();
        o.setOrderNo(s.getOrderNo());
        o.setSaleId(s.getId());
        o.setProductId(p.getId());
        o.setPartnerId(p.getPartnerId());
        o.setProductName(p.getName());
        o.setSalePrice(price);
        o.setQuantity(qty);
        o.setTotalAmount(price * qty);
        o.setPayMethod("BANK");
        o.setStatus("접수");
        o.setOrdererName(trim(req.ordererName()));
        o.setOrdererTel(trim(req.ordererTel()));
        o.setOrdererMobile(trim(req.ordererMobile()));
        o.setOrdererEmail(trim(req.ordererEmail()));
        o.setOrdererZipcode(trim(req.ordererZipcode()));
        o.setOrdererAddress(trim(req.ordererAddress()));
        o.setOrdererAddressDetail(trim(req.ordererAddressDetail()));
        o = orderRepo.save(o);
        for (DeliveryReq d : ds) {
            OrderDelivery od = new OrderDelivery();
            od.setOrderId(o.getId());
            od.setReceiverName(trim(d.receiverName()));
            od.setReceiverMobile(trim(d.receiverMobile()));
            od.setZipcode(trim(d.zipcode()));
            od.setAddress(trim(d.address()));
            od.setAddressDetail(trim(d.addressDetail()));
            od.setQuantity(d.quantity());
            deliveryRepo.save(od);
        }
        return ResponseEntity.status(201).body(Map.of("id", o.getId(), "orderNo", o.getOrderNo()));
    }

    @GetMapping("/complete")
    public ResponseEntity<?> complete(@RequestParam Long refId, @RequestParam String ordNo) {
        Sale s = findSale(refId, ordNo);
        ShopOrder o = s == null ? null : orderRepo.findFirstBySaleIdAndOrderNoOrderByIdDesc(s.getId(), s.getOrderNo()).orElse(null);
        if (o == null) return ResponseEntity.status(404).body(Map.of("message", "주문 내역을 찾을 수 없습니다."));
        Map<String, Object> m = orderService.detail(o);
        if ("BANK".equals(o.getPayMethod()) && o.getPartnerId() != null) {
            partnerRepo.findById(o.getPartnerId()).ifPresent((Partner pt) -> {
                Map<String, Object> bank = new LinkedHashMap<>();
                bank.put("bankName", pt.getBankName());
                bank.put("accountNumber", pt.getAccountNumber());
                bank.put("accountHolder", pt.getAccountHolder());
                m.put("bank", bank);
            });
        }
        return ResponseEntity.ok(m);
    }

    private static ResponseEntity<?> bad(String msg) { return ResponseEntity.badRequest().body(Map.of("message", msg)); }
}
