// קאש בסיסי ל"מעטפת" האתר (HTML/CSS/JS/אייקונים) כדי שהאתר ייטען מהר ובקליטה חלשה בשטח.
// לא נוגע בקריאות ל-Firebase/Firestore/Google Fonts (חוצי-מקור) - אלו תמיד ישירות מהרשת.
const CACHE_NAME = 'logistic-balar-v2';
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
  './js/push-subscribe.js',
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

// מציג התראת Push שהתקבלה מהשרת (ראו scripts/lib/push.js).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: 'דרישות לוגיסטיות', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'דרישות לוגיסטיות';
  const options = {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    data: { url: data.url || './' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// לחיצה על ההתראה - פותח/ממקד את האתר בטאב קיים במקום לפתוח כפול.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
