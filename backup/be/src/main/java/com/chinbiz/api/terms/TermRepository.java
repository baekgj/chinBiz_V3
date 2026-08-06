package com.chinbiz.api.terms;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TermRepository extends JpaRepository<Term, String> {
    List<Term> findAllByOrderBySortOrderAscCodeAsc();
}
