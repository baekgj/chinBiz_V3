package com.chinbiz.api.center;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.category.Category;
import com.chinbiz.api.category.CategoryRepository;
import com.chinbiz.api.common.Mask;
import com.chinbiz.api.partner.Partner;
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

import java.util.*;
import java.util.stream.Collectors;

/**
 * 센터(CENTER_ADMIN) 소속 버즈회원 목록 + 1차/2차 영업 상품별 합산.
 *  - GET /api/center/buzz-members : 소속 버즈회원(sales_center_id=내 센터) 리스트
 *  - GET /api/center/sales/buzz   : 소속 버즈 1차영업 상품별 합산
 *  - GET /api/center/sales/manager: 소속 매니저(manager_center_id=내 센터) 2차영업 상품별 합산
 */
@RestController
@RequestMapping("/api/center")
public class CenterSalesController {

    private final UserRepository userRepo;
    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final PartnerRepository partnerRepo;

    private static final String STATUS_CONFIRMED = "구매확정";

    public CenterSalesController(UserRepository userRepo, SaleRepository saleRepo, ProductRepository productRepo,
                                 CategoryRepository categoryRepo, PartnerRepository partnerRepo) {
        this.userRepo = userRepo; this.saleRepo = saleRepo; this.productRepo = productRepo;
        this.categoryRepo = categoryRepo; this.partnerRepo = partnerRepo;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    /** 소속 버즈회원 — 가입일자·아이디·회원명·영업수·완료수 */
    @GetMapping("/buzz-members")
    public ResponseEntity<?> buzzMembers(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        if (myCenter == null) return ResponseEntity.ok(Map.of("content", List.of()));

        // 소속 버즈의 영업수/완료수 집계 (buzzId 기준)
        Map<Long, long[]> byBuzz = new HashMap<>(); // [0]=영업수 [1]=완료수
        for (Sale s : saleRepo.findAll()) {
            if (s.getBuzzId() == null) continue;
            long[] c = byBuzz.computeIfAbsent(s.getBuzzId(), k -> new long[2]);
            c[0]++;
            if (STATUS_CONFIRMED.equals(s.getStatus())) c[1]++;
        }

        List<Map<String, Object>> rows = userRepo.findByRole(Role.BUZZ).stream()
                .filter(u -> myCenter.equals(u.getSalesCenterId()))
                .map(u -> {
                    long[] c = byBuzz.getOrDefault(u.getId(), new long[2]);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("createdAt", u.getCreatedAt() == null ? null : u.getCreatedAt().toLocalDate().toString());
                    m.put("userId", u.getUserId());
                    m.put("name", u.getName());
                    m.put("salesCount", c[0]);
                    m.put("completedCount", c[1]);
                    return m;
                }).toList();
        return ResponseEntity.ok(Map.of("content", rows));
    }

    /** 1차영업관리 — 소속 버즈(sales_center_id=내 센터)의 1차영업을 상품별 합산 */
    @GetMapping("/sales/buzz")
    public ResponseEntity<?> salesByBuzz(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        if (myCenter == null) return ResponseEntity.ok(Map.of("content", List.of()));

        Set<Long> buzzIds = userRepo.findByRole(Role.BUZZ).stream()
                .filter(u -> myCenter.equals(u.getSalesCenterId()))
                .map(User::getId).collect(Collectors.toSet());
        List<Sale> sales = saleRepo.findAll().stream()
                .filter(s -> s.getBuzzId() != null && buzzIds.contains(s.getBuzzId())).toList();
        return ResponseEntity.ok(Map.of("content", aggregateByProduct(sales, true)));
    }

    /** 2차영업관리 — 소속 매니저(manager_center_id=내 센터)의 2차영업을 상품별 합산 */
    @GetMapping("/sales/manager")
    public ResponseEntity<?> salesByManager(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        if (myCenter == null) return ResponseEntity.ok(Map.of("content", List.of()));

        Set<Long> mgrIds = userRepo.findByRole(Role.MANAGER).stream()
                .filter(u -> myCenter.equals(u.getManagerCenterId()))
                .map(User::getId).collect(Collectors.toSet());
        List<Sale> sales = saleRepo.findAll().stream()
                .filter(s -> s.getManagerId() != null && mgrIds.contains(s.getManagerId())).toList();
        return ResponseEntity.ok(Map.of("content", aggregateByProduct(sales, false)));
    }

    /** 1차영업관리 — 소속 버즈의 개별 1차 영업신청 내역 (고객정보 마스킹) */
    @GetMapping("/sales/buzz/list")
    public ResponseEntity<?> salesListByBuzz(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        if (myCenter == null) return ResponseEntity.ok(Map.of("content", List.of()));
        Set<Long> buzzIds = userRepo.findByRole(Role.BUZZ).stream()
                .filter(u -> myCenter.equals(u.getSalesCenterId())).map(User::getId).collect(Collectors.toSet());
        List<Sale> sales = saleRepo.findAll().stream()
                .filter(s -> s.getBuzzId() != null && buzzIds.contains(s.getBuzzId()))
                .sorted(Comparator.comparing(Sale::getId).reversed()).toList();
        return ResponseEntity.ok(Map.of("content", maskedList(sales, true)));
    }

    /** 2차영업관리 — 소속 매니저의 개별 2차 영업 진행내역 (고객정보 마스킹) */
    @GetMapping("/sales/manager/list")
    public ResponseEntity<?> salesListByManager(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        if (myCenter == null) return ResponseEntity.ok(Map.of("content", List.of()));
        Set<Long> mgrIds = userRepo.findByRole(Role.MANAGER).stream()
                .filter(u -> myCenter.equals(u.getManagerCenterId())).map(User::getId).collect(Collectors.toSet());
        List<Sale> sales = saleRepo.findAll().stream()
                .filter(s -> s.getManagerId() != null && mgrIds.contains(s.getManagerId()))
                .sorted(Comparator.comparing(Sale::getId).reversed()).toList();
        return ResponseEntity.ok(Map.of("content", maskedList(sales, false)));
    }

    /** 개별 영업 내역 → 고객정보(고객명/전화/이메일) 서버 마스킹 후 반환.
     *  byBuzz=true → 영업자=버즈명 / false → 담당=매니저명 */
    private List<Map<String, Object>> maskedList(List<Sale> sales, boolean byBuzz) {
        Map<Long, String> productName = new HashMap<>();
        productRepo.findAll().forEach(p -> productName.put(p.getId(), p.getName()));
        Map<Long, String> userName = new HashMap<>();
        userRepo.findAll().forEach(u -> userName.put(u.getId(), u.getName()));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Sale s : sales) {
            // 고객명: 담당자명 우선, 없으면 대표자명
            String rawName = (s.getManagerName() != null && !s.getManagerName().isBlank()) ? s.getManagerName() : s.getCeoName();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("createdAt", s.getCreatedAt() == null ? null : s.getCreatedAt().toLocalDate().toString());
            m.put("orderNo", s.getOrderNo());
            m.put("productName", s.getProductId() == null ? null : productName.get(s.getProductId()));
            m.put("companyName", s.getCompanyName()); // 상호명(사업체명)은 노출
            m.put("actorName", byBuzz ? userName.get(s.getBuzzId()) : userName.get(s.getManagerId()));
            m.put("customerName", Mask.name(rawName));   // 고객명 마스킹
            m.put("phone", Mask.phone(s.getPhone()));    // 전화 마스킹
            m.put("email", Mask.email(s.getEmail()));    // 이메일 마스킹
            m.put("status", s.getStatus());
            rows.add(m);
        }
        return rows;
    }

