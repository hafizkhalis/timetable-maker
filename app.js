/* ══════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════ */
const ALL_DAYS = [
  { key: 'sun', label: 'Sun', color: '#a78bfa' },
  { key: 'mon', label: 'Mon', color: '#f472b6' },
  { key: 'tue', label: 'Tue', color: '#60a5fa' },
  { key: 'wed', label: 'Wed', color: '#34d399' },
  { key: 'thu', label: 'Thu', color: '#fb923c' },
  { key: 'fri', label: 'Fri', color: '#f87171' },
  { key: 'sat', label: 'Sat', color: '#facc15' },
];

const THEMES = [
  { name: 'Cosmos',   stops: ['#1a1a2e', '#16213e', '#0f3460', '#533483'] },
  { name: 'Midnight', stops: ['#0f0c29', '#302b63', '#24243e', '#0f0c29'] },
  { name: 'Ocean',    stops: ['#0d1b2a', '#1b2838', '#1a4064', '#2176ae'] },
  { name: 'Sunset',   stops: ['#1a0a2e', '#2d1b69', '#7b2d8e', '#f0527a'] },
  { name: 'Forest',   stops: ['#0a1a0f', '#0d2818', '#1a4d2e', '#2d8a4e'] },
  { name: 'Cherry',   stops: ['#1a0a14', '#3d0f2f', '#7b1e4a', '#c73866'] },
  { name: 'Slate',    stops: ['#0f172a', '#1e293b', '#334155', '#475569'] },
  { name: 'Nord',     stops: ['#2e3440', '#3b4252', '#434c5e', '#4c566a'] },
  { name: 'Ember',    stops: ['#1a0a00', '#3d1c00', '#7b3600', '#c75500'] },
  { name: 'AMOLED',   stops: ['#000000', '#050510', '#0a0a1a', '#0f0f20'] },
];

/* ══════════════════════════════════════
   STATE
   ══════════════════════════════════════ */
let state = {
  theme: 0,
  customGradient: null,
  timeSlots: ['08:00 AM', '10:30 AM', '02:00 PM'],
  activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
  subjects: [
    { code: 'CSC510', fullName: '', color: '#8b5cf6', textColor: '#ede9fe' },
    { code: 'CSC520', fullName: '', color: '#ec4899', textColor: '#fce7f3' },
    { code: 'MAT423', fullName: '', color: '#f59e0b', textColor: '#fef3c7' },
    { code: 'LCC401', fullName: '', color: '#ef4444', textColor: '#fee2e2' },
    { code: 'ICT502', fullName: '', color: '#10b981', textColor: '#d1fae5' },
    { code: 'CTU552', fullName: '', color: '#3b82f6', textColor: '#dbeafe' },
    { code: 'CSC583', fullName: '', color: '#14b8a6', textColor: '#ccfbf1' },
    { code: 'TAC401', fullName: '', color: '#f97316', textColor: '#ffedd5' },
  ],
  schedule: {
    sun: [
      { subject: 'CSC510', type: 'Lecture', room: 'Virtual' },
      { subject: 'CSC520', type: 'Lecture', room: 'C1-1, C1-2' },
      { subject: 'MAT423', type: 'Lecture', room: 'A3-2' },
    ],
    mon: [
      { subject: 'LCC401', type: 'Lecture', room: 'MK C3' },
      { subject: 'ICT502', type: 'Lecture', room: 'Virtual' },
      { subject: 'CSC520', type: 'Lab', room: 'MK B2' },
    ],
    tue: [
      { subject: 'CTU552', type: 'Lecture', room: 'C1-1, C1-2' },
      { subject: 'CSC583', type: 'Lecture', room: 'Bilik Sem 1' },
      { subject: 'TAC401', type: 'Lecture', room: 'B3-5' },
    ],
    wed: [
      { subject: 'ICT502', type: 'Lab', room: 'MK D3' },
      { subject: 'MAT423', type: 'Tutorial', room: 'Big Data Lab' },
      { subject: 'CSC583', type: 'Lab', room: 'MK B4' },
    ],
    thu: [
      null,
      { subject: 'CSC510', type: 'Lab', room: 'MK C2' },
      null,
    ],
  },
};

