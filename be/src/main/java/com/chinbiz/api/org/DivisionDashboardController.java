package com.chinbiz.api.org;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowancePaymentRepository;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.buzz.ManagerCenter;
import com.chinbiz.api.buzz.ManagerCenterRepository;
import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 본부(DIVISION_ADMIN) 본부분석 · 센터별 실적비교 (docs/24, docs/35-1).
 *
 * 본부 ↔ 센터 계층: 본부장으로 할당된 본부행(center_code.fix_idx = 본인 user.id, center_code IS NULL)
 *                  + 본인 user.sales_center_id 코드의 head_code → 같은 head_code 의 센터행 전체 = 소속 센터.
 * 센터장   : 본사 [본부ᆞ센터 리스트]에서 할당된 계정 = center_code.fix_idx (docs/30). 없으면 미등록.
 * 버즈회원 : role=BUZZ 이고 sales_center_id = 센터 idx (소속센터).
 * 매니저   : manager_center 승인(Y) 활동센터 = 센터 idx (센터 [소속매니저]와 동일 기준).
 * 1차영업  : 등록자(sale.buzz_id)의 소속센터가 산하 센터인 건 (수당 원장 BUZZ_CENTER/DIVISION 라우팅과 동일 기준).
 * 본부수당 : allowance member_type=DIVISION, member_id=로그인 본부장. 센터 귀속 = 처리자(handler_id) 소속센터.
 *
 *  - GET /api/division/dashboard                      : CP(전체 예정) / MP(출금가능) + 산하 현황 + 센터장 지정 리스트
 *  - GET /api/division/centers?month=YYYY-MM          : 월별 산하 현황 + 센터별 실적 리스트
 *  - GET /api/division/centers/{idx}/products?month=  : 센터의 1차영업 상품별 버즈/접수/본부배정수당
 */
@RestController
@RequestMapping("/api/division")
public class DivisionDashboardController {

    /** 상품 종류 집계에서 제외할 상태(취소) */
    static final String CANCELED = "취소/반품";
    static final List<Allowance.MemberType> DIV = List.of(Allowance.MemberType.DIVISION);

    private final AllowanceRepository allowanceRepo;
    private final AllowancePaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final CenterCodeRepository centerCodeRepo;
    private final SaleRepository saleRepo;
    private final ManagerCenterRepository managerCenterRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;

    public DivisionDashboardController(AllowanceRepository allowanceRepo, AllowancePaymentRepository paymentRepo,
                                       UserRepository userRepo, CenterCodeRepository centerCodeRepo, SaleRepository saleRepo,
                                       ManagerCenterRepository managerCenterRepo, ProductRepository productRepo,
                                       PartnerRepository partnerRepo) {
        this.allowanceRepo = allowanceRepo; this.paymentRepo = paymentRepo; this.userRepo = userRepo;
        this.centerCodeRepo = centerCodeRepo; this.saleRepo = saleRepo; this.managerCenterRepo = managerCenterRepo;
        this.productRepo = productRepo; this.partnerRepo = partnerRepo;
    }

    // ───────────────────────── 공통 컨텍스트 ─────────────────────────

    /** 본부 산하 데이터 묶음 */
    private class Ctx {
        final User me;
        final List<CenterCode> centers;
        final Set<Long> centerIds;
        final List<User> members;            // 산하 센터 소속 전체 회원(모든 role)
        final Map<Long, Long> userCenter;    // user.id → 소속센터 idx
        final Map<String, Long> loginCenter; // user_id → 소속센터 idx (수당 handler 매핑)

        Ctx(User me) {
            this.me = me;
            // 담당 본부(head_code): 본사 [본부ᆞ센터 리스트]에서 본부장으로 할당된 본부행(fix_idx=본인, 중복등록 시 복수)
            //                       + 본인 소속(sales_center_id) 코드의 본부 — 합집합
            Set<String> headCodes = new LinkedHashSet<>();
            centerCodeRepo.findByFixIdx(me.getId()).stream()
                    .filter(x -> x.getCenterCode() == null && x.getHeadCode() != null)
                    .forEach(x -> headCodes.add(x.getHeadCode()));
            if (me.getSalesCenterId() != null)
                centerCodeRepo.findById(me.getSalesCenterId())
                        .map(CenterCode::getHeadCode).filter(Objects::nonNull).ifPresent(headCodes::add);
            // 소속 센터 = 담당 본부의 센터행 전체 (상태 무관, 모두 표시)
            List<CenterCode> list = new ArrayList<>();
            for (String hc : headCodes) list.addAll(centerCodeRepo.findByCenterCodeIsNotNullAndHeadCodeOrderByIdxAsc(hc));
            this.centers = list;
            this.centerIds = centers.stream().map(CenterCode::getIdx).collect(Collectors.toCollection(LinkedHashSet::new));
            this.members = centerIds.isEmpty() ? List.of() : userRepo.findBySalesCenterIdIn(centerIds);
            this.userCenter = new HashMap<>();
            this.loginCenter = new HashMap<>();
            for (User u : members) { userCenter.put(u.getId(), u.getSalesCenterId()); loginCenter.put(u.getUserId(), u.getSalesCenterId()); }
        }

