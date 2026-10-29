package com.chinbiz.api.ad;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AdRepository extends JpaRepository<Ad, Long> {
    List<Ad> findAllByOrderByIdDesc();
    List<Ad> findByPositionAndPublishedTrueOrderByIdAsc(Ad.Position position);
    Optional<Ad> findByAreaId(String areaId);
}
