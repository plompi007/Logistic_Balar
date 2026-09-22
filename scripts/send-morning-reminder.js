// שולח תזכורת אישית לכל מדריך הידוע למערכת (מי שהגיש אי-פעם דרישה) שעדיין לא הגיש דרישה
// לוגיסטית עבור מחר. רץ בתוך GitHub Actions, מופעל ע"י Google Apps Script חיצוני כל בוקר
// (ראו .github/workflows/morning-reminder.yml). מכוון לפשטות: לא יודע לאיזה יום/קורס
// מדריך מסוים רגיל להגיש, אז שולח לכולם כל יום עד שהם מגישים - עלול להיות מיותר בימים
// שהם לא מלמדים בכלל, אבל לא דורש שום תחזוקה ידנית (לוח מדריכים וכו').
const nodemailer = require('nodemailer');
const { getDb, fetchTomorrowSubmissions, fetchKnownInstructors } = require('./lib/firestore');
const { sendPushToEmail } = require('./lib/push');
const { fmtDateHe } = require('../js/report.js');

const FORM_URL = 'https://plompi007.github.io/Logistic_Balar/';

async function sendReminder({ to, subject, html }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
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

function buildReminderHtml(instructorName, dateHe) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>תזכורת: דרישה לוגיסטית</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef1f7;">
    <tr><td align="center" style="padding:24px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="background:#ffffff;border-radius:10px;overflow:hidden;padding:24px;">
          <div style="font-size:18px;font-weight:bold;color:#3457d5;margin-bottom:12px;">תזכורת: דרישה לוגיסטית</div>
          <div style="font-size:14px;color:#1a2233;line-height:1.6;">
            שלום ${instructorName},<br><br>
            טרם נמצאה הגשת דרישה לוגיסטית על שמך ליום ${dateHe}.<br>
            אם אתה מלמד קורס מחר, יש להגיש עד השעה 12:00 היום. אם לא - אפשר להתעלם מההודעה.
          </div>
          <div style="margin-top:20px;">
            <a href="${FORM_URL}" style="display:inline-block;background:#3457d5;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:bold;">לטופס ההגשה</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function main() {
  const instructors = await fetchKnownInstructors();
  if (!instructors.length) {
    console.log('אין מדריכים ידועים במערכת - לא נשלחות תזכורות.');
    return;
  }

  const { targetDate, submissions } = await fetchTomorrowSubmissions();
  const alreadySubmitted = new Set(submissions.map((s) => (s.submitterEmail || '').toLowerCase()));
  const missing = instructors.filter((i) => !alreadySubmitted.has(i.email.toLowerCase()));

  if (!missing.length) {
    console.log(`כל המדריכים הידועים כבר הגישו ל-${targetDate} - לא נשלחות תזכורות.`);
    return;
  }

  const db = getDb();
  const dateHe = fmtDateHe(targetDate);
  for (const instructor of missing) {
    const html = buildReminderHtml(instructor.name, dateHe);
    await sendReminder({
      to: instructor.email,
      subject: `תזכורת: דרישה לוגיסטית - ${dateHe}`,
      html,
    });
    await sendPushToEmail(db, instructor.email, {
      title: 'תזכורת: דרישה לוגיסטית',
      body: `טרם הגשת דרישה ליום ${dateHe}. יש להגיש עד 12:00.`,
      url: FORM_URL,
    });
    console.log(`נשלחה תזכורת ל-${instructor.email}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
