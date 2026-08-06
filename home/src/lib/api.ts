// 친비즈 백엔드(Spring Boot, 포트 9001) 연동 헬퍼

/**
 * 서비스 주소 런타임 해석.
 * 1) env(NEXT_PUBLIC_*)가 지정되면 그 값을 우선 사용(FE/BE가 서로 다른 host인 특수 배포용 override).
 * 2) 미지정 시 브라우저 접속 host 기준 자동 구성:
 *    - HTTP  : 접속 host + 지정 포트(BE 9001 / admin 3100, HOME은 80이라 포트 생략)로 직접 호출 → 로컬/서버IP/도메인(HTTP) 자동 대응.
 *    - HTTPS : 같은 도메인(same-origin, 포트 미지정)으로 호출 → 리버스 프록시가 /api 를 BE(9001)로 전달하는
 *              표준 HTTPS 배포를 가정. (https 에서 :9001 직결은 평문/TLS 불일치로 불가 → 자동 회피)
 * 3) SSR 등 window 없을 때는 fallback.
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

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  message?: string;
};

async function parse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

const NET_FAIL = { ok: false, status: 0, data: null, message: "서버에 연결할 수 없습니다." } as const;

export async function apiGet<T = unknown>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
    const data = await parse(res);
    return { ok: res.ok, status: res.status, data, message: data?.message };
  } catch { return NET_FAIL as ApiResult<T>; }
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await parse(res);
    return { ok: res.ok, status: res.status, data, message: data?.message };
  } catch { return NET_FAIL as ApiResult<T>; }
}

// 인증 토큰 저장 키
export const TOKEN_KEY = "chinbiz_token";
