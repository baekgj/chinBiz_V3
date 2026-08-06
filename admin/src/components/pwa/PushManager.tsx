"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { getToken } from "@/lib/auth";

/**
 * PWA 서비스워커 등록 + 웹푸시 구독 관리.
 * - 앱 전역(root layout)에 1회 마운트. 로그인 상태에서만 구독을 저장한다.
 * - 알림 권한이 이미 허용됨 → 조용히 구독 보장. 미결정(default) → 우측 하단 "알림 켜기" 버튼 노출.
 * - VAPID 미설정(BE)일 땐 아무 것도 하지 않음.
 */
export default function PushManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      // 1) 서비스워커 등록(로그인 여부와 무관 — 오프라인/자동업데이트 위해 항상)
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        return;
      }

      // 2) 로그인 상태가 아니면 구독은 보류
      if (!getToken()) return;

      // 3) BE VAPID 공개키 조회(푸시 활성 여부 확인)
      const res = await apiGet<{ publicKey: string; enabled: boolean }>("/api/push/vapid-public-key");
      if (!alive) return;
      if (!res.ok || !res.data?.enabled || !res.data.publicKey) return;
      setVapidKey(res.data.publicKey);

      const perm = Notification.permission;
      if (perm === "granted") {
        await subscribe(res.data.publicKey);
      } else if (perm === "default") {
        setShowPrompt(true); // 사용자 제스처로 권한 요청(브라우저 차단 방지)
      }
      // denied → 아무 것도 안 함
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enableClicked() {
    setBusy(true);
    try {
      const key = vapidKey ?? (await fetchKey());
      if (!key) return;
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribe(key);
      }
      setShowPrompt(false);
    } finally {
      setBusy(false);
    }
  }

  async function fetchKey(): Promise<string | null> {
    const res = await apiGet<{ publicKey: string; enabled: boolean }>("/api/push/vapid-public-key");
    return res.ok && res.data?.enabled ? res.data.publicKey : null;
  }

  async function subscribe(publicKey: string) {
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
      await apiPost("/api/push/subscribe", {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
    } catch {
      /* 구독 실패(권한 취소 등) → 조용히 무시 */
    }
  }

  if (!showPrompt) return null;

  return (
    <button
      onClick={enableClicked}
      disabled={busy}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
      aria-label="알림 켜기"
    >
      <span aria-hidden>🔔</span>
      {busy ? "설정 중…" : "알림 켜기"}
    </button>
  );
}

/** VAPID base64url 공개키 → Uint8Array (pushManager.subscribe applicationServerKey용) */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