/* ══════════════════════════════════════
   PERSISTENCE
   ══════════════════════════════════════ */
function saveState() {
  localStorage.setItem('tt-maker-state', JSON.stringify(state));
  saveFormFields();
}

function loadState() {
  const s = localStorage.getItem('tt-maker-state');
  if (s) {
    try { state = { ...state, ...JSON.parse(s) }; } catch (e) { /* ignore */ }
  }
}

function saveFormFields() {
  const fields = ['groupName', 'semester', 'showHeader', 'showFooter', 'footerText', 'spacerTop', 'spacerBottom'];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (!el) return;
    data[f] = el.type === 'checkbox' ? el.checked : el.value;
  });
  localStorage.setItem('tt-maker-form', JSON.stringify(data));
}

function loadFormFields() {
  const s = localStorage.getItem('tt-maker-form');
  if (!s) return;
  try {
    const data = JSON.parse(s);
    Object.keys(data).forEach(k => {
      const el = document.getElementById(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = data[k];
      else el.value = data[k];
    });
    // sync range display values
    const st = document.getElementById('spacerTop');
    const sb = document.getElementById('spacerBottom');
    if (st) document.getElementById('spacerTopVal').textContent = st.value;
    if (sb) document.getElementById('spacerBottomVal').textContent = sb.value;
  } catch (e) { /* ignore */ }
}

/* ══════════════════════════════════════
   TABS
   ══════════════════════════════════════ */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* ══════════════════════════════════════
   THEMES
   ══════════════════════════════════════ */
function renderThemes() {
  const grid = document.getElementById('themeGrid');
  grid.innerHTML = THEMES.map((t, i) => {
    const grad = `linear-gradient(135deg, ${t.stops.join(', ')})`;
    const active = (state.customGradient === null && state.theme === i) ? 'active' : '';
    return `<div class="theme-swatch ${active}" style="background:${grad};" onclick="selectTheme(${i})">
      <span class="theme-name">${t.name}</span>
    </div>`;
  }).join('');
}

function selectTheme(i) {
  state.theme = i;
  state.customGradient = null;
  // Update gradient pickers to match theme
  const t = THEMES[i];
  document.getElementById('gradStart').value = t.stops[0];
  document.getElementById('gradMid').value = t.stops[2] || t.stops[1];
  document.getElementById('gradEnd').value = t.stops[t.stops.length - 1];
  updateGradHex();
  saveState();
  renderThemes();
  render();
}

function updateGradHex() {
  document.getElementById('gradStartHex').textContent = document.getElementById('gradStart').value;
  document.getElementById('gradMidHex').textContent = document.getElementById('gradMid').value;
  document.getElementById('gradEndHex').textContent = document.getElementById('gradEnd').value;
}

function applyCustomGradient() {
  const s = document.getElementById('gradStart').value;
  const m = document.getElementById('gradMid').value;
  const e = document.getElementById('gradEnd').value;
  state.customGradient = [s, m, e];
  saveState();
  renderThemes();
  render();
  showToast('Custom gradient applied');
}

function getGradientCSS() {
  if (state.customGradient) {
    const [s, m, e] = state.customGradient;
    return `linear-gradient(135deg, ${s} 0%, ${m} 50%, ${e} 100%)`;
  }
  const t = THEMES[state.theme] || THEMES[0];
  const pcts = t.stops.map((c, i) => `${c} ${Math.round(i / (t.stops.length - 1) * 100)}%`);
  return `linear-gradient(135deg, ${pcts.join(', ')})`;
}

/* ══════════════════════════════════════
   TIME SLOTS
   ══════════════════════════════════════ */
function renderTimeSlots() {
  const c = document.getElementById('timeSlotsContainer');
  c.innerHTML = state.timeSlots.map((t, i) => `
    <div class="time-slot-item">
      <span class="slot-num">${i + 1}</span>
      <input type="text" value="${esc(t)}" onchange="updateTimeSlot(${i}, this.value)" />
      <button class="btn btn-danger" onclick="removeTimeSlot(${i})" style="padding:5px 10px;font-size:11px;">&times;</button>
    </div>
  `).join('');
}

function addTimeSlot() {
  state.timeSlots.push('12:00 PM');
  for (const day of Object.keys(state.schedule)) {
    if (state.schedule[day]) state.schedule[day].push(null);
  }
  saveState(); fullRender();
}

function removeTimeSlot(i) {
  if (state.timeSlots.length <= 1) return;
  state.timeSlots.splice(i, 1);
  for (const day of Object.keys(state.schedule)) {
    if (state.schedule[day]) state.schedule[day].splice(i, 1);
  }
  saveState(); fullRender();
}

function updateTimeSlot(i, val) {
  state.timeSlots[i] = val;
  saveState(); render(); renderScheduleEditor();
}

/* ══════════════════════════════════════
   DAYS
   ══════════════════════════════════════ */
function renderDays() {
  const c = document.getElementById('daysContainer');
  c.innerHTML = ALL_DAYS.map(d => {
    const active = state.activeDays.includes(d.key);
    return `<div class="day-check ${active ? 'active' : ''}" onclick="toggleDay('${d.key}')">
      <span style="color:${d.color};">\u25CF</span> ${d.label}
    </div>`;
  }).join('');
}

function toggleDay(key) {
  const idx = state.activeDays.indexOf(key);
  if (idx >= 0) {
    state.activeDays.splice(idx, 1);
  } else {
    const order = ALL_DAYS.map(d => d.key);
    state.activeDays.push(key);
    state.activeDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (!state.schedule[key]) {
      state.schedule[key] = state.timeSlots.map(() => null);
    }
  }
  saveState(); fullRender();
}

/* ══════════════════════════════════════
   SUBJECTS
   ══════════════════════════════════════ */
let editingSubjectIdx = -1;

function renderSubjects() {
  const c = document.getElementById('subjectsList');
  document.getElementById('subjectCount').textContent = state.subjects.length;
  c.innerHTML = state.subjects.map((s, i) => `
    <div class="subject-item">
      <div class="swatch" style="background:${s.color};"></div>
      <div class="subj-info">
        <div class="subj-code" style="color:${s.textColor}; text-shadow: 0 0 10px ${s.color}40;">${esc(s.code)}</div>
        ${s.fullName ? `<div class="subj-name">${esc(s.fullName)}</div>` : ''}
      </div>
      <button class="btn btn-secondary" style="padding:4px 10px;font-size:11px;" onclick="editSubject(${i})">Edit</button>
      <button class="btn btn-danger" style="padding:4px 10px;font-size:11px;" onclick="removeSubject(${i})">&times;</button>
    </div>
  `).join('');
}

function openSubjectModal(idx) {
  editingSubjectIdx = idx !== undefined ? idx : -1;
  const title = document.getElementById('modalTitle');
  const code = document.getElementById('modalCode');
  const fullName = document.getElementById('modalFullName');
  const color = document.getElementById('modalColor');
  const textColor = document.getElementById('modalTextColor');
  const btn = document.getElementById('modalSaveBtn');

  if (editingSubjectIdx >= 0) {
    const s = state.subjects[editingSubjectIdx];
    title.textContent = 'Edit Subject';
    code.value = s.code;
    fullName.value = s.fullName || '';
    color.value = s.color;
    textColor.value = s.textColor;
    btn.textContent = 'Update';
  } else {
    title.textContent = 'Add Subject';
    code.value = '';
    fullName.value = '';
    color.value = randomColor();
    textColor.value = '#f0f0f0';
    btn.textContent = 'Add';
  }
  updateModalHex();
  document.getElementById('subjectModal').classList.add('open');
  code.focus();
}

function closeSubjectModal() {
  document.getElementById('subjectModal').classList.remove('open');
}

function updateModalHex() {
  document.getElementById('modalColorHex').textContent = document.getElementById('modalColor').value;
  document.getElementById('modalTextHex').textContent = document.getElementById('modalTextColor').value;
}

function saveSubject() {
  const code = document.getElementById('modalCode').value.trim().toUpperCase();
  if (!code) return;
  const fullName = document.getElementById('modalFullName').value.trim();
  const color = document.getElementById('modalColor').value;
  const textColor = document.getElementById('modalTextColor').value;

  if (editingSubjectIdx >= 0) {
    const oldCode = state.subjects[editingSubjectIdx].code;
    state.subjects[editingSubjectIdx] = { code, fullName, color, textColor };
    if (oldCode !== code) {
      for (const day of Object.keys(state.schedule)) {
        for (const slot of state.schedule[day]) {
          if (slot && slot.subject === oldCode) slot.subject = code;
        }
      }
    }
  } else {
    state.subjects.push({ code, fullName, color, textColor });
  }
  closeSubjectModal();
  saveState(); fullRender();
}

function editSubject(i) { openSubjectModal(i); }

function removeSubject(i) {
  if (!confirm(`Remove ${state.subjects[i].code}? This will also clear it from the schedule.`)) return;
  const code = state.subjects[i].code;
  state.subjects.splice(i, 1);
  for (const day of Object.keys(state.schedule)) {
    if (state.schedule[day]) {
      state.schedule[day] = state.schedule[day].map(s => s && s.subject === code ? null : s);
    }
  }
  saveState(); fullRender();
}

/* ══════════════════════════════════════
   SCHEDULE EDITOR
   ══════════════════════════════════════ */
let slotEditDay = null;
let slotEditIdx = null;

function renderScheduleEditor() {
  const c = document.getElementById('scheduleEditor');
  const cols = state.timeSlots.length;
  const gridCols = `60px ${'1fr '.repeat(cols).trim()}`;

  let html = `<div class="schedule-grid" style="grid-template-columns:${gridCols};">`;
  // headers
  html += `<div class="sched-header"></div>`;
  state.timeSlots.forEach(t => { html += `<div class="sched-header">${esc(t)}</div>`; });

  // rows
  state.activeDays.forEach(dayKey => {
    const dayInfo = ALL_DAYS.find(d => d.key === dayKey);
    if (!state.schedule[dayKey]) state.schedule[dayKey] = state.timeSlots.map(() => null);
    while (state.schedule[dayKey].length < cols) state.schedule[dayKey].push(null);

    html += `<div class="sched-day-label"><span style="color:${dayInfo.color};">\u25CF</span> ${dayInfo.label}</div>`;

    state.timeSlots.forEach((_, si) => {
      const slot = state.schedule[dayKey][si];
      if (slot) {
        const subj = state.subjects.find(s => s.code === slot.subject);
        const bg = subj ? subj.color : '#666';
        const tc = subj ? subj.textColor : '#fff';
        html += `<div class="sched-cell has-class" onclick="openSlotModal('${dayKey}',${si})">
          <div class="slot-card" style="background:${hexToRgba(bg, 0.35)};color:${tc};border:1px solid ${hexToRgba(bg, 0.4)};">
            <div class="sc-code">${esc(slot.subject)}</div>
            <div class="sc-meta">${esc(slot.type)} &middot; ${esc(slot.room)}</div>
            <button class="sc-clear" onclick="event.stopPropagation();clearSlot('${dayKey}',${si})">&times;</button>
          </div>
        </div>`;
      } else {
        html += `<div class="sched-cell" onclick="openSlotModal('${dayKey}',${si})">
          <span class="empty-label">+</span>
        </div>`;
      }
    });
  });
  html += '</div>';
  c.innerHTML = html;

  renderStats();
}

function openSlotModal(dayKey, slotIdx) {
  slotEditDay = dayKey;
  slotEditIdx = slotIdx;
  const current = (state.schedule[dayKey] || [])[slotIdx];
  const dayInfo = ALL_DAYS.find(d => d.key === dayKey);

  document.getElementById('slotModalTitle').textContent =
    `${dayInfo.label} — ${state.timeSlots[slotIdx] || ''}`;

  // populate subject select
  const sel = document.getElementById('slotSubject');
  sel.innerHTML = state.subjects.map(s =>
    `<option value="${esc(s.code)}" ${current && current.subject === s.code ? 'selected' : ''}>${esc(s.code)}${s.fullName ? ' — ' + esc(s.fullName) : ''}</option>`
  ).join('');

  document.getElementById('slotType').value = current ? current.type : 'Lecture';
  document.getElementById('slotRoom').value = current ? current.room : '';
  document.getElementById('slotClearBtn').style.display = current ? 'inline-flex' : 'none';

  document.getElementById('slotModal').classList.add('open');
}

function closeSlotModal() {
  document.getElementById('slotModal').classList.remove('open');
}

function saveSlot() {
  if (!slotEditDay) return;
  const subject = document.getElementById('slotSubject').value;
  const type = document.getElementById('slotType').value;
  const room = document.getElementById('slotRoom').value.trim();
  if (!subject) return;

  if (!state.schedule[slotEditDay]) state.schedule[slotEditDay] = state.timeSlots.map(() => null);
  state.schedule[slotEditDay][slotEditIdx] = { subject, type, room };

  closeSlotModal();
  saveState(); renderScheduleEditor(); render();
}

function clearSlotFromModal() {
  clearSlot(slotEditDay, slotEditIdx);
  closeSlotModal();
}

function clearSlot(dayKey, slotIdx) {
  if (state.schedule[dayKey]) state.schedule[dayKey][slotIdx] = null;
  saveState(); renderScheduleEditor(); render();
}

/* ══════════════════════════════════════
   STATS
   ══════════════════════════════════════ */
function renderStats() {
  const c = document.getElementById('statsContainer');
  let totalClasses = 0;
  let busyDays = 0;
  const subjectCounts = {};

  state.activeDays.forEach(dayKey => {
    const slots = state.schedule[dayKey] || [];
    let dayHasClass = false;
    slots.forEach(slot => {
      if (slot) {
        totalClasses++;
        dayHasClass = true;
        subjectCounts[slot.subject] = (subjectCounts[slot.subject] || 0) + 1;
      }
    });
    if (dayHasClass) busyDays++;
  });

  const freeDays = state.activeDays.length - busyDays;
  const mostBusy = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0];

  let html = `
    <div class="stat-card">
      <div class="stat-value" style="color:#a78bfa;">${totalClasses}</div>
      <div class="stat-label">Total Classes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#34d399;">${state.subjects.length}</div>
      <div class="stat-label">Subjects</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#fb923c;">${busyDays}</div>
      <div class="stat-label">Busy Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#60a5fa;">${freeDays}</div>
      <div class="stat-label">Free Days</div>
    </div>
  `;
  if (mostBusy) {
    const subj = state.subjects.find(s => s.code === mostBusy[0]);
    html += `<div class="stat-card">
      <div class="stat-value" style="color:${subj ? subj.color : '#fff'};font-size:16px;">${mostBusy[0]}</div>
      <div class="stat-label">Most Classes (${mostBusy[1]})</div>
    </div>`;
  }
  c.innerHTML = html;
}

