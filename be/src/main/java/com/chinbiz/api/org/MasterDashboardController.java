package com.chinbiz.api.org;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowancePaymentRepository;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.partner.PartnerInquiry;
import com.chinbiz.api.partner.PartnerInquiryRepository;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 본사(MASTER_ADMIN) 대시보드 — 금월 플랫폼 총거래액(전월대비) / 본사 확정수익(전월대비).
 *  - 총거래액: 이달 등록된 sale × product.salePrice 합산
 *  - 확정수익: 회원구분 HQ, 상태 MP, member_id=로그인(본사) 이달 합산
 *  - /overview : 플랫폼 가동 현황(조직망 규모) + 빠른 처리 대기 + 실시간 활동 피드
 */
@RestController
@RequestMapping("/api/org/dashboard")
public class MasterDashboardController {

    private final SaleRepository saleRepo;
    private final AllowanceRepository allowanceRepo;
    private final UserRepository userRepo;
    private final PartnerRepository partnerRepo;
    private final ProductRepository productRepo;
    private final PartnerInquiryRepository inquiryRepo;
    private final AllowancePaymentRepository paymentRepo;

    public MasterDashboardController(SaleRepository saleRepo, AllowanceRepository allowanceRepo, UserRepository userRepo,
                                     PartnerRepository partnerRepo, ProductRepository productRepo,
                                     PartnerInquiryRepository inquiryRepo, AllowancePaymentRepository paymentRepo) {
        this.saleRepo = saleRepo; this.allowanceRepo = allowanceRepo; this.userRepo = userRepo;
        this.partnerRepo = partnerRepo; this.productRepo = productRepo;
        this.inquiryRepo = inquiryRepo; this.paymentRepo = paymentRepo;
    }

    /** 전월 대비 증감률(%) — 반올림 정수. 전월 0이면 이번달>0=100, 아니면 0 */
    private long rate(long cur, long prev) {
        if (prev == 0) return cur > 0 ? 100 : 0;
        return Math.round((cur - prev) * 100.0 / prev);
    }

    @GetMapping
    public ResponseEntity<?> dashboard(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User me = userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        LocalDateTime curFrom = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime curTo = curFrom.plusMonths(1);
        LocalDateTime prevFrom = curFrom.minusMonths(1);

        // 금월/전월 총거래액(GMV)
        long gmvCur = saleRepo.sumGmvBetween(curFrom, curTo);
        long gmvPrev = saleRepo.sumGmvBetween(prevFrom, curFrom);

        // 금월/전월 본사 확정수익 (HQ, MP)
        var hq = List.of(Allowance.MemberType.HQ);
        long profitCur = allowanceRepo.sumMonthly(me.getUserId(), Allowance.Status.MP, hq, curFrom, curTo);
        long profitPrev = allowanceRepo.sumMonthly(me.getUserId(), Allowance.Status.MP, hq, prevFrom, curFrom);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("gmv", gmvCur);
        m.put("gmvRate", rate(gmvCur, gmvPrev));
        m.put("profit", profitCur);
        m.put("profitRate", rate(profitCur, profitPrev));
        return ResponseEntity.ok(m);
    }

    /** 플랫폼 가동 현황 + 빠른 처리 대기 + 실시간 활동 피드 (DB 집계) */
    @GetMapping("/overview")
    public ResponseEntity<?> overview(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        // ── 플랫폼 가동 현황 ──
        Map<String, Object> platform = new LinkedHashMap<>();
        platform.put("partners", partnerRepo.count());
        platform.put("products", productRepo.countByOnSaleTrue());
        platform.put("divisions", userRepo.findByRole(Role.DIVISION_ADMIN).size());
        platform.put("centers", userRepo.findByRole(Role.CENTER_ADMIN).size());
        platform.put("managers", userRepo.findByRole(Role.MANAGER).size());
        platform.put("buzz", userRepo.findByRole(Role.BUZZ).size());

        // ── 빠른 처리 대기 ──
        Map<String, Object> pending = new LinkedHashMap<>();
        pending.put("partnerInquiry", inquiryRepo.countByStatus("NEW"));   // 신규 입점 상담신청
        pending.put("payoutApproval", paymentRepo.countByPaymentFlag("N")); // 미지급(출금승인 대기)
        pending.put("freeze", 0);                                           // 민원 동결(별도 테이블 없음)

        // ── 실시간 활동 피드 : 최근 영업 + 최근 입점신청 병합(시간 내림차순) ──
        List<Map<String, Object>> events = new ArrayList<>();
        var recentSales = saleRepo.findAll(PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        for (Sale s : recentSales) {
            String pname = s.getProductId() == null ? "상품" :
                    productRepo.findById(s.getProductId()).map(Product::getName).orElse("상품");
            String who = s.getCompanyName() != null && !s.getCompanyName().isBlank() ? s.getCompanyName() : "고객";
            String status = s.getStatus() == null ? "" : s.getStatus();
            String tone = switch (status) {
                case "구매확정" -> "pos";
                case "취소", "반품", "취소/반품" -> "danger";
                default -> "brand";
            };
            events.add(evt(s.getUpdatedAt() != null ? s.getUpdatedAt() : s.getCreatedAt(), tone,
                    "[" + who + "] " + pname + " " + (status.isBlank() ? "영업 등록" : status)));
        }
        for (PartnerInquiry q : inquiryRepo.findAllByOrderByIdDesc().stream().limit(5).toList()) {
            String co = q.getCompanyName() != null ? q.getCompanyName() : "신규 파트너사";
            String tone = "DONE".equals(q.getStatus()) ? "pos" : "warn";
            String label = "DONE".equals(q.getStatus()) ? "입점 상담 완료" : "입점 심사 요청";
            events.add(evt(q.getCreatedAt(), tone, "파트너사 [" + co + "] " + label));
        }
        events.sort((a, b) -> Long.compare((long) b.get("_ts"), (long) a.get("_ts")));
        List<Map<String, Object>> feed = new ArrayList<>();
        for (Map<String, Object> e : events.stream().limit(6).toList()) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("t", e.get("t")); f.put("tone", e.get("tone")); f.put("text", e.get("text"));
            feed.add(f);
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("platform", platform);
        m.put("pending", pending);
        m.put("feed", feed);
        return ResponseEntity.ok(m);
    }

    /** 피드 이벤트 1건 (정렬용 _ts, 상대시간 t 포함) */
    private Map<String, Object> evt(LocalDateTime at, String tone, String text) {
        Map<String, Object> m = new LinkedHashMap<>();
        long ts = at == null ? 0 : at.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
        m.put("_ts", ts);
        m.put("t", relTime(at));
        m.put("tone", tone);
        m.put("text", text);
        return m;
    }

    /** 상대 시간 표기 (방금 전 / N분 전 / N시간 전 / N일 전 / 날짜) */
    private String relTime(LocalDateTime at) {
        if (at == null) return "";
        Duration d = Duration.between(at, LocalDateTime.now());
        long sec = d.getSeconds();
        if (sec < 0) return "방금 전";
        if (sec < 60) return "방금 전";
        if (sec < 3600) return (sec / 60) + "분 전";
        if (sec < 86400) return (sec / 3600) + "시간 전";
        if (sec < 86400L * 30) return (sec / 86400) + "일 전";
        return at.toLocalDate().toString();
    }
}
