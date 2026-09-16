(function () {
  if (!window.firebase || !window.FIREBASE_CONFIG) {
    console.error('Firebase SDK או firebase-config.js לא נטענו כראוי');
    return;
  }
  firebase.initializeApp(window.FIREBASE_CONFIG);
  window.db = firebase.firestore();
  window.auth = firebase.auth();
})();
