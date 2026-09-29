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

const EXPORT_FORMATS = [
  { key: 'iphone',      name: 'iPhone',        desc: '1170 × 2532', w: 390, h: 844, radius: 50, exportScale: 3, fixed: false },
  { key: 'ipad',        name: 'iPad',          desc: '2048 × 2732', w: 512, h: 683, radius: 24, exportScale: 4, fixed: false },
  { key: 'desktop169',  name: 'Desktop 16:9',  desc: '1920 × 1080', w: 960, h: 540, radius: 0,  exportScale: 2, fixed: true  },
  { key: 'desktop1610', name: 'Desktop 16:10', desc: '1920 × 1200', w: 960, h: 600, radius: 0,  exportScale: 2, fixed: true  },
];

const VALIDATE_OPTS = { themeCount: THEMES.length, formatKeys: EXPORT_FORMATS.map(f => f.key) };

/* ══════════════════════════════════════
   STATE
   ══════════════════════════════════════ */
let state = {
  theme: 0,
  exportFormat: 'iphone',
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
const FORM_FIELDS = ['groupName', 'semester', 'showHeader', 'showFooter', 'footerText'];
let storageWarned = false;

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (!storageWarned) {
      storageWarned = true;
      showToast('Autosave is unavailable in this browser — use Save Schedule to keep your work');
    }
    return false;
  }
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function saveState() {
  const ok = storageSet('tt-maker-state', JSON.stringify(state));
  saveFormFields();
  if (ok) updateSaveStatus();
}

function updateSaveStatus() {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  el.textContent = `Autosaved in this browser · ${t}`;
}

function loadState() {
  const s = storageGet('tt-maker-state');
  if (s) {
    let parsed = null;
    try { parsed = JSON.parse(s); } catch (e) { /* handled below */ }
    const res = parsed ? validateImport(parsed, { ...VALIDATE_OPTS, allowMissingImage: true }) : null;
    if (res && res.ok) {
      state = { ...state, ...res.state };
    } else {
      // keep the unreadable data around instead of overwriting it
      storageSet('tt-maker-state-backup', s);
      showToast('Saved data was unreadable — started fresh (backup kept)');
    }
  }
  normalizeSchedule(state);
  if (!state.layout) {
    // older versions positioned the block with a "top spacing" slider
    try {
      const form = JSON.parse(storageGet('tt-maker-form') || 'null');
      if (form && form.spacerTop !== undefined) state.layout = layoutFromSpacer(form.spacerTop);
    } catch (e) { /* ignore */ }
  }
}

function layoutFromSpacer(spacerTop) {
  const n = parseInt(spacerTop, 10);
  if (isNaN(n)) return undefined;
  const offset = Math.max(0, Math.min(2000, n * 18));       // one spacer line was about 18px
  return { iphone: { offset }, ipad: { offset } };
}

function readFormFields() {
  const data = {};
  FORM_FIELDS.forEach(f => {
    const el = document.getElementById(f);
    if (!el) return;
    data[f] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return data;
}

function saveFormFields() {
  storageSet('tt-maker-form', JSON.stringify(readFormFields()));
}

function applyFormFields(data) {
  Object.keys(data || {}).forEach(k => {
    const el = document.getElementById(k);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!data[k];
    else el.value = data[k];
  });
}

function loadFormFields() {
  const s = storageGet('tt-maker-form');
  if (!s) return;
  try { applyFormFields(JSON.parse(s)); } catch (e) { /* ignore */ }
}

/* ══════════════════════════════════════
   TABS
   ══════════════════════════════════════ */
function showTab(name, opts) {
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
  if (!(opts && opts.noScroll)) {
    const tabs = document.querySelector('.tabs');
    if (tabs) tabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab, { noScroll: true }));
});

/* ══════════════════════════════════════
   WELCOME, HELP & COLOUR MODE
   ══════════════════════════════════════ */
function initWelcome() {
  const w = document.getElementById('welcome');
  if (w) w.hidden = storageGet('tt-maker-welcome') === 'done';
}

function dismissWelcome() {
  storageSet('tt-maker-welcome', 'done');
  document.getElementById('welcome').hidden = true;
}

function showWelcomeAgain() {
  storageSet('tt-maker-welcome', '');
  closeHelp();
  document.getElementById('welcome').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startUitm() {
  showTab('classes');
  const input = document.getElementById('uitmMatric');
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus({ preventScroll: true });
}

function openHelp() { document.getElementById('helpModal').classList.add('open'); }
function closeHelp() { document.getElementById('helpModal').classList.remove('open'); }

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  storageSet('tt-maker-theme', next);
}

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
   EXPORT FORMATS
   ══════════════════════════════════════ */
function getFormat() {
  return EXPORT_FORMATS.find(f => f.key === state.exportFormat) || EXPORT_FORMATS[0];
}

function selectFormat(key) {
  state.exportFormat = key;
  saveState();
  renderFormatSelector();
  renderPositionPanel();
  renderBackgroundPanel();
  render();
}

function renderFormatSelector() {
  const c = document.getElementById('formatSelector');
  if (!c) return;
  c.innerHTML = EXPORT_FORMATS.map(f => {
    const active = state.exportFormat === f.key ? 'active' : '';
    return `<button class="format-btn ${active}" onclick="selectFormat('${f.key}')">
      <span class="format-name">${esc(f.name)}</span>
      <span class="format-desc">${f.desc}</span>
    </button>`;
  }).join('');
  const fmt = getFormat();
  const info = document.getElementById('exportInfo');
  if (info) info.textContent = `${fmt.name} \u00b7 ${fmt.desc}`;
}

