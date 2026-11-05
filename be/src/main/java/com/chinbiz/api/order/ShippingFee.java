package com.chinbiz.api.order;

import com.chinbiz.api.product.Product;

import java.util.List;
import java.util.Set;

/**
 * 택배비 계산 (docs/34). 상품의 택배비 설정 + 배송지별 수량으로 주문 택배비를 산출한다.
 *  - FREE            : 택배비없음(무료) → 0원
 *  - PER_QTY         : 개별부과 — (N)개 상품당 택배비 (X)원 → ceil(총수량 / N) × X
 *  - PER_ADDRESS     : 배송지별부과 — 한 배송지당 (X)원 → 배송지 수 × X
 *  - PER_ADDRESS_QTY : 배송지별개별부과 — 한 배송지당 (N)개 상품당 (X)원 → Σ ceil(배송지수량 / N) × X
 */
public final class ShippingFee {

    public static final Set<String> TYPES = Set.of("FREE", "PER_QTY", "PER_ADDRESS", "PER_ADDRESS_QTY");

    private ShippingFee() {}

    public static String normalizeType(String type) {
        return type != null && TYPES.contains(type) ? type : "FREE";
    }

    private static long ceilDiv(long a, long b) { return (a + b - 1) / b; }

    public static long calc(Product p, List<Integer> deliveryQtys) {
        String type = normalizeType(p.getShippingType());
        long fee = p.getShippingFee();
        long unit = Math.max(1, p.getShippingUnitQty());
        if ("FREE".equals(type) || fee <= 0 || deliveryQtys.isEmpty()) return 0L;
        return switch (type) {
            case "PER_QTY" -> ceilDiv(deliveryQtys.stream().mapToLong(Integer::longValue).sum(), unit) * fee;
            case "PER_ADDRESS" -> deliveryQtys.size() * fee;
            case "PER_ADDRESS_QTY" -> deliveryQtys.stream().mapToLong(q -> ceilDiv(Math.max(q, 1), unit)).sum() * fee;
            default -> 0L;
        };
    }
}
