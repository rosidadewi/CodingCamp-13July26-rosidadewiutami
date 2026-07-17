/* ============================================================
   MY DASHBOARD — app.js
   MVP  : Greeting · Focus Timer · To-Do List · Quick Links
   Bonus: Light/Dark mode · Custom name · Change Pomodoro time
   ============================================================ */

'use strict';

/* ── LocalStorage helpers ─────────────────────────────────── */
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  },
};

/* ================================================================
   1. GREETING  — live clock/date + custom name + edit name modal
   ================================================================ */
const greetingEl  = document.getElementById('greeting');
const datetimeEl  = document.getElementById('datetime');
const nameModal   = document.getElementById('nameModal');
const nameInput   = document.getElementById('nameInput');
const nameSaveBtn = document.getElementById('nameSave');

function greetWord(hour) {
  if (hour <  12) return 'Good morning';
  if (hour <  17) return 'Good afternoon';
  if (hour <  21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now  = new Date();
  const name = store.get('userName', '');
  const word = greetWord(now.getHours());
  const tag  = name ? `, ${name}` : '';

  greetingEl.innerHTML =
    `${word}${tag}! <span class="hint">✏️ edit name</span>`;

  const datePart = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timePart = now.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  datetimeEl.textContent = `${datePart} · ${timePart}`;
}

// Open name modal on greeting click
greetingEl.addEventListener('click', () => {
  nameInput.value = store.get('userName', '');
  nameModal.classList.remove('hidden');
  nameInput.focus();
});

function saveName() {
  store.set('userName', nameInput.value.trim());
  nameModal.classList.add('hidden');
  updateClock();
}

nameSaveBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

// Show name prompt on very first visit
if (store.get('userName') === null) {
  nameModal.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 50);
}

updateClock();
setInterval(updateClock, 1000);


/* ================================================================
   2. LIGHT / DARK MODE  (Challenge #1)
   ================================================================ */
const themeToggleBtn = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set('theme', theme);
}

applyTheme(store.get('theme', 'light'));

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});


/* ================================================================
   3. FOCUS TIMER  — Start / Stop / Reset + custom duration (Challenge #3)
   ================================================================ */
const timerDisplay   = document.getElementById('timerDisplay');
const timerStartBtn  = document.getElementById('timerStart');
const timerStopBtn   = document.getElementById('timerStop');
const timerResetBtn  = document.getElementById('timerReset');
const timerStatusEl  = document.getElementById('timerStatus');
const editDurationBtn = document.getElementById('editDuration');
const durationEditor = document.getElementById('durationEditor');
const durationInput  = document.getElementById('durationInput');
const durationSaveBtn = document.getElementById('durationSave');

let timerDuration = store.get('timerDuration', 25); // minutes
let timeLeft      = timerDuration * 60;             // seconds
let timerInterval = null;
let timerRunning  = false;

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(secs) {
  return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeLeft);
  timerDisplay.classList.toggle('running', timerRunning);
  timerDisplay.classList.toggle('done', !timerRunning && timeLeft === 0);
  timerStartBtn.disabled = timerRunning || timeLeft === 0;
  timerStopBtn.disabled  = !timerRunning;
}

function startTimer() {
  if (timerRunning || timeLeft === 0) return;
  timerRunning = true;
  timerStatusEl.textContent = '⏱ Focus session in progress…';
  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStatusEl.textContent = '🎉 Session complete! Take a break.';
      renderTimer();
    }
  }, 1000);
  renderTimer();
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerStatusEl.textContent = '⏸ Paused.';
  renderTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timeLeft     = timerDuration * 60;
  timerStatusEl.textContent = '';
  renderTimer();
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click',  stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Duration editor (Challenge #3)
editDurationBtn.addEventListener('click', () => {
  durationEditor.classList.toggle('hidden');
  durationInput.value = timerDuration;
  if (!durationEditor.classList.contains('hidden')) durationInput.focus();
});

durationSaveBtn.addEventListener('click', () => {
  const val = parseInt(durationInput.value, 10);
  if (!val || val < 1 || val > 120) return;
  timerDuration = val;
  store.set('timerDuration', timerDuration);
  durationEditor.classList.add('hidden');
  resetTimer();
  timerStatusEl.textContent = `✅ Timer set to ${timerDuration} min.`;
});

durationInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') durationSaveBtn.click();
});

renderTimer();


/* ================================================================
   4. TO-DO LIST  — Add / Edit / Complete / Delete + localStorage
   ================================================================ */
const todoForm    = document.getElementById('todoForm');
const todoInput   = document.getElementById('todoInput');
const todoListEl  = document.getElementById('todoList');
const todoCountEl = document.getElementById('todoCount');

// Edit modal
const editModal    = document.getElementById('editModal');
const editInput    = document.getElementById('editInput');
const editSaveBtn  = document.getElementById('editSave');
const editCancelBtn = document.getElementById('editCancel');
let editingId = null;

