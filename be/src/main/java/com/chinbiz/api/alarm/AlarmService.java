package com.chinbiz.api.alarm;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.org.CenterCode;
import com.chinbiz.api.org.CenterCodeRepository;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.push.WebPushService;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 알람 발생 서비스 — 프로세스 트리거 시 alram_setting(사용중) 을 읽어 대상별 수신자를 해석하고
 * 문구를 렌더링해 alram 에 저장한다. (docs/16)
 */
@Service
public class AlarmService {

    private static final Logger log = LoggerFactory.getLogger(AlarmService.class);

    private final AlarmSettingRepository settingRepo;
    private final AlarmRepository alarmRepo;
    private final UserRepository userRepo;
    private final CenterCodeRepository centerCodeRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final WebPushService webPushService;
    private final com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepo;

    public AlarmService(AlarmSettingRepository settingRepo, AlarmRepository alarmRepo,
                        UserRepository userRepo, CenterCodeRepository centerCodeRepo,
                        ProductRepository productRepo, PartnerRepository partnerRepo,
                        WebPushService webPushService,
                        com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepo) {
        this.settingRepo = settingRepo; this.alarmRepo = alarmRepo;
        this.userRepo = userRepo; this.centerCodeRepo = centerCodeRepo;
        this.productRepo = productRepo; this.partnerRepo = partnerRepo;
        this.webPushService = webPushService; this.managerCenterRepo = managerCenterRepo;
    }

    /** 수신자 1명 */
    public record Recipient(String id, String name, String role) {}

    /**
     * 알람 발생. 프로세스의 사용중 설정 각각에 대해, 해당 대상의 수신자들에게 문구를 렌더링해 alram 저장.
     */
    public int fire(String processCode, Map<AlarmTarget, List<Recipient>> recipients,
                    Map<String, String> tokens, String refType, Long refId) {
        int created = 0;
        for (AlarmSetting s : settingRepo.findByProcessCodeAndEnabledTrue(processCode)) {
            List<Recipient> rs = recipients.get(s.getTarget());
            if (rs == null || rs.isEmpty()) continue;
            String rendered = render(s.getMessage(), tokens);
            List<String> pushAccounts = new ArrayList<>();
            for (Recipient r : rs) {
                if (r == null || r.id() == null) continue;
                alarmRepo.save(new Alarm(processCode, s.getTarget(), r.id(), r.name(), r.role(), rendered, refType, refId));
                created++;
                pushAccounts.add(r.id());
            }
            // 인앱 알람 저장과 동시에 웹푸시 발송(수신자 본인에게만). 실패해도 알람 저장엔 영향 없음.
            firePush(pushAccounts, rendered, urlForTarget(s.getTarget()));
        }
        return created;
    }

    /** 웹푸시 발송(격리) — 대상 회원에게 인앱 알람과 동일 문구로. 예외는 삼켜 알람 저장에 영향 없게. */
    private void firePush(List<String> accounts, String message, String url) {
        if (accounts == null || accounts.isEmpty()) return;
        try {
            webPushService.sendToAccounts(accounts, "친비즈 알림", message, url);
        } catch (Exception e) {
            log.warn("[alarm] 웹푸시 발송 실패 ({}명): {}", accounts.size(), e.getMessage());
        }
    }

    /** 알람 대상 유형 → 알림 클릭 시 이동할 워크스페이스 경로 */
    private String urlForTarget(AlarmTarget target) {
        if (target == null) return "/";
        return switch (target) {
            case BUZZ, MANAGER, REFERRER -> "/buzz";
            case CENTER, MGMT_CENTER -> "/center";
            case DIVISION -> "/division";
            case HQ -> "/master";
            case PARTNER -> "/partner";
        };
    }