function updatePreviewScale() {
  const fmt = getFormat();
  const maxW = Math.min(420, window.innerWidth - 64);
  const s = Math.min(1, maxW / fmt.w);
  const preview = document.getElementById('phonePreview');
  const scaler = document.getElementById('previewScaler');
  const target = document.getElementById('exportTarget');
  if (preview) {
    preview.style.transform = `scale(${s})`;
    preview.style.transformOrigin = 'top left';
  }
  if (scaler) {
    const actualH = target ? target.offsetHeight : fmt.h;
    const actualW = target ? target.offsetWidth : fmt.w;
    scaler.style.width = (actualW * s) + 'px';
    scaler.style.height = (actualH * s) + 'px';
  }
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
    if (state.schedule[day]) removeSlotFromDay(state.schedule[day], i);
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
  if (!state.subjects.length) {
    c.innerHTML = `<div class="empty-state"><b>No subjects yet</b>Add your first subject below, or import your timetable if you&rsquo;re a UiTM student.</div>`;
    return;
  }
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

function subjectStyle(code) {
  const subj = state.subjects.find(s => s.code === code);
  return { bg: subj ? subj.color : '#666', tc: subj ? subj.textColor : '#fff' };
}

function slotRangeLabel(idx, span) {
  const a = state.timeSlots[idx];
  const b = state.timeSlots[idx + span - 1];
  return span > 1 ? `${a} – ${b}` : a;
}

function renderClassPalette() {
  const c = document.getElementById('classPalette');
  if (!c) return;
  if (!state.subjects.length) {
    c.innerHTML = '<div class="palette-empty">No subjects yet — add some in the Design tab.</div>';
    return;
  }
  const counts = {};
  state.activeDays.forEach(d => (state.schedule[d] || []).forEach(e => { if (e) counts[e.subject] = (counts[e.subject] || 0) + 1; }));
  c.innerHTML = state.subjects.map((s, i) => `
    <div class="palette-chip" data-drag-subject="${i}" title="Drag onto the grid"
         style="background:${tint(s.color, 0.3)};color:${s.textColor};border-color:${hexToRgba(s.color, 0.55)};">
      <span class="pc-grip">⠿</span>
      <span class="pc-code">${esc(s.code)}</span>
      <span class="pc-count">${counts[s.code] || 0}×</span>
    </div>`).join('');
}

function renderScheduleEditor() {
  const c = document.getElementById('scheduleEditor');
  const cols = state.timeSlots.length;
  const gridCols = `56px repeat(${cols}, minmax(92px, 1fr))`;
  renderClassPalette();

  let html = `<div class="schedule-grid" style="grid-template-columns:${gridCols};">`;
  html += `<div class="sched-header sched-sticky"></div>`;
  state.timeSlots.forEach(t => { html += `<div class="sched-header">${esc(t)}</div>`; });

  state.activeDays.forEach(dayKey => {
    const dayInfo = ALL_DAYS.find(d => d.key === dayKey);
    if (!state.schedule[dayKey]) state.schedule[dayKey] = state.timeSlots.map(() => null);
    while (state.schedule[dayKey].length < cols) state.schedule[dayKey].push(null);

    html += `<div class="sched-day-label sched-sticky"><span style="color:${dayInfo.color};">●</span> ${dayInfo.label}</div>`;

    for (let si = 0; si < cols; si++) {
      const occ = getOccupant(state.schedule, dayKey, si);
      if (occ && occ.start < si) continue;              // covered by a longer class
      if (occ) {
        const slot = occ.entry;
        const span = Math.min(slot.span || 1, cols - si);
        const { bg, tc } = subjectStyle(slot.subject);
        html += `<div class="sched-cell has-class" data-day="${dayKey}" data-slot="${si}" data-span="${span}"
            style="grid-column:span ${span};" onclick="openSlotModal('${dayKey}',${si})">
          <div class="slot-card" data-drag-entry style="background:${tint(bg, 0.35)};color:${tc};border:1px solid ${hexToRgba(bg, 0.4)};">
            <div class="sc-code">${esc(slot.subject)}</div>
            <div class="sc-meta">${esc(slot.type)}${slot.room ? ' &middot; ' + esc(slot.room) : ''}</div>
            ${slot.lecturer ? `<div class="sc-meta">${esc(slot.lecturer)}</div>` : ''}
            ${span > 1 ? `<div class="sc-span">${esc(slotRangeLabel(si, span))}</div>` : ''}
            <button class="sc-clear" title="Remove" onclick="event.stopPropagation();clearSlot('${dayKey}',${si})">&times;</button>
            <span class="sc-resize" data-resize title="Drag to change duration"></span>
          </div>
        </div>`;
      } else {
        html += `<div class="sched-cell" data-day="${dayKey}" data-slot="${si}" data-span="1" onclick="openSlotModal('${dayKey}',${si})">
          <span class="empty-label">+</span>
        </div>`;
      }
    }
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

  const sel = document.getElementById('slotSubject');
  sel.innerHTML = state.subjects.map(s =>
    `<option value="${esc(s.code)}" ${current && current.subject === s.code ? 'selected' : ''}>${esc(s.code)}${s.fullName ? ' — ' + esc(s.fullName) : ''}</option>`
  ).join('');

  const typeSel = document.getElementById('slotType');
  const type = current ? current.type : 'Lecture';
  if (![...typeSel.options].some(o => o.value === type)) typeSel.add(new Option(type, type));
  typeSel.value = type;
  document.getElementById('slotRoom').value = current ? current.room : '';
  document.getElementById('slotLecturer').value = current ? (current.lecturer || '') : '';

  // duration: only lengths that fit without overlapping something else
  const limit = maxSpan(state.schedule, state.timeSlots.length, dayKey, slotIdx, current || null);
  const curSpan = current ? Math.min(current.span || 1, limit) : 1;
  const spanSel = document.getElementById('slotSpan');
  spanSel.innerHTML = Array.from({ length: limit }, (_, i) => i + 1).map(n =>
    `<option value="${n}" ${n === curSpan ? 'selected' : ''}>${n} slot${n > 1 ? 's' : ''} (${esc(slotRangeLabel(slotIdx, n))})</option>`
  ).join('');

  document.getElementById('slotClearBtn').style.display = current ? 'inline-flex' : 'none';
  document.getElementById('slotModal').classList.add('open');
}

function closeSlotModal() {
  document.getElementById('slotModal').classList.remove('open');
}

function saveSlot() {
  if (!slotEditDay) return;
  const subject = document.getElementById('slotSubject').value;
  if (!subject) return;
  const span = parseInt(document.getElementById('slotSpan').value, 10) || 1;
  const current = (state.schedule[slotEditDay] || [])[slotEditIdx] || null;

  const check = canPlace(state.schedule, state.timeSlots.length, slotEditDay, slotEditIdx, span, current);
  if (!check.ok) { showToast(check.reason); return; }

  if (!state.schedule[slotEditDay]) state.schedule[slotEditDay] = state.timeSlots.map(() => null);
  state.schedule[slotEditDay][slotEditIdx] = normalizeEntry({
    subject,
    type: document.getElementById('slotType').value,
    room: document.getElementById('slotRoom').value.trim(),
    lecturer: document.getElementById('slotLecturer').value.trim(),
    span,
  });

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
   DRAG & DROP  (pointer events: mouse, pen and touch)
   modes:  new    – palette chip  -> grid
           move   – placed class  -> other slot / remove zone
           resize – right-edge handle changes duration
   Touch drags start after a short press so the page can still scroll.
   ══════════════════════════════════════ */
const DRAG_THRESHOLD = 6;
const LONG_PRESS_MS = 220;
let drag = null;
let suppressClick = false;

function slotFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const cell = el && el.closest ? el.closest('.sched-cell') : null;
  if (!cell) return null;
  const start = +cell.dataset.slot;
  const span = +cell.dataset.span || 1;
  const r = cell.getBoundingClientRect();
  const off = Math.max(0, Math.min(span - 1, Math.floor((x - r.left) / (r.width / span))));
  return { day: cell.dataset.day, slot: start + off };
}

function cellAt(day, slot) {
  const occ = getOccupant(state.schedule, day, slot);
  const idx = occ ? occ.start : slot;
  return document.querySelector(`.sched-cell[data-day="${day}"][data-slot="${idx}"]`);
}

function onDragPointerDown(e) {
  if (e.button > 0 || drag) return;
  if (e.target.closest('.sc-clear')) return;
  const resize = e.target.closest('[data-resize]');
  const cardEl = e.target.closest('[data-drag-entry]');
  const chip = e.target.closest('[data-drag-subject]');
  if (!cardEl && !chip) return;

  drag = { active: false, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, touch: e.pointerType === 'touch', ghost: null, target: null, timer: null, scroller: null };
  if (chip) {
    drag.mode = 'new';
    drag.subject = state.subjects[+chip.dataset.dragSubject].code;
    drag.srcEl = chip;
  } else {
    const cell = cardEl.closest('.sched-cell');
    drag.mode = resize ? 'resize' : 'move';
    drag.day = cell.dataset.day;
    drag.start = +cell.dataset.slot;
    drag.entry = state.schedule[drag.day][drag.start];
    drag.subject = drag.entry.subject;
    drag.srcEl = cardEl;
    const sl = slotFromPoint(e.clientX, e.clientY);
    drag.grab = sl && sl.day === drag.day ? Math.max(0, Math.min(drag.entry.span - 1, sl.slot - drag.start)) : 0;
  }
  if (drag.touch && drag.mode !== 'resize') {
    drag.timer = setTimeout(() => { if (drag && !drag.active) activateDrag(); }, LONG_PRESS_MS);
  }
}

function onDragPointerMove(e) {
  if (!drag) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (!drag.active) {
    const moved = Math.hypot(drag.x - drag.sx, drag.y - drag.sy);
    if (drag.touch && drag.mode !== 'resize') {
      if (moved > 10) endDrag();                     // finger is scrolling, not dragging
    } else if (moved > DRAG_THRESHOLD) {
      activateDrag();
    }
    return;
  }
  e.preventDefault();
  updateDragTarget();
}

function activateDrag() {
  clearTimeout(drag.timer);
  drag.active = true;
  document.body.classList.add('dragging');
  if (drag.srcEl) drag.srcEl.classList.add('drag-source');
  if (drag.mode === 'move') document.getElementById('removeZone').classList.add('show');

  const { bg, tc } = subjectStyle(drag.subject);
  const g = document.createElement('div');
  g.className = 'drag-ghost';
  g.style.background = hexToRgba(bg, 0.85);
  g.style.color = tc;
  g.innerHTML = `<b></b><span class="gh-msg"></span>`;
  g.firstChild.textContent = drag.mode === 'resize' ? 'Duration' : drag.subject;
  document.body.appendChild(g);
  drag.ghost = g;
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (err) { /* ignore */ } }
  drag.scroller = setInterval(autoScrollTick, 30);
  updateDragTarget();
}

function computeTarget() {
  const cols = state.timeSlots.length;
  const rz = document.getElementById('removeZone');
  if (drag.mode === 'move') {
    const r = rz.getBoundingClientRect();
    if (drag.x >= r.left && drag.x <= r.right && drag.y >= r.top && drag.y <= r.bottom) return { remove: true };
  }
  const sl = slotFromPoint(drag.x, drag.y);
  if (drag.mode === 'resize') {
    if (!sl || sl.day !== drag.day) return drag.target;   // keep last valid length while pointer is elsewhere
    const span = Math.max(1, sl.slot - drag.start + 1);
    return { day: drag.day, start: drag.start, span, check: canPlace(state.schedule, cols, drag.day, drag.start, span, drag.entry) };
  }
  if (!sl) return null;
  if (drag.mode === 'new') {
    return { day: sl.day, start: sl.slot, span: 1, check: canPlace(state.schedule, cols, sl.day, sl.slot, 1, null) };
  }
  const span = drag.entry.span;
  const start = Math.max(0, Math.min(cols - span, sl.slot - drag.grab));
  return { day: sl.day, start, span, check: canPlace(state.schedule, cols, sl.day, start, span, drag.entry) };
}

function updateDragTarget() {
  const g = drag.ghost;
  g.style.transform = `translate(${drag.x + 14}px, ${drag.y + 14}px)`;
  const t = computeTarget();
  drag.target = t;

  document.querySelectorAll('.drop-ok, .drop-bad').forEach(el => el.classList.remove('drop-ok', 'drop-bad'));
  document.getElementById('removeZone').classList.toggle('hot', !!(t && t.remove));
  const msg = g.querySelector('.gh-msg');
  g.classList.toggle('bad', !!(t && t.check && !t.check.ok));

  if (!t) { msg.textContent = drag.mode === 'new' ? 'Drop on the grid' : ''; return; }
  if (t.remove) { msg.textContent = 'Release to remove'; return; }

  const cls = t.check.ok ? 'drop-ok' : 'drop-bad';
  for (let j = t.start; j < t.start + t.span; j++) {
    const el = cellAt(t.day, j);
    if (el) el.classList.add(cls);
  }
  if (t.check.ok) {
    const day = ALL_DAYS.find(d => d.key === t.day).label;
    msg.textContent = `${day} · ${slotRangeLabel(t.start, t.span)}`;
  } else {
    msg.textContent = t.check.reason;
  }
}

function autoScrollTick() {
  if (!drag || !drag.active) return;
  const EDGE = 56, STEP = 14;
  if (drag.y < EDGE) window.scrollBy(0, -STEP);
  else if (drag.y > window.innerHeight - EDGE) window.scrollBy(0, STEP);
  const ed = document.getElementById('scheduleEditor');
  const r = ed.getBoundingClientRect();
  if (drag.y >= r.top - 20 && drag.y <= r.bottom + 20) {
    if (drag.x < r.left + EDGE) ed.scrollLeft -= STEP;
    else if (drag.x > r.right - EDGE) ed.scrollLeft += STEP;
  }
  updateDragTarget();
}

function onDragPointerUp() {
  if (!drag) return;
  if (!drag.active) { endDrag(); return; }
  const d = drag, t = drag.target;
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 120);
  endDrag();
  commitDrop(d, t);
}

function commitDrop(d, t) {
  if (!t) {
    if (d.mode === 'new') showToast('Drop the class onto a day/time cell');
    return;
  }
  if (t.remove) {
    state.schedule[d.day][d.start] = null;
    showToast(`Removed ${d.subject}`);
  } else if (!t.check.ok) {
    showToast(t.check.reason);
    return;
  } else if (d.mode === 'new') {
    state.schedule[t.day][t.start] = normalizeEntry({ subject: d.subject, type: 'Lecture' });
    showToast(`Added ${d.subject} · ${ALL_DAYS.find(x => x.key === t.day).label} ${state.timeSlots[t.start]}`);
  } else if (d.mode === 'move') {
    if (t.day === d.day && t.start === d.start) return;
    state.schedule[d.day][d.start] = null;
    state.schedule[t.day][t.start] = d.entry;
    showToast(`Moved ${d.subject} to ${ALL_DAYS.find(x => x.key === t.day).label} ${state.timeSlots[t.start]}`);
  } else if (d.mode === 'resize') {
    if (d.entry.span === t.span) return;
    d.entry.span = t.span;
    showToast(`${d.subject}: ${t.span} slot${t.span > 1 ? 's' : ''}`);
  }
  saveState(); renderScheduleEditor(); render();
}

function endDrag() {
  if (!drag) return;
  clearTimeout(drag.timer);
  clearInterval(drag.scroller);
  if (drag.ghost) drag.ghost.remove();
  if (drag.srcEl) drag.srcEl.classList.remove('drag-source');
  document.querySelectorAll('.drop-ok, .drop-bad').forEach(el => el.classList.remove('drop-ok', 'drop-bad'));
  const rz = document.getElementById('removeZone');
  rz.classList.remove('show', 'hot');
  document.body.classList.remove('dragging');
  drag = null;
}

function initDrag() {
  document.addEventListener('pointerdown', onDragPointerDown);
  document.addEventListener('pointermove', onDragPointerMove, { passive: false });
  document.addEventListener('pointerup', onDragPointerUp);
  document.addEventListener('pointercancel', endDrag);
  // once a touch drag is active, stop the page from scrolling under the finger
  document.addEventListener('touchmove', e => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', e => {
    if (drag && e.target.closest('[data-drag-subject],[data-drag-entry]')) e.preventDefault();
  });
  document.addEventListener('click', e => {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
  }, true);
}

