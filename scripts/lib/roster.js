// שולף את לוח המדריכים ממסמך Google Sheets שפורסם כ-CSV (Publish to web), עם העמודות:
// יום בשבוע, שם הקורס, שם המדריך, אימייל המדריך. כתובת הגיליון מגיעה מ-ROSTER_SHEET_CSV_URL
// (משתנה ריפו, לא secret - זה קישור לתוכן שכבר מפורסם לציבור ברגע שמפרסמים אותו).

function parseCsvLine(line) {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      cols.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cols.push(cur);
  return cols;
}

async function fetchRoster() {
  const url = process.env.ROSTER_SHEET_CSV_URL;
  if (!url) return [];

  const res = await fetch(url);
  if (!res.ok) throw new Error(`שגיאה בשליפת גיליון המדריכים: ${res.status}`);
  const csv = await res.text();

  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.slice(1); // דילוג על שורת הכותרות

  return rows
    .map(parseCsvLine)
    .filter((cols) => cols.length >= 4)
    .map(([weekday, courseName, instructorName, instructorEmail]) => ({
      weekday: (weekday || '').trim(),
      courseName: (courseName || '').trim(),
      instructorName: (instructorName || '').trim(),
      instructorEmail: (instructorEmail || '').trim().toLowerCase(),
    }))
    .filter((r) => r.weekday && r.courseName && r.instructorEmail);
}

module.exports = { fetchRoster };
