(function () {
  const ADMIN_EMAILS = ['nohar.tzur@gmail.com', 'yonatan1279@gmail.com'];

  const loginBox = document.getElementById('loginBox');
  const adminPanel = document.getElementById('adminPanel');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');
  const filterDate = document.getElementById('filterDate');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const exportBtn = document.getElementById('exportBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const tableWrap = document.getElementById('tableWrap');
  const seedBtn = document.getElementById('seedBtn');
  const clearSeedBtn = document.getElementById('clearSeedBtn');

  if (new URLSearchParams(location.search).get('seed') === '1') {
    seedBtn.classList.remove('hidden');
    clearSeedBtn.classList.remove('hidden');
  }

  let allSubmissions = [];

  loginBtn.addEventListener('click', async () => {
    loginError.style.display = 'none';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await window.auth.signInWithPopup(provider);
    } catch (err) {
      loginError.textContent = 'התחברות נכשלה: ' + err.message;
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => window.auth.signOut());

  window.auth.onAuthStateChanged((user) => {
    if (user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
      loginError.style.display = 'none';
      loginBox.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      loadSubmissions();
    } else if (user) {
      // מחובר עם חשבון Google שאינו מורשה לניהול
      window.auth.signOut();
      loginError.textContent = `החשבון ${user.email} אינו מורשה לניהול.`;
      loginError.style.display = 'block';
    } else {
      loginBox.classList.remove('hidden');
      adminPanel.classList.add('hidden');
    }
  });

  function toDate(submittedAt) {
    if (submittedAt && typeof submittedAt.toDate === 'function') return submittedAt.toDate();
    return submittedAt ? new Date(submittedAt) : null;
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // עוטף ערכים שעלולים לערבב עברית עם אנגלית/מספרים (שמות קורסים) ב-<bdi>, למניעת סדר bidi מבלבל.
  function bdi(str) {
    return `<bdi>${escapeHtml(str)}</bdi>`;
  }

  function renderTable(items) {
    if (!items.length) {
      tableWrap.innerHTML = '<p style="text-align:center;color:#6b7280;">אין דרישות להצגה</p>';
      return;
    }
    const sorted = [...items].sort((a, b) =>
      `${a.courseDate || ''}${a.startTime || ''}`.localeCompare(`${b.courseDate || ''}${b.startTime || ''}`)
    );
    const rows = sorted
      .map((item) => {
        const late = window.LogisticReport.isLate(item);
        return `<tr class="${late ? 'late' : ''}" data-id="${item.id}">
          <td>${bdi(item.courseName)}</td>
          <td>${escapeHtml(item.courseDate)}</td>
          <td>${escapeHtml(item.startTime)}-${escapeHtml(item.endTime)}</td>
          <td title="${escapeHtml(item.submitterEmail || '')}">${bdi(item.submitterName)}</td>
          <td>${escapeHtml(item.traineesCount || '-')}</td>
          <td><span class="tag ${late ? 'tag-late' : 'tag-ok'}">${late ? 'באיחור' : 'בזמן'}</span></td>
          <td><button class="btn btn-danger delete-btn" data-id="${item.id}">מחק</button></td>
        </tr>`;
      })
      .join('');
    tableWrap.innerHTML = `<table>
      <thead><tr>
        <th>קורס</th><th>תאריך</th><th>שעות</th><th>מדריך</th><th>חניכים</th><th>סטטוס</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    tableWrap.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('למחוק דרישה זו?')) return;
        await window.db.collection('submissions').doc(btn.dataset.id).delete();
        loadSubmissions();
      });
    });
  }

  function applyFilter() {
    const items = filterDate.value
      ? allSubmissions.filter((i) => i.courseDate === filterDate.value)
      : allSubmissions;
    renderTable(items);
  }

  async function loadSubmissions() {
    const snapshot = await window.db.collection('submissions').get();
    allSubmissions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data, submittedAt: toDate(data.submittedAt) };
    });
    applyFilter();
  }

  clearFilterBtn.addEventListener('click', () => {
    filterDate.value = '';
    applyFilter();
  });
  refreshBtn.addEventListener('click', loadSubmissions);
  filterDate.addEventListener('change', applyFilter);

  function dateStr(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function buildSampleSubmissions() {
    const courses = ['אווטה', 'פלייקארט', 'FPV', 'הגנמי'];
    const names = ['דני כהן', 'יעל לוי', 'עומר ביטון', 'שירה מזרחי', 'אורי גל', 'נועה שרון', 'תומר אשכנזי', 'רותם פרץ', 'איתי נחום', 'מאיה גורן'];
    const equipmentPool = [['נשק אישי', '25'], ['אפודי מגן', '25'], ['קסדות', '15'], ['משקפי ראיית לילה', '5']];
    const logisticsPool = [['בקבוקי מים', '50'], ['שולחנות', '4'], ['כיסאות', '20'], ['מטען ניידים', '3']];
    const notesPool = ['נא לוודא זמינות מוקדם', 'קבוצה גדולה, יש להיערך בהתאם', ''];

    const samples = [];
    for (let i = 0; i < 10; i++) {
      // 7 ראשונות בעוד כמה ימים (בזמן), 3 אחרונות היום/מחר (יוצג כ"באיחור" כי המועד כבר עבר)
      const offset = i < 7 ? 4 + i : i - 6;
      samples.push({
        submitterName: names[i],
        submitterEmail: window.auth.currentUser.email,
        courseName: courses[i % courses.length],
        courseDate: dateStr(offset),
        startTime: i % 2 === 0 ? '08:00' : '13:00',
        endTime: i % 2 === 0 ? '12:00' : '17:00',
        traineesCount: String(5 + i * 2),
        needsClassroom: i % 2 === 0,
        classroomHours: i % 2 === 0 ? '08:00-09:00' : '',
        equipmentItems: [equipmentPool[i % equipmentPool.length]].map(([name, qty]) => ({ name, qty })),
        logisticsItems: [logisticsPool[i % logisticsPool.length]].map(([name, qty]) => ({ name, qty })),
        notes: notesPool[i % notesPool.length],
        sample: true,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    return samples;
  }

  seedBtn.addEventListener('click', async () => {
    seedBtn.disabled = true;
    seedBtn.textContent = 'יוצר...';
    try {
      const batch = window.db.batch();
      buildSampleSubmissions().forEach((s) => {
        batch.set(window.db.collection('submissions').doc(), s);
      });
      await batch.commit();
      await loadSubmissions();
      alert('נוצרו 10 דרישות לדוגמה. אפשר עכשיו ללחוץ על "ייצוא דוח מסודר" כדי לראות איך זה נראה.');
    } catch (err) {
      alert('שגיאה ביצירת דוגמאות: ' + err.message);
    } finally {
      seedBtn.disabled = false;
      seedBtn.textContent = 'צור 10 דרישות לדוגמה';
    }
  });

  clearSeedBtn.addEventListener('click', async () => {
    if (!confirm('למחוק את כל דרישות הדוגמה (sample=true)?')) return;
    clearSeedBtn.disabled = true;
    try {
      const snapshot = await window.db.collection('submissions').where('sample', '==', true).get();
      const batch = window.db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      await loadSubmissions();
    } catch (err) {
      alert('שגיאה במחיקת דוגמאות: ' + err.message);
    } finally {
      clearSeedBtn.disabled = false;
    }
  });

  exportBtn.addEventListener('click', () => {
    const items = filterDate.value
      ? allSubmissions.filter((i) => i.courseDate === filterDate.value)
      : allSubmissions;
    const title = filterDate.value
      ? `דוח דרישות לוגיסטיות - קורסי ${window.LogisticReport.fmtDateHe(filterDate.value)}`
      : 'דוח דרישות לוגיסטיות - כלל הקורסים';
    const html = window.LogisticReport.buildReportHtml(items, { title });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  });
})();
