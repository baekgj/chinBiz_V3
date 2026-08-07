"use client";

import { createContext, useContext } from "react";
import type { Me } from "@/lib/auth";

/** AuthGuard 가 검증한 현재 사용자 정보를 하위 컴포넌트(Sidebar·RBAC 가드)에 공급. */
export const MeContext = createContext<Me | null>(null);

export function useMe(): Me | null {
  return useContext(MeContext);
}

/** 현재 사용자의 RBAC 담당영역(A~D). 미지정=[]=슈퍼(전체 접근). */
export function useAdminScopes(): string[] {
  const me = useMe();
  return me?.adminScopes ?? [];
}
