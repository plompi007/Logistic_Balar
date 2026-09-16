(function () {
  const loginBox = document.getElementById('loginBox');
  const adminPanel = document.getElementById('adminPanel');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const filterDate = document.getElementById('filterDate');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const exportBtn = document.getElementById('exportBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const tableWrap = document.getElementById('tableWrap');

  let allSubmissions = [];

  loginBtn.addEventListener('click', async () => {
    loginError.style.display = 'none';
    try {
      await window.auth.signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value);
    } catch (err) {
      loginError.textContent = 'התחברות נכשלה: ' + err.message;
      loginError.style.display = 'block';
    }
  });

  [emailInput, passwordInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });
  });

  window.auth.onAuthStateChanged((user) => {
    if (user) {
      loginBox.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      loadSubmissions();
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
          <td>${escapeHtml(item.courseName)}</td>
          <td>${escapeHtml(item.courseDate)}</td>
          <td>${escapeHtml(item.startTime)}-${escapeHtml(item.endTime)}</td>
          <td>${escapeHtml(item.submitterName)}</td>
          <td>${escapeHtml(item.traineesCount || '-')}</td>
          <td><span class="tag ${late ? 'tag-late' : 'tag-ok'}">${late ? 'באיחור' : 'בזמן'}</span></td>
          <td><button class="btn btn-danger delete-btn" data-id="${item.id}">מחק</button></td>
        </tr>`;
      })
      .join('');
    tableWrap.innerHTML = `<table>
      <thead><tr>
        <th>קורס</th><th>תאריך</th><th>שעות</th><th>מגיש</th><th>חניכים</th><th>סטטוס</th><th></th>
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

  exportBtn.addEventListener('click', () => {
    const items = filterDate.value
      ? allSubmissions.filter((i) => i.courseDate === filterDate.value)
      : allSubmissions;
    const title = filterDate.value
      ? `דוח דרישות לוגיסטיות - קורסי ${filterDate.value}`
      : 'דוח דרישות לוגיסטיות - כלל הקורסים';
    const html = window.LogisticReport.buildReportHtml(items, { title });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  });
})();
