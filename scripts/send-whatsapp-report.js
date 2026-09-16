// שולח סיכום WhatsApp (דרך CallMeBot) עם כל הדרישות שהוגשו לקורסים של מחר.
// רץ בתוך GitHub Actions (ראו .github/workflows/whatsapp-daily-report.yml).
const { currentJerusalemHour } = require('./lib/time');
const { fetchTomorrowSubmissions } = require('./lib/firestore');
const { isLate, fmtDateHe } = require('../js/report.js');

const TARGET_HOUR = 15;

function itemsLine(items) {
  if (!Array.isArray(items) || items.length === 0) return '  לא צוין';
  return items
    .filter((i) => i && (i.name || '').trim())
    .map((i) => `  • ${i.name} — כמות: ${i.qty || '-'}`)
    .join('\n');
}

function buildMessage(courseDateStr, submissions) {
  const header = `*דרישות לוגיסטיות לקורסים של ${fmtDateHe(courseDateStr)}*\n(${submissions.length} דרישות)`;
  if (submissions.length === 0) {
    return `${header}\n\nלא הוגשו דרישות ליום זה.`;
  }

  const sorted = [...submissions].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const blocks = sorted.map((s) => {
    const late = isLate(s);
    return [
      `\n----------------------------`,
      `*${s.courseName || '(ללא שם קורס)'}* ${late ? '⚠️ הוגש באיחור' : '✅ בזמן'}`,
      `מדריך: ${s.submitterName || '-'}`,
      `שעות: ${s.startTime || '-'}–${s.endTime || '-'}`,
      `חניכים: ${s.traineesCount || '-'}`,
      s.needsClassroom ? `כיתה: כן (${s.classroomHours || '-'})` : 'כיתה: לא',
      `\nאמל"ח נדרש:\n${itemsLine(s.equipmentItems)}`,
      `\nציוד לוגיסטי נדרש:\n${itemsLine(s.logisticsItems)}`,
      s.notes ? `\nהערות: ${s.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return `${header}\n${blocks.join('\n')}`;
}

async function sendWhatsApp(text) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) {
    throw new Error('חסרים משתני סביבה CALLMEBOT_PHONE / CALLMEBOT_APIKEY');
  }
  // ל-CallMeBot יש הגבלת אורך הודעה - פיצול לחלקים של עד כ-1500 תווים אם צריך.
  const CHUNK = 1500;
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i + CHUNK));

  for (const chunk of chunks) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(chunk)}&apikey=${encodeURIComponent(apikey)}`;
    const res = await fetch(url);
    const body = await res.text();
    console.log(`CallMeBot response (${res.status}): ${body.slice(0, 200)}`);
    if (!res.ok) throw new Error(`שליחת WhatsApp נכשלה: ${res.status} ${body}`);
    await new Promise((r) => setTimeout(r, 2000)); // מרווח קטן בין חלקים
  }
}

async function main() {
  const hour = currentJerusalemHour();
  if (hour !== TARGET_HOUR && !process.env.FORCE_SEND) {
    console.log(`שעה נוכחית בישראל: ${hour}:00, לא ${TARGET_HOUR}:00 - לא שולח (זה תקין, זו הרצת ה-cron השנייה של אותו יום).`);
    return;
  }

  const { targetDate, submissions } = await fetchTomorrowSubmissions();
  const message = buildMessage(targetDate, submissions);
  console.log(message);
  await sendWhatsApp(message);
  console.log('הודעת WhatsApp נשלחה בהצלחה.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
