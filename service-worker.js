// קאש בסיסי ל"מעטפת" האתר (HTML/CSS/JS/אייקונים) כדי שהאתר ייטען מהר ובקליטה חלשה בשטח.
// לא נוגע בקריאות ל-Firebase/Firestore/Google Fonts (חוצי-מקור) - אלו תמיד ישירות מהרשת.
const CACHE_NAME = 'logistic-balar-v1';
const APP_SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './css/style.css',
  './js/firebase-config.js',
  './js/firebase-init.js',
  './js/form.js',
  './js/admin.js',
  './js/report.js',
  './js/pwa-register.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first עם נפילה לקאש - תמיד מעדכן מהרשת כשיש חיבור, אבל האתר עדיין נטען מהקאש
// גם עם קליטה גרועה/בלי רשת. מוגבל לבקשות מאותו המקור (הקבצים הסטטיים שלנו בלבד).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
