package com.chinbiz.api.ad;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface AdImageRepository extends JpaRepository<AdImage, Long> {
    List<AdImage> findByAdIdOrderBySortOrderAsc(Long adId);
    @Transactional void deleteByAdId(Long adId);
}
