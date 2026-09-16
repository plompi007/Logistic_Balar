// גישה משותפת ל-Firestore לסקריפטים המתוזמנים, דרך Service Account (עוקף את ה-rules של הדפדפן).
const admin = require('firebase-admin');
const { tomorrowJerusalemDateStr } = require('./time');

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error('חסר משתנה סביבה FIREBASE_SERVICE_ACCOUNT');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountJson)) });
  initialized = true;
}

// שולף את הדרישות שהוגשו לקורסים של "מחר" (שעון ישראל).
async function fetchTomorrowSubmissions() {
  ensureInitialized();
  const db = admin.firestore();
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
