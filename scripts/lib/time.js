// עזרי זמן משותפים לסקריפטים המתוזמנים (שעון ישראל, ללא תלות בשעון הקיץ/חורף של השרת).
const TIMEZONE = 'Asia/Jerusalem';

function currentJerusalemHour() {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: '2-digit', hour12: false });
  return Number(fmt.format(new Date()));
}

function tomorrowJerusalemDateStr() {
  const now = new Date();
  const jerusalemNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  jerusalemNow.setDate(jerusalemNow.getDate() + 1);
  const y = jerusalemNow.getFullYear();
  const m = String(jerusalemNow.getMonth() + 1).padStart(2, '0');
  const d = String(jerusalemNow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = { TIMEZONE, currentJerusalemHour, tomorrowJerusalemDateStr };
