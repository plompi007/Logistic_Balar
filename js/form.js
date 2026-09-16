(function () {
  const loginBox = document.getElementById('loginBox');
  const formPanel = document.getElementById('formPanel');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutLink = document.getElementById('logoutLink');
  const userEmailLabel = document.getElementById('userEmailLabel');

  const form = document.getElementById('reqForm');
  const successMsg = document.getElementById('successMsg');
  const errorMsg = document.getElementById('errorMsg');
  const needsClassroom = document.getElementById('needsClassroom');
  const classroomHoursField = document.getElementById('classroomHoursField');
  const courseNameSelect = document.getElementById('courseName');
  const courseNameOtherField = document.getElementById('courseNameOtherField');
  const courseNameOther = document.getElementById('courseNameOther');
  const traineesCountSelect = document.getElementById('traineesCount');
  const submitterNameInput = document.getElementById('submitterName');

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

  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.auth.signOut();
  });

  window.auth.onAuthStateChanged((user) => {
    if (user) {
      loginBox.classList.add('hidden');
      formPanel.classList.remove('hidden');
      userEmailLabel.textContent = user.email || '';
      if (!submitterNameInput.value && user.displayName) {
        submitterNameInput.value = user.displayName;
      }
    } else {
      loginBox.classList.remove('hidden');
      formPanel.classList.add('hidden');
    }
  });

  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    traineesCountSelect.appendChild(opt);
  }

  courseNameSelect.addEventListener('change', () => {
    courseNameOtherField.classList.toggle('hidden', courseNameSelect.value !== 'אחר');
  });

  const ITEM_OPTIONS = {
    equipmentItems: [
      'איבו', 'אטטי', 'אלפא', 'אנטנת הרחקה', 'בומרנג', 'מתקן הטלה',
      'תיק הטלות שחור', 'תיק הטלות חום', 'אולרים', 'ערכת עטלף',
      'פליקן מטיס 3', 'פליקן לוס', 'פליקן B1', 'פליקן B2', 'פליקן C2',
      'בלוטי', 'פקפק', 'מב"ן חישה', 'רינג', 'עין הבשור', 'פיש',
      'מגן שמיים', 'בני', 'אחר',
    ],
    logisticsItems: ['כיסאות', 'שולחנות', 'תרמוקן', 'משטח הנחתה', 'פאוור בנק', 'אחר'],
  };

  function addItemRow(containerId) {
    const container = document.getElementById(containerId);

    const row = document.createElement('div');
    row.className = 'item-row';

    const select = document.createElement('select');
    select.className = 'item-name-select';
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    placeholderOpt.textContent = 'בחר/י פריט...';
    select.appendChild(placeholderOpt);
    ITEM_OPTIONS[containerId].forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    const otherInput = document.createElement('input');
    otherInput.type = 'text';
    otherInput.className = 'item-name-other hidden';
    otherInput.placeholder = 'נא לפרט את שם הפריט';

    const qtyInput = document.createElement('input');
    qtyInput.type = 'text';
    qtyInput.className = 'item-qty';
    qtyInput.placeholder = 'כמות';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger remove-item-btn';
    removeBtn.textContent = 'הסר';
    removeBtn.addEventListener('click', () => row.remove());

    select.addEventListener('change', () => {
      otherInput.classList.toggle('hidden', select.value !== 'אחר');
    });

    const mainLine = document.createElement('div');
    mainLine.className = 'item-row-main';
    mainLine.append(select, qtyInput, removeBtn);
    row.append(mainLine, otherInput);
    container.appendChild(row);
  }

  document.querySelectorAll('.add-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => addItemRow(btn.dataset.target));
  });

  // start each list with one empty row for convenience
  addItemRow('equipmentItems');
  addItemRow('logisticsItems');

  needsClassroom.addEventListener('change', () => {
    classroomHoursField.classList.toggle('hidden', !needsClassroom.checked);
  });

  function collectItems(containerId) {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('.item-row'))
      .map((row) => {
        const select = row.querySelector('.item-name-select');
        const name = select.value === 'אחר'
          ? row.querySelector('.item-name-other').value.trim()
          : select.value;
        return { name, qty: row.querySelector('.item-qty').value.trim() };
      })
      .filter((item) => item.name);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    const currentUser = window.auth.currentUser;
    if (!currentUser) {
      errorMsg.textContent = 'יש להתחבר עם Google לפני שליחת הדרישה';
      errorMsg.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const submitterName = document.getElementById('submitterName').value.trim();
    const courseName = courseNameSelect.value === 'אחר'
      ? courseNameOther.value.trim()
      : courseNameSelect.value;
    const courseDate = document.getElementById('courseDate').value;
    if (!submitterName || !courseName || !courseDate) {
      errorMsg.textContent = 'יש למלא שם מדריך, שם קורס ותאריך קורס';
      errorMsg.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      submitterName,
      submitterEmail: currentUser.email,
      courseName,
      courseDate,
      startTime: document.getElementById('startTime').value,
      endTime: document.getElementById('endTime').value,
      traineesCount: document.getElementById('traineesCount').value,
      needsClassroom: needsClassroom.checked,
      classroomHours: document.getElementById('classroomHours').value.trim(),
      equipmentItems: collectItems('equipmentItems'),
      logisticsItems: collectItems('logisticsItems'),
      notes: document.getElementById('notes').value.trim(),
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'שולח...';

    try {
      await window.db.collection('submissions').add(payload);

      form.reset();
      document.querySelectorAll('#equipmentItems, #logisticsItems').forEach((c) => (c.innerHTML = ''));
      addItemRow('equipmentItems');
      addItemRow('logisticsItems');
      classroomHoursField.classList.add('hidden');
      courseNameOtherField.classList.add('hidden');

      successMsg.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      errorMsg.textContent = 'שגיאה בשליחה: ' + err.message;
      errorMsg.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'שליחת הדרישה';
    }
  });
})();
