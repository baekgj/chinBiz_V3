package com.chinbiz.api.org;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowancePayment;
import com.chinbiz.api.allowance.AllowancePaymentRepository;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 본사 [수당및정산관리] — 매출현황 ▸ 마감내역 ▸ 정산내역 ▸ 지급내역 (MASTER_ADMIN, /api/org).
 *  매출현황  : confirm_date=검색월·MP·미지급·fixed_month=null  → [마감완료] fixed_date/fixed_month 기록
 *  마감내역  : fixed_month=검색월·미지급 회원별 합산            → [정산완료] paid=1 + allowance_payment 생성
 *  정산내역  : allowance_payment fixed_month=검색월·미지급(N)    → [지급완료] payment_flag=Y, payment_date
 *  지급내역  : allowance_payment fixed_month=검색월·지급완료(Y)
 */
@RestController
@RequestMapping("/api/org/settlement")
public class MasterSettlementController {

    private final AllowanceRepository allowanceRepo;
    private final AllowancePaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final SaleRepository saleRepo;
    private final com.chinbiz.api.alarm.AlarmService alarmService;

    private static final Map<String, String> MT = Map.of(
            "BUZZ", "버즈회원", "TOPBUZZ", "추천(친쿠)", "MANAGER", "관리매니저",
            "BUZZ_CENTER", "소속센터", "MANAGER_CENTER", "관리센터", "DIVISION", "본부", "HQ", "본사", "MASTER", "본사");

    public MasterSettlementController(AllowanceRepository allowanceRepo, AllowancePaymentRepository paymentRepo,
                                      UserRepository userRepo, SaleRepository saleRepo,
                                      com.chinbiz.api.alarm.AlarmService alarmService) {
        this.allowanceRepo = allowanceRepo; this.paymentRepo = paymentRepo;
        this.userRepo = userRepo; this.saleRepo = saleRepo;
        this.alarmService = alarmService;
    }

    private LocalDate[] range(String month) {
        if (month == null || month.length() != 6) return null;
        int y = Integer.parseInt(month.substring(0, 4)), m = Integer.parseInt(month.substring(4));
        LocalDate from = LocalDate.of(y, m, 1);
        return new LocalDate[]{ from, from.plusMonths(1) };
    }
    private String label(Allowance.MemberType t) { return t == null ? null : MT.getOrDefault(t.name(), t.name()); }
    /** "202607" → "202608" (익월) */
    private String nextMonth(String yyyymm) {
        int y = Integer.parseInt(yyyymm.substring(0, 4)), m = Integer.parseInt(yyyymm.substring(4));
        if (++m > 12) { m = 1; y++; }
        return String.format("%04d%02d", y, m);
    }
    private User byUserId(String uid) { return uid == null ? null : userRepo.findByUserId(uid).orElse(null); }

    // ───────── 1) 매출현황 ─────────
    @GetMapping("/sales")
    public ResponseEntity<?> sales(@RequestParam String month) {
        LocalDate[] r = range(month);
        if (r == null) return ResponseEntity.badRequest().body(Map.of("message", "대상월(YYYYMM)을 선택해 주세요."));
        Map<String, LocalDateTime> saleCreated = new HashMap<>();
        saleRepo.findAll().forEach(s -> { if (s.getOrderNo() != null) saleCreated.put(s.getOrderNo(), s.getCreatedAt()); });

        List<Map<String, Object>> list = new ArrayList<>();
        long total = 0;
        for (Allowance a : allowanceRepo.findSalesForClose(Allowance.Status.MP, r[0], r[1])) {
            LocalDateTime sc = a.getOrderNo() == null ? null : saleCreated.get(a.getOrderNo());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("saleRegDate", sc == null ? null : sc.toLocalDate().toString());
            m.put("orderNo", a.getOrderNo());
            m.put("memberType", label(a.getMemberType()));
            m.put("memberId", a.getMemberId());
            m.put("allowanceType", a.getType() == null ? null : a.getType().name());
            m.put("amount", a.getAmount());
            m.put("confirmDate", a.getConfirmDate() == null ? null : a.getConfirmDate().toString());
            list.add(m);
            total += a.getAmount() == null ? 0 : a.getAmount();
        }
        return ResponseEntity.ok(Map.of("content", list, "total", total, "count", list.size()));
    }