        List<Sale> sales() { return userCenter.isEmpty() ? List.of() : saleRepo.findByBuzzIdIn(userCenter.keySet()); }

        /** 센터 idx → 센터장 = 본사 [본부ᆞ센터 리스트]에서 할당된 계정(center_code.fix_idx → user.id) */
        Map<Long, User> heads() {
            Set<Long> ids = centers.stream().map(CenterCode::getFixIdx).filter(Objects::nonNull).collect(Collectors.toSet());
            Map<Long, User> byId = new HashMap<>();
            userRepo.findAllById(ids).forEach(u -> byId.put(u.getId(), u));
            Map<Long, User> m = new HashMap<>();
            for (CenterCode cc : centers) {
                User u = cc.getFixIdx() == null ? null : byId.get(cc.getFixIdx());
                if (u != null) m.put(cc.getIdx(), u);
            }
            return m;
        }
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    private static ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
    }

    /** "YYYY-MM" → 해당월(없거나 오류면 이번달) */
    private static YearMonth ym(String month) {
        try { return month == null || month.isBlank() ? YearMonth.now() : YearMonth.parse(month.trim()); }
        catch (Exception e) { return YearMonth.now(); }
    }

    private static boolean in(LocalDateTime t, LocalDateTime from, LocalDateTime to) {
        return t != null && !t.isBefore(from) && t.isBefore(to);
    }

    // ───────────────────────── 본부분석 대시보드 ─────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(Authentication auth) {
        User me = me(auth);
        if (me == null) return unauthorized();
        String mid = me.getUserId();
        Ctx c = new Ctx(me);

        // CP = 전체 기간 예정수당 합계, MP = 확정수당 합계 − 지급완료(출금) 합계 = 출금 가능 (버즈 대시보드와 동일 산식, docs/34)
        long cp = allowanceRepo.sumAll(mid, Allowance.Status.CP, DIV);
        long mpAll = allowanceRepo.sumAll(mid, Allowance.Status.MP, DIV);
        long withdrawn = paymentRepo.sumWithdrawn(mid, DIV);

        long buzzCount = c.members.stream().filter(u -> u.getRole() == Role.BUZZ).count();
        long productKinds = c.sales().stream().filter(s -> !CANCELED.equals(s.getStatus()))
                .map(Sale::getProductId).filter(Objects::nonNull).distinct().count();

        Map<Long, User> heads = c.heads();
        List<Map<String, Object>> centers = new ArrayList<>();
        for (CenterCode cc : c.centers) {
            User h = heads.get(cc.getIdx());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("idx", cc.getIdx());
            m.put("centerCode", cc.getCenterCode());
            m.put("centerName", cc.getCenterName());
            m.put("headUserId", h == null ? null : h.getUserId());
            m.put("headName", h == null ? null : h.getName());
            m.put("headPhone", h == null ? null : h.getPhone());
            centers.add(m);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("cp", cp);
        out.put("mp", mpAll - withdrawn);
        out.put("mpAll", mpAll);
        out.put("withdrawn", withdrawn);
        out.put("centerCount", c.centers.size());
        out.put("buzzCount", buzzCount);
        out.put("productKinds", productKinds);
        out.put("headAssigned", heads.size());
        out.put("centers", centers);
        return ResponseEntity.ok(out);
    }

    // ───────────────────────── 센터별 실적비교 (월) ─────────────────────────

