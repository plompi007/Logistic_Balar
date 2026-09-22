// הפעלת/כיבוי התראות Push בדפדפן, דרך Service Worker + VAPID. המפתח הציבורי בטוח לחשיפה
// (רק המפתח הפרטי, שנשמר כ-secret ב-GitHub Actions, מאפשר לשלוח בפועל).
(function () {
  const VAPID_PUBLIC_KEY = 'BHRF0WPIZ69ZVsWw8mDaMgGRy57gmrnD3ULstK1PO2cKIFHu1NXPbaULjYE3CPhwzK9K5-xEDWhs9rKpVg22ios';

  const btn = document.getElementById('enablePushBtn');
  if (!btn || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (btn) btn.classList.add('hidden');
    return;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  function subscriptionDocId(endpoint) {
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
      hash = (hash * 31 + endpoint.charCodeAt(i)) >>> 0;
    }
    return `sub-${hash}`;
  }

  async function updateButtonState() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    btn.textContent = subscription ? '🔕 בטל התראות' : '🔔 הפעל התראות';
    btn.dataset.subscribed = subscription ? '1' : '0';
  }

  btn.addEventListener('click', async () => {
    const currentUser = window.auth.currentUser;
    if (!currentUser) return;

    btn.disabled = true;
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        await window.db.collection('pushSubscriptions').doc(subscriptionDocId(existing.endpoint)).delete();
        await existing.unsubscribe();
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('לא ניתנה הרשאה להתראות.');
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const raw = subscription.toJSON();
        await window.db.collection('pushSubscriptions').doc(subscriptionDocId(subscription.endpoint)).set({
          userEmail: currentUser.email,
          endpoint: raw.endpoint,
          keys: raw.keys,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      alert('שגיאה בהפעלת התראות: ' + err.message);
    } finally {
      btn.disabled = false;
      updateButtonState();
    }
  });

  updateButtonState();
})();
