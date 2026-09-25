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

  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editCancelBtn = document.getElementById('editCancelBtn');
  const editCourseName = document.getElementById('editCourseName');
  const editCourseNameOtherField = document.getElementById('editCourseNameOtherField');
  const editCourseNameOther = document.getElementById('editCourseNameOther');
  const editLocation = document.getElementById('editLocation');
  const editLocationOtherField = document.getElementById('editLocationOtherField');
  const editLocationOther = document.getElementById('editLocationOther');
  const editNeedsClassroom = document.getElementById('editNeedsClassroom');
  const editClassroomHoursField = document.getElementById('editClassroomHoursField');
  const editClassroomStartTime = document.getElementById('editClassroomStartTime');
  const editClassroomEndTime = document.getElementById('editClassroomEndTime');
  let editingId = null;

  editCourseName.addEventListener('change', () => {
    editCourseNameOtherField.classList.toggle('hidden', editCourseName.value !== 'אחר');
  });
  editLocation.addEventListener('change', () => {
    editLocationOtherField.classList.toggle('hidden', editLocation.value !== 'אחר');
  });
  editNeedsClassroom.addEventListener('change', () => {
    editClassroomHoursField.classList.toggle('hidden', !editNeedsClassroom.checked);
  });

  // ממיר רשימת פריטים לטקסט (שורה לכל פריט "שם - כמות") ובחזרה, לעריכה נוחה בטקסט חופשי.
  function itemsToText(items) {
    return (Array.isArray(items) ? items : [])
      .filter((i) => i && (i.name || '').trim())
      .map((i) => `${i.name} - ${i.qty || '-'}`)
      .join('\n');
  }

  function textToItems(text) {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.lastIndexOf(' - ');
        if (idx === -1) return { name: line, qty: '-' };
        return { name: line.slice(0, idx).trim(), qty: line.slice(idx + 3).trim() || '-' };
      })
      .filter((item) => item.name);
  }

  function openEditModal(item) {
    editingId = item.id;
    document.getElementById('editSubmitterName').value = item.submitterName || '';

    const knownCourseNames = Array.from(editCourseName.options).map((o) => o.value);
    if (item.courseName && !knownCourseNames.includes(item.courseName)) {
      editCourseName.value = 'אחר';
      editCourseNameOther.value = item.courseName;
    } else {
      editCourseName.value = item.courseName || '';
      editCourseNameOther.value = '';
    }
    editCourseNameOtherField.classList.toggle('hidden', editCourseName.value !== 'אחר');

    document.getElementById('editCourseDate').value = item.courseDate || '';
    document.getElementById('editTraineesCount').value = item.traineesCount || '';
    document.getElementById('editStartTime').value = item.startTime || '';
    document.getElementById('editEndTime').value = item.endTime || '';

    const knownLocations = Array.from(editLocation.options).map((o) => o.value);
    if (item.location && !knownLocations.includes(item.location)) {
      editLocation.value = 'אחר';
      editLocationOther.value = item.location;
    } else {
      editLocation.value = item.location || '';
      editLocationOther.value = '';
    }
    editLocationOtherField.classList.toggle('hidden', editLocation.value !== 'אחר');

    editNeedsClassroom.checked = !!item.needsClassroom;
    editClassroomHoursField.classList.toggle('hidden', !item.needsClassroom);
    const [classroomStart, classroomEnd] = (item.classroomHours || '').split('-');
    editClassroomStartTime.value = classroomStart || '';
    editClassroomEndTime.value = classroomEnd || '';

    document.getElementById('editEquipmentItems').value = itemsToText(item.equipmentItems);
    document.getElementById('editLogisticsItems').value = itemsToText(item.logisticsItems);
    document.getElementById('editNotes').value = item.notes || '';

    editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
    editingId = null;
  }

  editCancelBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingId) return;

    const courseName = editCourseName.value === 'אחר' ? editCourseNameOther.value.trim() : editCourseName.value;
    const location = editLocation.value === 'אחר' ? editLocationOther.value.trim() : editLocation.value;
    const classroomHours = editClassroomStartTime.value && editClassroomEndTime.value
      ? `${editClassroomStartTime.value}-${editClassroomEndTime.value}`
      : (editClassroomStartTime.value || editClassroomEndTime.value || '');

    const update = {
      submitterName: document.getElementById('editSubmitterName').value.trim(),
      courseName,
      courseDate: document.getElementById('editCourseDate').value,
      traineesCount: document.getElementById('editTraineesCount').value.trim(),
      startTime: document.getElementById('editStartTime').value,
      endTime: document.getElementById('editEndTime').value,
      location,
      needsClassroom: editNeedsClassroom.checked,
      classroomHours,
      equipmentItems: textToItems(document.getElementById('editEquipmentItems').value),
      logisticsItems: textToItems(document.getElementById('editLogisticsItems').value),
      notes: document.getElementById('editNotes').value.trim(),
    };

    const submitBtn = editForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'שומר...';
    try {
      await window.db.collection('submissions').doc(editingId).update(update);
      closeEditModal();
      await loadSubmissions();
    } catch (err) {
      alert('שגיאה בשמירת השינויים: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'שמירה';
    }
  });

  if (new URLSearchParams(location.search).get('seed') === '1') {
    seedBtn.classList.remove('hidden');
    clearSeedBtn.classList.remove('hidden');
  }

  // תוכן ידני (רכבים/כוח אדם/כיתות/עמדות למחר/משימות למחר) לדוח הבוקר, נשמר לפי תאריך
  // ונקרא ע"י סקריפט המייל היומי כדי למלא את הסעיפים שלא נגזרים מהטופס. מוצהר כאן, לפני
  // ה-onAuthStateChanged למטה שקורא ל-loadManualNotes באופן מיידי כשמשתמש כבר מחובר.
  const manualNotesDate = document.getElementById('manualNotesDate');
  const manualNotesFields = {
    positionsTomorrow: document.getElementById('manualPositionsTomorrow'),
    classrooms: document.getElementById('manualClassrooms'),
    vehicles: document.getElementById('manualVehicles'),
    tasksTomorrow: document.getElementById('manualTasksTomorrow'),
    personnel: document.getElementById('manualPersonnel'),
  };
  const saveManualNotesBtn = document.getElementById('saveManualNotesBtn');
  const manualNotesSavedMsg = document.getElementById('manualNotesSavedMsg');

  function defaultManualNotesDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  async function loadManualNotes() {
    manualNotesSavedMsg.classList.add('hidden');
    const date = manualNotesDate.value;
    if (!date) return;
    const doc = await window.db.collection('dailyNotes').doc(date).get();
    const data = doc.exists ? doc.data() : {};
    Object.entries(manualNotesFields).forEach(([key, field]) => {
      field.value = data[key] || '';
    });
  }

  manualNotesDate.value = defaultManualNotesDate();
  manualNotesDate.addEventListener('change', loadManualNotes);

  saveManualNotesBtn.addEventListener('click', async () => {
    const date = manualNotesDate.value;
    if (!date) return;
    const data = {};
    Object.entries(manualNotesFields).forEach(([key, field]) => {
      data[key] = field.value.trim();
    });
    saveManualNotesBtn.disabled = true;
    try {
      await window.db.collection('dailyNotes').doc(date).set(data, { merge: true });
      manualNotesSavedMsg.classList.remove('hidden');
    } catch (err) {
      alert('שגיאה בשמירה: ' + err.message);
    } finally {
      saveManualNotesBtn.disabled = false;
    }
  });

  let allSubmissions = [];

  // signInWithPopup נשבר ב-Safari באייפון כשהאתר מותקן כ-PWA למסך הבית (מצב standalone) -
  // חלון ה-popup לא מצליח להעביר את תוצאת ההתחברות בחזרה לחלון ה-PWA, אז הכפתור פשוט לא
  // עושה כלום. לכן במצב standalone עוברים ל-signInWithRedirect. אבל redirect לא תמיד עדיף:
  // הוא עושה כמה ניתובים מלאים דרך דומיין ה-authDomain של Firebase (‎*.firebaseapp.com‎),
  // ובדפדפנים עם הגנת מעקב אגרסיבית (Safari ITP ודומיו, גם בנייד וגם בדסקטופ) זה נתפס
  // כ"bounce tracking" והדפדפן מוחק את האחסון הזמני של הדומיין הזה באמצע התהליך - מה שגורם
  // ללולאה: בוחרים חשבון גוגל, זה "נטען", ואז חוזרים למסך ההתחברות בלי להתחבר בפועל.
  // signInWithPopup לא סובל מהבעיה הזו כי התוצאה עוברת בין החלונות ישירות (postMessage),
  // בלי ניתוב מרובה-קפיצות - ולכן הוא ברירת המחדל בכל מקרה שהוא כן עובד (טאב רגיל, לא PWA).
  function isStandalonePwa() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  loginBtn.addEventListener('click', async () => {
    loginError.style.display = 'none';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      if (isStandalonePwa()) {
        await window.auth.signInWithRedirect(provider);
      } else {
        await window.auth.signInWithPopup(provider);
      }
    } catch (err) {
      loginError.textContent = 'התחברות נכשלה: ' + err.message;
      loginError.style.display = 'block';
    }
  });

  window.auth.getRedirectResult().catch((err) => {
    loginError.textContent = 'התחברות נכשלה: ' + err.message;
    loginError.style.display = 'block';
  });

  logoutBtn.addEventListener('click', () => window.auth.signOut());

  window.auth.onAuthStateChanged((user) => {
    if (user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
      loginError.style.display = 'none';
      loginBox.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      loadSubmissions();
      loadManualNotes();
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

  // מזהה הגשות כפולות (אותו קורס + אותו תאריך) כדי להתריע עליהן במנהל.
  function computeDuplicateKeys(items) {
    const counts = new Map();
    items.forEach((item) => {
      const key = `${item.courseName || ''}|${item.courseDate || ''}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
  }

  function renderTable(items) {
    if (!items.length) {
      tableWrap.innerHTML = '<p style="text-align:center;color:#6b7280;">אין דרישות להצגה</p>';
      return;
    }
    const sorted = [...items].sort((a, b) =>
      `${a.courseDate || ''}${a.startTime || ''}`.localeCompare(`${b.courseDate || ''}${b.startTime || ''}`)
    );
    const duplicateKeys = computeDuplicateKeys(sorted);
    const rows = sorted
      .map((item) => {
        const late = window.LogisticReport.isLate(item);
        const isDuplicate = duplicateKeys.has(`${item.courseName || ''}|${item.courseDate || ''}`);
        return `<tr class="${late ? 'late' : ''}" data-id="${item.id}">
          <td data-label="קורס">${bdi(item.courseName)}${isDuplicate ? ' <span class="tag tag-duplicate" title="קיימת הגשה נוספת לאותו קורס ותאריך">⚠ כפילות</span>' : ''}</td>
          <td data-label="תאריך">${escapeHtml(item.courseDate)}</td>
          <td data-label="שעות">${escapeHtml(item.startTime)}-${escapeHtml(item.endTime)}</td>
          <td data-label="מדריך" title="${escapeHtml(item.submitterEmail || '')}">${bdi(item.submitterName)}</td>
          <td data-label="חניכים">${escapeHtml(item.traineesCount || '-')}</td>
          <td data-label="סטטוס"><span class="tag ${late ? 'tag-late' : 'tag-ok'}">${late ? 'באיחור' : 'בזמן'}</span></td>
          <td data-label="פעולות">
            <button class="btn btn-secondary edit-btn" data-id="${item.id}">ערוך</button>
            <button class="btn btn-danger delete-btn" data-id="${item.id}">מחק</button>
          </td>
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

    tableWrap.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = allSubmissions.find((s) => s.id === btn.dataset.id);
        if (item) openEditModal(item);
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

  // פותחים את חלון הדוח באופן מיידי וסינכרוני עם הקליק (לפני כל await), וכותבים אליו את
  // ה-HTML ישירות עם document.write במקום להשתמש ב-blob: URL + window.open(blobUrl) -
  // ב-Safari באייפון window.open שמגיע אחרי await (כמו קריאת Firestore) נחסם בשקט כי
  // "טביעת האצבע" של פעולת המשתמש כבר פגה, וגם כשהוא לא נחסם, ב-PWA שמותקן למסך הבית
  // ה-blob: URL שנוצר בהקשר האפליקציה לא תמיד נגיש מהטאב החדש שנפתח.
  function openReportWindow(reportWindow, html) {
    if (!reportWindow) {
      alert('הדפדפן חסם את פתיחת הדוח בחלון חדש. יש לאשר חלונות קופצים לאתר ולנסות שוב.');
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  }

  // עם תאריך מסונן - מייצא את גיליון "משימות לוגיסטיקה" (בוקר/צהריים/עמדות/כיתות) בדיוק
  // כמו שמופיע במייל הבוקר לאותו תאריך, כולל התוכן הידני שמולא עבורו. בלי סינון תאריך -
  // אין "יום אחד" ברור לגיליון הזה, אז נשאר דוח כרטיסי ההגשות הכללי הישן.
  exportBtn.addEventListener('click', async () => {
    const date = filterDate.value;
    const reportWindow = window.open('', '_blank');

    if (date) {
      const items = allSubmissions.filter((i) => i.courseDate === date);
      const title = `משימות לוגיסטיקה - ${window.LogisticReport.fmtDateHe(date)}`;
      let manualNotes = {};
      try {
        const doc = await window.db.collection('dailyNotes').doc(date).get();
        if (doc.exists) manualNotes = doc.data();
      } catch (err) {
        console.error('שגיאה בטעינת תוכן ידני לדוח:', err);
      }
      const html = window.LogisticReport.buildMorningTasksReportHtml(items, { title, manualNotes });
      openReportWindow(reportWindow, html);
      return;
    }

    const html = window.LogisticReport.buildReportHtml(allSubmissions, { title: 'דוח דרישות לוגיסטיות - כלל הקורסים' });
    openReportWindow(reportWindow, html);
  });

  // שליחת מייל דורשת את הגמייל/סוד ה-SMTP שקיימים רק כ-secrets ב-GitHub Actions, ולא
  // ניתן וגם לא בטוח לחשוף אותם כאן - לכן הכפתור פותח את עמוד ההרצה של ה-workflow עצמו.
  document.getElementById('sendFeedbackDigestBtn').addEventListener('click', () => {
    window.open('https://github.com/plompi007/Logistic_Balar/actions/workflows/feedback-weekly-digest.yml', '_blank', 'noopener');
  });
})();
