// גישה משותפת ל-Firestore לסקריפטים המתוזמנים, דרך Service Account (עוקף את ה-rules של הדפדפן).
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { tomorrowJerusalemDateStr } = require('./time');

function ensureInitialized() {
  if (getApps().length > 0) return;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error('חסר משתנה סביבה FIREBASE_SERVICE_ACCOUNT');
  initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
}

// שולף את הדרישות שהוגשו לקורסים של "מחר" (שעון ישראל).
async function fetchTomorrowSubmissions() {
  ensureInitialized();
  const db = getFirestore();
  const targetDate = tomorrowJerusalemDateStr();
  const snapshot = await db.collection('submissions').where('courseDate', '==', targetDate).get();
  const submissions = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      submittedAt: data.submittedAt && data.submittedAt.toDate ? data.submittedAt.toDate().toISOString() : null,
    };
  });
  return { targetDate, submissions };
}

module.exports = { fetchTomorrowSubmissions };
