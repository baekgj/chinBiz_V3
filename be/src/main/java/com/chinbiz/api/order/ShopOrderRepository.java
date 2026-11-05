package com.chinbiz.api.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long>, JpaSpecificationExecutor<ShopOrder> {
    Optional<ShopOrder> findFirstBySaleIdAndOrderNoOrderByIdDesc(Long saleId, String orderNo);

    /** 파트너 정산현황 CP/MP (docs/34) — sale 과 연결된 partner_order 의 주문상태별 상품금액(판매가×수량, 택배비 제외) 합계 */
    @Query("select coalesce(sum(o.salePrice * o.quantity),0) from ShopOrder o, com.chinbiz.api.buzz.Sale s " +
           "where s.id = o.saleId and o.partnerId = :pid and o.status = :status")
    long sumProductAmount(@Param("pid") Long partnerId, @Param("status") String status);
}