    @PostMapping("/sales/close")
    @Transactional
    public ResponseEntity<?> closeSales(@RequestBody Map<String, String> body) {
        String month = body.get("month");
        LocalDate[] r = range(month);
        if (r == null) return ResponseEntity.badRequest().body(Map.of("message", "대상월(YYYYMM)을 선택해 주세요."));
        LocalDateTime now = LocalDateTime.now();
        List<Allowance> rows = allowanceRepo.findSalesForClose(Allowance.Status.MP, r[0], r[1]);
        for (Allowance a : rows) { a.setFixedDate(now); a.setFixedMonth(month); }
        allowanceRepo.saveAll(rows);
        // [마감완료] 알람 (버즈/매니저/센터/본부) — docs/17
        try {
            List<String[]> members = new ArrayList<>();
            for (Allowance a : rows) if (a.getMemberType() != null) members.add(new String[]{ a.getMemberType().name(), a.getMemberId() });
            alarmService.fireSettlement("CLOSE", month, members);
        } catch (Exception ignore) {}
        return ResponseEntity.ok(Map.of("message", rows.size() + "건 마감완료 (확정월 " + month + ")", "count", rows.size()));
    }

    // ───────── 2) 마감내역 (회원별 합산) ─────────
    @GetMapping("/closed")
    public ResponseEntity<?> closed(@RequestParam String month) {
        // 회원유형+회원id 별 합산 (순서 유지)
        Map<String, Object[]> grp = new LinkedHashMap<>(); // key → [MemberType, memberId, sum]
        long total = 0;
        for (Allowance a : allowanceRepo.findByFixedMonthAndPaidFalse(month)) {
            String key = a.getMemberType() + "|" + a.getMemberId();
            Object[] g = grp.computeIfAbsent(key, k -> new Object[]{ a.getMemberType(), a.getMemberId(), 0L });
            g[2] = (Long) g[2] + (a.getAmount() == null ? 0 : a.getAmount());
        }
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] g : grp.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("memberType", label((Allowance.MemberType) g[0]));
            m.put("memberId", g[1]);
            m.put("amount", g[2]);
            list.add(m);
            total += (Long) g[2];
        }
        return ResponseEntity.ok(Map.of("content", list, "total", total, "count", list.size()));
    }

    @PostMapping("/closed/settle")
    @Transactional
    public ResponseEntity<?> settle(@RequestBody Map<String, String> body) {
        String month = body.get("month");
        if (month == null || month.length() != 6) return ResponseEntity.badRequest().body(Map.of("message", "대상월(YYYYMM)을 선택해 주세요."));
        LocalDateTime now = LocalDateTime.now();
        List<Allowance> rows = allowanceRepo.findByFixedMonthAndPaidFalse(month);
        // 회원유형+회원id 합산
        Map<String, Object[]> grp = new LinkedHashMap<>();
        for (Allowance a : rows) {
            String key = a.getMemberType() + "|" + a.getMemberId();
            Object[] g = grp.computeIfAbsent(key, k -> new Object[]{ a.getMemberType(), a.getMemberId(), 0L });
            g[2] = (Long) g[2] + (a.getAmount() == null ? 0 : a.getAmount());
        }
        // MP 1만원 미만 → 익월 이월(미정산). 1만원 이상 → 당월 정산.
        final long MIN = 10000;
        String next = nextMonth(month);
        java.util.Set<String> settledKeys = new java.util.HashSet<>();
        for (Object[] g : grp.values()) if ((Long) g[2] >= MIN) settledKeys.add(g[0] + "|" + g[1]);
        for (Allowance a : rows) {
            String key = a.getMemberType() + "|" + a.getMemberId();
            if (settledKeys.contains(key)) a.setPaid(true);        // 정산완료
            else a.setFixedMonth(next);                             // 익월 이월
        }
        allowanceRepo.saveAll(rows);
        int created = 0, skipped = 0;
        List<String[]> settledMembers = new ArrayList<>(), skippedMembers = new ArrayList<>();
        for (Object[] g : grp.values()) {
            boolean ok = (Long) g[2] >= MIN;
            String[] mp = new String[]{ ((Allowance.MemberType) g[0]).name(), (String) g[1] };
            if (!ok) { skipped++; skippedMembers.add(mp); continue; }
            settledMembers.add(mp);
            AllowancePayment p = new AllowancePayment();
            p.setMemberType((Allowance.MemberType) g[0]);
            p.setMemberId((String) g[1]);
            p.setFixedMonth(month);
            p.setPaymentAmount((Long) g[2]);
            p.setCreatedDate(now);
            p.setPaymentFlag("N");
            User u = byUserId((String) g[1]);
            if (u != null) { p.setAccountHolder(u.getAccountHolder()); p.setAccountNumber(u.getAccountNumber()); p.setAccountBankname(u.getBankName()); }
            paymentRepo.save(p);
            created++;
        }
        // [정산완료] 알람(정산대상) / [정산완료(미정산대상)] 알람(1만원 미만 이월) — docs/17·18
        try { alarmService.fireSettlement("SETTLE", month, settledMembers); } catch (Exception ignore) {}
        try { alarmService.fireSettlement("SETTLE_SKIP", month, skippedMembers); } catch (Exception ignore) {}
        return ResponseEntity.ok(Map.of(
                "message", "정산완료 — 정산전표 " + created + "건 생성, 미정산(1만원 미만) " + skipped + "명 익월(" + next + ") 이월",
                "count", created, "skipped", skipped));
    }

    // ───────── 3) 정산내역 (미지급) / 4) 지급내역 (지급완료) ─────────
    private List<Map<String, Object>> paymentRows(String month, String flag, boolean withPaidDate) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (AllowancePayment p : paymentRepo.findByFixedMonthAndPaymentFlagOrderByIdDesc(month, flag)) {
            User u = byUserId(p.getMemberId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("memberType", label(p.getMemberType()));
            m.put("memberId", p.getMemberId());
            m.put("bankName", p.getAccountBankname() != null ? p.getAccountBankname() : (u == null ? null : u.getBankName()));
            m.put("accountNumber", p.getAccountNumber() != null ? p.getAccountNumber() : (u == null ? null : u.getAccountNumber()));
            m.put("accountHolder", p.getAccountHolder() != null ? p.getAccountHolder() : (u == null ? null : u.getAccountHolder()));
            m.put("amount", p.getPaymentAmount());
            if (withPaidDate) m.put("paymentDate", p.getPaymentDate() == null ? null : p.getPaymentDate().toLocalDate().toString());
            list.add(m);
        }
        return list;
    }

    @GetMapping("/payments")
    public ResponseEntity<?> payments(@RequestParam String month) {
        return ResponseEntity.ok(Map.of("content", paymentRows(month, "N", false)));
    }

    @PostMapping("/payments/pay")
    @Transactional
    public ResponseEntity<?> pay(@RequestBody Map<String, String> body) {
        String month = body.get("month");
        if (month == null || month.length() != 6) return ResponseEntity.badRequest().body(Map.of("message", "대상월(YYYYMM)을 선택해 주세요."));
        LocalDateTime now = LocalDateTime.now();
        List<AllowancePayment> rows = paymentRepo.findByFixedMonthAndPaymentFlagOrderByIdDesc(month, "N");
        for (AllowancePayment p : rows) { p.setPaymentFlag("Y"); p.setPaymentDate(now); }
        paymentRepo.saveAll(rows);
        // [지급완료] 알람 (버즈/매니저/센터/본부) — docs/17
        try {
            List<String[]> members = new ArrayList<>();
            for (AllowancePayment p : rows) if (p.getMemberType() != null) members.add(new String[]{ p.getMemberType().name(), p.getMemberId() });
            alarmService.fireSettlement("PAY", month, members);
        } catch (Exception ignore) {}
        return ResponseEntity.ok(Map.of("message", rows.size() + "건 지급완료 처리", "count", rows.size()));
    }

    @GetMapping("/paid")
    public ResponseEntity<?> paid(@RequestParam String month) {
        return ResponseEntity.ok(Map.of("content", paymentRows(month, "Y", true)));
    }
}