/* ══════════════════════════════════════
   PHONE PREVIEW RENDER
   ══════════════════════════════════════ */
function render() {
  saveFormFields();
  saveState();

  const groupName = document.getElementById('groupName').value;
  const semester = document.getElementById('semester').value;
  const showHeader = document.getElementById('showHeader').checked;
  const showFooter = document.getElementById('showFooter').checked;
  const footerText = document.getElementById('footerText').value;
  const spacerTop = parseInt(document.getElementById('spacerTop').value) || 0;
  const spacerBottom = parseInt(document.getElementById('spacerBottom').value) || 0;
  const cols = state.timeSlots.length;
  const gridCols = `52px ${'1fr '.repeat(cols).trim()}`;
  const gradient = getGradientCSS();

  let html = `
    <div class="phone-wrap" id="exportTarget" style="background:${gradient};">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="phone-spacer">${'<br>'.repeat(spacerTop)}</div>
  `;

  if (showHeader) {
    html += `
      <div class="header-glass">
        <div class="group-label">Timetable</div>
        <div class="group-name">${esc(groupName)}</div>
        <div class="semester-text">${esc(semester)}</div>
      </div>`;
  }

  html += `<div class="timetable-card">`;
  // time header
  html += `<div class="grid-row time-header-row" style="grid-template-columns:${gridCols};">
    <div class="corner-cell"></div>`;
  state.timeSlots.forEach(t => { html += `<div class="time-col-header">${esc(t)}</div>`; });
  html += `</div>`;

  // day rows
  state.activeDays.forEach(dayKey => {
    const dayInfo = ALL_DAYS.find(d => d.key === dayKey);
    const slots = state.schedule[dayKey] || [];

    html += `<div class="grid-row day-row" style="grid-template-columns:${gridCols};">
      <div class="day-label">
        <div class="day-abbr">${dayInfo.label}</div>
        <div class="day-dot" style="background:${dayInfo.color};"></div>
      </div>`;

    state.timeSlots.forEach((_, si) => {
      const slot = slots[si];
      if (slot) {
        const subj = state.subjects.find(s => s.code === slot.subject);
        const bg = subj ? subj.color : '#666';
        const tc = subj ? subj.textColor : '#fff';
        html += `<div class="cell">
          <div class="class-pill" style="background:${hexToRgba(bg, 0.40)};color:${tc};border:1px solid ${hexToRgba(bg, 0.45)};">
            <div class="pill-code">${esc(slot.subject)}</div>
            <div class="pill-type">${esc(slot.type)}</div>
            <div class="pill-room">${esc(slot.room)}</div>
          </div>
        </div>`;
      } else {
        html += `<div class="cell empty"></div>`;
      }
    });
    html += `</div>`;
  });

  html += `</div>`;

  if (showFooter) {
    html += `<div class="footer-glass">${esc(footerText)}</div>`;
  }

  html += `<div class="phone-spacer">${'<br>'.repeat(spacerBottom)}</div>`;
  html += `</div>`;

  document.getElementById('phonePreview').innerHTML = html;
}

