// admin → BE 인증 포함 API 헬퍼 (JWT Bearer 자동 첨부)
import { getToken, API_BASE } from "./auth";

export { API_BASE };

/**
 * 업로드 이미지 URL 정규화. 상대(/uploads/..) · 레거시 절대(http://host:9001/uploads/..) 모두
 * 현재 API_BASE 기준으로 재구성 → 리버스 프록시(HTTPS same-origin)/localhost 자동 대응 + mixed-content 방지.
 */
export function mediaUrl(p?: string | null): string {
  if (!p) return "";
  const i = p.indexOf("/uploads/");
  if (i >= 0) return `${API_BASE}${p.slice(i)}`;
  if (/^https?:\/\//i.test(p)) return p;
  return p.startsWith("/") ? `${API_BASE}${p}` : p;
}

export type ApiResult<T> = { ok: boolean; status: number; data: T | null; message?: string };

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle<T>(res: Response): Promise<ApiResult<T>> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  const d = data as { message?: string } | null;
  return { ok: res.ok, status: res.status, data: data as T, message: d?.message };
}

/** 네트워크 실패(BE 미연결·CORS 등)를 던지지 않고 실패 결과로 반환 → 호출부 unhandledRejection 방지 */
const NET_FAIL: ApiResult<never> = { ok: false, status: 0, data: null, message: "서버에 연결할 수 없습니다." };

export async function apiGet<T = unknown>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return handle<T>(res);
  } catch { return NET_FAIL as ApiResult<T>; }
}

async function send<T>(path: string, method: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...authHeaders(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return handle<T>(res);
  } catch { return NET_FAIL as ApiResult<T>; }
}

export const apiPost = <T = unknown>(p: string, b: unknown) => send<T>(p, "POST", b);
export const apiPut = <T = unknown>(p: string, b: unknown) => send<T>(p, "PUT", b);
export const apiDelete = <T = unknown>(p: string) => send<T>(p, "DELETE", null);

/** 멀티파트 파일 업로드 (Content-Type 미지정 → 브라우저가 boundary 설정). fields: 추가 폼 필드 */
export async function apiUpload<T = unknown>(path: string, file: File, fields?: Record<string, string>): Promise<ApiResult<T>> {
  const fd = new FormData();
  fd.append("file", file);
  Object.entries(fields ?? {}).forEach(([k, v]) => fd.append(k, v));
  try {
    const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers: { ...authHeaders() }, body: fd });
    return handle<T>(res);
  } catch { return NET_FAIL as ApiResult<T>; }
}

/**
 * 인증 파일 다운로드 — 응답 본문을 끝까지 받은 뒤(완료 시점) 브라우저 저장을 실행하고 true 반환.
 * 파일명은 Content-Disposition(filename*=UTF-8) 우선, 없으면 fallbackName.
 */
export async function apiDownload(path: string, fallbackName: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } });
    if (!res.ok) {
      const r = await handle<{ message?: string }>(res);
      return { ok: false, message: r.message || "다운로드에 실패했습니다." };
    }
    const blob = await res.blob(); // 전체 수신 완료
    const cd = res.headers.get("Content-Disposition") ?? "";
    const star = cd.match(/filename\*=UTF-8''([^;]+)/i);
    const plain = cd.match(/filename="?([^";]+)"?/i);
    const name = star ? decodeURIComponent(star[1]) : plain ? plain[1] : fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true };
  } catch { return { ok: false, message: NET_FAIL.message }; }
}