/* ══════════════════════════════════════
   STATS
   ══════════════════════════════════════ */
function renderStats() {
  const c = document.getElementById('statsContainer');
  const anyClass = state.activeDays.some(d => (state.schedule[d] || []).some(Boolean));
  const ge = document.getElementById('gridEmpty');
  if (ge) ge.hidden = anyClass;
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
  const fmt = getFormat();
  const lay = getLayout(fmt.key);
  const flex = { top: 'flex-start', left: 'flex-start', middle: 'center', center: 'center', bottom: 'flex-end', right: 'flex-end' };
  const isDesktop = fmt.fixed;
  const cols = state.timeSlots.length;
  const dayCol = isDesktop ? '72px' : '52px';
  const gridCols = `${dayCol} ${'1fr '.repeat(cols).trim()}`;
  const gradient = getBackgroundCSS(fmt);
  const photo = photoActive();
  const bgc = getBg();
  const frost = (0.07 + bgc.frost / 100 * 0.6).toFixed(3);
  const sizeStyle = fmt.fixed
    ? `width:${fmt.w}px;height:${fmt.h}px;`
    : `width:${fmt.w}px;min-height:${fmt.h}px;`;
  const fmtClass = isDesktop ? 'format-desktop' : (fmt.key === 'ipad' ? 'format-ipad' : '');

  let html = `
    <div class="phone-wrap ${fmtClass}${photo ? ' has-bg' : ''}${photo && !bgc.blobs ? ' no-blobs' : ''}" id="exportTarget" style="${photo ? `--frost:${frost};` : ''}${sizeStyle}border-radius:${fmt.radius}px;background:${gradient};justify-content:${flex[lay.v]};align-items:${flex[lay.h]};">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="content-stack" style="width:${lay.width}%;top:${lay.offset}px;">
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
    html += `<div class="grid-row day-row" style="grid-template-columns:${gridCols};">
      <div class="day-label">
        <div class="day-abbr">${dayInfo.label}</div>
        <div class="day-dot" style="background:${dayInfo.color};"></div>
      </div>`;

    for (let si = 0; si < cols; si++) {
      const occ = getOccupant(state.schedule, dayKey, si);
      if (occ && occ.start < si) continue;              // covered by a longer class
      if (occ) {
        const slot = occ.entry;
        const span = Math.min(slot.span || 1, cols - si);
        const { bg, tc } = subjectStyle(slot.subject);
        html += `<div class="cell" style="${span > 1 ? `grid-column:span ${span};` : ''}">
          <div class="class-pill" style="background:${hexToRgba(bg, 0.40)};color:${tc};border:1px solid ${hexToRgba(bg, 0.45)};">
            <div class="pill-code">${esc(slot.subject)}</div>
            <div class="pill-type">${esc(slot.type)}</div>
            <div class="pill-room">${esc(slot.room)}</div>
            ${slot.lecturer ? `<div class="pill-lect">${esc(slot.lecturer)}</div>` : ''}
          </div>
        </div>`;
      } else {
        html += `<div class="cell empty"></div>`;
      }
    }
    html += `</div>`;
  });

  html += `</div>`;

  if (showFooter) {
    html += `<div class="footer-glass">${esc(footerText)}</div>`;
  }

  html += `</div></div>`;                                // .content-stack, .phone-wrap

  document.getElementById('phonePreview').innerHTML = html;
  updatePreviewScale();
  updateGuides();
  checkLayoutFit();
}

/* ══════════════════════════════════════
   POSITION  (where the timetable sits on the exported image)
   state.layout[formatKey] = { v, offset, h, width } — stored per format
   ══════════════════════════════════════ */
function getLayout(key) {
  return { ...defaultLayout(key), ...((state.layout || {})[key] || {}) };
}

let guidesOn = storageGet('tt-maker-guides') === '1';

function setLayout(patch, rerenderPanel = true) {
  const key = state.exportFormat;
  state.layout = { ...(state.layout || {}), [key]: { ...getLayout(key), ...patch } };
  saveState();
  if (rerenderPanel) renderPositionPanel();
  render();
}

function resetLayout() {
  if (state.layout) delete state.layout[state.exportFormat];
  saveState();
  renderPositionPanel();
  render();
}

function setGuides(on) {
  guidesOn = on;
  storageSet('tt-maker-guides', on ? '1' : '0');
  updateGuides();
}

function isPhoneFormat() {
  return state.exportFormat === 'iphone' || state.exportFormat === 'ipad';
}

function updateGuides() {
  const g = document.getElementById('guideOverlay');
  if (g) g.classList.toggle('show', guidesOn && isPhoneFormat());
}

function checkLayoutFit() {
  const warn = document.getElementById('layoutWarn');
  const wrap = document.getElementById('exportTarget');
  const stack = wrap && wrap.querySelector('.content-stack');
  if (!warn || !stack) return;
  const top = stack.offsetTop, bottom = top + stack.offsetHeight;
  const out = top < 0 || bottom > wrap.offsetHeight;
  warn.textContent = out ? 'Part of the timetable is outside the image \u2014 move it back or reduce the offset.' : '';
}

function renderPositionPanel() {
  const c = document.getElementById('positionPanel');
  if (!c) return;
  const fmt = getFormat();
  const lay = getLayout(fmt.key);
  const half = Math.round(fmt.h / 2);
  const phone = isPhoneFormat();
  const clockOffset = defaultLayout(fmt.key).offset;

  const seg = (items, active) => items.map(([label, patch, on]) =>
    `<button class="seg-btn ${on ? 'active' : ''}" onclick='setLayout(${JSON.stringify(patch)})'>${label}</button>`).join('');
  const vItems = [['Top', { v: 'top', offset: 0 }, lay.v === 'top' && lay.offset === 0 && !(phone && clockOffset === 0)]];
  if (phone) vItems.push(['Below clock', { v: 'top', offset: clockOffset }, lay.v === 'top' && lay.offset === clockOffset]);
  vItems.push(['Middle', { v: 'middle', offset: 0 }, lay.v === 'middle' && lay.offset === 0]);
  vItems.push(['Bottom', { v: 'bottom', offset: 0 }, lay.v === 'bottom' && lay.offset === 0]);
  const hItems = [['Left', { h: 'left' }, lay.h === 'left'], ['Center', { h: 'center' }, lay.h === 'center'], ['Right', { h: 'right' }, lay.h === 'right']];

  c.innerHTML = `
    <div class="panel-title">Position <span class="subject-count">${esc(fmt.name)}</span></div>
    <p class="panel-hint">Where the timetable sits on the image. Saved separately for each format.</p>
    <div class="ctl-label">Vertical</div>
    <div class="seg">${seg(vItems)}</div>
    <div class="ctl-label">Fine-tune <strong>${lay.offset > 0 ? '+' : ''}${lay.offset}px</strong></div>
    <input type="range" min="${-half}" max="${half}" step="2" value="${Math.max(-half, Math.min(half, lay.offset))}"
      oninput="this.previousElementSibling.lastElementChild.textContent=(this.value>0?'+':'')+this.value+'px'; setLayout({offset:+this.value}, false)" />
    <div class="ctl-label">Horizontal</div>
    <div class="seg">${seg(hItems)}</div>
    <div class="ctl-label">Width <strong>${lay.width}%</strong></div>
    <input type="range" min="60" max="100" step="1" value="${lay.width}"
      oninput="this.previousElementSibling.lastElementChild.textContent=this.value+'%'; setLayout({width:+this.value}, false)" />
    <div class="btn-row" style="margin-top:12px; align-items:center;">
      ${phone ? `<label class="check-inline"><input type="checkbox" ${guidesOn ? 'checked' : ''} onchange="setGuides(this.checked)" /> Show lock-screen guides</label>` : ''}
      <button class="btn btn-secondary" style="margin-left:auto;padding:6px 12px;font-size:11px;" onclick="resetLayout()">Reset position</button>
    </div>
    <div class="layout-warn" id="layoutWarn"></div>`;
}

/* ══════════════════════════════════════
   BACKGROUND PHOTO
   state.background = { mode, dim, blur, frost, blobs, focus: { [format]: { x, y, zoom } } }
   The photo itself is NOT in `state` (render() saves state on every edit): it lives in its own
   localStorage key, and is shown through a blob: URL so render() never re-emits megabytes of text.
   Blur is baked with a canvas because html2canvas ignores CSS filters.
   ══════════════════════════════════════ */
const BG_KEY = 'tt-maker-bg';
const BG_MAX_INPUT = 25 * 1024 * 1024;
const BG_MAX_SIDE = 3000;
const BG_MAX_CHARS = 1800000;
const DEFAULT_BG = { mode: 'gradient', dim: 25, blur: 0, frost: 18, blobs: false };

let bgDataUrl = null;      // JPEG/PNG/WebP data URL (storage + saved file)
let bgDims = null;         // { w, h } of the stored photo
let bgBlobUrl = null;      // what the preview/export actually draws (blurred when blur > 0)
let bgBlobFor = null;      // cache key of the current blob
let bgPlainBlob = null;
let bgBlurTimer = null;
let bgInfo = '';
let bgUnsaved = false;     // true when the photo could not be written to localStorage

function getBg() { return { ...DEFAULT_BG, ...(state.background || {}) }; }
function getBgFocus(key) { return { x: 50, y: 50, zoom: 100, ...(((state.background || {}).focus || {})[key] || {}) }; }
function photoActive() { return getBg().mode === 'photo' && !!bgBlobUrl && !!bgDims; }

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

async function decodeFile(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file); } catch (e) { /* fall back below */ }
  }
  const url = URL.createObjectURL(file);
  try { return await loadImageEl(url); } finally { URL.revokeObjectURL(url); }
}

function canvasToBlob(canvas, type, q) {
  return new Promise(res => canvas.toBlob(res, type, q));
}

/** Downscale to BG_MAX_SIDE and re-encode as JPEG, shrinking until it fits BG_MAX_CHARS. */
function encodePhoto(source, w, h) {
  let scale = Math.min(1, BG_MAX_SIDE / Math.max(w, h));
  for (let pass = 0; pass < 6; pass++) {
    const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#101020';                       // transparent PNGs become dark, not black-hole JPEG
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(source, 0, 0, cw, ch);
    for (const q of [0.88, 0.8, 0.7, 0.6]) {
      const url = c.toDataURL('image/jpeg', q);
      if (url.length <= BG_MAX_CHARS) return { url, w: cw, h: ch };
    }
    scale *= 0.8;
  }
  return null;
}

async function setBackgroundFile(file) {
  if (!file) return;
  if (file.size > BG_MAX_INPUT) { showToast('That photo is over 25 MB — try a smaller one.'); return; }
  if (file.type && !/^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(file.type)) {
    showToast(/heic|heif/.test(file.type) ? 'HEIC photos are not supported here — export it as JPG or PNG first.' : 'Please choose a JPG, PNG or WebP image.');
    return;
  }
  showToast('Preparing your photo…');
  let bmp;
  try { bmp = await decodeFile(file); } catch (e) {
    showToast('Could not read that image. Try a JPG or PNG (HEIC is not supported).');
    return;
  }
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  const enc = encodePhoto(bmp, w, h);
  if (bmp.close) bmp.close();
  if (!enc) { showToast('That photo could not be shrunk enough. Try a smaller one.'); return; }
  const ok = await adoptBackgroundImage(enc.url);
  if (!ok) return;
  state.background = { ...getBg(), mode: 'photo' };
  saveState();
  renderBackgroundPanel();
  render();
  showToast(bgUnsaved ? 'Photo added, but it is too big to keep between visits — it lasts until you close this tab.' : 'Photo added ✓ Adjust it below');
}

/** Make `dataUrl` the current photo (stores it, builds the display blob). Returns false on failure. */
async function adoptBackgroundImage(dataUrl) {
  let img;
  try { img = await loadImageEl(dataUrl); } catch (e) { showToast('The background photo could not be read.'); return false; }
  bgDataUrl = dataUrl;
  bgDims = { w: img.naturalWidth, h: img.naturalHeight };
  bgInfo = `${bgDims.w}×${bgDims.h} · ${(dataUrl.length * 0.75 / 1048576).toFixed(1)} MB`;
  bgPlainBlob = null; bgBlobFor = null;
  bgUnsaved = false;
  try { localStorage.setItem(BG_KEY, dataUrl); }
  catch (e) { bgUnsaved = true; }
  await rebuildBgBlob(img);
  return true;
}

async function rebuildBgBlob(imgEl) {
  if (!bgDataUrl) return;
  const blur = getBg().blur;
  const key = String(blur);
  if (bgBlobFor === key && bgBlobUrl) return;
  const img = imgEl || await loadImageEl(bgDataUrl);
  let blob;
  if (blur <= 0) {
    if (!bgPlainBlob) bgPlainBlob = await (await fetch(bgDataUrl)).blob();
    blob = bgPlainBlob;
  } else {
    blob = await blurredBlob(img, blur);
  }
  if (bgBlobUrl) URL.revokeObjectURL(bgBlobUrl);
  bgBlobUrl = URL.createObjectURL(blob);
  bgBlobFor = key;
}

/** Blur on a <=1200px working copy (detail is gone anyway); CSS scales it back up. */
async function blurredBlob(img, blur) {
  const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const px = blur * (Math.max(w, h) / 600);            // slider 0-40 -> a few percent of the image size
  const m = Math.ceil(px * 2);                          // over-draw so blurred edges are not transparent
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.filter = `blur(${px}px)`;
  if (ctx.filter === `blur(${px}px)`) {
    ctx.drawImage(img, -m, -m, w + 2 * m, h + 2 * m);
  } else {
    // no ctx.filter (older Safari): shrink then enlarge with smoothing
    ctx.filter = 'none';
    const f = Math.max(2, 1 + px / 2);
    const s = document.createElement('canvas');
    s.width = Math.max(2, Math.round(w / f)); s.height = Math.max(2, Math.round(h / f));
    const sc = s.getContext('2d');
    sc.imageSmoothingQuality = 'high';
    sc.drawImage(img, 0, 0, s.width, s.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(s, 0, 0, w, h);
  }
  return canvasToBlob(c, 'image/jpeg', 0.9);
}

function loadBackgroundImage() {
  let url = null;
  try { url = localStorage.getItem(BG_KEY); } catch (e) { /* ignore */ }
  if (!url) {
    if (getBg().mode === 'photo') state.background = { ...getBg(), mode: 'gradient' };
    return Promise.resolve();
  }
  return adoptBackgroundImage(url).then(ok => { if (ok) { renderBackgroundPanel(); render(); } });
}

function removeBackground() {
  try { localStorage.removeItem(BG_KEY); } catch (e) { /* ignore */ }
  if (bgBlobUrl) URL.revokeObjectURL(bgBlobUrl);
  bgDataUrl = bgDims = bgBlobUrl = bgBlobFor = bgPlainBlob = null;
  state.background = { ...getBg(), mode: 'gradient' };
  saveState();
  renderBackgroundPanel();
  render();
  showToast('Photo removed');
}

function setBackground(patch, rerenderPanel = true) {
  const key = state.exportFormat;
  if (patch.focus) {
    const focus = { ...(getBg().focus || {}), [key]: { ...getBgFocus(key), ...patch.focus } };
    state.background = { ...getBg(), ...patch, focus };
  } else {
    state.background = { ...getBg(), ...patch };
  }
  saveState();
  if (patch.blur !== undefined) {
    clearTimeout(bgBlurTimer);
    bgBlurTimer = setTimeout(() => rebuildBgBlob().then(render), 140);
  }
  if (rerenderPanel) renderBackgroundPanel();
  render();
}

function chooseBackgroundMode(mode) {
  if (mode === 'photo' && !bgDataUrl) { pickBackgroundFile(); return; }
  setBackground({ mode });
}

function pickBackgroundFile() { document.getElementById('bgFile').click(); }
function onBackgroundFile(ev) {
  const f = ev.target.files[0];
  ev.target.value = '';
  if (f) setBackgroundFile(f);
}

/** CSS `background` value for the export target */
function getBackgroundCSS(fmt) {
  const gradient = getGradientCSS();
  if (!photoActive()) return gradient;
  const cfg = getBg(), f = getBgFocus(fmt.key);
  const ratio = bgDims.w / bgDims.h;
  const z = f.zoom / 100;
  let sw, sh;
  if (fmt.w / fmt.h > ratio) { sw = fmt.w * z; sh = sw / ratio; } else { sh = fmt.h * z; sw = sh * ratio; }
  const d = (cfg.dim / 100 * 0.85).toFixed(3);
  return `linear-gradient(rgba(0,0,0,${d}),rgba(0,0,0,${d})), url(${bgBlobUrl}) ${f.x}% ${f.y}% / ${sw.toFixed(1)}px ${sh.toFixed(1)}px no-repeat, ${gradient}`;
}

function renderBackgroundPanel() {
  const c = document.getElementById('backgroundPanel');
  if (!c) return;
  const cfg = getBg();
  const fmt = getFormat();
  const f = getBgFocus(fmt.key);
  const photo = cfg.mode === 'photo' && !!bgDataUrl;
  const gp = document.getElementById('gradientPanel');
  if (gp) gp.hidden = photo;

  const slider = (label, key, min, max, val, unit, onInput) => `
    <div class="ctl-label">${label} <strong>${val}${unit}</strong></div>
    <input type="range" min="${min}" max="${max}" step="1" value="${val}"
      oninput="this.previousElementSibling.lastElementChild.textContent=this.value+'${unit}'; ${onInput}" />`;

  let body = '';
  if (!bgDataUrl) {
    body = `<button class="upload-zone" onclick="pickBackgroundFile()">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>
        <b>Upload your own photo</b>
        <span>Click, or drop an image anywhere on this page. JPG, PNG or WebP. It stays on your device.</span>
      </button>`;
  } else if (photo) {
    body = `
      <div class="photo-row">
        <img class="photo-thumb" src="${bgBlobUrl || ''}" alt="Your background photo" />
        <div class="photo-meta"><b>Your photo</b><span>${esc(bgInfo)}</span>
          <div class="btn-row" style="margin-top:8px;">
            <button class="btn btn-secondary" style="padding:6px 12px;font-size:11px;" onclick="pickBackgroundFile()">Replace</button>
            <button class="btn btn-danger" style="padding:6px 12px;font-size:11px;" onclick="removeBackground()">Remove</button>
          </div></div>
      </div>
      <div class="ctl-label sub-h">Framing <span class="subject-count">${esc(fmt.name)}</span></div>
      ${slider('Move left / right', 'x', 0, 100, f.x, '%', "setBackground({focus:{x:+this.value}}, false)")}
      ${slider('Move up / down', 'y', 0, 100, f.y, '%', "setBackground({focus:{y:+this.value}}, false)")}
      ${slider('Zoom', 'zoom', 100, 300, f.zoom, '%', "setBackground({focus:{zoom:+this.value}}, false)")}
      <div class="ctl-label sub-h">Make it readable</div>
      ${slider('Darken', 'dim', 0, 100, cfg.dim, '%', "setBackground({dim:+this.value}, false)")}
      ${slider('Blur', 'blur', 0, 40, cfg.blur, '', "setBackground({blur:+this.value}, false)")}
      ${slider('Card frost', 'frost', 0, 100, cfg.frost, '%', "setBackground({frost:+this.value}, false)")}
      <label class="check-inline" style="margin-top:12px;"><input type="checkbox" ${cfg.blobs ? 'checked' : ''} onchange="setBackground({blobs:this.checked}, false)" /> Keep the soft colored glow</label>
      <p class="panel-hint" style="margin:10px 0 0;">Tip: for bright or busy photos, raise <em>Darken</em> or <em>Card frost</em> so the text stays easy to read. Framing is saved separately for each device size.</p>`;
  } else {
    body = `<p class="panel-hint">You have a photo saved (${esc(bgInfo)}). Switch to <em>Photo</em> to use it, or <button class="link-btn" onclick="removeBackground()">remove it</button>.</p>`;
  }

  c.innerHTML = `
    <div class="panel-title">Background</div>
    <p class="panel-hint">Choose a soft gradient, or make it yours with a photo.</p>
    <div class="seg">
      <button class="seg-btn ${photo ? '' : 'active'}" onclick="chooseBackgroundMode('gradient')">Gradient</button>
      <button class="seg-btn ${photo ? 'active' : ''}" onclick="chooseBackgroundMode('photo')">Photo</button>
    </div>
    <div style="margin-top:14px;">${body}</div>
    <input type="file" id="bgFile" accept="image/*" style="display:none" onchange="onBackgroundFile(event)" />`;
}

/* ══════════════════════════════════════
   EXPORT PNG
   ══════════════════════════════════════ */
function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));     // iPadOS reports as a Mac
}

function isInAppBrowser() {
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Telegram|Snapchat|TikTok|Twitter/i.test(navigator.userAgent);
}

/** Plain download for desktop browsers (also used as a fallback on phones). */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

let exportResult = null;

/**
 * Phones: the render takes a second or two, so by the time it finishes the browser no longer treats a
 * scripted download as coming from the user's tap and blocks it. Instead show the finished image with
 * real buttons (each a fresh tap) and a press-and-hold fallback that works in every browser.
 */
function showExportResult(blob, filename) {
  const img = document.getElementById('exportImg');
  if (exportResult) URL.revokeObjectURL(exportResult.url);
  exportResult = { blob, filename, url: URL.createObjectURL(blob) };
  img.src = exportResult.url;
  const file = new File([blob], filename, { type: 'image/png' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  document.getElementById('exportShareBtn').style.display = canShare ? 'inline-flex' : 'none';
  document.getElementById('exportInApp').hidden = !isInAppBrowser();
  document.getElementById('exportModal').classList.add('open');
}

function closeExportModal() {
  document.getElementById('exportModal').classList.remove('open');
  if (exportResult) { URL.revokeObjectURL(exportResult.url); exportResult = null; document.getElementById('exportImg').removeAttribute('src'); }
}

async function shareExport() {
  if (!exportResult) return;
  const file = new File([exportResult.blob], exportResult.filename, { type: 'image/png' });
  try {
    await navigator.share({ files: [file], title: 'My timetable wallpaper' });
  } catch (e) {
    if (e.name !== 'AbortError') showToast('Sharing failed \u2014 press and hold the image to save it instead.');
  }
}

function downloadExport() {
  if (exportResult) downloadBlob(exportResult.blob, exportResult.filename);
}

async function exportPNG() {
  const target = document.getElementById('exportTarget');
  if (!target) return;
  showToast('Generating PNG...');
  try {
    const fmt = getFormat();
    // stay under the ~16 megapixel canvas limit of mobile browsers
    const scale = Math.min(fmt.exportScale, Math.sqrt(16e6 / (fmt.w * fmt.h)));
    const canvas = await html2canvas(target, {
      scale,
      backgroundColor: null,
      useCORS: true,
      logging: false,
      // the live preview is scaled down to fit; capture the target at its true size
      onclone: doc => {
        const pp = doc.getElementById('phonePreview');
        const sc = doc.getElementById('previewScaler');
        if (pp) { pp.style.transform = 'none'; pp.style.transition = 'none'; }
        if (sc) { sc.style.width = 'auto'; sc.style.height = 'auto'; sc.style.overflow = 'visible'; }
      },
    });
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('the image was too large for this device \u2014 try a smaller format');
    const name = document.getElementById('groupName').value || 'timetable';
    const filename = `${name}_${fmt.key}_timetable.png`;
    if (isMobileBrowser()) {
      showToast('Your wallpaper is ready \u2713');
      showExportResult(blob, filename);
    } else {
      downloadBlob(blob, filename);
      showToast('Wallpaper downloaded \u2713');
    }
  } catch (e) {
    showToast('Export failed: ' + e.message);
  }
}

/* ══════════════════════════════════════
   SAVE / LOAD SCHEDULE DATA (JSON)
   ══════════════════════════════════════ */
let pendingImport = null;

function exportJSON() {
  const data = buildExport(state, readFormFields(), bgDataUrl);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const name = (data.meta.groupName || 'timetable').replace(/[^\w.-]+/g, '_');
  const link = document.createElement('a');
  link.download = `${name}_schedule.json`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast(`Saved \u2713 ${data.schedule.length} class${data.schedule.length === 1 ? '' : 'es'} in your file`);
}

function pickImportFile() {
  document.getElementById('importFile').click();
}

function importJSON(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (file) readImportFile(file);
}

function readImportFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    showImportError(['The file is larger than 10 MB — that is not a timetable file.']);
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showImportError(['The file could not be read.']);
  reader.onload = e => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (err) {
      showImportError([`"${file.name}" is not valid JSON, so it cannot be a saved timetable.`]);
      return;
    }
    const res = validateImport(data, VALIDATE_OPTS);
    if (!res.ok) { showImportError(res.errors); return; }
    pendingImport = res;
    showImportConfirm(res, file.name);
  };
  reader.readAsText(file);
}

function openImportModal(title, bodyHtml, confirmable) {
  document.getElementById('importTitle').textContent = title;
  document.getElementById('importBody').innerHTML = bodyHtml;
  document.getElementById('importApplyBtn').style.display = confirmable ? 'inline-flex' : 'none';
  document.getElementById('importCancelBtn').textContent = confirmable ? 'Cancel' : 'Close';
  document.getElementById('importModal').classList.add('open');
}

function closeImportModal() {
  document.getElementById('importModal').classList.remove('open');
  pendingImport = null;
}

function showImportError(errors) {
  pendingImport = null;
  openImportModal("Can't load this file",
    `<p class="import-note">Nothing was changed. Problems found:</p>
     <ul class="import-errors">${errors.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`, false);
}

function showImportConfirm(res, fileName) {
  const count = res.state.activeDays.reduce((n, d) => n + res.state.schedule[d].filter(Boolean).length, 0);
  const name = res.meta.groupName ? ` for <b>${esc(res.meta.groupName)}</b>` : '';
  const sum = res.summary
    ? ` Based on ${res.summary.dates} dates (${esc(res.summary.firstDate)} to ${esc(res.summary.lastDate)}), shown as a weekly timetable.` : '';
  const warn = res.warnings && res.warnings.length
    ? `<ul class="import-errors warn">${res.warnings.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '';
  openImportModal(res.keepDesign ? 'Use this timetable?' : 'Load this schedule?',
    `<p class="import-note">${esc(fileName)}${name}: ${count} class${count === 1 ? '' : 'es'},
     ${res.state.subjects.length} subjects, ${res.state.activeDays.length} days, ${res.state.timeSlots.length} time slots.${sum}</p>
     ${warn}
     <p class="import-note">${res.keepDesign
       ? 'This replaces your classes, subjects and time slots. Your theme, layout and header/footer are kept.'
       : 'This replaces your current timetable.'}</p>`, true);
}

function applyImport() {
  if (!pendingImport) return;
  const res = pendingImport;
  if (res.keepDesign) {
    const { timeSlots, activeDays, subjects, schedule } = res.state;
    state = { ...state, timeSlots, activeDays, subjects, schedule };
    if (res.meta.groupName) applyFormFields({ groupName: res.meta.groupName });
  } else {
    state = { ...state, ...res.state, layout: res.state.layout || layoutFromSpacer(res.meta.spacerTop) };
    applyFormFields(res.meta);
    syncGradientPickers();
  }
  normalizeSchedule(state);
  closeImportModal();
  saveState();
  fullRender();
  if (!res.keepDesign && res.image) adoptBackgroundImage(res.image).then(() => { renderBackgroundPanel(); render(); });
  showToast(res.keepDesign ? 'All set \u2014 your timetable is in! Next: check the Schedule tab.' : 'Timetable loaded \u2713');
}

/* ══════════════════════════════════════
   UiTM STUDENT IMPORT
   ══════════════════════════════════════ */
const UITM_URL = 'https://cdn.uitm.link/jadual/baru/';

function setUitmStatus(msg, kind) {
  const el = document.getElementById('uitmStatus');
  el.textContent = msg;
  el.className = 'uitm-status' + (kind ? ' ' + kind : '');
}

async function importFromUitm() {
  const input = document.getElementById('uitmMatric');
  const btn = document.getElementById('uitmBtn');
  const id = input.value.trim();
  if (!/^[A-Za-z0-9]{6,15}$/.test(id)) {
    setUitmStatus('Enter your student ID (6\u201315 letters or digits).', 'error');
    input.focus();
    return;
  }
  storageSet('tt-maker-matric', id);
  btn.disabled = true;
  setUitmStatus('Fetching timetable\u2026', '');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const resp = await fetch(UITM_URL + encodeURIComponent(id) + '.json', { signal: ctrl.signal, cache: 'no-store' });
    if (resp.status === 404) throw new Error(`No timetable found for "${id}". Check the student ID.`);
    if (!resp.ok) throw new Error(`The server returned an error (${resp.status}). Try again later.`);
    let json;
    try { json = await resp.json(); } catch (e) { throw new Error('The server sent something that is not a timetable. Check the student ID.'); }

    const conv = convertUitm(json);
    if (!conv.ok) throw new Error(conv.errors[0]);
    const v = validateImport(conv.data, VALIDATE_OPTS);
    if (!v.ok) { setUitmStatus('', ''); showImportError(v.errors); return; }
    pendingImport = { ...v, keepDesign: true, warnings: conv.warnings, summary: conv.summary };
    setUitmStatus('', '');
    showImportConfirm(pendingImport, `UiTM ${id}`);
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'The request timed out. Check your connection and try again.'
      : e instanceof TypeError ? 'Could not reach cdn.uitm.link. Check your internet connection.'
      : e.message;
    setUitmStatus(msg, 'error');
  } finally {
    clearTimeout(timer);
    btn.disabled = false;
  }
}

function syncGradientPickers() {
  const g = state.customGradient || (() => { const t = THEMES[state.theme] || THEMES[0]; return [t.stops[0], t.stops[2] || t.stops[1], t.stops[t.stops.length - 1]]; })();
  document.getElementById('gradStart').value = g[0];
  document.getElementById('gradMid').value = g[1];
  document.getElementById('gradEnd').value = g[2];
  updateGradHex();
}

// Drop a .json file anywhere on the page to load it
function initFileDrop() {
  const overlay = document.getElementById('fileDropOverlay');
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  let depth = 0;
  window.addEventListener('dragenter', e => { if (hasFiles(e)) { depth++; overlay.classList.add('show'); } });
  window.addEventListener('dragleave', e => { if (hasFiles(e) && --depth <= 0) { depth = 0; overlay.classList.remove('show'); } });
  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    overlay.classList.remove('show');
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (/^image\//.test(f.type)) { showTab('style', { noScroll: true }); setBackgroundFile(f); } else readImportFile(f);
  });
}

