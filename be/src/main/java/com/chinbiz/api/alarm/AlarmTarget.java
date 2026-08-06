package com.chinbiz.api.alarm;

/**
 * 알람 수신 대상 유형 (docs/16 chinbiz3_alramlist.xlsx 수신자).
 *  - CENTER = 소속센터(버즈센터), MGMT_CENTER = 관리센터(매니저센터)
 */
public enum AlarmTarget {
    BUZZ("버즈"),
    MANAGER("매니저"),
    CENTER("소속센터"),
    MGMT_CENTER("관리센터"),
    DIVISION("본부"),
    HQ("본사"),
    REFERRER("추천인"),
    PARTNER("파트너");

    private final String label;
    AlarmTarget(String label) { this.label = label; }
    public String label() { return label; }
}