    /** 문구 치환 — 엑셀 리터럴 플레이스홀더를 토큰 값으로 대체 */
    private String render(String msg, Map<String, String> tokens) {
        if (msg == null) return "";
        String out = msg;
        if (tokens != null) {
            String company = tokens.get("company");
            String member = tokens.get("member");
            String center = tokens.get("center");
            String customer = tokens.get("customer");
            String amount = tokens.get("amount");
            String product = tokens.get("product");
            String orderNo = tokens.get("orderNo");
            if (company != null) out = out.replace("OOOO", company);   // 4자 = 회사명(파트너)
            if (member != null) out = out.replace("OOO", member);      // 3자 = 회원명
            if (center != null) out = out.replace("ㅁㅁㅁㅁ", center).replace("센터센터", "센터");
            if (customer != null) out = out.replace("@@@", customer);
            if (amount != null) out = out.replace("$$$$$", amount).replace("$$$$", amount);
            if (product != null) out = out.replaceAll("\\*{3,}", product);
            if (orderNo != null) out = out.replace("______", orderNo);
            String period = tokens.get("period");
            if (period != null) out = out.replace("0000년 00월", period);
        }
        return out;
    }

    // ───────────────────────── 회원(가입/추천) ─────────────────────────

    /** [회원가입] 알람 — 센터/본부/본사(+추천인) */
    public int fireSignup(User member) { return fireMemberJoin("SIGNUP", member); }

    /** [회원추천] 알람 — 버즈admin 회원등록. 센터/본부/본사(+추천인) */
    public int fireMemberReferral(User member) { return fireMemberJoin("MEMBER_REFERRAL", member); }

