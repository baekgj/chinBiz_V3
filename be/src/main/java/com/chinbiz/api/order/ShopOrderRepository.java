package com.chinbiz.api.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long>, JpaSpecificationExecutor<ShopOrder> {
    Optional<ShopOrder> findFirstBySaleIdAndOrderNoOrderByIdDesc(Long saleId, String orderNo);
}
