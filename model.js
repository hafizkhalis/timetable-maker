/* ══════════════════════════════════════
   SCHEDULE MODEL  (pure logic, no DOM)
   Shared by the timetable UI, drag & drop, localStorage and JSON import/export.
   Also loadable from Node for testing:  require('./model.js')

   In-memory shape (state.schedule):
     { [dayKey]: Array(timeSlots.length) of Entry | null }
   Entry = { subject, type, room, lecturer, span }
   An entry is stored ONCE at its start slot; the `span - 1` slots after it
   are covered by it (their array cells stay null).

   File shape (version 2): see buildExport().
   ══════════════════════════════════════ */
(function (root) {
  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const FILE_APP = 'timetable-maker';
  const FILE_VERSION = 2;
  const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const LIMITS = { slots: 12, subjects: 100, entries: 500, str: 200, maxErrors: 12 };

  /* ── entries ── */
  function normalizeEntry(e) {
    return {
      subject: String(e.subject == null ? '' : e.subject),
      type: String(e.type || 'Lecture'),
      room: String(e.room || ''),
      lecturer: String(e.lecturer || ''),
      span: Math.max(1, parseInt(e.span, 10) || 1),
    };
  }

  /** Fill defaults, pad/trim day arrays, clamp spans. Mutates and returns state. */
  function normalizeSchedule(state) {
    const n = state.timeSlots.length;
    if (!state.schedule) state.schedule = {};
    for (const day of Object.keys(state.schedule)) {
      const arr = Array.isArray(state.schedule[day]) ? state.schedule[day] : [];
      const out = [];
      for (let i = 0; i < n; i++) {
        const e = arr[i];
        if (!e) { out.push(null); continue; }
        const ne = normalizeEntry(e);
        ne.span = Math.min(ne.span, n - i);
        out.push(ne);
      }
      state.schedule[day] = out;
    }
    return state;
  }

  /** Entry covering (day, idx), or null. Returns { entry, start }. */
  function getOccupant(schedule, day, idx) {
    const arr = schedule[day] || [];
    for (let i = Math.min(idx, arr.length - 1); i >= 0; i--) {
      const e = arr[i];
      if (e && i + (e.span || 1) > idx) return { entry: e, start: i };
    }
    return null;
  }

  /** Can an entry of `span` slots start at (day, idx)? `ignore` = the entry being moved/resized. */
  function canPlace(schedule, slotCount, day, idx, span, ignore) {
    if (idx < 0 || idx >= slotCount) return { ok: false, reason: 'Outside the timetable' };
    if (idx + span > slotCount) return { ok: false, reason: 'Not enough time slots left in the day' };
    for (let j = idx; j < idx + span; j++) {
      const occ = getOccupant(schedule, day, j);
      if (occ && occ.entry !== ignore) {
        return { ok: false, reason: 'Conflicts with ' + occ.entry.subject, conflict: occ.entry };
      }
    }
    return { ok: true };
  }

  /** Largest span that fits starting at (day, idx). */
  function maxSpan(schedule, slotCount, day, idx, ignore) {
    let s = 0;
    while (idx + s < slotCount) {
      const occ = getOccupant(schedule, day, idx + s);
      if (occ && occ.entry !== ignore) break;
      s++;
    }
    return s;
  }

  /** Remove slot column `i` from one day's array, keeping spans consistent. */
  function removeSlotFromDay(arr, i) {
    const removed = arr.splice(i, 1)[0];
    for (let k = 0; k < i; k++) {                    // entries that reached into slot i get shorter
      const e = arr[k];
      if (e && k + e.span > i) e.span--;
    }
    if (removed && removed.span > 1) {                // entry that started at i now starts at i (next slot)
      removed.span--;
      arr[i] = removed;
    }
  }

  /* ── state <-> flat entry list ── */
  function entriesFromState(state) {
    const out = [];
    for (const day of state.activeDays) {
      (state.schedule[day] || []).forEach((e, i) => {
        if (!e) return;
        out.push({
          day, slotIndex: i, span: e.span || 1,
          startTime: state.timeSlots[i],
          endTime: state.timeSlots[Math.min(i + (e.span || 1), state.timeSlots.length) - 1],
          subject: e.subject, type: e.type, room: e.room || '', lecturer: e.lecturer || '',
        });
      });
    }
    return out;
  }

  function buildExport(state, meta) {
    return {
      app: FILE_APP,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      meta: meta || {},
      appearance: {
        theme: state.theme,
        customGradient: state.customGradient || null,
        exportFormat: state.exportFormat,
      },
      timeSlots: state.timeSlots.slice(),
      activeDays: state.activeDays.slice(),
      subjects: state.subjects.map(s => ({ code: s.code, fullName: s.fullName || '', color: s.color, textColor: s.textColor })),
      schedule: entriesFromState(state),
    };
  }

  /** Turn older shapes into the v2 file shape. Returns null if unrecognised. */
  function migrateToV2(data) {
    if (data && data.app === FILE_APP) return data;
    // v1 export: { state, formFields, version: 1 }; localStorage: the raw state itself
    const st = data && data.state && typeof data.state === 'object' ? data.state : data;
    if (!st || typeof st !== 'object' || !Array.isArray(st.timeSlots) || !st.schedule || Array.isArray(st.schedule)) return null;
    const legacy = {
      theme: st.theme, customGradient: st.customGradient, exportFormat: st.exportFormat,
      timeSlots: st.timeSlots,
      activeDays: Array.isArray(st.activeDays) ? st.activeDays : DAY_KEYS.filter(d => st.schedule[d]),
      subjects: Array.isArray(st.subjects) ? st.subjects : [],
    };
    const entries = [];
    for (const day of Object.keys(st.schedule)) {
      if (!Array.isArray(st.schedule[day])) continue;
      st.schedule[day].forEach((e, i) => { if (e && legacy.activeDays.includes(day)) entries.push(Object.assign({ day, slotIndex: i }, e)); });
    }
    return {
      app: FILE_APP, version: 1, meta: data.formFields || {},
      appearance: { theme: legacy.theme, customGradient: legacy.customGradient, exportFormat: legacy.exportFormat },
      timeSlots: legacy.timeSlots, activeDays: legacy.activeDays, subjects: legacy.subjects, schedule: entries,
    };
  }

  /**
   * Validate + convert file/localStorage data.
   * opts: { themeCount, formatKeys }
   * Returns { ok, errors[], state, meta } — `state` is only meaningful when ok.
   */
  function validateImport(raw, opts) {
    opts = opts || {};
    const errors = [];
    const err = m => { if (errors.length < LIMITS.maxErrors) errors.push(m); else if (errors.length === LIMITS.maxErrors) errors.push('…and more problems'); };
    const fail = () => ({ ok: false, errors, state: null, meta: null });

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { err('The file does not contain a timetable (expected a JSON object).'); return fail(); }
    if (raw.app !== undefined && raw.app !== FILE_APP) { err(`This file was not created by Timetable Maker (app = "${String(raw.app).slice(0, 40)}").`); return fail(); }
    const d = migrateToV2(raw);
    if (!d) { err('This does not look like a Timetable Maker file (missing timeSlots / schedule).'); return fail(); }
    if (typeof d.version !== 'number' || d.version > FILE_VERSION) {
      err(`Unsupported file version ${JSON.stringify(d.version)}. This app understands versions 1–${FILE_VERSION}.`); return fail();
    }

    const str = (v, what, max) => {
      if (typeof v !== 'string') { err(`${what} must be text.`); return null; }
      if (v.length > (max || LIMITS.str)) { err(`${what} is too long.`); return null; }
      return v;
    };

    // time slots
    let timeSlots = [];
    if (!Array.isArray(d.timeSlots) || d.timeSlots.length < 1 || d.timeSlots.length > LIMITS.slots) {
      err(`timeSlots must be a list of 1–${LIMITS.slots} labels.`);
    } else {
      d.timeSlots.forEach((t, i) => { const v = str(t, `Time slot ${i + 1}`, 40); if (v !== null) timeSlots.push(v); });
    }

    // active days
    const activeDays = [];
    if (!Array.isArray(d.activeDays) || !d.activeDays.length) err('activeDays must list at least one day.');
    else d.activeDays.forEach(k => {
      if (!DAY_KEYS.includes(k)) err(`Unknown day "${String(k).slice(0, 20)}" (use ${DAY_KEYS.join(', ')}).`);
      else if (!activeDays.includes(k)) activeDays.push(k);
    });

    // subjects
    const subjects = [];
    if (!Array.isArray(d.subjects)) err('subjects must be a list.');
    else if (d.subjects.length > LIMITS.subjects) err(`Too many subjects (max ${LIMITS.subjects}).`);
    else d.subjects.forEach((s, i) => {
      if (!s || typeof s !== 'object') { err(`Subject ${i + 1} is not an object.`); return; }
      const code = str(s.code, `Subject ${i + 1} code`, 40);
      if (code !== null && !code.trim()) err(`Subject ${i + 1} has an empty code.`);
      else if (code !== null && subjects.some(x => x.code === code)) err(`Subject code "${code}" appears twice.`);
      if (!HEX_RE.test(s.color || '')) err(`Subject "${s.code}" has an invalid color (expected #rrggbb).`);
      if (!HEX_RE.test(s.textColor || '')) err(`Subject "${s.code}" has an invalid text color (expected #rrggbb).`);
      const fullName = s.fullName == null ? '' : str(s.fullName, `Subject "${s.code}" name`);
      if (code !== null && fullName !== null) subjects.push({ code, fullName, color: s.color, textColor: s.textColor });
    });

    // appearance
    const ap = d.appearance || {};
    let theme = 0, customGradient = null, exportFormat = 'iphone';
    if (ap.theme !== undefined && ap.theme !== null) {
      if (!Number.isInteger(ap.theme) || ap.theme < 0 || (opts.themeCount && ap.theme >= opts.themeCount)) err('Unknown wallpaper theme.');
      else theme = ap.theme;
    }
    if (ap.customGradient) {
      if (!Array.isArray(ap.customGradient) || ap.customGradient.length !== 3 || !ap.customGradient.every(c => HEX_RE.test(c || ''))) err('customGradient must be 3 hex colors.');
      else customGradient = ap.customGradient.slice();
    }
    if (ap.exportFormat !== undefined && ap.exportFormat !== null) {
      if (opts.formatKeys && !opts.formatKeys.includes(ap.exportFormat)) err(`Unknown export format "${String(ap.exportFormat).slice(0, 20)}".`);
      else exportFormat = ap.exportFormat;
    }

    // schedule entries
    const schedule = {};
    const list = d.schedule;
    if (!Array.isArray(list)) err('schedule must be a list of classes.');
    else if (list.length > LIMITS.entries) err(`Too many scheduled classes (max ${LIMITS.entries}).`);
    else if (timeSlots.length) {
      list.forEach((e, n) => {
        const label = `Class #${n + 1}`;
        if (!e || typeof e !== 'object') { err(`${label} is not an object.`); return; }
        if (!DAY_KEYS.includes(e.day)) { err(`${label}: unknown day "${String(e.day).slice(0, 20)}".`); return; }
        if (!Number.isInteger(e.slotIndex) || e.slotIndex < 0 || e.slotIndex >= timeSlots.length) {
          err(`${label} (${e.subject}, ${e.day}): slotIndex ${JSON.stringify(e.slotIndex)} is outside the ${timeSlots.length} time slots.`); return;
        }
        const span = e.span === undefined ? 1 : e.span;
        if (!Number.isInteger(span) || span < 1 || e.slotIndex + span > timeSlots.length) {
          err(`${label} (${e.subject}, ${e.day}): duration ${JSON.stringify(span)} does not fit in the day.`); return;
        }
        if (typeof e.subject !== 'string' || !subjects.some(s => s.code === e.subject)) {
          err(`${label}: subject "${String(e.subject).slice(0, 40)}" is not in the subject list.`); return;
        }
        const type = e.type === undefined ? 'Lecture' : str(e.type, `${label} type`, 50);
        const room = e.room === undefined ? '' : str(e.room, `${label} room`);
        const lecturer = e.lecturer === undefined ? '' : str(e.lecturer, `${label} lecturer`);
        if (type === null || room === null || lecturer === null) return;
        if (!schedule[e.day]) schedule[e.day] = new Array(timeSlots.length).fill(null);
        const entry = { subject: e.subject, type: type || 'Lecture', room, lecturer, span };
        const c = canPlace(schedule, timeSlots.length, e.day, e.slotIndex, span);
        if (!c.ok) { err(`${label} (${e.subject}, ${e.day}, ${timeSlots[e.slotIndex]}): ${c.reason.toLowerCase()} — classes overlap.`); return; }
        schedule[e.day][e.slotIndex] = entry;
        if (!activeDays.includes(e.day)) activeDays.push(e.day);
      });
    }

    if (errors.length) return fail();
    activeDays.sort((a, b) => DAY_KEYS.indexOf(a) - DAY_KEYS.indexOf(b));
    for (const day of activeDays) if (!schedule[day]) schedule[day] = new Array(timeSlots.length).fill(null);

    const meta = {};
    if (d.meta && typeof d.meta === 'object') {
      ['groupName', 'semester', 'footerText'].forEach(k => { if (typeof d.meta[k] === 'string') meta[k] = d.meta[k].slice(0, 300); });
      ['showHeader', 'showFooter'].forEach(k => { if (typeof d.meta[k] === 'boolean') meta[k] = d.meta[k]; });
      ['spacerTop', 'spacerBottom'].forEach(k => {
        const n = parseInt(d.meta[k], 10);
        if (!isNaN(n)) meta[k] = String(Math.max(0, Math.min(40, n)));
      });
    }
    return { ok: true, errors, state: { theme, customGradient, exportFormat, timeSlots, activeDays, subjects, schedule }, meta };
  }

  const api = {
    DAY_KEYS, FILE_APP, FILE_VERSION,
    normalizeEntry, normalizeSchedule, getOccupant, canPlace, maxSpan, removeSlotFromDay,
    entriesFromState, buildExport, migrateToV2, validateImport,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
