// 친비즈 백엔드(Spring Boot, 포트 9001) 연동 헬퍼

/**
 * 서비스 주소 런타임 해석.
 * 1) env(NEXT_PUBLIC_*)가 지정되면 그 값을 우선 사용(FE/BE가 서로 다른 host인 특수 배포용 override).
 * 2) 미지정 시: 브라우저가 접속한 host(protocol+hostname) + 지정 포트로 자동 구성.
 *    → localhost로 열면 localhost, 서버 IP로 열면 서버 IP를 자동으로 호출(파일 수정 불필요).
 * 3) SSR 등 window 없을 때는 fallback.
 */
export function resolveServiceUrl(envValue: string | undefined, port: number, fallback: string): string {
  if (envValue) return envValue;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
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

export async function apiGet<T = unknown>(path: string): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  const data = await parse(res);
  return { ok: res.ok, status: res.status, data, message: data?.message };
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse(res);
  return { ok: res.ok, status: res.status, data, message: data?.message };
}

// 인증 토큰 저장 키
export const TOKEN_KEY = "chinbiz_token";
