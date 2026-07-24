package com.chinbiz.api.edu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EducationRepository extends JpaRepository<Education, Long> {
    Optional<Education> findByProductIdAndManagerId(Long productId, Long managerId);
    List<Education> findByManagerId(Long managerId);
    List<Education> findByCompletedTrueAndApprovedFalseOrderByCompletedAtDesc();
    List<Education> findByApprovedTrueOrderByApprovedAtDesc();
}
