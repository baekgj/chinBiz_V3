package com.chinbiz.api.partner.dto;

import com.chinbiz.api.partner.Partner;

/** 파트너사 응답 (비밀번호 제외). */
public record PartnerResponse(
        Long id,
        String partnerId,
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
        String accountHolder,
        String createdAt
) {
    public static PartnerResponse of(Partner p) {
        return new PartnerResponse(
                p.getId(), p.getPartnerId(), p.getCompanyName(), p.getBusinessNumber(),
                p.getCeoName(), p.getCompanyPhone(), p.getZipcode(), p.getAddress(),
                p.getAddressDetail(), p.getManagerName(), p.getManagerPhone(), p.getEmail(),
                p.getBankName(), p.getAccountNumber(), p.getAccountHolder(),
                p.getCreatedAt() == null ? null : p.getCreatedAt().toString()
        );
    }
}
