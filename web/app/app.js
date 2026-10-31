(() => {
  'use strict';

  const KEY = 'still-board-web-v1';
  const THEME_KEY = 'still-board-theme';
  const SECTIONS = [
    { key: 'now', name: 'Now', sub: "what you're carrying today", empty: 'Nothing here yet. What actually deserves today?' },
    { key: 'next', name: 'Next', sub: 'soon, but not today', empty: "Empty — and that's fine." },
    { key: 'nextweek', name: 'Next week', sub: 'the week ahead', empty: 'Nothing waiting for next week.' },
    { key: 'someday', name: 'Someday', sub: 'no pressure to act', empty: 'Room for the things that can wait.' },
  ];
  const PRIORITIES = ['Not urgent', 'Low', 'Somewhat', 'Urgent'];
  const $ = (id) => document.getElementById(id);
  let notes = [];
  let selectedFilter = 'all';
  let editingId = null;
  let showingDone = false;
  let toastTimer = null;
  let undo = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(validNote)) throw new Error('invalid');
      notes = parsed;
    } catch (_) {
      message('Saved notes could not be read. Your browser data was left untouched.');
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(notes));
      return true;
    } catch (_) {
      message('This browser could not save the change. Check available storage or browser settings.');
      return false;
    }
  }

  function commit(next, notice, previous) {
    const before = notes;
    notes = next;
    if (!save()) { notes = before; return false; }
    render();
    message(notice, previous ? () => { commit(previous, 'Undone.'); } : null);
    return true;
  }

  function validNote(n) {
    return n && typeof n === 'object' && typeof n.id === 'string' && n.id.length > 0 &&
      typeof n.text === 'string' && SECTIONS.some((s) => s.key === n.section) &&
      Number.isFinite(n.position) && Number.isFinite(n.createdAt) && Number.isFinite(n.updatedAt) &&
      (n.completedAt == null || Number.isFinite(n.completedAt)) &&
      (n.remindAt == null || Number.isFinite(n.remindAt));
  }

  function message(text, undoAction) {
    const toast = $('toast');
    clearTimeout(toastTimer);
    toast.replaceChildren(document.createTextNode(text));
    undo = undoAction;
    if (undoAction) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Undo';
      button.addEventListener('click', () => { const action = undo; undo = null; if (action) action(); });
      toast.append(button);
    }
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; undo = null; }, undoAction ? 6500 : 4500);
  }

  function active() { return notes.filter((n) => n.completedAt == null); }
  function nowCount(excludeId) { return active().filter((n) => n.section === 'now' && n.id !== excludeId).length; }
  function sorted(section, source = active()) { return source.filter((n) => n.section === section).sort((a, b) => a.position - b.position || a.createdAt - b.createdAt); }
  function matches(n) {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    if (selectedFilter === 'today') return n.createdAt >= midnight.getTime();
    if (selectedFilter === 'week') return n.createdAt >= midnight.getTime() - 6 * 86400000;
    if (selectedFilter === 'older') return n.createdAt < midnight.getTime() - 6 * 86400000;
    return true;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderNote(note, done = false) {
    const card = el('div', `note tint-${Math.abs(note.tint || 0) % 4} priority-${[0, 1, 2, 3].includes(note.priority) ? note.priority : 0}${done ? ' done-note' : ''}`);
    const check = el('button', 'check', done ? '↶' : '');
    check.type = 'button';
    check.setAttribute('aria-label', done ? `Restore ${note.text}` : `Mark ${note.text} done`);
    check.addEventListener('click', () => done ? restore(note.id) : complete(note.id));
    const main = el('button', 'note-main');
    main.type = 'button';
    main.textContent = note.text;
    main.setAttribute('aria-label', done ? note.text : `Edit ${note.text}`);
    if (!done) main.addEventListener('click', () => openDialog(note.id));
    else main.disabled = true;
    if (note.priority > 0) main.append(el('span', 'priority-label', PRIORITIES[note.priority]));
    card.append(check, main);
    if (!done) {
      const more = el('button', 'note-more', '⋯');
      more.type = 'button';
      more.setAttribute('aria-label', `Options for ${note.text}`);
      more.addEventListener('click', () => openDialog(note.id));
      card.append(more);
    }
    return card;
  }

  function render() {
    const current = active();
    const board = $('board');
    board.replaceChildren();
    const count = nowCount();
    $('subtitle').textContent = current.length ? `${count} in Now · ${current.length} on your board` : 'A little room to think.';
    const doneRecent = notes.filter((n) => n.completedAt != null && n.completedAt >= Date.now() - 30 * 86400000).sort((a, b) => b.completedAt - a.completedAt);
    $('done-count').textContent = doneRecent.length ? `(${doneRecent.length})` : '';
    $('done-toggle').setAttribute('aria-pressed', String(showingDone));
    board.hidden = showingDone;
    $('done-view').hidden = !showingDone;
    $('add-note').hidden = showingDone;
    document.querySelector('.filters').hidden = showingDone;
    $('filter-note').hidden = showingDone || selectedFilter === 'all';
    document.querySelector('.intro h1').textContent = showingDone ? 'What you cleared' : 'Your board';
    document.querySelector('.intro p').textContent = showingDone ? 'A quiet record of the last 30 days.' : "One place for everything you're carrying.";

    for (const section of SECTIONS) {
      const lane = el('section', 'lane');
      lane.setAttribute('aria-label', section.name);
      const head = el('div', 'section-heading');
      const words = el('div');
      words.append(el('h2', '', section.name), el('p', '', section.sub));
      const sectionCount = section.key === 'now' ? `${count} / 7` : String(sorted(section.key).length);
      head.append(words, el('span', `count${section.key === 'now' && count >= 7 ? ' full' : ''}`, sectionCount));
      lane.append(head);
      if (section.key === 'now') {
        const gauge = el('div', 'gauge');
        gauge.setAttribute('aria-label', `${count} of 7 places filled`);
        for (let i = 0; i < 7; i++) gauge.append(el('i', i < count ? 'on' : ''));
        lane.append(gauge);
      }
      const items = sorted(section.key).filter(matches);
      if (items.length) {
        const list = el('div', 'note-list');
        items.forEach((n) => list.append(renderNote(n)));
        lane.append(list);
      } else {
        const empty = el('div', 'empty');
        empty.append(el('p', '', selectedFilter === 'all' ? section.empty : 'No notes from this time here.'));
        if (selectedFilter === 'all') {
          const add = el('button', '', `Add to ${section.name}`);
          add.type = 'button'; add.addEventListener('click', () => openDialog(null, section.key)); empty.append(add);
        }
        lane.append(empty);
      }
      board.append(lane);
    }

    const doneList = $('done-list'); doneList.replaceChildren();
    if (!doneRecent.length) doneList.append(el('div', 'empty', 'Nothing cleared in the last 30 days.'));
    else {
      let lastDay = '';
      for (const n of doneRecent) {
        const day = new Date(n.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        if (day !== lastDay) doneList.append(el('h3', 'done-date', day));
        doneList.append(renderNote(n, true)); lastDay = day;
      }
    }
    document.querySelectorAll('.filter').forEach((button) => {
      const on = button.dataset.filter === selectedFilter;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  function openDialog(id = null, section = 'now') {
    const note = notes.find((n) => n.id === id);
    editingId = id;
    $('dialog-title').textContent = note ? 'Your note' : 'Write a note';
    $('note-text').value = note ? note.text : '';
    $('save-note').textContent = note ? 'Save note' : 'Add note';
    $('delete-note').hidden = !note;
    $('priority-wrap').hidden = !note;
    $('section-options').replaceChildren();
    $('priority-options').replaceChildren();
    const selectedSection = note ? note.section : section;
    for (const s of SECTIONS) {
      const label = el('label', `choice${s.key === selectedSection ? ' selected' : ''}`, s.name);
      const input = el('input', 'sr-only'); input.type = 'radio'; input.name = 'section'; input.value = s.key; input.checked = s.key === selectedSection;
      label.prepend(input); $('section-options').append(label);
    }
    if (note) for (let p = 0; p < PRIORITIES.length; p++) {
      const label = el('label', `choice${p === (note.priority || 0) ? ' selected' : ''}`, PRIORITIES[p]);
      const input = el('input', 'sr-only'); input.type = 'radio'; input.name = 'priority'; input.value = String(p); input.checked = p === (note.priority || 0);
      label.prepend(input); $('priority-options').append(label);
    }
    $('limit-message').hidden = true;
    $('note-dialog').showModal();
    $('note-text').focus();
  }

  function closeDialog() { $('note-dialog').close(); editingId = null; }
  function selected(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value; }
  function saveDialog(event) {
    event.preventDefault();
    const text = $('note-text').value.trim();
    if (!text) { $('note-text').focus(); return; }
    const section = selected('section');
    if (section === 'now' && nowCount(editingId) >= 7) { $('limit-message').hidden = false; return; }
    const now = Date.now();
    if (editingId) {
      const prior = notes.find((n) => n.id === editingId);
      const nextPosition = prior.section === section ? prior.position : Math.max(0, ...sorted(section).map((n) => n.position)) + 1000;
      const updated = { ...prior, text, section, position: nextPosition, priority: Number(selected('priority')), remindAt: section === 'now' ? prior.remindAt : null, updatedAt: now };
      if (!commit(notes.map((n) => n.id === editingId ? updated : n), 'Saved.')) return;
    } else {
      const id = crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random().toString(36).slice(2)}`;
      const created = { id, text, section, position: Math.max(0, ...sorted(section).map((n) => n.position)) + 1000, tint: Math.floor(Math.random() * 4), createdAt: now, updatedAt: now, completedAt: null, remindAt: null, priority: 0 };
      if (!commit([...notes, created], 'Added.')) return;
    }
    closeDialog();
  }

  function complete(id) {
    const before = notes.slice();
    commit(notes.map((n) => n.id === id ? { ...n, completedAt: Date.now(), remindAt: null, updatedAt: Date.now() } : n), 'Cleared.', before);
  }
  function restore(id) {
    const note = notes.find((n) => n.id === id);
    if (note.section === 'now' && nowCount() >= 7) { message('Now is full. Move or finish a note before restoring this one.'); return; }
    const before = notes.slice();
    commit(notes.map((n) => n.id === id ? { ...n, completedAt: null, updatedAt: Date.now() } : n), 'Back on the board.', before);
  }
  function remove(id) {
    const before = notes.slice();
    if (commit(notes.filter((n) => n.id !== id), 'Dropped.', before)) closeDialog();
  }

  function exportBackup() {
    const file = { app: 'still.', version: 1, exportedAt: Date.now(), notes };
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `board-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Backup downloaded.');
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.version !== 1 || !Array.isArray(data.notes) || !data.notes.every(validNote)) throw new Error('That file is not a valid still. backup.');
      const ids = new Set();
      for (const n of data.notes) { if (ids.has(n.id)) throw new Error('That backup lists the same note twice.'); ids.add(n.id); }
      const existing = new Set(notes.map((n) => n.id));
      const incoming = data.notes.filter((n) => !existing.has(n.id)).map((n) => ({ ...n, priority: [0, 1, 2, 3].includes(n.priority) ? n.priority : 0, tint: Number.isFinite(n.tint) ? n.tint : 0 }));
      const newNow = incoming.filter((n) => n.section === 'now' && n.completedAt == null).length;
      if (nowCount() + newNow > 7) throw new Error('That backup would put more than seven notes in Now. Move some current notes first.');
      if (!incoming.length) { message('All notes from that backup are already here.'); return; }
      commit([...notes, ...incoming], `${incoming.length} ${incoming.length === 1 ? 'note' : 'notes'} added from backup.`);
    } catch (error) { message(error.message || 'That backup could not be read.'); }
  }

  function theme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
    const dark = document.documentElement.dataset.theme === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
    $('theme-toggle').textContent = dark ? 'Light' : 'Dark';
    $('theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  }

  $('add-note').addEventListener('click', () => openDialog());
  $('done-toggle').addEventListener('click', () => { showingDone = !showingDone; render(); });
  $('theme-toggle').addEventListener('click', () => {
    const dark = $('theme-toggle').textContent === 'Light';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme); } catch (_) {}
    theme();
  });
  $('menu-toggle').addEventListener('click', () => { $('menu').hidden = !$('menu').hidden; $('menu-toggle').setAttribute('aria-expanded', String(!$('menu').hidden)); });
  $('export').addEventListener('click', exportBackup);
  $('import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', (event) => { void importBackup(event.target.files[0]); event.target.value = ''; });
  $('close-dialog').addEventListener('click', closeDialog);
  $('note-form').addEventListener('submit', saveDialog);
  $('delete-note').addEventListener('click', () => remove(editingId));
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { selectedFilter = button.dataset.filter; render(); }));
  document.querySelectorAll('.choice-row').forEach((row) => row.addEventListener('change', () => row.querySelectorAll('.choice').forEach((label) => label.classList.toggle('selected', label.querySelector('input').checked))));
  $('note-dialog').addEventListener('close', () => { editingId = null; });

  load(); theme(); render();
})();
