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

// שולף דיווחי משוב (באגים/הצעות) שהוגשו ב-N הימים האחרונים.
async function fetchRecentFeedback(days) {
  ensureInitialized();
  const db = getFirestore();
  const { Timestamp } = require('firebase-admin/firestore');
  const since = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const snapshot = await db.collection('feedback').where('submittedAt', '>=', since).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      submittedAt: data.submittedAt && data.submittedAt.toDate ? data.submittedAt.toDate().toISOString() : null,
    };
  });
}

// שולף את התוכן הידני (רכבים/כוח אדם/כיתות וכו') שהמנהל מילא למחר, אם קיים.
async function fetchManualNotes(dateStr) {
  ensureInitialized();
  const db = getFirestore();
  const doc = await db.collection('dailyNotes').doc(dateStr).get();
  return doc.exists ? doc.data() : {};
}

// כל המדריכים הידועים למערכת - לפי אימיילים ייחודיים שהגישו אי-פעם דרישה כלשהי.
async function fetchKnownInstructors() {
  ensureInitialized();
  const db = getFirestore();
  const snapshot = await db.collection('submissions').get();
  const byEmail = new Map();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.submitterEmail) return;
    const email = data.submitterEmail.toLowerCase();
    if (!byEmail.has(email)) {
      byEmail.set(email, { email: data.submitterEmail, name: data.submitterName || data.submitterEmail });
    }
  });
  return Array.from(byEmail.values());
}

module.exports = {
  fetchTomorrowSubmissions,
  fetchRecentFeedback,
  fetchManualNotes,
  fetchKnownInstructors,
};
