package com.chinbiz.api.alarm;

import java.util.List;
import java.util.Map;

import static com.chinbiz.api.alarm.AlarmTarget.*;

/**
 * 알람 프로세스 기본 정의 (docs/16 chinbiz3_alramlist.xlsx). 시더/문서화 기준.
 *  - 각 프로세스는 대상별 기본 문구를 가진다. 엑셀에 있는 (프로세스,대상)만 기본 사용(enabled=true).
 *  - 관리자는 [알람설정]에서 대상 on/off·문구를 수정할 수 있다.
 */
public final class AlarmDefs {
    private AlarmDefs() {}

    public record TargetMsg(AlarmTarget target, String message) {}
    public record Def(String code, String name, String trigger, List<TargetMsg> defaults) {}

    // 편의: 여러 대상이 같은 문구를 공유
    private static List<TargetMsg> msg(String message, AlarmTarget... targets) {
        return java.util.Arrays.stream(targets).map(t -> new TargetMsg(t, message)).toList();
    }
    private static List<TargetMsg> merge(List<TargetMsg>... lists) {
        return java.util.Arrays.stream(lists).flatMap(List::stream).toList();
    }

    public static final List<Def> DEFS = List.of(
        new Def("SIGNUP", "회원가입", "home - 회원가입화면에서 [무료로 가입하기] 버튼 클릭시", merge(
            msg("OOO 버즈회원이 ㅁㅁㅁㅁ센터 소속으로 가입되었습니다.", CENTER, DIVISION, HQ),
            msg("OOO 버즈회원이 추천인으로 가입되었습니다.", REFERRER))),

        new Def("PARTNER_INQUIRY", "파트너상담", "home - 파트너사 입점 및 제안하기 버튼 클릭시",
            msg("OOOO 파트너 상담 신청이 접수되었습니다.", HQ)),

        new Def("MEMBER_REFERRAL", "회원추천", "버즈ADMIN - [버즈 네트워크]-[회원등록] 화면에서 [회원등록] 버튼 클릭시", merge(
            msg("OOO 버즈회원이 ㅁㅁㅁㅁ센터 소속으로 가입되었습니다.", CENTER, DIVISION, HQ),
            msg("OOO 버즈회원을 가입하였습니다.", REFERRER))),

        new Def("MANAGER_APPLY", "매니저신청", "버즈ADMIN - 버즈네트워크 - 매니저신청",
            msg("OOO 버즈회원이 ㅁㅁㅁㅁ센터 소속 매니저 활동을 신청하였습니다.", CENTER)),

        new Def("MANAGER_APPROVE", "매니저승인", "센터ADMIN/본사admin 매니저 [승인] 버튼 클릭시", merge(
            msg("ㅁㅁㅁㅁ센터의 소속 매니저 활동 승인 되었습니다.", MANAGER),
            msg("OOO회원(@@@)의 ㅁㅁㅁㅁ센터 소속 매니저 활동이 승인되었습니다.", CENTER))),

        new Def("MANAGER_APPROVE_CANCEL", "매니저취소", "본사admin - [조직망 및 영업관리]/[매니저신청]-[매니저 승인완료] [취소] 버튼", merge(
            msg("매니저 활동량이 미비하여, 매니저 승인이 취소되었습니다.", MANAGER),
            msg("OOO회원(@@@)의 매니저 활동량이 미비하여, 매니저 승인이 취소되었습니다.", CENTER))),

        new Def("PRODUCT_REGISTER", "상품등록", "본사admin - [상품관리]/[상품등록] 메뉴에서 상품 등록시",
            msg("********* 신규상품이 등록되었습니다.", BUZZ, MANAGER, CENTER)),

        new Def("EDU_APPLY", "교육신청", "매니저admin - 교육관리 - 교육완료 버튼 클릭시",
            msg("OOO 매니저가 ******** 상품에 대한 교육신청을 접수 하였습니다.", CENTER, HQ)),

        new Def("EDU_APPROVE", "교육승인", "센터ADMIN - [교육관리]/[교육이수신청] 메뉴에서 [승인] 버튼 클릭시",
            msg("******* 상품에 대한 교육이수가 완료되었습니다.", MANAGER)),

        new Def("SALE1", "1차영업신청", "버즈ADMIN - [영업파이프라인]-[1차 영업등록] 화면에서 [영업등록] 버튼 클릭시", merge(
            msg("OOO 버즈회원이 @@@ 고객을 1차영업 등록하였습니다. CP수당 $$$$$원이 적립됩니다.\n[주문번호 : ______]", BUZZ, CENTER, DIVISION, HQ, REFERRER),
            msg("OOO 버즈회원이 @@@ 고객을 1차영업 등록하였습니다. [상품명 : *******]\n[주문번호 : ______]", PARTNER))),

        new Def("SALE2", "2차영업신청", "매니저admin - [영업관리]/[버즈1차접수현황] 메뉴의 버튼 클릭시", merge(
            msg("OOO 매니저회원이 @@@ 고객을 2차영업 신청하였습니다. CP수당 $$$$$원이 적립됩니다.\n[주문번호 : ______]", MANAGER, MGMT_CENTER),
            msg("OOO 매니저회원이 @@@ 고객을 2차영업 신청하였습니다. [상품명 : *******]\n[주문번호 : ______]", PARTNER))),

        new Def("MANAGER_CANCEL", "매니저취소", "본사admin - [조직망 및 영업관리]/[영업관리] 메뉴의 [매니저취소] 버튼 클릭시", merge(
            msg("OOO 매니저회원의 @@@ 고객의 2차 영업활동을 취소합니다. CP수당 $$$$원을 차감합니다.\n[주문번호 : ______]", MANAGER, MGMT_CENTER),
            msg("OOO 매니저회원의 @@@ 고객의 2차 영업활동을 취소합니다.\n[주문번호 : ______]", BUZZ, CENTER))),

        new Def("ORDER_CANCEL", "주문취소", "파트너사admin - [영업현황] 메뉴에서 [취소] 버튼 클릭시", merge(
            msg("고객의 요청으로 해당 주문을 취소하였습니다. 기 적립된 CP수당 $$$$$원을 차감합니다.\n[주문번호 : ______]", BUZZ, REFERRER, CENTER, HQ, MGMT_CENTER),
            msg("고객의 요청으로 해당 주문을 취소하였습니다. 기 적립된 CP수당 $$$$$원을 차감되며, 활동비 보전으로 50000원을 지급해 드립니다.\n[주문번호 : ______]", MANAGER))),

        new Def("ORDER_CONFIRM", "거래확정", "파트너사admin - [영업현황] 메뉴에서 [구매확정] 버튼 클릭시",
            msg("고객 주문이 확정되어 적립된 CP수당이 MP수당으로 전환됩니다.\n[주문번호 : ______]", BUZZ, CENTER, MANAGER, MGMT_CENTER, DIVISION, REFERRER)),

        new Def("CLOSE", "마감완료", "본사admin - [수당및정산관리]/[매출현황] 메뉴에서 [마감완료] 버튼 클릭시",
            msg("0000년 00월 영업 활동에 대한 마감을 완료하였습니다.", BUZZ, MANAGER, CENTER, DIVISION)),

        new Def("SETTLE", "정산완료", "본사admin - [수당및정산관리]/[마감내역] 메뉴에서 [정산완료] 버튼 클릭시",
            msg("0000년 00월 영업 활동에 대한 정산이 마감되었습니다. 정산된 수당금액은 5영업일 이내 지급될 예정입니다.", BUZZ, MANAGER, CENTER, DIVISION)),

        new Def("SETTLE_SKIP", "정산완료(미정산대상)", "본사admin - [마감내역] [정산완료] 시 MP 1만원 미만 → 익월 이월 대상",
            msg("정산 대상금액이 1만원 미만으로 당월 정산이 미처리 되었습니다. 좀더 노력해 주세요~", BUZZ, MANAGER, CENTER, DIVISION)),

        new Def("PAY", "지급완료", "본사admin - [수당및정산관리]/[정산내역] 메뉴에서 [지급완료] 버튼 클릭시",
            msg("0000년 00월 영업 활동에 대한 수당이 지급되었습니다.", BUZZ, MANAGER, CENTER, DIVISION))
    );

    /** 전체 대상 표시 순서 */
    public static final List<AlarmTarget> ALL_TARGETS = List.of(BUZZ, MANAGER, CENTER, MGMT_CENTER, DIVISION, HQ, REFERRER, PARTNER);

    /** (code,target) → 기본 문구 조회 */
    public static Map<String, String> defaultMessages(Def d) {
        java.util.Map<String, String> m = new java.util.LinkedHashMap<>();
        for (TargetMsg tm : d.defaults()) m.put(tm.target().name(), tm.message());
        return m;
    }
}
