package com.chinbiz.api.partner.dto;

/**
 * 파트너사 등록/수정 요청. (수정 시 password 는 비우면 기존 유지)
 */
public record PartnerRequest(
        String partnerId,
        String password,
        String companyName,
        String businessNumber,
        String ceoName,
        String companyPhone,
        String zipcode,
        String address,
        String addressDetail,
        String managerName,
        String managerPhone,
        String email,
        String bankName,
        String accountNumber,
        String accountHolder
) {}
