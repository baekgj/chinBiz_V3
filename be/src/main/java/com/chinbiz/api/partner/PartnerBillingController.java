package com.chinbiz.api.partner;

import com.chinbiz.api.order.ShopOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 파트너사 [정산/수당현황 > 정산 현황] — 친비즈 본사 지급 수당 CP/MP (docs/34).
 *  CP = sale·partner_order 의 '접수'(주문접수) 건 상품금액 합계
 *  MP = sale·partner_order 의 '입금'(입금완료) 건 상품금액 합계
 */
@RestController
@RequestMapping("/api/partner/billing")
public class PartnerBillingController {

    private final PartnerRepository partnerRepo;
    private final ShopOrderRepository orderRepo;

    public PartnerBillingController(PartnerRepository partnerRepo, ShopOrderRepository orderRepo) {
        this.partnerRepo = partnerRepo; this.orderRepo = orderRepo;
    }

    @GetMapping
    public ResponseEntity<?> summary(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Partner me = partnerRepo.findByPartnerId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다."));
        return ResponseEntity.ok(Map.of(
                "cp", orderRepo.sumProductAmount(me.getId(), "접수"),
                "mp", orderRepo.sumProductAmount(me.getId(), "입금")));
    }
}
