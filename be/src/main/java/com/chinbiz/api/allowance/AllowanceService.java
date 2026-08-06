package com.chinbiz.api.allowance;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.org.CenterCode;
import com.chinbiz.api.org.CenterCodeRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 수당 원장 생성. 1차영업(주문) 등록 시 상품의 역할별 수당을 CP(예정수당) 레코드로 추가.
 *  - 1차영업 시점 확정 대상: 버즈(BUZZ), 소속센터(BUZZ_CENTER), 본부(DIVISION), 본사(HQ)
 *  - 추천인(친쿠)이 있으면 상위추천(TOPBUZZ) 레코드도 추가
 *  - 매니저(MANAGER)/관리센터(MANAGER_CENTER)는 2차 배정 시점에 별도 생성(여기서는 제외)
 */
@Service
public class AllowanceService {

    private final AllowanceRepository allowanceRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final CenterCodeRepository centerCodeRepo;

    public AllowanceService(AllowanceRepository allowanceRepo, ProductRepository productRepo,
                            UserRepository userRepo, CenterCodeRepository centerCodeRepo) {
        this.allowanceRepo = allowanceRepo; this.productRepo = productRepo;
        this.userRepo = userRepo; this.centerCodeRepo = centerCodeRepo;
    }

    /** 상품 역할수당 → 금액 (RATE: 총수당×비율%, FIXED: 저장값 원) */
    private long amount(Product p, Long roleReward) {
        long r = roleReward == null ? 0L : roleReward;
        if (p.getRewardType() == Product.RewardType.RATE) {
            long total = p.getTotalAllowance() == null ? 0L : p.getTotalAllowance();
            return Math.round(total * (r / 100.0));
        }
        return r; // FIXED (원)
    }

    /** 본사(MASTER_ADMIN) 계정 — 여러 명이면 첫 계정 */
    private User masterAdmin() {
        return userRepo.findByRole(Role.MASTER_ADMIN).stream().findFirst().orElse(null);
    }

    /** 소속센터(CENTER_ADMIN) 계정 — 없으면 "SC:<idx>" */
    private User centerAdmin(Long salesCenterId) {
        if (salesCenterId == null) return null;
        return userRepo.findBySalesCenterId(salesCenterId).stream()
                .filter(u -> u.getRole() == Role.CENTER_ADMIN).findFirst().orElse(null);
    }

    /** 소속센터가 속한 본부(DIVISION_ADMIN) 계정 — center_code.head_code 로 본부 idx 찾아 매칭 */
    private User divisionAdmin(Long salesCenterId) {
        if (salesCenterId == null) return null;
        CenterCode center = centerCodeRepo.findById(salesCenterId).orElse(null);
        if (center == null || center.getHeadCode() == null) return null;
        CenterCode head = centerCodeRepo.findFirstByHeadCodeAndCenterCodeIsNull(center.getHeadCode()).orElse(null);
        if (head == null) return null;
        return userRepo.findBySalesCenterId(head.getIdx()).stream()
                .filter(u -> u.getRole() == Role.DIVISION_ADMIN).findFirst().orElse(null);
    }

    private void add(Sale sale, Allowance.MemberType mt, String memberId, long amt, User payee, Long partnerId, User handler) {
        if (memberId == null || memberId.isBlank()) return;
        Allowance a = new Allowance();
        a.setType(Allowance.Type.ORDER);
        a.setOrderNo(sale.getOrderNo());
        a.setMemberType(mt);
        a.setMemberId(memberId);
        a.setStatus(Allowance.Status.CP);           // 1차영업 등록 = 예정수당(CP)
        a.setProductId(sale.getProductId());
        a.setPartnerId(partnerId);
        a.setAmount(amt);
        a.setPaid(false);
        if (payee != null) {
            a.setAccountNumber(payee.getAccountNumber());
            a.setBankName(payee.getBankName());
            a.setAccountHolder(payee.getAccountHolder());
        }
        if (handler != null) a.setHandlerId(handler.getUserId());
        allowanceRepo.save(a);
    }

