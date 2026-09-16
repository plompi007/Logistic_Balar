// בניית דוח HTML מודפס/קריא מתוך רשימת הגשות.
// נטען גם בעמוד הניהול (דפדפן) וגם בסקריפטים המתוזמנים ב-GitHub Actions (Node).
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;
  } else {
    root.LogisticReport = mod;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // מועד ההגשה האחרון הוא 12:00 יום לפני הקורס.
  function deadlineFor(courseDate) {
    if (!courseDate) return null;
    const d = new Date(`${courseDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d;
  }

  function isLate(submission) {
    const deadline = deadlineFor(submission.courseDate);
    if (!deadline || !submission.submittedAt) return false;
    return new Date(submission.submittedAt) > deadline;
  }

  function fmtDateHe(dateLike) {
    if (!dateLike) return '';
    const d = new Date(dateLike);
    return d.toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function fmtDateTimeHe(dateLike) {
    if (!dateLike) return '';
    const d = new Date(dateLike);
    return d.toLocaleString('he-IL', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }

  function itemsList(items) {
    const clean = (Array.isArray(items) ? items : []).filter((i) => i && (i.name || '').trim());
    if (clean.length === 0) return '<p class="empty">לא צוין</p>';
    return `<ul>${clean
      .map((i) => `<li><span class="item-dot"></span><span class="item-name">${escapeHtml(i.name)}</span><span class="item-qty">${escapeHtml(i.qty || '-')}</span></li>`)
      .join('')}</ul>`;
  }

  function metaRow(pairs) {
    return `<tr>${pairs
      .map(([label, value]) => `<th>${escapeHtml(label)}</th><td>${value}</td>`)
      .join('')}</tr>`;
  }

  function submissionCard(s, index) {
    const late = isLate(s);
    const rows = [
      metaRow([
        ['שם המדריך', escapeHtml(s.submitterName || '-')],
        ['תאריך הקורס', escapeHtml(fmtDateHe(s.courseDate) || s.courseDate || '-')],
      ]),
      metaRow([
        ['שעות הקורס', `${escapeHtml(s.startTime || '-')} – ${escapeHtml(s.endTime || '-')}`],
        ['כמות חניכים', escapeHtml(s.traineesCount || '-')],
      ]),
      metaRow([
        ['צורך בכיתה', s.needsClassroom ? 'כן' : 'לא'],
        ['שעות כיתה', s.needsClassroom ? escapeHtml(s.classroomHours || '-') : '—'],
      ]),
    ];

    return `
    <section class="card ${late ? 'late' : ''}">
      <header class="card-header">
        <div class="card-title">
          <span class="card-index">${index}</span>
          <h2>${escapeHtml(s.courseName || '(ללא שם קורס)')}</h2>
        </div>
        ${late ? '<span class="badge badge-late">⚠ הוגש באיחור</span>' : '<span class="badge badge-ok">✓ הוגש בזמן</span>'}
      </header>

      <table class="meta-table">${rows.join('')}</table>

      <div class="items-grid">
        <div class="section">
          <h3><span class="section-icon">🛡️</span> אמל"ח נדרש</h3>
          ${itemsList(s.equipmentItems)}
        </div>
        <div class="section">
          <h3><span class="section-icon">🎒</span> ציוד לוגיסטי נדרש</h3>
          ${itemsList(s.logisticsItems)}
        </div>
      </div>

      ${s.notes ? `<div class="section notes-section"><h3><span class="section-icon">📝</span> הערות</h3><p>${escapeHtml(s.notes)}</p></div>` : ''}

      <footer class="card-footer">הוגש בתאריך: ${escapeHtml(fmtDateTimeHe(s.submittedAt))}</footer>
    </section>`;
  }

  function buildReportHtml(submissions, { title } = {}) {
    const sorted = [...submissions].sort((a, b) => {
      const da = `${a.courseDate || ''}T${a.startTime || '00:00'}`;
      const db = `${b.courseDate || ''}T${b.startTime || '00:00'}`;
      return da.localeCompare(db);
    });
    const lateCount = sorted.filter(isLate).length;
    const generatedAt = fmtDateTimeHe(new Date());

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title || 'דוח דרישות לוגיסטיות')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: light;
    --accent: #3457d5;
    --accent-soft: #eaf0ff;
    --ok: #0f9d68;
    --ok-soft: #e5f7ef;
    --late: #d5384f;
    --late-soft: #fdeaee;
    --text: #1a2233;
    --muted: #667085;
    --border: #e6e9f0;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Heebo', 'Segoe UI', Arial, sans-serif;
    background: #eef1f7;
    margin: 0;
    padding: 32px 16px 60px;
    color: var(--text);
  }
  .report-header {
    max-width: 880px;
    margin: 0 auto 28px;
    text-align: center;
  }
  .report-header h1 { margin: 0 0 6px; font-size: 1.8rem; font-weight: 800; color: var(--accent); }
  .report-meta { color: var(--muted); font-size: 0.9rem; }
  .summary { display: flex; justify-content: center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
  .summary .pill { background: var(--accent-soft); color: var(--accent); padding: 6px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
  .summary .pill.late { background: var(--late-soft); color: var(--late); }
  main { max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
  .card {
    background: #fff;
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(20, 30, 60, 0.07);
    border: 1px solid var(--border);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px 22px;
    background: var(--accent-soft);
    border-bottom: 3px solid var(--accent);
  }
  .card.late .card-header { background: var(--late-soft); border-bottom-color: var(--late); }
  .card-title { display: flex; align-items: center; gap: 10px; }
  .card-index {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--accent); color: #fff; font-size: 0.8rem; font-weight: 700;
    flex-shrink: 0;
  }
  .card.late .card-index { background: var(--late); }
  .card-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
  .badge { font-size: 0.78rem; padding: 5px 12px; border-radius: 999px; font-weight: 700; white-space: nowrap; }
  .badge-ok { background: var(--ok-soft); color: var(--ok); }
  .badge-late { background: var(--late-soft); color: var(--late); border: 1px solid var(--late); }

  .meta-table { width: 100%; border-collapse: collapse; }
  .meta-table tr { border-bottom: 1px solid var(--border); }
  .meta-table tr:last-child { border-bottom: none; }
  .meta-table th, .meta-table td {
    text-align: right;
    padding: 10px 22px;
    font-size: 0.92rem;
    font-weight: 400;
    width: 25%;
  }
  .meta-table th { color: var(--muted); font-weight: 600; white-space: nowrap; }
  .meta-table td { color: var(--text); font-weight: 500; }

  .items-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-top: 1px solid var(--border);
  }
  .section { padding: 16px 22px; }
  .items-grid .section:first-child { border-inline-end: 1px solid var(--border); }
  .section h3 {
    margin: 0 0 10px; font-size: 0.9rem; font-weight: 700; color: var(--accent);
    display: flex; align-items: center; gap: 6px;
  }
  .section-icon { font-size: 1rem; }
  ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
  .item-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .item-name { flex: 1; }
  .item-qty {
    color: var(--accent); background: var(--accent-soft); font-weight: 700;
    font-size: 0.78rem; padding: 2px 9px; border-radius: 999px; white-space: nowrap;
  }
  .empty { color: #9ca3af; margin: 0; font-size: 0.88rem; }
  .notes-section { border-top: 1px solid var(--border); }
  .notes-section p { margin: 0; font-size: 0.9rem; color: var(--text); line-height: 1.5; }
  .card-footer {
    padding: 10px 22px; font-size: 0.78rem; color: var(--muted);
    background: #fafbfd; border-top: 1px solid var(--border);
  }

  @media (max-width: 560px) {
    .meta-table th, .meta-table td { padding: 8px 14px; font-size: 0.85rem; }
    .items-grid { grid-template-columns: 1fr; }
    .items-grid .section:first-child { border-inline-end: none; border-bottom: 1px solid var(--border); }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .card { box-shadow: none; break-inside: avoid; }
    .no-print { display: none; }
  }
  .no-print { max-width: 880px; margin: 0 auto 20px; text-align: left; }
  .no-print button {
    background: var(--accent); color: #fff; border: none; padding: 10px 20px;
    border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; font-family: inherit;
  }
</style>
</head>
<body>
  <div class="no-print"><button onclick="window.print()">הדפסה / שמירה כ-PDF</button></div>
  <div class="report-header">
    <h1>${escapeHtml(title || 'דוח דרישות לוגיסטיות')}</h1>
    <div class="report-meta">נוצר בתאריך: ${generatedAt}</div>
    <div class="summary">
      <span class="pill">סה"כ דרישות: ${sorted.length}</span>
      <span class="pill late">הוגשו באיחור: ${lateCount}</span>
    </div>
  </div>
  <main>
    ${sorted.length ? sorted.map((s, i) => submissionCard(s, i + 1)).join('') : '<p style="text-align:center;color:#6b7280;">אין דרישות להצגה</p>'}
  </main>
</body>
</html>`;
  }

  // גרסה מיוחדת לשליחה במייל: לקוחות מייל (Gmail וכו') לא תומכים ב-CSS variables, גופנים
  // חיצוניים, grid/flex או <style> מורכב - לכן זו טבלת HTML פשוטה עם עיצוב inline בלבד.
  function emailFieldRow(label, value) {
    return `<tr>
      <td style="padding:6px 0;border-bottom:1px solid #e6e9f0;font-size:13px;color:#667085;width:120px;white-space:nowrap;" valign="top">${escapeHtml(label)}</td>
      <td style="padding:6px 0;border-bottom:1px solid #e6e9f0;font-size:13px;color:#1a2233;" valign="top">${value}</td>
    </tr>`;
  }

  function emailItemsBlock(title, items) {
    const clean = (Array.isArray(items) ? items : []).filter((i) => i && (i.name || '').trim());
    const rows = clean.length
      ? clean.map((i) => `<div style="padding:2px 0;font-size:13px;color:#1a2233;">• ${escapeHtml(i.name)} <span style="color:#3457d5;">(כמות: ${escapeHtml(i.qty || '-')})</span></div>`).join('')
      : `<div style="font-size:13px;color:#9ca3af;">לא צוין</div>`;
    return `<div style="margin-top:12px;">
      <div style="font-size:13px;font-weight:bold;color:#3457d5;margin-bottom:4px;">${escapeHtml(title)}</div>
      ${rows}
    </div>`;
  }

  function emailSubmissionBlock(s, index) {
    const late = isLate(s);
    const statusColor = late ? '#d5384f' : '#0f9d68';
    const statusBg = late ? '#fdeaee' : '#e5f7ef';
    const statusText = late ? '⚠ הוגש באיחור' : '✓ הוגש בזמן';

    const metaRows = [
      emailFieldRow('שם המדריך', escapeHtml(s.submitterName || '-')),
      emailFieldRow('תאריך הקורס', escapeHtml(fmtDateHe(s.courseDate) || s.courseDate || '-')),
      emailFieldRow('שעות הקורס', `${escapeHtml(s.startTime || '-')} - ${escapeHtml(s.endTime || '-')}`),
      emailFieldRow('כמות חניכים', escapeHtml(s.traineesCount || '-')),
      emailFieldRow('צורך בכיתה', s.needsClassroom ? 'כן' : 'לא'),
    ];
    if (s.needsClassroom) {
      metaRows.push(emailFieldRow('שעות כיתה', escapeHtml(s.classroomHours || '-')));
    }

    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;border:1px solid #e6e9f0;border-radius:8px;overflow:hidden;">
      <tr><td style="background:${statusColor};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:16px 20px;background:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:16px;font-weight:bold;color:#1a2233;">${index}. ${escapeHtml(s.courseName || '(ללא שם קורס)')}</td>
            <td align="left" style="white-space:nowrap;">
              <span style="display:inline-block;font-size:12px;font-weight:bold;color:${statusColor};background:${statusBg};padding:4px 10px;border-radius:999px;">${statusText}</span>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:10px;">
          ${metaRows.join('')}
        </table>
        ${emailItemsBlock('אמל"ח נדרש', s.equipmentItems)}
        ${emailItemsBlock('ציוד לוגיסטי נדרש', s.logisticsItems)}
        ${s.notes ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e6e9f0;">
          <div style="font-size:13px;font-weight:bold;color:#3457d5;margin-bottom:4px;">הערות</div>
          <div style="font-size:13px;color:#1a2233;">${escapeHtml(s.notes)}</div>
        </div>` : ''}
        <div style="margin-top:12px;font-size:11px;color:#9ca3af;">הוגש בתאריך: ${escapeHtml(fmtDateTimeHe(s.submittedAt))}</div>
      </td></tr>
    </table>`;
  }

  function buildEmailHtml(submissions, { title } = {}) {
    const sorted = [...submissions].sort((a, b) => {
      const da = `${a.courseDate || ''}T${a.startTime || '00:00'}`;
      const db = `${b.courseDate || ''}T${b.startTime || '00:00'}`;
      return da.localeCompare(db);
    });
    const lateCount = sorted.filter(isLate).length;
    const generatedAt = fmtDateTimeHe(new Date());
    const body = sorted.length
      ? sorted.map((s, i) => emailSubmissionBlock(s, i + 1)).join('')
      : `<div style="text-align:center;color:#667085;padding:20px;font-size:13px;">אין דרישות להצגה</div>`;

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title || 'דוח דרישות לוגיסטיות')}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef1f7;">
    <tr><td align="center" style="padding:24px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="text-align:center;padding-bottom:20px;">
          <div style="font-size:20px;font-weight:bold;color:#3457d5;">${escapeHtml(title || 'דוח דרישות לוגיסטיות')}</div>
          <div style="font-size:12px;color:#667085;margin-top:4px;">נוצר בתאריך: ${generatedAt}</div>
          <div style="margin-top:10px;">
            <span style="display:inline-block;background:#eaf0ff;color:#3457d5;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:999px;margin:0 4px;">סה"כ דרישות: ${sorted.length}</span>
            <span style="display:inline-block;background:#fdeaee;color:#d5384f;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:999px;margin:0 4px;">הוגשו באיחור: ${lateCount}</span>
          </div>
        </td></tr>
        <tr><td>${body}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  return { buildReportHtml, buildEmailHtml, isLate, deadlineFor };
});
