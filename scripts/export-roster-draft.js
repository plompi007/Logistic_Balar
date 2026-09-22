// יוצר טיוטת לוח מדריכים (CSV) מתוך כל ההגשות שכבר קיימות ב-Firestore, כדי לחסוך הקלדה ידנית.
// כלי חד-פעמי/לפי צורך - רץ ידנית (workflow_dispatch) ומעלה את הקובץ כ-artifact של ההרצה.
// הפלט הוא טיוטה בלבד: היום בשבוע נגזר מהתאריכים שבפועל הוגשו, לא בהכרח דפוס שבועי קבוע -
// יש לעבור עליו ולערוך לפני שמפרסמים אותו כלוח האמיתי.
const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const WEEKDAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function weekdayHe(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return WEEKDAY_NAMES_HE[d.getUTCDay()];
}

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

async function main() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error('חסר משתנה סביבה FIREBASE_SERVICE_ACCOUNT');
  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  }
  const db = getFirestore();

  const snapshot = await db.collection('submissions').get();
  const seen = new Map();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.courseDate || !data.courseName || !data.submitterEmail) return;
    const weekday = weekdayHe(data.courseDate);
    const key = `${weekday}|${data.courseName}|${data.submitterEmail.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, {
        weekday,
        courseName: data.courseName,
        submitterName: data.submitterName || '',
        submitterEmail: data.submitterEmail,
      });
    }
  });

  const rows = Array.from(seen.values()).sort(
    (a, b) =>
      WEEKDAY_NAMES_HE.indexOf(a.weekday) - WEEKDAY_NAMES_HE.indexOf(b.weekday)
      || a.courseName.localeCompare(b.courseName, 'he')
  );

  const lines = ['יום בשבוע,שם הקורס,שם המדריך,אימייל המדריך'];
  rows.forEach((r) => {
    lines.push([r.weekday, r.courseName, r.submitterName, r.submitterEmail].map(csvEscape).join(','));
  });

  fs.writeFileSync('roster-draft.csv', lines.join('\n') + '\n', 'utf8');
  console.log(`נוצרו ${rows.length} שורות בטיוטת הלוח.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
