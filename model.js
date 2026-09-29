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
  const LAYOUT_V = ['top', 'middle', 'bottom'];
  const LAYOUT_H = ['left', 'center', 'right'];
  const IMG_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
  const LIMITS = { image: 6000000,  slots: 12, subjects: 100, entries: 500, str: 200, maxErrors: 12 };

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

  function buildExport(state, meta, image) {
    return {
      app: FILE_APP,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      meta: meta || {},
      appearance: {
        theme: state.theme,
        customGradient: state.customGradient || null,
        exportFormat: state.exportFormat,
        layout: state.layout || undefined,
        background: state.background ? Object.assign({}, state.background, image ? { image } : {}) : undefined,
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
      appearance: { theme: legacy.theme, customGradient: legacy.customGradient, exportFormat: legacy.exportFormat, layout: st.layout, background: st.background },
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
    const fail = () => ({ ok: false, errors, state: null, meta: null, image: null });

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

    let layout;
    if (ap.layout !== undefined && ap.layout !== null) {
      if (typeof ap.layout !== 'object' || Array.isArray(ap.layout)) err('layout must be an object.');
      else {
        layout = {};
        for (const key of Object.keys(ap.layout)) {
          const l = ap.layout[key];
          if (opts.formatKeys && !opts.formatKeys.includes(key)) { err(`layout: unknown format "${key.slice(0, 20)}".`); continue; }
          if (!l || typeof l !== 'object') { err(`layout for "${key}" must be an object.`); continue; }
          const out = {};
          if (l.v !== undefined) { if (LAYOUT_V.includes(l.v)) out.v = l.v; else err(`layout "${key}": v must be ${LAYOUT_V.join(', ')}.`); }
          if (l.h !== undefined) { if (LAYOUT_H.includes(l.h)) out.h = l.h; else err(`layout "${key}": h must be ${LAYOUT_H.join(', ')}.`); }
          if (l.offset !== undefined) { if (Number.isFinite(l.offset) && Math.abs(l.offset) <= 2000) out.offset = Math.round(l.offset); else err(`layout "${key}": offset must be a number between -2000 and 2000.`); }
          if (l.width !== undefined) { if (Number.isFinite(l.width) && l.width >= 40 && l.width <= 100) out.width = Math.round(l.width); else err(`layout "${key}": width must be 40–100.`); }
          layout[key] = out;
        }
      }
    }

    let background, image;
    if (ap.background !== undefined && ap.background !== null) {
      const b = ap.background;
      if (typeof b !== 'object' || Array.isArray(b)) err('background must be an object.');
      else {
        background = {};
        if (b.mode !== undefined) { if (b.mode === 'gradient' || b.mode === 'photo') background.mode = b.mode; else err('background mode must be "gradient" or "photo".'); }
        [['dim', 0, 100], ['blur', 0, 40], ['frost', 0, 100]].forEach(([k, lo, hi]) => {
          if (b[k] === undefined) return;
          if (Number.isFinite(b[k]) && b[k] >= lo && b[k] <= hi) background[k] = b[k]; else err(`background ${k} must be ${lo}\u2013${hi}.`);
        });
        if (b.blobs !== undefined) { if (typeof b.blobs === 'boolean') background.blobs = b.blobs; else err('background blobs must be true or false.'); }
        if (b.focus !== undefined) {
          if (!b.focus || typeof b.focus !== 'object' || Array.isArray(b.focus)) err('background focus must be an object.');
          else {
            background.focus = {};
            for (const key of Object.keys(b.focus)) {
              const f = b.focus[key];
              if (opts.formatKeys && !opts.formatKeys.includes(key)) { err(`background focus: unknown format "${key.slice(0, 20)}".`); continue; }
              if (!f || typeof f !== 'object') { err(`background focus for "${key}" must be an object.`); continue; }
              const o = {};
              [['x', 0, 100], ['y', 0, 100], ['zoom', 100, 300]].forEach(([k, lo, hi]) => {
                if (f[k] === undefined) return;
                if (Number.isFinite(f[k]) && f[k] >= lo && f[k] <= hi) o[k] = f[k]; else err(`background focus "${key}" ${k} must be ${lo}\u2013${hi}.`);
              });
              background.focus[key] = o;
            }
          }
        }
        if (b.image !== undefined) {
          if (typeof b.image !== 'string' || b.image.length > LIMITS.image || !IMG_RE.test(b.image)) err('The background image is not a valid JPEG, PNG or WebP (or is too large).');
          else image = b.image;
        }
        if (background.mode === 'photo' && !image && !opts.allowMissingImage) err('The file selects a photo background but does not contain the photo.');
      }
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
    return { ok: true, errors, state: Object.assign({ theme, customGradient, exportFormat, timeSlots, activeDays, subjects, schedule }, layout ? { layout } : {}, background ? { background } : {}), meta, image };
  }


  /* ══════════════════════════════════════
     UiTM  (https://cdn.uitm.link/jadual/baru/{matric}.json)
     { "2026-10-05": { hari: "Monday", jadual: [{ course_desc, courseid, groups, masa: "16:00 PM - 18:00 PM", bilik }] } }
     One entry per calendar date; collapsed here into a weekly timetable.
     ══════════════════════════════════════ */
  const DAY_NAMES = {
    sunday: 'sun', ahad: 'sun', monday: 'mon', isnin: 'mon', tuesday: 'tue', selasa: 'tue',
    wednesday: 'wed', rabu: 'wed', thursday: 'thu', khamis: 'thu', friday: 'fri', jumaat: 'fri',
    saturday: 'sat', sabtu: 'sat',
  };

  /** "16:00 PM" | "8:00 AM" | "14:30" -> { minutes, label:"04:00 PM" } or null */
  function parseTimeLabel(text) {
    const m = /(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i.exec(String(text || ''));
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    const ap = (m[3] || '').toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;             // "02:00 PM"
    if (ap === 'AM' && h === 12) h = 0;
    const suffix = h >= 12 ? 'PM' : 'AM';           // "16:00 PM" is really 4 PM
    const h12 = h % 12 || 12;
    return { minutes: h * 60 + min, label: String(h12).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ' ' + suffix };
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  /** Deterministic, well-spread subject colors: { color, textColor } */
  function pickSubjectColors(i) {
    const hue = (260 + i * 137.508) % 360;
    return { color: hslToHex(hue, 65, 52), textColor: hslToHex(hue, 85, 93) };
  }

  function titleCase(text) {
    return String(text || '').toLowerCase().replace(/[a-z][a-z']*/g, w =>
      /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1));
  }

  /**
   * Convert the UiTM response.  Returns { ok, errors[], warnings[], data, summary }.
   * `data` is the v2 file shape (no appearance), ready for validateImport().
   */
  function convertUitm(json) {
    const errors = [], warnings = [];
    const fail = m => { errors.push(m); return { ok: false, errors, warnings, data: null, summary: null }; };
    if (!json || typeof json !== 'object' || Array.isArray(json)) return fail('The server did not return a timetable.');
    const dates = Object.keys(json).filter(k => json[k] && typeof json[k] === 'object' && Array.isArray(json[k].jadual));
    if (!dates.length) return fail('No classes were found for this student.');
    dates.sort();

    // 1. rows per date -> signature per weekday; keep the most common week pattern
    const byDay = {};                                   // day -> Map(signature -> { count, rows, lastDate })
    let skipped = 0;
    dates.forEach(date => {
      const dayKey = DAY_NAMES[String(json[date].hari || '').trim().toLowerCase()];
      if (!dayKey) { warnings.push(`Skipped ${date}: unknown day "${json[date].hari}".`); return; }
      const rows = [];
      json[date].jadual.forEach(r => {
        const t = r && parseTimeLabel(String(r.masa || '').split('-')[0]);
        if (!r || !r.courseid || !t) { skipped++; return; }
        rows.push({ courseid: String(r.courseid).trim(), desc: String(r.course_desc || '').trim(), groups: String(r.groups || '').trim(), room: String(r.bilik || '').trim(), t });
      });
      rows.sort((a, b) => a.t.minutes - b.t.minutes || a.courseid.localeCompare(b.courseid));
      const sig = JSON.stringify(rows.map(r => [r.courseid, r.t.minutes, r.room]));
      byDay[dayKey] = byDay[dayKey] || new Map();
      const cur = byDay[dayKey].get(sig) || { count: 0, rows, lastDate: date };
      cur.count++; cur.lastDate = date;
      byDay[dayKey].set(sig, cur);
    });
    if (skipped) warnings.push(`${skipped} row(s) had no usable course or time and were skipped.`);

    const chosen = {};
    for (const day of Object.keys(byDay)) {
      const best = [...byDay[day].values()].sort((a, b) => b.count - a.count || (a.lastDate < b.lastDate ? 1 : -1))[0];
      if (byDay[day].size > 1) warnings.push(`${day.toUpperCase()}: classes differ between weeks — using the most common week.`);
      chosen[day] = best.rows;
    }
    const activeDays = DAY_KEYS.filter(d => chosen[d] && chosen[d].length);
    if (!activeDays.length) return fail('No classes were found for this student.');

    // 2. time slots = unique start times
    const slotMap = new Map();
    activeDays.forEach(d => chosen[d].forEach(r => slotMap.set(r.t.minutes, r.t.label)));
    const minutes = [...slotMap.keys()].sort((a, b) => a - b);
    const timeSlots = minutes.map(m => slotMap.get(m));

    // 3. subjects + entries
    const subjects = [], groupCount = {}, entries = [], taken = new Set();
    activeDays.forEach(d => chosen[d].forEach(r => {
      if (!subjects.some(s => s.code === r.courseid)) {
        subjects.push(Object.assign({ code: r.courseid, fullName: titleCase(r.desc) }, pickSubjectColors(subjects.length)));
      }
      groupCount[r.groups] = (groupCount[r.groups] || 0) + 1;
      const slotIndex = minutes.indexOf(r.t.minutes);
      const id = d + ':' + slotIndex;
      if (taken.has(id)) { warnings.push(`${r.courseid} clashes with another class on ${d.toUpperCase()} at ${r.t.label} — skipped.`); return; }
      taken.add(id);
      entries.push({ day: d, slotIndex, span: 1, subject: r.courseid, type: 'Lecture', room: r.room, lecturer: '' });
    }));
    const groupName = Object.entries(groupCount).filter(e => e[0]).sort((a, b) => b[1] - a[1])[0];

    return {
      ok: true, errors, warnings,
      data: {
        app: FILE_APP, version: FILE_VERSION,
        meta: groupName ? { groupName: groupName[0] } : {},
        timeSlots, activeDays, subjects, schedule: entries,
      },
      summary: { dates: dates.length, firstDate: dates[0], lastDate: dates[dates.length - 1], classes: entries.length, groupName: groupName ? groupName[0] : '' },
    };
  }

  /** Default block position per export format. Phones/tablet start below the lock-screen clock area. */
  function defaultLayout(formatKey) {
    const tall = formatKey === 'iphone' || formatKey === 'ipad';
    return { v: 'top', offset: tall ? 280 : 0, h: 'center', width: 100 };
  }

  const api = {
    DAY_KEYS, FILE_APP, FILE_VERSION,
    normalizeEntry, normalizeSchedule, getOccupant, canPlace, maxSpan, removeSlotFromDay,
    entriesFromState, buildExport, migrateToV2, validateImport,
    convertUitm, parseTimeLabel, pickSubjectColors, defaultLayout, LAYOUT_V, LAYOUT_H,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
