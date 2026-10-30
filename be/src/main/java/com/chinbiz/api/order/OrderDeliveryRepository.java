package com.chinbiz.api.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderDeliveryRepository extends JpaRepository<OrderDelivery, Long> {
    List<OrderDelivery> findByOrderIdOrderByIdAsc(Long orderId);
}
