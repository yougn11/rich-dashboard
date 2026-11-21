const CACHE_NAME = 'rich-project-pwa-v1';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 구글 시트 실시간 시세, GitHub Gist API, 환율 API는 캐시하지 않고 항상 실시간 네트워크 요청
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('script.googleusercontent.com') ||
    url.hostname.includes('api.github.com') ||
    url.hostname.includes('open.er-api.com')
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // 앱 본체(HTML, manifest, icon)는 네트워크 우선(최신 코드 즉시 반영), 오프라인 시 캐시 사용
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
