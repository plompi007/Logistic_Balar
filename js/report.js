// בניית דוח HTML מודפס/קריא מתוך רשימת הגשות. נטען גם בעמוד הניהול.
window.LogisticReport = (function () {
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
    if (!Array.isArray(items) || items.length === 0) return '<p class="empty">לא צוין</p>';
    return `<ul>${items
      .filter((i) => i && (i.name || '').trim())
      .map((i) => `<li><span class="item-name">${escapeHtml(i.name)}</span><span class="item-qty">כמות: ${escapeHtml(i.qty || '-')}</span></li>`)
      .join('')}</ul>`;
  }

  function submissionCard(s) {
    const late = isLate(s);
    return `
    <section class="card ${late ? 'late' : ''}">
      <header class="card-header">
        <h2>${escapeHtml(s.courseName || '(ללא שם קורס)')}</h2>
        <div class="badges">
          ${late ? '<span class="badge badge-late">הוגש באיחור</span>' : '<span class="badge badge-ok">הוגש בזמן</span>'}
        </div>
      </header>
      <div class="grid">
        <div><strong>מגיש הדרישה:</strong> ${escapeHtml(s.submitterName || '-')}</div>
        <div><strong>תאריך הקורס:</strong> ${escapeHtml(fmtDateHe(s.courseDate) || s.courseDate || '-')}</div>
        <div><strong>שעת פתיחה:</strong> ${escapeHtml(s.startTime || '-')}</div>
        <div><strong>שעת סיום:</strong> ${escapeHtml(s.endTime || '-')}</div>
        <div><strong>כמות חניכים:</strong> ${escapeHtml(s.traineesCount || '-')}</div>
        <div><strong>צורך בכיתה:</strong> ${s.needsClassroom ? 'כן' : 'לא'}</div>
        ${s.needsClassroom ? `<div><strong>שעות כיתה:</strong> ${escapeHtml(s.classroomHours || '-')}</div>` : ''}
        <div><strong>הוגש בתאריך:</strong> ${escapeHtml(fmtDateTimeHe(s.submittedAt))}</div>
      </div>
      <div class="section">
        <h3>אמל"ח נדרש</h3>
        ${itemsList(s.equipmentItems)}
      </div>
      <div class="section">
        <h3>ציוד לוגיסטי נדרש</h3>
        ${itemsList(s.logisticsItems)}
      </div>
      ${s.notes ? `<div class="section"><h3>הערות</h3><p>${escapeHtml(s.notes)}</p></div>` : ''}
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
<title>${escapeHtml(title || 'דוח דרישות לוגיסטיות')}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#f4f6f8; margin:0; padding:24px; color:#1f2937; }
  .report-header { max-width: 900px; margin: 0 auto 24px; }
  .report-header h1 { margin:0 0 4px; font-size: 1.6rem; }
  .report-meta { color:#6b7280; font-size: 0.9rem; }
  .summary { display:flex; gap:16px; margin-top:12px; flex-wrap: wrap; }
  .summary .pill { background:#e5e7eb; padding:6px 14px; border-radius: 999px; font-size: 0.85rem; }
  .summary .pill.late { background:#fee2e2; color:#991b1b; }
  main { max-width: 900px; margin: 0 auto; display:flex; flex-direction:column; gap:16px; }
  .card { background:#fff; border-radius:12px; padding:18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-inline-start: 5px solid #10b981; }
  .card.late { border-inline-start-color:#ef4444; }
  .card-header { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap: wrap; }
  .card-header h2 { margin:0; font-size:1.2rem; }
  .badge { font-size:0.75rem; padding:4px 10px; border-radius:999px; font-weight:600; }
  .badge-ok { background:#d1fae5; color:#065f46; }
  .badge-late { background:#fee2e2; color:#991b1b; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:8px 16px; margin:14px 0; font-size:0.92rem; }
  .section { margin-top:12px; padding-top:10px; border-top:1px solid #e5e7eb; }
  .section h3 { margin:0 0 6px; font-size:0.95rem; color:#374151; }
  ul { margin:0; padding-inline-start: 20px; }
  li { display:flex; justify-content:space-between; gap:12px; padding:2px 0; }
  .item-qty { color:#6b7280; white-space:nowrap; }
  .empty { color:#9ca3af; margin:0; }
  @media print {
    body { background:#fff; padding:0; }
    .card { box-shadow:none; border:1px solid #e5e7eb; break-inside: avoid; }
    .no-print { display:none; }
  }
  .no-print { max-width:900px; margin: 0 auto 16px; text-align:left; }
  .no-print button { background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:0.9rem; }
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
    ${sorted.length ? sorted.map(submissionCard).join('') : '<p style="text-align:center;color:#6b7280;">אין דרישות להצגה</p>'}
  </main>
</body>
</html>`;
  }

  return { buildReportHtml, isLate, deadlineFor };
})();
