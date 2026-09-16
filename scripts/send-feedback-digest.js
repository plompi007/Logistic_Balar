// שולח דוח שבועי (מייל) עם כל דיווחי הבאגים/הצעות השיפור שהתקבלו בשבוע האחרון.
// שולח רק אם יש לפחות דיווח אחד. רץ בתוך GitHub Actions (ראו
// .github/workflows/feedback-weekly-digest.yml).
const nodemailer = require('nodemailer');
const { currentJerusalemHour, currentJerusalemWeekday } = require('./lib/time');
const { fetchRecentFeedback } = require('./lib/firestore');
const { buildFeedbackDigestEmailHtml } = require('../js/report.js');

const TARGET_WEEKDAY = 0; // ראשון
const TARGET_HOUR = 9;
const DAYS_BACK = 7;
const DEFAULT_RECIPIENT = 'nohar.tzur@gmail.com';

async function sendEmail({ subject, html }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.FEEDBACK_EMAIL_TO || DEFAULT_RECIPIENT;
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('חסרים משתני סביבה GMAIL_USER / GMAIL_APP_PASSWORD');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  await transporter.sendMail({
    from: `דיווחי מערכת <${gmailUser}>`,
    to,
    subject,
    html,
  });
}

async function main() {
  const weekday = currentJerusalemWeekday();
  const hour = currentJerusalemHour();
  if ((weekday !== TARGET_WEEKDAY || hour !== TARGET_HOUR) && !process.env.FORCE_SEND) {
    console.log(`יום ${weekday} שעה ${hour}:00 בישראל - לא יום ראשון ב-${TARGET_HOUR}:00, לא שולח (תקין, זו הרצה כפולה של אותו יום/ימים אחרים).`);
    return;
  }

  const entries = await fetchRecentFeedback(DAYS_BACK);
  if (entries.length === 0) {
    console.log('אין דיווחים חדשים בשבוע האחרון - לא נשלח מייל.');
    return;
  }

  const title = `דוח שבועי - ${entries.length} דיווחים על באגים/הצעות שיפור`;
  const html = buildFeedbackDigestEmailHtml(entries, { title });
  await sendEmail({ subject: title, html });
  console.log(`מייל נשלח בהצלחה (${entries.length} דיווחים).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
