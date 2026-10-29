package com.chinbiz.api.edu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EduMaterialRepository extends JpaRepository<EduMaterial, Long> {
    List<EduMaterial> findAllByOrderByIdDesc();
    List<EduMaterial> findByProductIdOrderByIdAsc(Long productId);
}
