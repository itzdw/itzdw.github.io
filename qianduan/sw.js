/* 前端八股文工作台 · Service Worker
 * 策略：HTML 导航 network-first（保证发版可见）；静态资源 cache-first + 后台更新。
 * 发版时只需把 VERSION 改掉，旧缓存会在 activate 阶段自动清理。
 */
const VERSION = 'baguwen-v1.0.1';
const CACHE = 'baguwen-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './state-store.js',
  './data/questions.js',
  './views.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

const scopeURL = (p) => new URL(p, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (p) => {
      try {
        await cache.add(new Request(scopeURL(p), { cache: 'reload' }));
      } catch (err) {
        console.warn('[SW] precache skipped:', p, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.indexOf('baguwen-') === 0 && k !== CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await cache.match(scopeURL('./index.html'));
    if (shell) return shell;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>离线不可用</title>' +
      '<body style="font-family:sans-serif;padding:24px">首次加载后即可离线使用，请联网打开一次再重试。</body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

async function cacheFirst(request, event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) {
    // 后台静默更新，下次打开即是新版本
    event.waitUntil(
      fetch(request).then((res) => res && res.ok ? cache.put(request, res.clone()) : null)
        .catch(() => null)
    );
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req, event));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
