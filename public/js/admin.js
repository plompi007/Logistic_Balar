(function () {
  const loginBox = document.getElementById('loginBox');
  const adminPanel = document.getElementById('adminPanel');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const filterDate = document.getElementById('filterDate');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const exportBtn = document.getElementById('exportBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const tableWrap = document.getElementById('tableWrap');

  function getPassword() {
    return sessionStorage.getItem('adminPassword') || '';
  }

  function deadlineFor(courseDate) {
    if (!courseDate) return null;
    const d = new Date(`${courseDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d;
  }

  function isLate(item) {
    const deadline = deadlineFor(item.courseDate);
    if (!deadline) return false;
    return new Date(item.submittedAt) > deadline;
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'x-admin-password': getPassword(),
      },
    });
    if (res.status === 401) {
      sessionStorage.removeItem('adminPassword');
      showLogin();
      throw new Error('נדרשת התחברות מחדש');
    }
    return res;
  }

  function showLogin() {
    loginBox.classList.remove('hidden');
    adminPanel.classList.add('hidden');
  }

  function showPanel() {
    loginBox.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    loadSubmissions();
  }

  loginBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      loginError.textContent = 'סיסמה שגויה';
      loginError.style.display = 'block';
      return;
    }
    sessionStorage.setItem('adminPassword', password);
    showPanel();
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

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
        const late = isLate(item);
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
        await apiFetch(`/api/submissions/${btn.dataset.id}`, { method: 'DELETE' });
        loadSubmissions();
      });
    });
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadSubmissions() {
    const q = filterDate.value ? `?date=${encodeURIComponent(filterDate.value)}` : '';
    const res = await apiFetch(`/api/submissions${q}`);
    const items = await res.json();
    renderTable(items);
  }

  clearFilterBtn.addEventListener('click', () => {
    filterDate.value = '';
    loadSubmissions();
  });
  refreshBtn.addEventListener('click', loadSubmissions);
  filterDate.addEventListener('change', loadSubmissions);

  exportBtn.addEventListener('click', () => {
    const q = new URLSearchParams({ password: getPassword() });
    if (filterDate.value) q.set('date', filterDate.value);
    window.open(`/api/export?${q.toString()}`, '_blank');
  });

  if (getPassword()) {
    showPanel();
  } else {
    showLogin();
  }
})();
