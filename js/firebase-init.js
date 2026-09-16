(function () {
  function showFatalError(message) {
    console.error(message);
    const banner = document.createElement('div');
    banner.textContent = message;
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f2607a;color:#fff;' +
      'padding:12px;text-align:center;font-weight:600;z-index:9999;direction:rtl;';
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(banner));
  }

  if (!window.firebase || !window.FIREBASE_CONFIG) {
    showFatalError('שגיאה: Firebase SDK או firebase-config.js לא נטענו כראוי');
    return;
  }
  try {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    window.db = firebase.firestore();
    // firebase.auth() קיים רק בעמודים שטוענים גם את firebase-auth-compat.js (admin.html).
    if (typeof firebase.auth === 'function') {
      window.auth = firebase.auth();
    }
  } catch (err) {
    showFatalError('שגיאה באתחול Firebase: ' + err.message);
  }
})();
