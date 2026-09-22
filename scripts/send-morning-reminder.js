// שולח תזכורת אישית לכל מדריך שלפי לוח המדריכים (Google Sheet) אמור ללמד קורס מחר,
// אבל עדיין לא הגיש עבורו דרישה לוגיסטית. רץ בתוך GitHub Actions, מופעל ע"י Google Apps
// Script חיצוני כל בוקר (ראו .github/workflows/morning-reminder.yml).
const nodemailer = require('nodemailer');
const { tomorrowJerusalemWeekdayHe } = require('./lib/time');
const { fetchTomorrowSubmissions } = require('./lib/firestore');
const { fetchRoster } = require('./lib/roster');
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

function buildReminderHtml(instructorName, courseName, dateHe) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>תזכורת: דרישה לוגיסטית חסרה</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef1f7;">
    <tr><td align="center" style="padding:24px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="background:#ffffff;border-radius:10px;overflow:hidden;padding:24px;">
          <div style="font-size:18px;font-weight:bold;color:#3457d5;margin-bottom:12px;">תזכורת: דרישה לוגיסטית חסרה</div>
          <div style="font-size:14px;color:#1a2233;line-height:1.6;">
            שלום ${instructorName},<br><br>
            לא נמצאה עדיין הגשת דרישה לוגיסטית עבור <b>${courseName}</b> שמתוכנן ליום ${dateHe}.<br>
            יש להגיש עד השעה 12:00 היום.
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
  const roster = await fetchRoster();
  if (!roster.length) {
    console.log('לוח המדריכים ריק או ROSTER_SHEET_CSV_URL לא מוגדר - לא נשלחות תזכורות.');
    return;
  }

  const { targetDate, submissions } = await fetchTomorrowSubmissions();
  const tomorrowWeekday = tomorrowJerusalemWeekdayHe();
  const dueTomorrow = roster.filter((r) => r.weekday === tomorrowWeekday);

  if (!dueTomorrow.length) {
    console.log(`אין קורסים בלוח המדריכים ליום ${tomorrowWeekday} - לא נשלחות תזכורות.`);
    return;
  }

  const alreadySubmitted = new Set(
    submissions.map((s) => `${(s.submitterEmail || '').toLowerCase()}|${(s.courseName || '').trim()}`)
  );
  const missing = dueTomorrow.filter(
    (r) => !alreadySubmitted.has(`${r.instructorEmail}|${r.courseName}`)
  );

  if (!missing.length) {
    console.log(`כל המדריכים שאמורים ללמד ב-${targetDate} כבר הגישו - לא נשלחות תזכורות.`);
    return;
  }

  const dateHe = fmtDateHe(targetDate);
  for (const r of missing) {
    const html = buildReminderHtml(r.instructorName || r.instructorEmail, r.courseName, dateHe);
    await sendReminder({
      to: r.instructorEmail,
      subject: `תזכורת: דרישה לוגיסטית ל${r.courseName} - ${dateHe}`,
      html,
    });
    console.log(`נשלחה תזכורת ל-${r.instructorEmail} (${r.courseName})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
