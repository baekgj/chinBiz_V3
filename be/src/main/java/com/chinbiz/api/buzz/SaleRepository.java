package com.chinbiz.api.buzz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {
    /** 활성 버즈 회원 수 = 1차영업을 1번이라도 신청한(등록한) 서로 다른 버즈 수 */
    @Query("select count(distinct s.buzzId) from Sale s where s.buzzId is not null")
    long countActiveBuzz();

    /** 기간 내 등록(신규 매칭) 건수 */
    long countByCreatedAtGreaterThanEqual(LocalDateTime from);

    /** 기간 내 등록된 영업의 상품 판매가 합산(총 거래액/GMV) */
    @Query("select coalesce(sum(p.salePrice),0) from Sale s, com.chinbiz.api.product.Product p " +
           "where p.id = s.productId and s.createdAt >= :from and s.createdAt < :to")
    long sumGmvBetween(@org.springframework.data.repository.query.Param("from") LocalDateTime from,
                       @org.springframework.data.repository.query.Param("to") LocalDateTime to);

    /** 중복 상품 신청 체크 (docs/28) — 사업자등록번호(숫자만) + 상품번호. 취소/반품 건·자기 자신(excludeId) 제외 */
    @Query(value = "select count(*) from sale where product_id = :productId " +
           "and replace(replace(business_number,'-',''),' ','') = :bizNo " +
           "and (status is null or status <> '취소/반품') and (:excludeId is null or id <> :excludeId)", nativeQuery = true)
    long countDupByBizNo(@org.springframework.data.repository.query.Param("productId") Long productId,
                         @org.springframework.data.repository.query.Param("bizNo") String bizNo,
                         @org.springframework.data.repository.query.Param("excludeId") Long excludeId);

    /** 중복 상품 신청 체크 (docs/28) — 사업자등록번호 없을 때: 대표자 핸드폰번호(숫자만) + 상품번호 */
    @Query(value = "select count(*) from sale where product_id = :productId " +
           "and replace(replace(ceo_phone,'-',''),' ','') = :phone " +
           "and (status is null or status <> '취소/반품') and (:excludeId is null or id <> :excludeId)", nativeQuery = true)
    long countDupByCeoPhone(@org.springframework.data.repository.query.Param("productId") Long productId,
                            @org.springframework.data.repository.query.Param("phone") String phone,
                            @org.springframework.data.repository.query.Param("excludeId") Long excludeId);
}
