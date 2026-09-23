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
  const locationSelect = document.getElementById('location');
  const locationOtherField = document.getElementById('locationOtherField');
  const locationOther = document.getElementById('locationOther');
  const submitterNameInput = document.getElementById('submitterName');
  const cloneLastFieldWrap = document.getElementById('cloneLastFieldWrap');
  const cloneLastBtn = document.getElementById('cloneLastBtn');
  const cloneLastMsg = document.getElementById('cloneLastMsg');

  function getCurrentCourseName() {
    return courseNameSelect.value === 'אחר' ? courseNameOther.value.trim() : courseNameSelect.value;
  }

  // signInWithPopup נשבר ב-Safari באייפון כשהאתר מותקן כ-PWA למסך הבית (מצב standalone) -
  // חלון ה-popup לא מצליח להעביר את תוצאת ההתחברות בחזרה לחלון ה-PWA, אז הכפתור פשוט לא
  // עושה כלום. signInWithRedirect עובד בכל מקום כי הוא ניווט מלא באותו חלון/טאב, לא popup.
  loginBtn.addEventListener('click', async () => {
    loginError.style.display = 'none';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await window.auth.signInWithRedirect(provider);
    } catch (err) {
      loginError.textContent = 'התחברות נכשלה: ' + err.message;
      loginError.style.display = 'block';
    }
  });

  window.auth.getRedirectResult().catch((err) => {
    loginError.textContent = 'התחברות נכשלה: ' + err.message;
    loginError.style.display = 'block';
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

  function updateCloneButtonVisibility() {
    cloneLastFieldWrap.classList.toggle('hidden', !getCurrentCourseName());
    cloneLastMsg.classList.add('hidden');
  }

  courseNameSelect.addEventListener('change', () => {
    courseNameOtherField.classList.toggle('hidden', courseNameSelect.value !== 'אחר');
    applyCourseDefaults(courseNameSelect.value);
    updateCloneButtonVisibility();
  });
  courseNameOther.addEventListener('input', updateCloneButtonVisibility);

  locationSelect.addEventListener('change', () => {
    locationOtherField.classList.toggle('hidden', locationSelect.value !== 'אחר');
  });

  const ITEM_OPTIONS = {
    logisticsItems: ['כיסאות', 'שולחנות', 'תרמוקן', 'משטח הנחתה', 'פאוור בנק', 'אחר'],
  };

  // אמל"ח: רשת בחירה (צ'יפים) במקום שורות - לרוב הפריטים הכמות לא משנה, רק לחלק
  // (הפריטים ב-EQUIPMENT_QTY_REQUIRED) מבקשים כמות בפועל.
  const EQUIPMENT_ITEMS = [
    'אווטה', 'איבו', 'אטטי', 'אלפא', 'אנטנת הרחקה',
    'כדור ברזל', 'בומרנג', 'חימושים בומרנג',
    'תיק הטלות שחור', 'תיק הטלות חום', 'אולרים', 'ערכת עטלף',
    'פליקן מטיס 3', 'פליקן לוס', 'פליקן B1', 'פליקן B2', 'פליקן C2',
    'פלייקארט 100', 'פלייקארט 30',
    'בלואטי', 'פקפק', 'מב"ן חישה', 'רינג', 'עין הבשור', 'פיש',
    'מגן שמיים', 'בני', 'סוללות איבו', 'סוללות אלפא',
    'סוללות פלייקארט 100', 'סוללות פלייקארט 30',
    'סוללות שבוע C', 'סוללות B1', 'סוללות B2',
    'סלייב', 'כבל מאריך', 'מפצל',
  ];
  const EQUIPMENT_QTY_REQUIRED = new Set([
    'אווטה', 'איבו', 'אלפא', 'אטטי', 'כדור ברזל', 'בומרנג', 'בלואטי',
    'סוללות איבו', 'סוללות פלייקארט 100', 'סוללות פלייקארט 30',
  ]);

  const equipmentGrid = document.getElementById('equipmentGrid');
  const equipmentSelectedCount = document.getElementById('equipmentSelectedCount');
  const equipmentOtherField = document.getElementById('equipmentOtherField');
  const equipmentOtherName = document.getElementById('equipmentOtherName');
  const equipmentOtherQty = document.getElementById('equipmentOtherQty');
  const equipmentShowMoreBtn = document.getElementById('equipmentShowMoreBtn');

  function buildEquipmentGrid() {
    EQUIPMENT_ITEMS.forEach((name) => {
      const chip = document.createElement('div');
      chip.className = 'item-chip';
      chip.dataset.name = name;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'chip-toggle';
      toggle.textContent = name;
      chip.appendChild(toggle);

      let qtyInput = null;
      if (EQUIPMENT_QTY_REQUIRED.has(name)) {
        qtyInput = document.createElement('input');
        qtyInput.type = 'text';
        qtyInput.className = 'chip-qty hidden';
        qtyInput.placeholder = 'כמות';
        chip.appendChild(qtyInput);
      }

      toggle.addEventListener('click', () => {
        const selected = chip.classList.toggle('selected');
        if (qtyInput) {
          qtyInput.classList.toggle('hidden', !selected);
          if (selected) qtyInput.focus();
          else qtyInput.value = '';
        }
      });

      equipmentGrid.appendChild(chip);
    });

    const otherChip = document.createElement('div');
    otherChip.className = 'item-chip';
    otherChip.dataset.name = 'אחר';
    const otherToggle = document.createElement('button');
    otherToggle.type = 'button';
    otherToggle.className = 'chip-toggle';
    otherToggle.textContent = 'אחר';
    otherToggle.addEventListener('click', () => {
      const selected = otherChip.classList.toggle('selected');
      equipmentOtherField.classList.toggle('hidden', !selected);
      if (!selected) {
        equipmentOtherName.value = '';
        equipmentOtherQty.value = '';
      }
    });
    otherChip.appendChild(otherToggle);
    equipmentGrid.appendChild(otherChip);
  }

  buildEquipmentGrid();

  // מונה "X פריטים נבחרו" מעל הגריד - מאזין לשינויי class על הצ'יפים במקום שכל מקום
  // שמסמן/מבטל בחירה (קליק, ברירות מחדל לפי קורס, איפוס, שכפול הגשה) יצטרך לעדכן ידנית.
  function updateEquipmentSelectedCount() {
    const count = equipmentGrid.querySelectorAll('.item-chip.selected').length;
    equipmentSelectedCount.textContent = count === 0
      ? 'לא נבחרו פריטים עדיין'
      : count === 1
        ? 'פריט אחד נבחר'
        : `${count} פריטים נבחרו`;
  }
  new MutationObserver(updateEquipmentSelectedCount).observe(equipmentGrid, {
    attributes: true, attributeFilter: ['class'], subtree: true,
  });
  updateEquipmentSelectedCount();

  // תבניות ברירת מחדל לאמל"ח לפי קורס - נבחר אוטומטית כשבוחרים קורס, ואפשר עדיין
  // לתקן/להוסיף/להסיר ידנית. ציוד לוגיסטי לא כלול כאן בכוונה כי הוא משתנה כל פעם.
  const COURSE_DEFAULTS = {
    'מטיס מבצעי': [
      { name: 'איבו' }, { name: 'אולרים' }, { name: 'אנטנת הרחקה' },
    ],
    'פלייקארט': [
      { name: 'פלייקארט 30' }, { name: 'פלייקארט 100' },
    ],
    'בומרנג': [
      { name: 'אטטי', qty: '2' }, { name: 'אלפא', qty: '2' }, { name: 'סוללות אלפא' },
    ],
    'כדור ברזל': [
      { name: 'אטטי', qty: '2' }, { name: 'כדור ברזל', qty: '4' },
    ],
    'מב"ן חישה': [
      { name: 'מב"ן חישה' },
    ],
    'FPV שבוע C': [
      { name: 'ערכת עטלף' }, { name: 'פליקן לוס' }, { name: 'בלואטי' },
      { name: 'פליקן C2' }, { name: 'סוללות שבוע C' },
    ],
    'FPV שבוע B': [
      { name: 'פליקן מטיס 3' }, { name: 'פליקן B1' }, { name: 'פליקן B2' },
      { name: 'סוללות B1' }, { name: 'סוללות B2' }, { name: 'בלואטי', qty: '2' },
    ],
  };

  function findChipByName(name) {
    return Array.from(equipmentGrid.querySelectorAll('.item-chip')).find((chip) => chip.dataset.name === name);
  }

  function applyCourseDefaults(courseName) {
    resetEquipmentGrid();
    const defaults = COURSE_DEFAULTS[courseName];

    // מציגים בברירת מחדל רק את הפריטים הרלוונטיים לקורס שנבחר (אם יש לו תבנית) - נקי יותר
    // לעין - ומאפשרים לחשוף את שאר הפריטים בלחיצה, למקרה שנדרש משהו יוצא דופן.
    const relevantNames = defaults ? new Set(defaults.map((d) => d.name)) : null;
    equipmentGrid.classList.remove('show-all');
    Array.from(equipmentGrid.querySelectorAll('.item-chip')).forEach((chip) => {
      const isRelevant = !relevantNames || chip.dataset.name === 'אחר' || relevantNames.has(chip.dataset.name);
      chip.classList.toggle('chip-filtered-out', !isRelevant);
    });
    equipmentShowMoreBtn.classList.toggle('hidden', !relevantNames);
    equipmentShowMoreBtn.textContent = 'הצג את כל הפריטים';

    if (!defaults) return;
    defaults.forEach(({ name, qty }) => {
      const chip = findChipByName(name);
      if (!chip) return;
      chip.classList.add('selected');
      const qtyInput = chip.querySelector('.chip-qty');
      if (qtyInput) {
        qtyInput.classList.remove('hidden');
        if (qty) qtyInput.value = qty;
      }
    });
  }

  equipmentShowMoreBtn.addEventListener('click', () => {
    const showingAll = equipmentGrid.classList.toggle('show-all');
    equipmentShowMoreBtn.textContent = showingAll ? 'הצג רק את הפריטים הרלוונטיים' : 'הצג את כל הפריטים';
  });

  function collectEquipmentItems() {
    const items = [];
    equipmentGrid.querySelectorAll('.item-chip.selected').forEach((chip) => {
      const name = chip.dataset.name;
      if (name === 'אחר') {
        const otherName = equipmentOtherName.value.trim();
        if (otherName) items.push({ name: otherName, qty: equipmentOtherQty.value.trim() || '-' });
        return;
      }
      const qtyInput = chip.querySelector('.chip-qty');
      const qty = qtyInput ? qtyInput.value.trim() : '';
      items.push({ name, qty: qty || '-' });
    });
    return items;
  }

  function resetEquipmentGrid() {
    equipmentGrid.querySelectorAll('.item-chip').forEach((chip) => {
      chip.classList.remove('selected', 'chip-filtered-out');
      const qtyInput = chip.querySelector('.chip-qty');
      if (qtyInput) {
        qtyInput.classList.add('hidden');
        qtyInput.value = '';
      }
    });
    equipmentGrid.classList.remove('show-all');
    equipmentShowMoreBtn.classList.add('hidden');
    equipmentOtherField.classList.add('hidden');
    equipmentOtherName.value = '';
    equipmentOtherQty.value = '';
  }

  function addItemRow(containerId, prefill) {
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

    const qtyLine = document.createElement('div');
    qtyLine.className = 'item-row-qty-line';
    qtyLine.append(qtyInput, removeBtn);
    row.append(select, otherInput, qtyLine);
    container.appendChild(row);

    if (prefill && prefill.name) {
      const isKnown = ITEM_OPTIONS[containerId].includes(prefill.name);
      select.value = isKnown ? prefill.name : 'אחר';
      otherInput.classList.toggle('hidden', isKnown);
      if (!isKnown) otherInput.value = prefill.name;
      qtyInput.value = prefill.qty && prefill.qty !== '-' ? prefill.qty : '';
    }
  }

  document.querySelectorAll('.add-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => addItemRow(btn.dataset.target));
  });

  // start the logistics list with one empty row for convenience
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

  // "שכפל את ההגשה האחרונה שלי לקורס הזה" - מסייע למדריך שמלמד אותו קורס שוב ושוב, בלי
  // למלא הכל מאפס בכל פעם. לא מעתיק את תאריך הקורס עצמו בכוונה - זה תמיד תאריך חדש.
  cloneLastBtn.addEventListener('click', async () => {
    const courseName = getCurrentCourseName();
    const currentUser = window.auth.currentUser;
    if (!courseName || !currentUser) return;

    cloneLastMsg.classList.remove('hidden');
    cloneLastMsg.textContent = 'מחפש הגשה קודמת...';
    cloneLastBtn.disabled = true;
    try {
      const snapshot = await window.db.collection('submissions')
        .where('submitterEmail', '==', currentUser.email)
        .get();
      const last = snapshot.docs
        .map((doc) => doc.data())
        .filter((d) => (d.courseName || '') === courseName)
        .sort((a, b) => (b.courseDate || '').localeCompare(a.courseDate || ''))[0];

      if (!last) {
        cloneLastMsg.textContent = 'לא נמצאה הגשה קודמת שלך לקורס הזה.';
        return;
      }

      document.getElementById('traineesCount').value = last.traineesCount || '';
      document.getElementById('startTime').value = last.startTime || '';
      document.getElementById('endTime').value = last.endTime || '';

      const knownLocations = Array.from(locationSelect.options).map((o) => o.value);
      if (last.location && !knownLocations.includes(last.location)) {
        locationSelect.value = 'אחר';
        locationOther.value = last.location;
        locationOtherField.classList.remove('hidden');
      } else {
        locationSelect.value = last.location || '';
        locationOther.value = '';
        locationOtherField.classList.add('hidden');
      }

      needsClassroom.checked = !!last.needsClassroom;
      classroomHoursField.classList.toggle('hidden', !last.needsClassroom);
      const [classroomStart, classroomEnd] = (last.classroomHours || '').split('-');
      document.getElementById('classroomStartTime').value = classroomStart || '';
      document.getElementById('classroomEndTime').value = classroomEnd || '';

      resetEquipmentGrid();
      (last.equipmentItems || []).forEach(({ name, qty }) => {
        if (!name) return;
        if (!EQUIPMENT_ITEMS.includes(name)) {
          const otherChip = findChipByName('אחר');
          if (otherChip) otherChip.classList.add('selected');
          equipmentOtherField.classList.remove('hidden');
          equipmentOtherName.value = name;
          equipmentOtherQty.value = qty && qty !== '-' ? qty : '';
          return;
        }
        const chip = findChipByName(name);
        if (!chip) return;
        chip.classList.add('selected');
        const qtyInput = chip.querySelector('.chip-qty');
        if (qtyInput) {
          qtyInput.classList.remove('hidden');
          if (qty && qty !== '-') qtyInput.value = qty;
        }
      });

      const logisticsContainer = document.getElementById('logisticsItems');
      logisticsContainer.innerHTML = '';
      const logisticsItems = (last.logisticsItems || []).filter((i) => i && i.name);
      if (logisticsItems.length) {
        logisticsItems.forEach((item) => addItemRow('logisticsItems', item));
      } else {
        addItemRow('logisticsItems');
      }

      document.getElementById('notes').value = last.notes || '';

      cloneLastMsg.textContent = `שוכפלה ההגשה האחרונה (מ-${last.courseDate || '?'}) - נא לוודא ולעדכן תאריך קורס.`;
    } catch (err) {
      cloneLastMsg.textContent = 'שגיאה בשליפת ההגשה הקודמת: ' + err.message;
    } finally {
      cloneLastBtn.disabled = false;
    }
  });

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

    const location = locationSelect.value === 'אחר'
      ? locationOther.value.trim()
      : locationSelect.value;

    const classroomStartTime = document.getElementById('classroomStartTime').value;
    const classroomEndTime = document.getElementById('classroomEndTime').value;
    const classroomHours = classroomStartTime && classroomEndTime
      ? `${classroomStartTime}-${classroomEndTime}`
      : (classroomStartTime || classroomEndTime || '');

    const payload = {
      submitterName,
      submitterEmail: currentUser.email,
      courseName,
      courseDate,
      startTime: document.getElementById('startTime').value,
      endTime: document.getElementById('endTime').value,
      traineesCount: document.getElementById('traineesCount').value,
      location,
      needsClassroom: needsClassroom.checked,
      classroomHours,
      equipmentItems: collectEquipmentItems(),
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
      resetEquipmentGrid();
      document.getElementById('logisticsItems').innerHTML = '';
      addItemRow('logisticsItems');
      classroomHoursField.classList.add('hidden');
      courseNameOtherField.classList.add('hidden');
      locationOtherField.classList.add('hidden');

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

  const feedbackToggleBtn = document.getElementById('feedbackToggleBtn');
  const feedbackForm = document.getElementById('feedbackForm');
  const feedbackType = document.getElementById('feedbackType');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
  const feedbackSuccess = document.getElementById('feedbackSuccess');

  feedbackToggleBtn.addEventListener('click', () => {
    feedbackSuccess.classList.add('hidden');
    feedbackForm.classList.toggle('hidden');
  });

  feedbackSubmitBtn.addEventListener('click', async () => {
    const message = feedbackMessage.value.trim();
    if (!message) {
      feedbackMessage.focus();
      return;
    }
    const currentUser = window.auth.currentUser;
    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.textContent = 'שולח...';
    try {
      await window.db.collection('feedback').add({
        type: feedbackType.value,
        message,
        submitterEmail: currentUser ? currentUser.email : '',
        submitterName: (currentUser && currentUser.displayName) || '',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      feedbackMessage.value = '';
      feedbackType.value = 'bug';
      feedbackForm.classList.add('hidden');
      feedbackSuccess.classList.remove('hidden');
    } catch (err) {
      alert('שגיאה בשליחת הדיווח: ' + err.message);
    } finally {
      feedbackSubmitBtn.disabled = false;
      feedbackSubmitBtn.textContent = 'שליחת הדיווח';
    }
  });
})();