    /** 상품별 합산 (byBuzz=true → 활동 버즈수·센터소속수당 / false → 활동 매니저수·센터관리수당) */
    private List<Map<String, Object>> aggregateByProduct(List<Sale> sales, boolean byBuzz) {
        Map<Long, String> catName = new HashMap<>();
        categoryRepo.findAll().forEach(c -> catName.put(c.getId(), c.getName()));
        Map<Long, String> ptnName = new HashMap<>();
        partnerRepo.findAll().forEach(p -> ptnName.put(p.getId(), p.getCompanyName()));
        Map<Long, Product> products = new HashMap<>();
        productRepo.findAll().forEach(p -> products.put(p.getId(), p));

        // productId → {cases, completed, distinct actor ids}
        Map<Long, Long> cases = new LinkedHashMap<>();
        Map<Long, Long> completed = new HashMap<>();
        Map<Long, Set<Long>> actors = new HashMap<>();
        for (Sale s : sales) {
            Long pid = s.getProductId();
            if (pid == null) continue;
            cases.merge(pid, 1L, Long::sum);
            if (STATUS_CONFIRMED.equals(s.getStatus())) completed.merge(pid, 1L, Long::sum);
            Long actor = byBuzz ? s.getBuzzId() : s.getManagerId();
            if (actor != null) actors.computeIfAbsent(pid, k -> new HashSet<>()).add(actor);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Long pid : cases.keySet()) {
            Product p = products.get(pid);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", pid);
            m.put("productName", p != null ? p.getName() : ("#" + pid));
            m.put("categoryName", p != null && p.getCategoryId() != null ? catName.get(p.getCategoryId()) : null);
            m.put("partnerName", p != null && p.getPartnerId() != null ? ptnName.get(p.getPartnerId()) : null);
            m.put("actorCount", actors.getOrDefault(pid, Set.of()).size());
            m.put("cases", cases.get(pid));
            m.put("completed", completed.getOrDefault(pid, 0L));
            long reward = p == null ? 0L : (byBuzz ? nz(p.getSalesCenterReward()) : nz(p.getMgmtCenterReward()));
            m.put("centerReward", reward);
            rows.add(m);
        }
        return rows;
    }

    private long nz(Long v) { return v == null ? 0L : v; }
}
