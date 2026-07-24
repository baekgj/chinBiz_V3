// admin 인증 유틸 (JWT/role 가드용)

/**
 * 서비스 주소 런타임 해석.
 * 1) env(NEXT_PUBLIC_*)가 지정되면 우선 사용(특수 배포용 override).
 * 2) 미지정 시: 브라우저가 접속한 host + 지정 포트로 자동 구성 → 로컬/서버 자동 대응(파일 수정 불필요).
 * 3) SSR 등 window 없을 때 fallback.
 */
export function resolveServiceUrl(envValue: string | undefined, port: number, fallback: string): string {
  if (envValue) return envValue;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return fallback;
}

export const API_BASE = resolveServiceUrl(process.env.NEXT_PUBLIC_API_URL, 9001, "http://175.125.94.198:9001");
export const HOME_URL = resolveServiceUrl(process.env.NEXT_PUBLIC_HOME_URL, 8001, "http://175.125.94.198:8001");
export const TOKEN_KEY = "chinbiz_token";

// role → admin 경로 (home과 동일)
export const ROLE_PATH: Record<string, string> = {
  MASTER_ADMIN: "/master",
  PARTNER: "/partner",
  BUZZ: "/buzz",
  MANAGER: "/buzz",
  DIVISION_ADMIN: "/division",
  CENTER_ADMIN: "/center",
};

export function getToken(): string | null {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function persistToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function goToLogin() {
  if (typeof window !== "undefined") window.location.href = `${HOME_URL}/login`;
}

export type Me = { userId: string; name: string; role: string; salesCenterId?: string | number };

/** /api/auth/me 로 토큰 검증 + 사용자 정보 조회 */
export async function fetchMe(token: string): Promise<Me | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}