    private int fireMemberJoin(String processCode, User member) {
        Long scid = member.getSalesCenterId();
        String centerName = centerName(scid);
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.CENTER, centerAdmins(scid));
        map.put(AlarmTarget.DIVISION, divisionAdmins(scid));
        map.put(AlarmTarget.HQ, hqAdmins());
        User referrer = referrerOf(member);
        if (referrer != null) map.put(AlarmTarget.REFERRER, List.of(toRecipient(referrer)));
        Map<String, String> tokens = Map.of("member", nz(member.getName()), "center", nz(centerName));
        return fire(processCode, map, tokens, "USER", member.getId());
    }

    // ───────────────────────── 파트너 상담 ─────────────────────────

    /** [파트너상담] 알람 — 본사 */
    public int firePartnerInquiry(String companyName, Long inquiryId) {
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.HQ, hqAdmins());
        return fire("PARTNER_INQUIRY", map, Map.of("company", nz(companyName)), "INQUIRY", inquiryId);
    }

    // ───────────────────────── 매니저 신청/승인 ─────────────────────────

    /** [매니저신청] 알람 — 신청한 각 센터(다중, docs/19)로 발송 */
    public int fireManagerApply(User applicant) {
        List<Long> ids = managerCenterRepo.findByBuzzIdAndStatus(applicant.getId(), "I")
                .stream().map(com.chinbiz.api.buzz.ManagerCenter::getCenterId).toList();
        return fireManagerApply(applicant, ids);
    }

    /** [매니저신청] 알람 — 지정한 신청 센터에 대해서만 발송(추가 신청 시 기존 센터 중복 알람 방지). */
    public int fireManagerApply(User applicant, java.util.Collection<Long> centerIds) {
        int created = 0;
        for (Long centerIdx : centerIds) {
            Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
            map.put(AlarmTarget.CENTER, centerAdmins(centerIdx));
            Map<String, String> tokens = Map.of("member", nz(applicant.getName()), "center", nz(centerName(centerIdx)));
            created += fire("MANAGER_APPLY", map, tokens, "USER", applicant.getId());
        }
        return created;
    }

    /** [매니저승인] 알람 — 승인된 매니저 + 승인 센터 관리자 */
    public int fireManagerApprove(User manager, Long centerIdx) {
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.MANAGER, List.of(toRecipient(manager)));
        map.put(AlarmTarget.CENTER, centerAdmins(centerIdx));
        Map<String, String> tokens = Map.of("member", nz(manager.getName()), "customer", nz(manager.getUserId()), "center", nz(centerName(centerIdx)));
        return fire("MANAGER_APPROVE", map, tokens, "USER", manager.getId());
    }

    /** [매니저취소] 알람(승인취소) — 매니저 본인 + 해당 센터 관리자 (docs/20) */
    public int fireManagerApproveCancel(User manager, Long centerIdx) {
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.MANAGER, List.of(toRecipient(manager)));
        map.put(AlarmTarget.CENTER, centerAdmins(centerIdx));
        Map<String, String> tokens = Map.of("member", nz(manager.getName()), "customer", nz(manager.getUserId()), "center", nz(centerName(centerIdx)));
        return fire("MANAGER_APPROVE_CANCEL", map, tokens, "USER", manager.getId());
    }

    /** [주민번호요청] 알람 — 정산 대상 회원 중 주민번호 미등록자에게 등록 요청 (docs/22) */
    public int fireResidentNumberRequest(User member) {
        AlarmTarget t = switch (member.getRole()) {
            case BUZZ -> AlarmTarget.BUZZ;
            case MANAGER -> AlarmTarget.MANAGER;
            case CENTER_ADMIN -> AlarmTarget.CENTER;
            case DIVISION_ADMIN -> AlarmTarget.DIVISION;
            default -> null;
        };
        if (t == null) return 0;
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(t, List.of(toRecipient(member)));
        return fire("RESIDENT_NUMBER_REQUEST", map, Map.of(), "USER", member.getId());
    }

    // ───────────────────────── 상품 등록 ─────────────────────────

    /** [상품등록] 알람 — 전체 버즈/매니저/센터 브로드캐스트 */
    public int fireProductRegister(Product product) {
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.BUZZ, recipientsByRole(Role.BUZZ));
        map.put(AlarmTarget.MANAGER, recipientsByRole(Role.MANAGER));
        map.put(AlarmTarget.CENTER, recipientsByRole(Role.CENTER_ADMIN));
        return fire("PRODUCT_REGISTER", map, Map.of("product", nz(product.getName())), "PRODUCT", product.getId());
    }

    // ───────────────────────── 교육 신청/승인 ─────────────────────────

    /** [교육신청] 알람 — 매니저의 활동센터(다중)/본사 */
    public int fireEduApply(User manager, String productName, Long refId) {
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.CENTER, managerCenterAdmins(manager.getId()));
        map.put(AlarmTarget.HQ, hqAdmins());
        Map<String, String> tokens = Map.of("member", nz(manager.getName()), "product", nz(productName));
        return fire("EDU_APPLY", map, tokens, "EDU", refId);
    }

    /** [교육승인] 알람 — 매니저 본인 */
    public int fireEduApprove(User manager, String productName, Long refId) {
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        map.put(AlarmTarget.MANAGER, List.of(toRecipient(manager)));
        return fire("EDU_APPROVE", map, Map.of("product", nz(productName)), "EDU", refId);
    }

    // ───────────────────────── 영업/주문 (Sale 기반) ─────────────────────────

    /** 영업/주문 프로세스 공통 — Sale 로부터 모든 대상 수신자·토큰 해석 후 발송.
     *  processCode: SALE1 / SALE2 / MANAGER_CANCEL / ORDER_CANCEL / ORDER_CONFIRM */
    public int fireSaleEvent(String processCode, Sale sale) {
        if (sale == null) return 0;
        User buzz = sale.getBuzzId() == null ? null : userRepo.findById(sale.getBuzzId()).orElse(null);
        User manager = sale.getManagerId() == null ? null : userRepo.findById(sale.getManagerId()).orElse(null);
        Product product = sale.getProductId() == null ? null : productRepo.findById(sale.getProductId()).orElse(null);

        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        if (buzz != null) {
            map.put(AlarmTarget.BUZZ, List.of(toRecipient(buzz)));
            // 소속센터(BUZZ_CENTER)는 버즈의 대표센터(sales_center_id)로 매칭 — 다중센터 확장 대상 아님(docs/19)
            map.put(AlarmTarget.CENTER, centerAdmins(buzz.getSalesCenterId()));
            map.put(AlarmTarget.DIVISION, divisionAdmins(buzz.getSalesCenterId()));
            User ref = referrerOf(buzz);
            if (ref != null) map.put(AlarmTarget.REFERRER, List.of(toRecipient(ref)));
        }
        if (manager != null) {
            map.put(AlarmTarget.MANAGER, List.of(toRecipient(manager)));
            // 관리센터(MGMT_CENTER)는 매니저의 승인 활동센터(manager_center, 다중) 중 이 영업의 지역센터로 매칭 (docs/19)
            map.put(AlarmTarget.MGMT_CENTER, centerAdmins(managerActivityCenterFor(manager.getId(), sale.getCustomerCenterId())));
        }
        map.put(AlarmTarget.HQ, hqAdmins());
        Recipient partner = partnerOf(product);
        if (partner != null) map.put(AlarmTarget.PARTNER, List.of(partner));

        // 토큰: 행위자(member)는 프로세스별 상이(1차=버즈 / 2차·매니저취소=매니저)
        boolean managerActor = "SALE2".equals(processCode) || "MANAGER_CANCEL".equals(processCode);
        String member = managerActor ? (manager != null ? manager.getName() : "") : (buzz != null ? buzz.getName() : "");
        long cp = cpAmount(product, managerActor ? "manager" : "buzz");
        Map<String, String> tokens = new HashMap<>();
        tokens.put("member", nz(member));
        tokens.put("customer", nz(sale.getCompanyName()));
        tokens.put("product", product == null ? "" : nz(product.getName()));
        tokens.put("amount", String.format("%,d", cp));
        tokens.put("orderNo", nz(sale.getOrderNo() == null ? String.valueOf(sale.getId()) : sale.getOrderNo()));
        return fire(processCode, map, tokens, "SALE", sale.getId());
    }

    // ───────────────────────── 마감/정산/지급 (월 단위) ─────────────────────────

    /**
     * [마감완료/정산완료/지급완료] 알람 — 해당 월 정산 대상 회원(버즈/매니저/센터/본부)에게 발송.
     * @param processCode CLOSE / SETTLE / PAY
     * @param fixedMonth  대상월(YYYYMM)
     * @param members     (memberType 이름, memberId) 목록 — allowance/allowance_payment 의 대상 회원
     */
    public int fireSettlement(String processCode, String fixedMonth, java.util.Collection<String[]> members) {
        // 대상유형별 회원 중복 제거(memberId 기준)
        Map<AlarmTarget, Map<String, Recipient>> byTarget = new EnumMap<>(AlarmTarget.class);
        for (String[] mp : members) {
            if (mp == null || mp.length < 2) continue;
            AlarmTarget t = mapMemberType(mp[0]);
            String memberId = mp[1];
            if (t == null || memberId == null || memberId.isBlank()) continue;
            byTarget.computeIfAbsent(t, k -> new java.util.LinkedHashMap<>()).computeIfAbsent(memberId, id -> {
                User u = userRepo.findByUserId(id).orElse(null);
                return u != null ? toRecipient(u)
                        : new Recipient(id, id, null);
            });
        }
        Map<AlarmTarget, List<Recipient>> map = new EnumMap<>(AlarmTarget.class);
        byTarget.forEach((t, m) -> map.put(t, new ArrayList<>(m.values())));
        return fire(processCode, map, Map.of("period", periodLabel(fixedMonth)), "SETTLE", null);
    }

    /** allowance/allowance_payment 의 member_type → 알람 대상 (버즈/매니저/센터/본부) */
    private AlarmTarget mapMemberType(String memberType) {
        if (memberType == null) return null;
        return switch (memberType) {
            case "BUZZ", "TOPBUZZ" -> AlarmTarget.BUZZ;
            case "MANAGER" -> AlarmTarget.MANAGER;
            case "BUZZ_CENTER", "MANAGER_CENTER" -> AlarmTarget.CENTER;
            case "DIVISION" -> AlarmTarget.DIVISION;
            default -> null; // HQ/MASTER 제외
        };
    }

    /** "202607" → "2026년 07월" */
    private String periodLabel(String yyyymm) {
        if (yyyymm == null || yyyymm.length() != 6) return "";
        return yyyymm.substring(0, 4) + "년 " + yyyymm.substring(4) + "월";
    }

    // ───────────────────────── 헬퍼 ─────────────────────────

    private String nz(String s) { return s == null ? "" : s; }

    private Recipient toRecipient(User u) {
        return new Recipient(u.getUserId(), u.getName(), u.getRole() == null ? null : u.getRole().name());
    }

    private String centerName(Long centerIdx) {
        if (centerIdx == null) return "";
        return centerCodeRepo.findById(centerIdx).map(CenterCode::displayName).orElse("");
    }

    private User referrerOf(User u) {
        String ref = u.getReferralCode();
        if (ref == null || ref.isBlank()) return null;
        return userRepo.findByUserId(ref.trim()).orElse(null);
    }

    private List<Recipient> recipientsByRole(Role role) {
        List<Recipient> out = new ArrayList<>();
        for (User u : userRepo.findByRole(role)) out.add(toRecipient(u));
        return out;
    }

    /** 소속/관리센터 관리자 — sales_center_id 가 같은 CENTER_ADMIN */
    private List<Recipient> centerAdmins(Long centerIdx) {
        List<Recipient> out = new ArrayList<>();
        if (centerIdx == null) return out;
        for (User u : userRepo.findBySalesCenterId(centerIdx))
            if (u.getRole() == Role.CENTER_ADMIN) out.add(toRecipient(u));
        return out;
    }

    /** 매니저의 승인 활동센터(다중, docs/19) 관리자 전원 — 중복 제거 */
    private List<Recipient> managerCenterAdmins(Long buzzId) {
        java.util.LinkedHashMap<String, Recipient> byId = new java.util.LinkedHashMap<>();
        for (com.chinbiz.api.buzz.ManagerCenter mc : managerCenterRepo.findByBuzzIdAndStatus(buzzId, "Y"))
            for (Recipient r : centerAdmins(mc.getCenterId())) byId.putIfAbsent(r.id(), r);
        return new ArrayList<>(byId.values());
    }

    /** 매니저의 승인 활동센터(manager_center Y) 중 이 영업의 지역센터. 활동센터가 아니면 null (docs/19) */
    private Long managerActivityCenterFor(Long managerId, Long saleCenterId) {
        if (managerId == null || saleCenterId == null) return null;
        boolean covers = managerCenterRepo.findByBuzzIdAndStatus(managerId, "Y")
                .stream().anyMatch(mc -> saleCenterId.equals(mc.getCenterId()));
        return covers ? saleCenterId : null;
    }

    /** 상위 본부 관리자 — 센터 head_code → 본부 center_code idx → 그 idx 소속 DIVISION_ADMIN */
    private List<Recipient> divisionAdmins(Long centerIdx) {
        List<Recipient> out = new ArrayList<>();
        if (centerIdx == null) return out;
        CenterCode center = centerCodeRepo.findById(centerIdx).orElse(null);
        if (center == null || center.getHeadCode() == null) return out;
        CenterCode head = centerCodeRepo.findFirstByHeadCodeAndCenterCodeIsNull(center.getHeadCode()).orElse(null);
        if (head == null) return out;
        for (User u : userRepo.findByRole(Role.DIVISION_ADMIN))
            if (head.getIdx().equals(u.getSalesCenterId())) out.add(toRecipient(u));
        return out;
    }

    private List<Recipient> hqAdmins() { return recipientsByRole(Role.MASTER_ADMIN); }

    /** 상품 공급 파트너를 수신자로 */
    private Recipient partnerOf(Product product) {
        if (product == null || product.getPartnerId() == null) return null;
        Partner p = partnerRepo.findById(product.getPartnerId()).orElse(null);
        if (p == null) return null;
        return new Recipient(p.getPartnerId(), p.getCompanyName(), Role.PARTNER.name());
    }

    /** CP 수당(원) — AllowanceService 규칙: RATE=총수당×(reward/100), FIXED=원. which=buzz|manager */
    private long cpAmount(Product p, String which) {
        if (p == null) return 0;
        Long reward = "manager".equals(which) ? p.getManagerReward() : p.getBuzzReward();
        if (reward == null) return 0;
        if (p.getRewardType() == Product.RewardType.FIXED) return reward;
        long total = p.getTotalAllowance() == null ? 0 : p.getTotalAllowance();
        return Math.round(total * (reward / 100.0));
    }
}
