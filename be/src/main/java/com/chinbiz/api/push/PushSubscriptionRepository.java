package com.chinbiz.api.push;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findByAccount(String account);

    /** 여러 계정의 모든 구독(공지 발송 대상 조회) */
    List<PushSubscription> findByAccountIn(Collection<String> accounts);

    boolean existsByEndpoint(String endpoint);

    void deleteByEndpoint(String endpoint);
}
