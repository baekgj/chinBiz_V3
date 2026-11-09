package com.chinbiz.api.buzz;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ManagerCenterRepository extends JpaRepository<ManagerCenter, Long> {
    List<ManagerCenter> findByBuzzId(Long buzzId);
    List<ManagerCenter> findByBuzzIdAndStatus(Long buzzId, String status);
    List<ManagerCenter> findByCenterIdAndStatus(Long centerId, String status);
    /** 여러 센터의 승인(Y) 매니저 — 본부 산하 집계(docs/35-1) */
    List<ManagerCenter> findByCenterIdInAndStatus(java.util.Collection<Long> centerIds, String status);
    Optional<ManagerCenter> findByBuzzIdAndCenterId(Long buzzId, Long centerId);
    boolean existsByBuzzIdAndStatus(Long buzzId, String status);
}