function resetAll() {
  if (!confirm('Reset everything to default? This cannot be undone.')) return;
  try {
    localStorage.removeItem('tt-maker-state');
    localStorage.removeItem('tt-maker-form');
    localStorage.removeItem(BG_KEY);
  } catch (e) { /* ignore */ }
  location.reload();
}

/* ══════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════ */
/** Translucent colour tint over a theme-dependent backing (transparent in dark mode, deep indigo in light) */
function tint(hex, alpha) {
  const c = hexToRgba(hex, alpha);
  return `linear-gradient(${c}, ${c}), var(--card-under)`;
}

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
    if (drag) { endDrag(); return; }
    closeSubjectModal();
    closeSlotModal();
    closeImportModal();
    closeHelp();
    closeExportModal();
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
  renderFormatSelector();
  renderPositionPanel();
  renderBackgroundPanel();
  renderTimeSlots();
  renderDays();
  renderSubjects();
  renderScheduleEditor();
  render();
}

// Init
loadState();
loadFormFields();
syncGradientPickers();
fullRender();
loadBackgroundImage();
initWelcome();
initDrag();
initFileDrop();
document.getElementById('uitmMatric').value = storageGet('tt-maker-matric') || '';
window.addEventListener('beforeunload', () => { saveState(); });
window.addEventListener('resize', updatePreviewScale);