    @GetMapping("/centers")
    public ResponseEntity<?> centers(Authentication auth, @RequestParam(required = false) String month) {
        User me = me(auth);
        if (me == null) return unauthorized();
        Ctx c = new Ctx(me);
        YearMonth ym = ym(month);
        LocalDateTime from = ym.atDay(1).atStartOfDay(), to = ym.plusMonths(1).atDay(1).atStartOfDay();

        // 버즈수(해당월 말 기준 누적 가입), 매니저수(해당월 말까지 승인된 활동센터)
        Map<Long, Long> buzzBy = c.members.stream()
                .filter(u -> u.getRole() == Role.BUZZ && (u.getCreatedAt() == null || u.getCreatedAt().isBefore(to)))
                .collect(Collectors.groupingBy(User::getSalesCenterId, Collectors.counting()));
        Map<Long, Long> mgrBy = c.centerIds.isEmpty() ? Map.of() : managerCenterRepo.findByCenterIdInAndStatus(c.centerIds, "Y").stream()
                .filter(mc -> mc.getApproveDate() == null || mc.getApproveDate().atStartOfDay().isBefore(to))
                .collect(Collectors.groupingBy(ManagerCenter::getCenterId, Collectors.mapping(ManagerCenter::getBuzzId, Collectors.toSet())))
                .entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, e -> (long) e.getValue().size()));

        // 해당월 1차영업 접수
        List<Sale> monthSales = c.sales().stream().filter(s -> in(s.getCreatedAt(), from, to)).toList();
        Map<Long, Long> saleBy = monthSales.stream()
                .collect(Collectors.groupingBy(s -> c.userCenter.get(s.getBuzzId()), Collectors.counting()));
        long productKinds = monthSales.stream().filter(s -> !CANCELED.equals(s.getStatus()))
                .map(Sale::getProductId).filter(Objects::nonNull).distinct().count();

        // 해당월 본부 배정수당 (전표 등록일 기준, 취소 (−)전표 포함 순액) — 센터 귀속 = 처리자 소속센터
        Map<Long, Long> rewardBy = new HashMap<>();
        for (Allowance a : allowanceRepo.findByMemberIdAndMemberTypeInOrderBySeqDesc(me.getUserId(), DIV)) {
            if (!in(a.getCreatedAt(), from, to) || a.getHandlerId() == null) continue;
            Long cid = c.loginCenter.get(a.getHandlerId());
            if (cid == null) continue;
            rewardBy.merge(cid, a.getAmount() == null ? 0L : a.getAmount(), Long::sum);
        }

        Map<Long, User> heads = c.heads();
        List<Map<String, Object>> list = new ArrayList<>();
        for (CenterCode cc : c.centers) {
            User h = heads.get(cc.getIdx());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("idx", cc.getIdx());
            m.put("centerCode", cc.getCenterCode());
            m.put("centerName", cc.getCenterName());
            m.put("headUserId", h == null ? null : h.getUserId());
            m.put("headName", h == null ? null : h.getName());
            m.put("buzzCount", buzzBy.getOrDefault(cc.getIdx(), 0L));
            m.put("managerCount", mgrBy.getOrDefault(cc.getIdx(), 0L));
            m.put("saleCount", saleBy.getOrDefault(cc.getIdx(), 0L));
            m.put("divisionReward", rewardBy.getOrDefault(cc.getIdx(), 0L));
            list.add(m);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("month", ym.toString());
        out.put("centerCount", c.centers.size());
        out.put("buzzCount", buzzBy.values().stream().mapToLong(Long::longValue).sum());
        out.put("productKinds", productKinds);
        out.put("centers", list);
        return ResponseEntity.ok(out);
    }

    /** 센터의 해당월 1차영업 상품별 버즈/접수/본부배정수당(건당) */
    @GetMapping("/centers/{idx}/products")
    public ResponseEntity<?> centerProducts(Authentication auth, @PathVariable Long idx, @RequestParam(required = false) String month) {
        User me = me(auth);
        if (me == null) return unauthorized();
        Ctx c = new Ctx(me);
        if (!c.centerIds.contains(idx))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "본부 산하 센터가 아닙니다."));
        YearMonth ym = ym(month);
        LocalDateTime from = ym.atDay(1).atStartOfDay(), to = ym.plusMonths(1).atDay(1).atStartOfDay();

        List<Sale> sales = c.sales().stream()
                .filter(s -> idx.equals(c.userCenter.get(s.getBuzzId())) && in(s.getCreatedAt(), from, to) && s.getProductId() != null)
                .toList();
        Map<Long, List<Sale>> byProduct = sales.stream().collect(Collectors.groupingBy(Sale::getProductId, LinkedHashMap::new, Collectors.toList()));

        Map<Long, Product> products = new HashMap<>();
        productRepo.findAllById(byProduct.keySet()).forEach(p -> products.put(p.getId(), p));
        Set<Long> partnerIds = products.values().stream().map(Product::getPartnerId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, String> partnerName = new HashMap<>();
        partnerRepo.findAllById(partnerIds).forEach(p -> partnerName.put(p.getId(), p.getCompanyName()));

        List<Map<String, Object>> list = new ArrayList<>();
        byProduct.forEach((pid, rows) -> {
            Product p = products.get(pid);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", pid);
            m.put("productName", p == null ? "(삭제된 상품)" : p.getName());
            m.put("partnerName", p == null ? null : partnerName.get(p.getPartnerId()));
            m.put("buzzCount", rows.stream().map(Sale::getBuzzId).distinct().count());
            m.put("saleCount", rows.size());
            long r = p == null || p.getDivisionReward() == null ? 0L : p.getDivisionReward();
            boolean rate = p != null && p.getRewardType() == Product.RewardType.RATE;
            long total = p == null || p.getTotalAllowance() == null ? 0L : p.getTotalAllowance();
            m.put("rewardPerCase", rate ? Math.round(total * (r / 100.0)) : r); // AllowanceService.amount 와 동일 산식
            m.put("rewardRate", rate ? r : null);
            list.add(m);
        });
        list.sort((a, b) -> Long.compare(((Number) b.get("saleCount")).longValue(), ((Number) a.get("saleCount")).longValue()));
        return ResponseEntity.ok(Map.of("month", ym.toString(), "centerIdx", idx, "products", list));
    }
}