    /**
     * 1차영업(주문) 등록 시 수당 원장 레코드 생성.
     * @param sale     order_no 가 세팅된 저장된 Sale
     * @param buzz     1차 영업자(버즈)
     * @param referrer 추천인(친쿠) — 없으면 null
     */
    @Transactional
    public void createForSale(Sale sale, User buzz, User referrer) {
        if (sale.getProductId() == null || sale.getOrderNo() == null) return;
        Product p = productRepo.findById(sale.getProductId()).orElse(null);
        if (p == null) return;
        Long partnerId = p.getPartnerId();

        // 1) 버즈 본인
        add(sale, Allowance.MemberType.BUZZ, buzz.getUserId(), amount(p, p.getBuzzReward()), buzz, partnerId, buzz);

        // 2) 추천인(친쿠) — 있을 때만
        if (referrer != null)
            add(sale, Allowance.MemberType.TOPBUZZ, referrer.getUserId(), amount(p, p.getChinkuReward()), referrer, partnerId, buzz);

        // 3) 소속센터
        User center = centerAdmin(buzz.getSalesCenterId());
        String centerId = center != null ? center.getUserId() : (buzz.getSalesCenterId() != null ? "SC:" + buzz.getSalesCenterId() : null);
        add(sale, Allowance.MemberType.BUZZ_CENTER, centerId, amount(p, p.getSalesCenterReward()), center, partnerId, buzz);

        // 4) 본부(총괄본부)
        User division = divisionAdmin(buzz.getSalesCenterId());
        String divisionId = division != null ? division.getUserId() : "DIVISION";
        add(sale, Allowance.MemberType.DIVISION, divisionId, amount(p, p.getDivisionReward()), division, partnerId, buzz);

        // 5) 친비즈 본사 (MASTER_ADMIN 계정 ID)
        User master = masterAdmin();
        String hqId = master != null ? master.getUserId() : "HQ";
        add(sale, Allowance.MemberType.HQ, hqId, amount(p, p.getHqReward()), master, partnerId, buzz);
    }

    /**
     * 2차 배정(영업권 확보) 시 수당 원장 레코드 생성.
     *  - MANAGER: 배정 매니저 수당
     *  - MANAGER_CENTER: 매니저 관리센터(자신의 센터) 수당
     * @param sale    order_no 가 세팅된 Sale
     * @param manager 배정된 관리매니저
     */
    @Transactional
    public void createForAssign(Sale sale, User manager) {
        if (sale.getProductId() == null || sale.getOrderNo() == null || manager == null) return;
        Product p = productRepo.findById(sale.getProductId()).orElse(null);
        if (p == null) return;
        Long partnerId = p.getPartnerId();

        // 1) 매니저 본인
        add(sale, Allowance.MemberType.MANAGER, manager.getUserId(), amount(p, p.getManagerReward()), manager, partnerId, manager);

        // 2) 매니저 관리센터 — 이 영업의 지역센터(고객 주소 센터, 매니저의 활동센터 중 하나). docs/19 다중센터
        Long mgmtCenterId = sale.getCustomerCenterId();
        User mgmtCenter = centerAdmin(mgmtCenterId);
        String mcId = mgmtCenter != null ? mgmtCenter.getUserId()
                : (mgmtCenterId != null ? "MC:" + mgmtCenterId : null);
        add(sale, Allowance.MemberType.MANAGER_CENTER, mcId, amount(p, p.getMgmtCenterReward()), mgmtCenter, partnerId, manager);
    }

    /** 매니저 재배정: 해당 주문의 MANAGER·MANAGER_CENTER ORDER 전표를 CANCEL(−금액) 상계전표로 Insert */
    @Transactional
    public void cancelManagerAllowance(String orderNo) {
        if (orderNo == null) return;
        for (Allowance o : allowanceRepo.findByOrderNoAndType(orderNo, Allowance.Type.ORDER)) {
            if (o.getMemberType() != Allowance.MemberType.MANAGER && o.getMemberType() != Allowance.MemberType.MANAGER_CENTER) continue;
            Allowance c = new Allowance();
            c.setType(Allowance.Type.CANCEL);
            c.setOrderNo(orderNo);
            c.setMemberType(o.getMemberType());
            c.setMemberId(o.getMemberId());
            c.setStatus(o.getStatus());
            c.setProductId(o.getProductId());
            c.setPartnerId(o.getPartnerId());
            c.setAmount(o.getAmount() == null ? 0L : -o.getAmount());
            c.setContractDate(o.getContractDate());
            c.setConfirmDate(o.getConfirmDate());
            c.setAccountNumber(o.getAccountNumber());
            c.setBankName(o.getBankName());
            c.setAccountHolder(o.getAccountHolder());
            c.setPaid(o.isPaid());
            c.setHandlerId(o.getHandlerId());
            allowanceRepo.save(c);
        }
    }

