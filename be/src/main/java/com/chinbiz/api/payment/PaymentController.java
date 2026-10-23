package com.chinbiz.api.payment;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.setting.AppSettingRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 회비/입점비 결제 API (토스페이먼츠 연동 골격).
 *  - GET  /api/payment/info     : 옵션·금액·상태·사용가능MP + 토스 clientKey(연동 시)
 *  - POST /api/payment/prepare  : 결제 준비(주문번호 발급, PENDING 기록). MP수당은 즉시 내부 처리.
 *  - POST /api/payment/confirm  : 결제 승인(토스 confirm). mock 모드면 승인 없이 완료.
 *  - POST /api/payment/webhook  : 토스 웹훅(가상계좌 입금완료 등) — permitAll.
 * 대상: MANAGER·CENTER_ADMIN(회비 월/연), PARTNER(입점비). 수단: 신용카드/가상계좌/계좌이체/간편결제/MP수당.
 */
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    static final int VAT_PERCENT = 10;
    static final List<String> METHODS = List.of("CARD", "VBANK", "TRANSFER", "NAVERPAY", "KAKAOPAY", "MP");
    static final List<String> METHODS_PARTNER = List.of("CARD", "VBANK", "TRANSFER", "NAVERPAY", "KAKAOPAY"); // 파트너는 MP수당 제외

    private final UserRepository userRepo;
    private final PartnerRepository partnerRepo;
    private final AppSettingRepository settingRepo;
    private final AllowanceRepository allowanceRepo;
    private final MembershipPaymentRepository payRepo;
    private final TossPaymentClient toss;

    public PaymentController(UserRepository userRepo, PartnerRepository partnerRepo, AppSettingRepository settingRepo,
                             AllowanceRepository allowanceRepo, MembershipPaymentRepository payRepo, TossPaymentClient toss) {
        this.userRepo = userRepo; this.partnerRepo = partnerRepo; this.settingRepo = settingRepo;
        this.allowanceRepo = allowanceRepo; this.payRepo = payRepo; this.toss = toss;
    }

    /** 공급가(부가세 제외). 설정 회비는 부가세 포함 금액으로 간주 → MP수당 결제 시 부가세 제외액. */
    private long supplyValue(long baseFee) { return Math.round(baseFee / (1.0 + VAT_PERCENT / 100.0)); }

    private long availableMp(String loginId) {
        // MP수당 결제 차감은 allowance 원장(type=MEMBERSHIP, 음수, MP)으로 반영되므로 원장 합계만 사용
        return Math.max(0, allowanceRepo.sumAvailableMp(loginId));
    }

    /** MP수당 회비 결제 → allowance 원장 차감 전표 insert (type=MEMBERSHIP, amount=-금액, status=MP, fixed_date=결제일) */
    private void insertMembershipDeduction(String memberId, String role, long amount, String orderId) {
        Allowance a = new Allowance();
        a.setType(Allowance.Type.MEMBERSHIP);
        a.setOrderNo(orderId);                    // 복합PK 유일성(결제 주문번호)
        a.setMemberType("CENTER_ADMIN".equals(role) ? Allowance.MemberType.MANAGER_CENTER : Allowance.MemberType.MANAGER);
        a.setMemberId(memberId);
        a.setStatus(Allowance.Status.MP);
        a.setAmount(-amount);                     // 차감(음수)
        a.setFixedDate(java.time.LocalDateTime.now()); // 결제일(확정일자)
        a.setPaid(false);
        allowanceRepo.save(a);
    }

    private List<Map<String, Object>> feeOptions(Role role) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (role == Role.MANAGER) {
            list.add(opt("monthly", "월회비", settingRepo.getLong("fee_manager_monthly", 0)));
            list.add(opt("yearly", "연회비", settingRepo.getLong("fee_manager_yearly", 0)));
        } else if (role == Role.CENTER_ADMIN) {
            list.add(opt("monthly", "월회비", settingRepo.getLong("fee_center_monthly", 0)));
            list.add(opt("yearly", "연회비", settingRepo.getLong("fee_center_yearly", 0)));
        }
        return list;
    }

    private Map<String, Object> opt(String key, String label, long baseFee) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key); m.put("label", label);
        m.put("baseFee", baseFee); m.put("supplyValue", supplyValue(baseFee));
        return m;
    }

    private long baseFeeFor(Role role, String feeType) {
        if (role == Role.MANAGER) return "yearly".equals(feeType) ? settingRepo.getLong("fee_manager_yearly", 0) : settingRepo.getLong("fee_manager_monthly", 0);
        if (role == Role.CENTER_ADMIN) return "yearly".equals(feeType) ? settingRepo.getLong("fee_center_yearly", 0) : settingRepo.getLong("fee_center_monthly", 0);
        return settingRepo.getLong("fee_partner_entry", 0);
    }

    private String orderName(String role, String feeType) {
        if ("entry".equals(feeType)) return "친비즈 파트너 입점비";
        String who = "CENTER_ADMIN".equals(role) ? "센터" : "관리매니저";
        return "친비즈 " + who + ("yearly".equals(feeType) ? " 연회비" : " 월회비");
    }

    // ================= info =================
    @GetMapping("/info")
    public ResponseEntity<?> info(Authentication auth) {
        User u = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        if (u != null) {
            if (u.getRole() != Role.MANAGER && u.getRole() != Role.CENTER_ADMIN)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "결제 대상 회원이 아닙니다."));
            return ResponseEntity.ok(userInfo(u));
        }
        Partner p = auth == null ? null : partnerRepo.findByPartnerId(auth.getName()).orElse(null);
        if (p != null) return ResponseEntity.ok(partnerInfo(p));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
    }

    private Map<String, Object> commonInfo(Map<String, Object> m) {
        m.put("vatPercent", VAT_PERCENT);
        m.put("methods", METHODS);
        m.put("tossEnabled", toss.enabled());
        m.put("clientKey", toss.clientKey()); // 공개키(FE 결제창). mock 모드면 빈 문자열
        return m;
    }

    private Map<String, Object> userInfo(User u) {
        boolean expired = u.getMembershipExpiry() == null || u.getMembershipExpiry().isBefore(LocalDate.now());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("payerType", "USER");
        m.put("role", u.getRole().name());
        m.put("feeKind", "MEMBERSHIP");
        m.put("feeOptions", feeOptions(u.getRole()));
        m.put("availableMp", availableMp(u.getUserId()));
        m.put("membershipExpiry", u.getMembershipExpiry() == null ? null : u.getMembershipExpiry().toString());
        m.put("expired", expired);
        return commonInfo(m);
    }

    private Map<String, Object> partnerInfo(Partner p) {
        long fee = settingRepo.getLong("fee_partner_entry", 0);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("payerType", "PARTNER");
        m.put("role", "PARTNER");
        m.put("feeKind", "ENTRY");
        List<Map<String, Object>> opts = new ArrayList<>();
        opts.add(opt("entry", "입점비", fee));
        m.put("feeOptions", opts);
        m.put("availableMp", 0L);
        m.put("entryFeePaid", p.isEntryFeePaid());
        m.put("entryFeePaidDate", p.getEntryFeePaidDate() == null ? null : p.getEntryFeePaidDate().toString());
        Map<String, Object> res = commonInfo(m);
        res.put("methods", METHODS_PARTNER); // 파트너 결제수단에서 MP수당 제외
        return res;
    }

    /** 영수증 대상 결제수단(가상계좌·계좌이체) */
    private boolean receiptEligible(String method) { return "VBANK".equals(method) || "TRANSFER".equals(method); }
    private boolean hasText(String s) { return s != null && !s.isBlank(); }

    // ================= history (본인 결제 내역) =================
    @GetMapping("/history")
    public ResponseEntity<?> history(Authentication auth) {
        String payerType; Long payerId;
        User u = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        if (u != null) {
            if (u.getRole() != Role.MANAGER && u.getRole() != Role.CENTER_ADMIN)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "결제 대상 회원이 아닙니다."));
            payerType = "USER"; payerId = u.getId();
        } else {
            Partner p = auth == null ? null : partnerRepo.findByPartnerId(auth.getName()).orElse(null);
            if (p == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
            payerType = "PARTNER"; payerId = p.getId();
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        for (MembershipPayment p : payRepo.findByPayerTypeAndPayerIdOrderByIdDesc(payerType, payerId)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("paidAt", p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
            m.put("feeType", p.getFeeType());
            m.put("method", p.getMethod());
            m.put("baseFee", p.getBaseFee());
            m.put("vat", p.getVat());
            m.put("amount", p.getAmount());
            m.put("status", p.getStatus());
            m.put("expiryAfter", p.getExpiryAfter() == null ? null : p.getExpiryAfter().toString());
            m.put("orderId", p.getOrderId());
            // 영수증: 가상계좌/계좌이체 + 결제완료 시 발행 대상. 주민번호 有=세금계산서 / 無=현금영수증
            boolean eligible = receiptEligible(p.getMethod()) && "DONE".equals(p.getStatus());
            m.put("receiptEligible", eligible);
            m.put("receiptType", eligible ? "CASH_RECEIPT" : null); // 모든 발행은 현금영수증
            m.put("receiptStatus", p.getReceiptStatus());
            m.put("receiptKey", p.getReceiptKey());
            rows.add(m);
        }
        return ResponseEntity.ok(Map.of("content", rows));
    }

    // ================= [본사] 전체 회비/입점비 결제내역 =================
    private LocalDate parseDate(String s) {
        if (!hasText(s)) return null;
        try { return LocalDate.parse(s.trim()); } catch (Exception e) { return null; }
    }

    @GetMapping("/admin/list")
    public ResponseEntity<?> adminList(Authentication auth,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String target,   // MANAGER | CENTER_ADMIN | PARTNER
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String feeType,  // monthly | yearly | entry
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        User me = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null || me.getRole() != Role.MASTER_ADMIN)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본사 관리자 전용"));

        List<Specification<MembershipPayment>> specs = new ArrayList<>();
        // 미확정(prepare만=PENDING) 제외. NULL(구버전 완료건)은 포함 — SQL 3치논리 주의(NULL<>x=NULL)
        specs.add((r, q, cb) -> cb.or(cb.isNull(r.get("status")), cb.notEqual(r.get("status"), "PENDING")));
        if (hasText(target)) specs.add((r, q, cb) -> cb.equal(r.get("role"), target));
        if (hasText(method)) specs.add((r, q, cb) -> cb.equal(r.get("method"), method));
        if (hasText(feeType)) specs.add((r, q, cb) -> cb.equal(r.get("feeType"), feeType));
        if (hasText(keyword)) {
            String kw = "%" + keyword.trim() + "%";
            specs.add((r, q, cb) -> cb.or(cb.like(r.get("payerLoginId"), kw), cb.like(r.get("payerName"), kw)));
        }
        LocalDate fromD = parseDate(from), toD = parseDate(to);
        if (fromD != null) { LocalDateTime f = fromD.atStartOfDay(); specs.add((r, q, cb) -> cb.greaterThanOrEqualTo(r.get("createdAt"), f)); }
        if (toD != null) { LocalDateTime t = toD.plusDays(1).atStartOfDay(); specs.add((r, q, cb) -> cb.lessThan(r.get("createdAt"), t)); }

        Specification<MembershipPayment> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<MembershipPayment> pg = payRepo.findAll(spec,
                PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "id")));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (MembershipPayment p : pg.getContent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("paidAt", p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
            m.put("payerType", p.getPayerType());
            m.put("role", p.getRole());
            m.put("payerLoginId", p.getPayerLoginId());
            m.put("payerName", p.getPayerName());
            m.put("feeType", p.getFeeType());
            m.put("method", p.getMethod());
            m.put("amount", p.getAmount());
            m.put("expiryAfter", p.getExpiryAfter() == null ? null : p.getExpiryAfter().toString());
            m.put("status", p.getStatus());
            m.put("receiptType", p.getReceiptType());
            m.put("receiptStatus", p.getReceiptStatus());
            rows.add(m);
        }
        return ResponseEntity.ok(Map.of("content", rows, "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    /**
     * 현금영수증 발행(가상계좌·계좌이체). 결제완료 시 finalizePayment 에서 자동 호출(동시 발급).
     * 회원 주민번호 있으면 주민번호, 없으면 휴대폰번호로 발행. 이미 발행됐으면 skip. 성공 여부 반환.
     */
    private boolean issueCashReceiptFor(MembershipPayment mp) {
        if (!receiptEligible(mp.getMethod())) return false;
        if ("ISSUED".equals(mp.getReceiptStatus())) return true;
        String resident = null, phone = null;
        if ("USER".equals(mp.getPayerType())) {
            User u = userRepo.findById(mp.getPayerId()).orElse(null);
            if (u != null) { resident = u.getResidentNumber(); phone = u.getPhone(); }
        } else {
            Partner p = partnerRepo.findById(mp.getPayerId()).orElse(null);
            if (p != null) phone = p.getCompanyPhone() != null ? p.getCompanyPhone() : p.getManagerPhone();
        }
        String identity = hasText(resident) ? digits(resident) : digits(phone);
        TossPaymentClient.ReceiptResult rr = toss.issueCashReceipt(
                mp.getOrderId(), mp.getAmount(), orderName(mp.getRole(), mp.getFeeType()), identity, "소득공제");
        mp.setReceiptType("CASH_RECEIPT");
        mp.setReceiptStatus(rr.ok() ? "ISSUED" : "FAILED");
        if (rr.receiptKey() != null) mp.setReceiptKey(rr.receiptKey());
        payRepo.save(mp);
        return rr.ok();
    }

    /** 현금영수증 재발행(자동 발급 실패 시 fallback 버튼용) */
    @PostMapping("/{id}/receipt")
    public ResponseEntity<?> receipt(Authentication auth, @PathVariable Long id) {
        MembershipPayment mp = payRepo.findById(id).orElse(null);
        if (mp == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "결제 건을 찾을 수 없습니다."));
        if (auth == null || !mp.getPayerLoginId().equals(auth.getName()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 결제 건이 아닙니다."));
        if (!receiptEligible(mp.getMethod()))
            return ResponseEntity.badRequest().body(Map.of("message", "가상계좌·계좌이체 결제만 발행 대상입니다."));
        if (!"DONE".equals(mp.getStatus()))
            return ResponseEntity.badRequest().body(Map.of("message", "결제 완료 건만 발행할 수 있습니다."));
        if ("ISSUED".equals(mp.getReceiptStatus()))
            return ResponseEntity.ok(Map.of("message", "이미 발행되었습니다.", "receiptStatus", "ISSUED", "receiptKey", mp.getReceiptKey()));

        boolean ok = issueCashReceiptFor(mp);
        if (!ok) return ResponseEntity.badRequest().body(Map.of("message", "현금영수증 발행에 실패했습니다."));
        return ResponseEntity.ok(Map.of("message", "현금영수증 발행 요청이 완료되었습니다.",
                "receiptStatus", "ISSUED", "receiptKey", mp.getReceiptKey()));
    }

    private String digits(String s) { return s == null ? "" : s.replaceAll("[^0-9]", ""); }

    // ================= prepare =================
    public record PrepareRequest(String feeType, String method) {}

    @PostMapping("/prepare")
    public ResponseEntity<?> prepare(Authentication auth, @RequestBody PrepareRequest req) {
        if (req == null || req.method() == null || !METHODS.contains(req.method()))
            return ResponseEntity.badRequest().body(Map.of("message", "결제수단을 선택해 주세요."));

        User u = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        Partner p = u == null && auth != null ? partnerRepo.findByPartnerId(auth.getName()).orElse(null) : null;
        if (u == null && p == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        // 역할·금액 결정
        String role; String payerType; Long payerId; String loginId; String feeType; long baseFee;
        if (u != null) {
            if (u.getRole() != Role.MANAGER && u.getRole() != Role.CENTER_ADMIN)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "결제 대상 회원이 아닙니다."));
            role = u.getRole().name(); payerType = "USER"; payerId = u.getId(); loginId = u.getUserId();
            feeType = "yearly".equals(req.feeType()) ? "yearly" : "monthly";
            baseFee = baseFeeFor(u.getRole(), feeType);
        } else {
            role = "PARTNER"; payerType = "PARTNER"; payerId = p.getId(); loginId = p.getPartnerId();
            feeType = "entry"; baseFee = settingRepo.getLong("fee_partner_entry", 0);
            if (p.isEntryFeePaid()) return ResponseEntity.ok(Map.of("done", true, "info", partnerInfo(p)));
        }
        if (baseFee <= 0) return ResponseEntity.badRequest().body(Map.of("message", "설정된 금액이 없습니다. 본사에 문의해 주세요."));

        long supply = supplyValue(baseFee);
        boolean isMp = "MP".equals(req.method());
        long amount = isMp ? supply : baseFee;

        if (isMp && "PARTNER".equals(payerType))
            return ResponseEntity.badRequest().body(Map.of("message", "파트너 회원은 MP수당 결제를 사용할 수 없습니다."));
        if (isMp && availableMp(loginId) < amount)
            return ResponseEntity.badRequest().body(Map.of("message", "MP 수당 잔액이 부족합니다."));

        String payerName = u != null ? u.getName() : p.getCompanyName();
        MembershipPayment mp = new MembershipPayment();
        mp.setRole(role); mp.setPayerType(payerType); mp.setPayerId(payerId); mp.setPayerLoginId(loginId);
        mp.setPayerName(payerName);
        mp.setFeeType(feeType); mp.setMethod(req.method());
        mp.setBaseFee(baseFee); mp.setVat(baseFee - supply); mp.setAmount(amount);
        mp.setOrderId(newOrderId(loginId));
        mp.setStatus("PENDING");
        payRepo.save(mp);

        // MP수당 결제는 토스 미경유 → 즉시 내부 확정 + allowance 원장에 차감 전표 insert
        if (isMp) {
            finalizePayment(mp);
            insertMembershipDeduction(loginId, role, amount, mp.getOrderId());
            return ResponseEntity.ok(Map.of("done", true, "info", u != null ? userInfo(u) : partnerInfo(p)));
        }

        // 카드/가상계좌/계좌이체/간편결제 → FE 결제창(토스) 또는 mock 확정 경유
        String phone = u != null ? u.getPhone() : (p.getCompanyPhone() != null ? p.getCompanyPhone() : p.getManagerPhone());
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("done", false);
        res.put("orderId", mp.getOrderId());
        res.put("amount", amount);
        res.put("orderName", orderName(role, feeType));
        res.put("customerName", u != null ? u.getName() : loginId);
        res.put("customerMobilePhone", digits(phone));   // 현금영수증 결제창 발급용(가상계좌·계좌이체)
        res.put("receiptRequested", receiptEligible(req.method())); // 결제창에 현금영수증 요청 여부
        res.put("method", req.method());
        res.put("tossEnabled", toss.enabled());
        res.put("clientKey", toss.clientKey());
        return ResponseEntity.ok(res);
    }

    // ================= confirm =================
    public record ConfirmRequest(String orderId, String paymentKey, Long amount) {}

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(Authentication auth, @RequestBody ConfirmRequest req) {
        if (req == null || req.orderId() == null)
            return ResponseEntity.badRequest().body(Map.of("message", "주문번호가 없습니다."));
        MembershipPayment mp = payRepo.findByOrderId(req.orderId()).orElse(null);
        if (mp == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "결제 건을 찾을 수 없습니다."));
        // 본인 확인
        if (auth == null || !mp.getPayerLoginId().equals(auth.getName()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본인 결제 건이 아닙니다."));
        // 금액 위변조 검증
        if (req.amount() != null && !req.amount().equals(mp.getAmount()))
            return ResponseEntity.badRequest().body(Map.of("message", "결제 금액이 일치하지 않습니다."));
        if ("DONE".equals(mp.getStatus())) return ResponseEntity.ok(infoForPayment(mp)); // 멱등

        TossPaymentClient.ConfirmResult cr = toss.confirm(req.paymentKey(), req.orderId(), mp.getAmount());
        if (!cr.ok())
            return ResponseEntity.badRequest().body(Map.of("message", cr.message() == null ? "결제 승인에 실패했습니다." : cr.message()));
        mp.setPaymentKey(req.paymentKey());
        // 결제창에서 요청한 현금영수증이 발급되어 응답에 오면 반영(계좌이체 즉시 / 가상계좌는 입금 웹훅 시)
        if (receiptEligible(mp.getMethod()) && cr.cashReceiptKey() != null) {
            mp.setReceiptType("CASH_RECEIPT"); mp.setReceiptStatus("ISSUED"); mp.setReceiptKey(cr.cashReceiptKey());
        }

        if ("DONE".equals(cr.status())) {
            finalizePayment(mp);
        } else { // WAITING_FOR_DEPOSIT(가상계좌) 등 → 입금 대기, 웹훅으로 확정
            mp.setStatus("WAITING_DEPOSIT");
            payRepo.save(mp);
        }
        Map<String, Object> out = new LinkedHashMap<>(infoForPayment(mp));
        out.put("paymentStatus", mp.getStatus());
        return ResponseEntity.ok(out);
    }

    // ================= webhook (토스 서버 호출, permitAll) =================
    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody(required = false) JsonNode body) {
        try {
            if (body == null) return ResponseEntity.ok().build();
            JsonNode data = body.has("data") ? body.get("data") : body;
            String orderId = data.path("orderId").asText(null);
            String status = data.path("status").asText(null);
            JsonNode rcNode = data.path("cashReceipt").path("receiptKey");
            String cashReceiptKey = rcNode.isMissingNode() || rcNode.isNull() ? null : rcNode.asText();
            if (orderId != null) {
                payRepo.findByOrderId(orderId).ifPresent(mp -> {
                    if ("DONE".equalsIgnoreCase(status) && !"DONE".equals(mp.getStatus())) finalizePayment(mp);
                    // 가상계좌 입금 시 결제창에서 요청한 현금영수증이 발급되어 웹훅으로 전달됨
                    if (cashReceiptKey != null && receiptEligible(mp.getMethod()) && !"ISSUED".equals(mp.getReceiptStatus())) {
                        mp.setReceiptType("CASH_RECEIPT"); mp.setReceiptStatus("ISSUED"); mp.setReceiptKey(cashReceiptKey);
                        payRepo.save(mp);
                    }
                });
            }
        } catch (Exception ignore) { /* 웹훅은 200 유지 */ }
        return ResponseEntity.ok().build();
    }

    // ================= 공통 확정 처리 =================
    /** 결제 확정: 상태 DONE + 회원만기일자 연장(회비) / 입점비 납부(파트너). 멱등. */
    private void finalizePayment(MembershipPayment mp) {
        if ("DONE".equals(mp.getStatus())) return;
        if ("USER".equals(mp.getPayerType())) {
            User u = userRepo.findById(mp.getPayerId()).orElse(null);
            if (u != null) {
                LocalDate today = LocalDate.now();
                LocalDate base = (u.getMembershipExpiry() != null && u.getMembershipExpiry().isAfter(today)) ? u.getMembershipExpiry() : today;
                LocalDate newExpiry = "yearly".equals(mp.getFeeType()) ? base.plusYears(1) : base.plusMonths(1);
                u.setMembershipExpiry(newExpiry);
                userRepo.save(u);
                mp.setExpiryAfter(newExpiry);
            }
        } else {
            Partner p = partnerRepo.findById(mp.getPayerId()).orElse(null);
            if (p != null && !p.isEntryFeePaid()) {
                p.setEntryFeePaid(true);
                p.setEntryFeePaidDate(LocalDate.now());
                partnerRepo.save(p);
            }
        }
        mp.setStatus("DONE");
        payRepo.save(mp);

        // 현금영수증은 '결제창 전달 방식' — 토스가 결제창 요청분으로 자동 발급하고 confirm/webhook 응답으로 반영.
        // mock 모드(결제창 미노출)에서는 발급 상태만 시뮬레이션.
        if (receiptEligible(mp.getMethod()) && mp.getReceiptStatus() == null && !toss.enabled()) {
            mp.setReceiptType("CASH_RECEIPT");
            mp.setReceiptStatus("ISSUED");
            mp.setReceiptKey("AUTO-" + mp.getOrderId());
            payRepo.save(mp);
        }
    }

    private Map<String, Object> infoForPayment(MembershipPayment mp) {
        if ("USER".equals(mp.getPayerType()))
            return userRepo.findById(mp.getPayerId()).map(this::userInfo).orElse(Map.of());
        return partnerRepo.findById(mp.getPayerId()).map(this::partnerInfo).orElse(Map.of());
    }

    private String newOrderId(String loginId) {
        String rnd = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String base = "FEE-" + loginId + "-" + System.currentTimeMillis() + "-" + rnd;
        return base.length() > 64 ? base.substring(0, 64) : base;
    }
}
