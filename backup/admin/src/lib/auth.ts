// admin 인증 유틸 (JWT/role 가드용)

/**
 * 서비스 주소 런타임 해석.
 * 1) env(NEXT_PUBLIC_*)가 지정되면 우선 사용(특수 배포용 override).
 * 2) 미지정 시 브라우저 접속 host 기준 자동 구성:
 *    - HTTP  : 접속 host + 지정 포트(BE 9001, HOME은 80이라 포트 생략)로 직접 호출 → 로컬/서버IP/도메인(HTTP) 자동 대응.
 *    - HTTPS : 같은 도메인(same-origin, 포트 미지정) → 리버스 프록시가 /api 를 BE(9001)로 전달하는 표준 배포 가정.
 *              (https 에서 :9001 직결은 평문/TLS 불일치로 불가 → 자동 회피)
 * 3) SSR 등 window 없을 때 fallback.
 * ※ HTTPS 에서 admin/home 을 서로 다른 서브도메인으로 나눠 서비스하면 NEXT_PUBLIC_API_URL/HOME_URL 로 override.
 */
export function resolveServiceUrl(envValue: string | undefined, port: number, fallback: string): string {
  if (envValue) return envValue;
  if (typeof window !== "undefined") {
    const { protocol, hostname, host } = window.location;
    if (protocol === "https:") return `${protocol}//${host}`; // same-origin (리버스 프록시 경유)
    const suffix = port === 80 ? "" : `:${port}`;              // 80(기본 HTTP 포트)은 생략 → http://chinbiz.kr
    return `${protocol}//${hostname}${suffix}`;
  }
  return fallback;
}

export const API_BASE = resolveServiceUrl(process.env.NEXT_PUBLIC_API_URL, 9001, "http://175.125.94.198:9001");
export const HOME_URL = resolveServiceUrl(process.env.NEXT_PUBLIC_HOME_URL, 80, "http://chinbiz.kr");
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

// PWA(admin 오리진) 스코프 유지를 위해 admin 자체 로그인(/login)으로 이동.
// 특수 배포에서 home 로그인으로 보내려면 NEXT_PUBLIC_LOGIN_URL 로 override.
export const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

export function goToLogin() {
  if (typeof window !== "undefined") window.location.href = LOGIN_URL;
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