    /** 구매확정: 해당 주문의 수당 상태 CP→MP, 구매확정일자 세팅 */
    @Transactional
    public void confirmOrder(String orderNo) {
        if (orderNo == null) return;
        java.time.LocalDate today = java.time.LocalDate.now();
        for (Allowance a : allowanceRepo.findByOrderNoAndType(orderNo, Allowance.Type.ORDER)) {
            if (a.getStatus() == Allowance.Status.CP) a.setStatus(Allowance.Status.MP);
            a.setConfirmDate(today);
            // fixed_date/fixed_month 는 구매확정이 아니라 본사 [마감완료] 시점에만 기록 (docs/12)
            allowanceRepo.save(a);
        }
    }

    /**
     * 취소(역정산): 기존 ORDER 전표는 수정하지 않고, 동일 내역 + 유형 CANCEL + 금액(−) 전표를 Insert.
     * 추가로 (구매확정/배송·설치 단계 && 설치형 상품)이면 매니저 취소수당(CANCEL_FEE, +50000, MP) 레코드 추가.
     * @param sale    현재 상태를 담은 Sale (상태 변경 전에 호출)
     * @param product 해당 상품
     */
    @Transactional
    public void cancelOrder(Sale sale, Product product) {
        String orderNo = sale.getOrderNo();
        if (orderNo == null) return;
        java.time.LocalDate today = java.time.LocalDate.now();

        // 1) ORDER 전표 → CANCEL 상계전표(금액 −)
        for (Allowance o : allowanceRepo.findByOrderNoAndType(orderNo, Allowance.Type.ORDER)) {
            Allowance c = new Allowance();
            c.setType(Allowance.Type.CANCEL);
            c.setOrderNo(orderNo);
            c.setMemberType(o.getMemberType());
            c.setMemberId(o.getMemberId());
            c.setStatus(o.getStatus());
            c.setProductId(o.getProductId());
            c.setPartnerId(o.getPartnerId());
            c.setAmount(o.getAmount() == null ? 0L : -o.getAmount());
            c.setContractDate(o.getContractDate());
            c.setConfirmDate(o.getConfirmDate());
            c.setAccountNumber(o.getAccountNumber());
            c.setBankName(o.getBankName());
            c.setAccountHolder(o.getAccountHolder());
            c.setPaid(o.isPaid());
            c.setHandlerId(o.getHandlerId());
            allowanceRepo.save(c);
        }

        // 2) 매니저 보전비 있는 상품 + 구매확정/배송·설치 단계 → 매니저 취소수당(CANCEL_FEE = product.cancel_amount)
        String st = sale.getStatus();
        boolean feeStage = "구매확정".equals(st) || "배송/설치".equals(st);
        long cancelFee = product == null || product.getCancelAmount() == null ? 0L : product.getCancelAmount();
        if (feeStage && product != null && product.isCancelFeeFlag() && cancelFee > 0 && sale.getManagerId() != null) {
            User mgr = userRepo.findById(sale.getManagerId()).orElse(null);
            if (mgr != null) {
                Allowance fee = new Allowance();
                fee.setType(Allowance.Type.CANCEL_FEE);
                fee.setOrderNo(orderNo);
                fee.setMemberType(Allowance.MemberType.MANAGER);
                fee.setMemberId(mgr.getUserId());
                fee.setStatus(Allowance.Status.MP);
                fee.setProductId(sale.getProductId());
                fee.setPartnerId(product.getPartnerId());
                fee.setAmount(cancelFee);
                fee.setConfirmDate(today);
                fee.setPaid(false);
                fee.setAccountNumber(mgr.getAccountNumber());
                fee.setBankName(mgr.getBankName());
                fee.setAccountHolder(mgr.getAccountHolder());
                fee.setHandlerId(mgr.getUserId());
                allowanceRepo.save(fee);
            }
        }
    }
}
