package com.chinbiz.api.agree;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 홈 상품화면 고객 동의 (docs/27, 비로그인 공개). 대표자가 카카오톡으로 받은
 * /products/{상품번호}?refId={sale.id}&ordNo={order_no} 링크로 접근 — refId·ordNo 가 모두 일치해야 조회/저장.
 *  - GET  /api/public/sale-consent?refId=&ordNo=          : 동의 상태 + 매니저 배정 현황
 *  - POST /api/public/sale-consent {refId,ordNo,agreeType,agreeCheck} : agree Insert (+provide면 sale 반영)
 */
@RestController
@RequestMapping("/api/public/sale-consent")
public class PublicSaleConsentController {

    private final SaleRepository saleRepo;
    private final AgreeRepository agreeRepo;
    private final UserRepository userRepo;

    public PublicSaleConsentController(SaleRepository saleRepo, AgreeRepository agreeRepo, UserRepository userRepo) {
        this.saleRepo = saleRepo; this.agreeRepo = agreeRepo; this.userRepo = userRepo;
    }

    private Sale find(Long refId, String ordNo) {
        if (refId == null || ordNo == null || ordNo.isBlank()) return null;
        return saleRepo.findById(refId).filter(s -> ordNo.trim().equals(s.getOrderNo())).orElse(null);
    }

    private String latest(Sale s, String type) {
        if (s.getCeoName() == null || s.getCeoName().isBlank()) return null;
        // 대표자 전화 미입력 건은 phone IS NULL 로 매칭 (저장 시에도 null 로 기록됨)
        String phone = s.getCeoPhone() == null || s.getCeoPhone().isBlank() ? null : s.getCeoPhone().trim();
        return agreeRepo.findFirstByAgreeTypeAndNameAndPhoneOrderByIdDesc(type, s.getCeoName().trim(), phone)
                .map(Agree::getAgreeCheck).orElse(null);
    }

    private Map<String, Object> dto(Sale s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("productId", s.getProductId());
        m.put("agreeCheck", s.getAgreeCheck() == null ? "N" : s.getAgreeCheck());
        m.put("provide", latest(s, Agree.PROVIDE));     // 최근 선택(Y/N, 미선택 null)
        m.put("marketing", latest(s, Agree.MARKETING));
        User mgr = s.getManagerId() == null ? null : userRepo.findById(s.getManagerId()).orElse(null);
        m.put("managerAssigned", mgr != null);
        m.put("managerName", mgr == null ? null : mgr.getName());
        m.put("managerPhone", mgr == null ? null : mgr.getPhone());
        return m;
    }

    @GetMapping
    public ResponseEntity<?> get(@RequestParam Long refId, @RequestParam String ordNo) {
        Sale s = find(refId, ordNo);
        if (s == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 정보를 찾을 수 없습니다."));
        return ResponseEntity.ok(dto(s));
    }

    public record ConsentRequest(Long refId, String ordNo, String agreeType, String agreeCheck) {}

    @PostMapping
    public ResponseEntity<?> agree(@RequestBody ConsentRequest req) {
        Sale s = find(req.refId(), req.ordNo());
        if (s == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 정보를 찾을 수 없습니다."));
        String type = req.agreeType();
        if (!Agree.PROVIDE.equals(type) && !Agree.MARKETING.equals(type))
            return ResponseEntity.badRequest().body(Map.of("message", "동의구분이 올바르지 않습니다."));
        String check = "Y".equals(req.agreeCheck()) ? "Y" : "N";
        LocalDateTime now = LocalDateTime.now();

        Agree a = new Agree();
        a.setAgreeType(type);
        a.setName(s.getCeoName() == null ? null : s.getCeoName().trim());
        a.setPhone(s.getCeoPhone() == null || s.getCeoPhone().isBlank() ? null : s.getCeoPhone().trim());
        a.setEmail(s.getEmail());
        String addr = ((s.getAddress() == null ? "" : s.getAddress()) + " " + (s.getAddressDetail() == null ? "" : s.getAddressDetail())).trim();
        a.setAddress(addr.isEmpty() ? null : addr);
        a.setAgreeCheck(check);
        a.setAgreeDate(now);
        agreeRepo.save(a);

        // 개인정보 3자제공 → 영업 건 동의상태 반영 (Y면 매니저 [버즈1차접수현황] 노출)
        if (Agree.PROVIDE.equals(type)) {
            s.setAgreeCheck(check);
            s.setAgreeDate(now);
            saleRepo.save(s);
        }
        return ResponseEntity.ok(dto(s));
    }
}
