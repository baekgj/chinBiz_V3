package com.chinbiz.api.partner;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 파트너사 정산 원장 (PARTNER 전용).
 *  - GET /api/partner/settlement/ledger : 내 상품(partner_id)의 '구매확정' sale 목록
 *    → 상품별 total_allowance(총수당) 금액을 표시.
 */
@RestController
@RequestMapping("/api/partner/settlement")
public class PartnerSettlementController {

    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;

    private static final String STATUS_CONFIRMED = "구매확정";

    public PartnerSettlementController(SaleRepository saleRepo, ProductRepository productRepo, PartnerRepository partnerRepo) {
        this.saleRepo = saleRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo;
    }

    @GetMapping("/ledger")
    public ResponseEntity<?> ledger(Authentication auth) {
        Partner me = auth == null ? null : partnerRepo.findByPartnerId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        // 내 상품 id → Product 맵
        Map<Long, Product> myProducts = productRepo.findAll().stream()
                .filter(p -> me.getId().equals(p.getPartnerId()))
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        long total = 0;
        List<Map<String, Object>> list = new ArrayList<>();
        // 내 상품에 대한 '구매확정' sale
        List<Sale> sales = saleRepo.findAll().stream()
                .filter(s -> STATUS_CONFIRMED.equals(s.getStatus()))
                .filter(s -> s.getProductId() != null && myProducts.containsKey(s.getProductId()))
                .sorted(Comparator.comparing(Sale::getId).reversed())
                .toList();
        for (Sale s : sales) {
            Product p = myProducts.get(s.getProductId());
            long allowance = p.getTotalAllowance() == null ? 0L : p.getTotalAllowance();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("saleId", s.getId());
            m.put("orderNo", s.getOrderNo());
            m.put("productName", p.getName());
            m.put("customerName", s.getCompanyName());
            m.put("salePrice", p.getSalePrice());
            m.put("totalAllowance", allowance);
            m.put("status", s.getStatus());
            m.put("confirmedAt", s.getUpdatedAt() == null ? null : s.getUpdatedAt().toLocalDate().toString());
            m.put("createdAt", s.getCreatedAt() == null ? null : s.getCreatedAt().toLocalDate().toString());
            list.add(m);
            total += allowance;
        }
        return ResponseEntity.ok(Map.of("content", list, "totalAllowance", total, "count", list.size()));
    }
}
