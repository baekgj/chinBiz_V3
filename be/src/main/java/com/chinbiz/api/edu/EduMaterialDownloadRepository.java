package com.chinbiz.api.edu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EduMaterialDownloadRepository extends JpaRepository<EduMaterialDownload, Long> {
    List<EduMaterialDownload> findByManagerId(Long managerId);
    List<EduMaterialDownload> findByManagerIdAndProductId(Long managerId, Long productId);
    long countByMaterialId(Long materialId);
}