/* ══════════════════════════════════════
   EXPORT PNG
   ══════════════════════════════════════ */
async function exportPNG() {
  const target = document.getElementById('exportTarget');
  if (!target) return;
  showToast('Generating PNG...');
  try {
    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    const name = document.getElementById('groupName').value || 'timetable';
    link.download = `${name}_timetable.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('PNG exported successfully!');
  } catch (e) {
    showToast('Export failed: ' + e.message);
  }
}

/* ══════════════════════════════════════
   IMPORT / EXPORT JSON
   ══════════════════════════════════════ */
function exportJSON() {
  const formFields = {};
  ['groupName', 'semester', 'showHeader', 'showFooter', 'footerText', 'spacerTop', 'spacerBottom'].forEach(f => {
    const el = document.getElementById(f);
    if (el) formFields[f] = el.type === 'checkbox' ? el.checked : el.value;
  });
  const data = { state, formFields, version: 1 };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `${formFields.groupName || 'timetable'}_data.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('JSON exported');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.state) state = { ...state, ...data.state };
      if (data.formFields) {
        Object.keys(data.formFields).forEach(k => {
          const el = document.getElementById(k);
          if (!el) return;
          if (el.type === 'checkbox') el.checked = data.formFields[k];
          else el.value = data.formFields[k];
        });
        const st = document.getElementById('spacerTop');
        const sb = document.getElementById('spacerBottom');
        if (st) document.getElementById('spacerTopVal').textContent = st.value;
        if (sb) document.getElementById('spacerBottomVal').textContent = sb.value;
      }
      saveState();
      fullRender();
      showToast('Timetable imported!');
    } catch (err) {
      showToast('Invalid JSON file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAll() {
  if (!confirm('Reset everything to default? This cannot be undone.')) return;
  localStorage.removeItem('tt-maker-state');
  localStorage.removeItem('tt-maker-form');
  location.reload();
}

/* ══════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════ */
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return hslToHex(hue, 70, 55);
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Escape to close modals
  if (e.key === 'Escape') {
    closeSubjectModal();
    closeSlotModal();
  }
  // Ctrl+E to export
  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault();
    exportPNG();
  }
  // Ctrl+S to save JSON
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    exportJSON();
  }
});

/* ══════════════════════════════════════
   FULL RENDER & INIT
   ══════════════════════════════════════ */
function fullRender() {
  renderThemes();
  renderTimeSlots();
  renderDays();
  renderSubjects();
  renderScheduleEditor();
  render();
}

// Init
loadState();
loadFormFields();
updateGradHex();
fullRender();
