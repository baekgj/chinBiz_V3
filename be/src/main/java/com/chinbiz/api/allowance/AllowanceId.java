package com.chinbiz.api.allowance;

import java.io.Serializable;
import java.util.Objects;

/**
 * 수당(Allowance) 복합 기본키: (유형, 주문번호, 회원구분, 회원ID)
 */
public class AllowanceId implements Serializable {
    private Allowance.Type type;
    private String orderNo;
    private Allowance.MemberType memberType;
    private String memberId;

    public AllowanceId() {}
    public AllowanceId(Allowance.Type type, String orderNo, Allowance.MemberType memberType, String memberId) {
        this.type = type; this.orderNo = orderNo; this.memberType = memberType; this.memberId = memberId;
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AllowanceId that)) return false;
        return type == that.type && Objects.equals(orderNo, that.orderNo)
                && memberType == that.memberType && Objects.equals(memberId, that.memberId);
    }
    @Override public int hashCode() { return Objects.hash(type, orderNo, memberType, memberId); }
}
