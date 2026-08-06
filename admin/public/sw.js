/*
 * 친비즈 PWA 서비스워커
 *  - 목적1: 웹푸시(Web Push) 수신 → 시스템 알림 표시 (앱이 닫혀 있어도 수신)
 *  - 목적2: "웹 수정 시 앱 자동 반영" → 네트워크 우선(HTML/정적은 항상 최신을 받음, 오프라인만 캐시 폴백)
 *  - API(/api), 업로드(/uploads)는 서비스워커가 관여하지 않고 브라우저에 그대로 위임(인증/최신성 보장)
 */
const CACHE = "chinbiz-runtime-v1";

self.addEventListener("install", () => {
  // 새 버전 즉시 활성화 (배포 후 다음 실행에서 최신 SW 적용)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 동일 오리진만 처리
  if (url.origin !== self.location.origin) return;
  // API / 업로드는 관여하지 않음(항상 네트워크 직접, 인증·최신성 보장)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) return;

  event.respondWith(
    (async () => {
      try {
        // 네트워크 우선 → 온라인이면 항상 최신 웹을 로드(자동 업데이트)
        const fresh = await fetch(req);
        if (fresh && fresh.ok && fresh.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        // 오프라인 폴백
        const cached = await caches.match(req);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});

// 웹푸시 수신 → 알림 표시
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "친비즈 알림", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "친비즈 알림";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
    vibrate: [80, 40, 80],
    tag: data.tag || undefined,
    renotify: !!data.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 → 해당 워크스페이스/페이지로 이동(열려 있으면 focus)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          try {
            await c.navigate(target);
          } catch (e) {
            /* 스코프 밖 등 → 무시 */
          }
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })()
  );
});