let todos = store.get('todos', []);

function saveTodos() { store.set('todos', todos); }

function updateBadge() {
  const done  = todos.filter(t => t.done).length;
  const total = todos.length;
  todoCountEl.textContent = total === 0
    ? '0 tasks'
    : `${done} / ${total} done`;
}

function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    const li = document.createElement('li');
    li.className   = 'todo__empty';
    li.textContent = 'No tasks yet — add one above!';
    todoListEl.appendChild(li);
    updateBadge();
    return;
  }

  todos.forEach((task) => {
    const li = document.createElement('li');
    li.className  = `todo__item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'todo__checkbox';
    cb.checked   = task.done;
    cb.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
    cb.addEventListener('change', () => toggleTodo(task.id));

    // Text
    const span = document.createElement('span');
    span.className   = 'todo__text';
    span.textContent = task.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo__actions';

    const editBtn = document.createElement('button');
    editBtn.className   = 'todo__btn';
    editBtn.textContent = '✏️';
    editBtn.title       = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit: ${task.text}`);
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const delBtn = document.createElement('button');
    delBtn.className   = 'todo__btn';
    delBtn.textContent = '🗑';
    delBtn.title       = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete: ${task.text}`);
    delBtn.addEventListener('click', () => deleteTodo(task.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    todoListEl.appendChild(li);
  });

  updateBadge();
}

function addTodo(text) {
  const t = text.trim();
  if (!t) return;
  todos.push({ id: Date.now().toString(), text: t, done: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const task = todos.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function openEditModal(id) {
  const task = todos.find(t => t.id === id);
  if (!task) return;
  editingId       = id;
  editInput.value = task.text;
  editModal.classList.remove('hidden');
  editInput.focus();
}

function saveEdit() {
  const t = editInput.value.trim();
  if (!t || !editingId) return;
  const task = todos.find(item => item.id === editingId);
  if (task) task.text = t;
  saveTodos();
  renderTodos();
  closeEditModal();
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingId = null;
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
});

editSaveBtn.addEventListener('click', saveEdit);
editCancelBtn.addEventListener('click', closeEditModal);
editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
});

renderTodos();


/* ================================================================
   5. QUICK LINKS  — Add / Delete + localStorage
   ================================================================ */
const linkForm    = document.getElementById('linkForm');
const linkLabelEl = document.getElementById('linkLabel');
const linkUrlEl   = document.getElementById('linkUrl');
const linkListEl  = document.getElementById('linkList');

let links = store.get('quickLinks', []);

function saveLinks() { store.set('quickLinks', links); }

function faviconFor(url) {
  try { return `${new URL(url).origin}/favicon.ico`; }
  catch { return ''; }
}

function renderLinks() {
  linkListEl.innerHTML = '';

  if (links.length === 0) {
    const p = document.createElement('p');
    p.className   = 'link__empty';
    p.textContent = 'No links yet — add one above!';
    linkListEl.appendChild(p);
    return;
  }

  links.forEach((link) => {
    const item = document.createElement('div');
    item.className = 'link__item';

    const anchor = document.createElement('a');
    anchor.className = 'link__anchor';
    anchor.href      = link.url;
    anchor.target    = '_blank';
    anchor.rel       = 'noopener noreferrer';

    const src = faviconFor(link.url);
    if (src) {
      const img     = document.createElement('img');
      img.src       = src;
      img.className = 'link__favicon';
      img.alt       = '';
      img.onerror   = () => img.remove();
      anchor.appendChild(img);
    }
    anchor.appendChild(document.createTextNode(link.label));

    const delBtn = document.createElement('button');
    delBtn.className   = 'link__delete';
    delBtn.textContent = '✕';
    delBtn.title       = `Remove ${link.label}`;
    delBtn.setAttribute('aria-label', `Remove link: ${link.label}`);
    delBtn.addEventListener('click', () => deleteLink(link.id));

    item.append(anchor, delBtn);
    linkListEl.appendChild(item);
  });
}

function addLink(label, url) {
  const l = label.trim();
  let   u = url.trim();
  if (!l || !u) return false;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { new URL(u); } catch { return false; }
  links.push({ id: Date.now().toString(), label: l, url: u });
  saveLinks();
  renderLinks();
  return true;
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = addLink(linkLabelEl.value, linkUrlEl.value);
  if (ok) {
    linkLabelEl.value = '';
    linkUrlEl.value   = '';
  } else {
    linkUrlEl.style.borderColor = 'var(--danger)';
    setTimeout(() => { linkUrlEl.style.borderColor = ''; }, 1500);
  }
});

renderLinks();


/* ================================================================
   CLOSE MODALS ON BACKDROP CLICK
   ================================================================ */
[editModal, nameModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});
