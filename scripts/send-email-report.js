// שולח מייל יומי עם דוח הדרישות לקורסים של מחר, באותו עיצוב כמו הדוח באתר.
// רץ בתוך GitHub Actions (ראו .github/workflows/email-daily-report.yml).
const nodemailer = require('nodemailer');
const { currentJerusalemHour } = require('./lib/time');
const { getDb, fetchTomorrowSubmissions, fetchManualNotes } = require('./lib/firestore');
const { sendPushToEmail } = require('./lib/push');
const { buildEmailHtml, fmtDateHe } = require('../js/report.js');

const TARGET_HOUR = 18;
const DEFAULT_RECIPIENT = 'yonatan1279@gmail.com';
const FORM_URL = 'https://plompi007.github.io/Logistic_Balar/admin.html';

async function sendEmail({ subject, html }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.EMAIL_TO || DEFAULT_RECIPIENT;
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('חסרים משתני סביבה GMAIL_USER / GMAIL_APP_PASSWORD');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  await transporter.sendMail({
    from: `דרישות לוגיסטיות <${gmailUser}>`,
    to,
    subject,
    html,
  });
}

async function main() {
  const hour = currentJerusalemHour();
  if (hour !== TARGET_HOUR && !process.env.FORCE_SEND) {
    console.log(`שעה נוכחית בישראל: ${hour}:00, לא ${TARGET_HOUR}:00 - לא שולח (זה תקין, זו הרצת ה-cron השנייה של אותו יום).`);
    return;
  }

  const { targetDate, submissions } = await fetchTomorrowSubmissions();
  const manualNotes = await fetchManualNotes(targetDate);
  const dateHe = fmtDateHe(targetDate);
  const title = `דוח דרישות לוגיסטיות - קורסי ${dateHe}`;
  const html = buildEmailHtml(submissions, { title, manualNotes });

  await sendEmail({ subject: title, html });
  console.log(`מייל נשלח בהצלחה (${submissions.length} דרישות ליום ${targetDate}).`);

  const db = getDb();
  const recipients = (process.env.EMAIL_TO || DEFAULT_RECIPIENT).split(',').map((e) => e.trim()).filter(Boolean);
  await Promise.all(
    recipients.map((email) =>
      sendPushToEmail(db, email, {
        title: 'דוח לוגיסטיקה מוכן',
        body: `${submissions.length} דרישות לקורסי ${dateHe}.`,
        url: FORM_URL,
      })
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
