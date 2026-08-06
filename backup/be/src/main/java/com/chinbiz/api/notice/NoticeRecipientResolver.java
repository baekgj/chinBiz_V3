package com.chinbiz.api.notice;

import com.chinbiz.api.buzz.ManagerCenter;
import com.chinbiz.api.buzz.ManagerCenterRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 공지(Notice) 대상 → 실제 수신 회원 계정(userId) 해석기.
 * MyNoticeController.context 의 역방향: (targetType, allFlag, targetId) 로 수신 role/센터 조건을 만들어 회원을 조회한다.
 *  - DIVISION → DIVISION_ADMIN (소속센터 salesCenterId)
 *  - CENTER   → CENTER_ADMIN   (소속센터 salesCenterId)
 *  - MANAGER  → MANAGER        (관리센터 managerCenterId)
 *  - BUZZ     → BUZZ           (소속센터 salesCenterId)
 * allFlag=true → 해당 role 전체, 아니면 targetId(center_code.idx) 일치자만 → "특정 회원 타게팅".
 */
@Component
public class NoticeRecipientResolver {

    private final UserRepository userRepo;
    private final ManagerCenterRepository managerCenterRepo;

    public NoticeRecipientResolver(UserRepository userRepo, ManagerCenterRepository managerCenterRepo) {
        this.userRepo = userRepo;
        this.managerCenterRepo = managerCenterRepo;
    }

    /** 수신 대상 회원의 로그인 아이디(account) 목록 */
    public List<String> resolveAccounts(Notice notice) {
        if (notice == null || notice.getTargetType() == null) return Collections.emptyList();
        Role role = roleOf(notice.getTargetType());
        if (role == null) return Collections.emptyList();

        List<User> users;
        if (notice.isAllFlag() || notice.getTargetId() == null) {
            users = userRepo.findByRole(role);
        } else if (notice.getTargetType() == Notice.Target.MANAGER) {
            // 다중 활동센터(docs/19): 해당 센터를 승인(Y)받은 매니저 전원 → 대표센터 무관
            Set<Long> buzzIds = managerCenterRepo.findByCenterIdAndStatus(notice.getTargetId(), "Y")
                    .stream().map(ManagerCenter::getBuzzId).collect(Collectors.toSet());
            users = userRepo.findByRole(role).stream().filter(u -> buzzIds.contains(u.getId())).toList();
        } else {
            users = userRepo.findByRoleAndSalesCenterId(role, notice.getTargetId());
        }
        return users.stream().map(User::getUserId).filter(java.util.Objects::nonNull).toList();
    }

    /** 대상 role → 알림 클릭 시 이동할 워크스페이스 경로 */
    public String workspacePath(Notice.Target target) {
        return switch (target) {
            case DIVISION -> "/division";
            case CENTER -> "/center";
            case MANAGER, BUZZ -> "/buzz";
        };
    }

    private Role roleOf(Notice.Target target) {
        return switch (target) {
            case DIVISION -> Role.DIVISION_ADMIN;
            case CENTER -> Role.CENTER_ADMIN;
            case MANAGER -> Role.MANAGER;
            case BUZZ -> Role.BUZZ;
        };
    }
}
