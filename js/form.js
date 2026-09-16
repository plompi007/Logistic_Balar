(function () {
  const form = document.getElementById('reqForm');
  const successMsg = document.getElementById('successMsg');
  const errorMsg = document.getElementById('errorMsg');
  const needsClassroom = document.getElementById('needsClassroom');
  const classroomHoursField = document.getElementById('classroomHoursField');
  const itemRowTemplate = document.getElementById('itemRowTemplate');
  const courseNameSelect = document.getElementById('courseName');
  const courseNameOtherField = document.getElementById('courseNameOtherField');
  const courseNameOther = document.getElementById('courseNameOther');
  const traineesCountSelect = document.getElementById('traineesCount');

  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    traineesCountSelect.appendChild(opt);
  }

  courseNameSelect.addEventListener('change', () => {
    courseNameOtherField.classList.toggle('hidden', courseNameSelect.value !== 'אחר');
  });

  function addItemRow(containerId) {
    const container = document.getElementById(containerId);
    const node = itemRowTemplate.content.cloneNode(true);
    node.querySelector('.remove-item-btn').addEventListener('click', (e) => {
      e.target.closest('.item-row').remove();
    });
    container.appendChild(node);
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
      .map((row) => ({
        name: row.querySelector('.item-name').value.trim(),
        qty: row.querySelector('.item-qty').value.trim(),
      }))
      .filter((item) => item.name);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    const submitterName = document.getElementById('submitterName').value.trim();
    const courseName = courseNameSelect.value === 'אחר'
      ? courseNameOther.value.trim()
      : courseNameSelect.value;
    const courseDate = document.getElementById('courseDate').value;
    if (!submitterName || !courseName || !courseDate) {
      errorMsg.textContent = 'יש למלא שם מגיש, שם קורס ותאריך קורס';
      errorMsg.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      submitterName,
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
