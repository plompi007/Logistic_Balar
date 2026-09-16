require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const store = require('./lib/store');
const { buildReportHtml } = require('./lib/report');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'balar2026';
const EXPORT_CRON = process.env.EXPORT_CRON; // e.g. "0 15 * * *" for every day at 15:00

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  const password = req.header('x-admin-password') || req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'סיסמת מנהל שגויה' });
  }
  next();
}

// --- Public: submit a logistics requirement ---
app.post('/api/submissions', (req, res) => {
  const b = req.body || {};
  if (!b.courseName || !b.courseDate || !b.submitterName) {
    return res.status(400).json({ error: 'יש למלא שם קורס, תאריך קורס ושם מגיש' });
  }
  const record = store.create({
    submitterName: String(b.submitterName).trim(),
    courseName: String(b.courseName).trim(),
    courseDate: b.courseDate,
    startTime: b.startTime || '',
    endTime: b.endTime || '',
    traineesCount: b.traineesCount || '',
    needsClassroom: !!b.needsClassroom,
    classroomHours: b.classroomHours || '',
    equipmentItems: Array.isArray(b.equipmentItems) ? b.equipmentItems : [],
    logisticsItems: Array.isArray(b.logisticsItems) ? b.logisticsItems : [],
    notes: b.notes || '',
  });
  res.status(201).json(record);
});

// --- Admin: list submissions ---
app.get('/api/submissions', requireAdmin, (req, res) => {
  const items = store.readAll();
  const { date } = req.query;
  const filtered = date ? items.filter((i) => i.courseDate === date) : items;
  res.json(filtered);
});

// --- Admin: delete a submission ---
app.delete('/api/submissions/:id', requireAdmin, (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'לא נמצא' });
  res.json({ ok: true });
});

// --- Admin: export report (HTML, printable) ---
app.get('/api/export', requireAdmin, (req, res) => {
  const items = store.readAll();
  const { date } = req.query;
  const filtered = date ? items.filter((i) => i.courseDate === date) : items;
  const title = date ? `דוח דרישות לוגיסטיות - קורסי ${date}` : 'דוח דרישות לוגיסטיות - כלל הקורסים';
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(buildReportHtml(filtered, { title }));
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'סיסמה שגויה' });
  res.json({ ok: true });
});

// --- Optional scheduled export to disk, e.g. daily at 15:00 ---
if (EXPORT_CRON) {
  const exportsDir = path.join(__dirname, 'data', 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  cron.schedule(EXPORT_CRON, () => {
    const items = store.readAll();
    const today = new Date().toISOString().slice(0, 10);
    const html = buildReportHtml(items, { title: `דוח דרישות לוגיסטיות - ${today}` });
    const file = path.join(exportsDir, `report-${today}-${Date.now()}.html`);
    fs.writeFileSync(file, html, 'utf8');
    console.log(`[cron] דוח מתוזמן נוצר: ${file}`);
  });
  console.log(`[cron] ייצוא מתוזמן פעיל לפי הביטוי: ${EXPORT_CRON}`);
}

app.listen(PORT, () => {
  console.log(`Logistic Balar server running on http://localhost:${PORT}`);
});
