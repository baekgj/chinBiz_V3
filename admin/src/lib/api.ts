// admin → BE 인증 포함 API 헬퍼 (JWT Bearer 자동 첨부)
import { getToken, API_BASE } from "./auth";

export { API_BASE };

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

export async function apiGet<T = unknown>(path: string): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  return handle<T>(res);
}

async function send<T>(path: string, method: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...authHeaders(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export const apiPost = <T = unknown>(p: string, b: unknown) => send<T>(p, "POST", b);
export const apiPut = <T = unknown>(p: string, b: unknown) => send<T>(p, "PUT", b);
export const apiDelete = <T = unknown>(p: string) => send<T>(p, "DELETE", null);

/** 멀티파트 파일 업로드 (Content-Type 미지정 → 브라우저가 boundary 설정) */
export async function apiUpload<T = unknown>(path: string, file: File): Promise<ApiResult<T>> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers: { ...authHeaders() }, body: fd });
  return handle<T>(res);
}
