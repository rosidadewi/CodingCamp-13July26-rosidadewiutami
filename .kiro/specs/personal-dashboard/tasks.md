# Implementation Plan: Personal Dashboard

## Overview

Implementasi dilakukan secara inkremental dalam satu file HTML, satu CSS, dan satu JS murni (Vanilla JavaScript, tanpa framework, tanpa npm). Setiap tugas membangun di atas tugas sebelumnya dan diakhiri dengan penyambungan seluruh komponen. Property-based test menggunakan `fast-check` (dimuat via CDN dalam file test terpisah `tests/pbt.html`) dan berjalan di browser tanpa build step.

---

## Tasks

- [~] 1. Siapkan struktur proyek dan kerangka HTML/CSS/JS dasar
  - [ ] 1.1 Verifikasi dan lengkapi `index.html` — pastikan semua elemen dengan id yang direferensikan `app.js` sudah ada (`#greeting`, `#datetime`, `#nameModal`, `#nameInput`, `#nameSave`, `#themeToggle`, `#timerDisplay`, `#timerStart`, `#timerStop`, `#timerReset`, `#timerStatus`, `#editDuration`, `#durationEditor`, `#durationInput`, `#durationSave`, `#todoForm`, `#todoInput`, `#todoList`, `#todoCount`, `#editModal`, `#editInput`, `#editSave`, `#editCancel`, `#linkForm`, `#linkLabel`, `#linkUrl`, `#linkList`)
    - Pastikan `lang="id"` dan `data-theme="light"` ada pada `<html>`
    - Tambahkan `<script src="js/app.js" defer></script>` di akhir `<body>` jika belum ada
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 1.2 Verifikasi dan lengkapi `css/style.css` — pastikan semua design token (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`, `--primary`, `--danger`, `--success`), selector dark mode (`[data-theme="dark"]`), dan semua class widget sudah terdefinisi
    - Pastikan transisi CSS ada pada `body`, `.card`, `.btn`, `.input` dengan durasi 150–300ms
    - Pastikan layout responsif (`@media (max-width: 600px)`) ada
    - _Requirements: 3.6, 9.1, 9.4, 9.5_
  - [ ] 1.3 Buat file `tests/pbt.html` sebagai test runner browser untuk property-based tests
    - Muat `fast-check` via CDN: `<script src="https://cdn.jsdelivr.net/npm/fast-check/lib/bundle/fast-check.min.js"></script>`
    - Siapkan struktur dasar: `<pre id="output"></pre>` untuk log hasil test
    - Tulis helper `runTest(name, fn)` yang menangkap pass/fail dan menampilkan hasilnya ke `#output`
    - _Requirements: 8.1_

- [ ] 2. Implementasi modul `store` (LocalStorage helper)
  - [ ] 2.1 Tulis objek `store` dengan metode `get(key, fallback)` dan `set(key, value)` di `js/app.js`
    - `get`: baca LocalStorage, parse JSON, kembalikan `fallback` jika key tidak ada atau JSON rusak (`try/catch` di sekitar `JSON.parse`)
    - `set`: serialisasi value ke JSON, tulis ke LocalStorage; tangkap semua exception (quota, SecurityError) secara diam-diam tanpa melempar ulang
    - _Requirements: 8.5, 8.7_
  - [ ]* 2.2 Tulis property test untuk Property 19 — round-trip store.set/get untuk nilai JSON arbitrer
    - **Property 19: `store.set/get` round-trip untuk nilai JSON-serializable**
    - **Validates: Requirements 8.5**
    - Di `tests/pbt.html`, buat arbitrary untuk primitive (number, string, boolean, null), array, dan plain object
    - Jalankan `fc.assert(fc.property(fc.jsonValue(), (v) => { store.set('_test', v); return deepEqual(store.get('_test', null), v); }))`
  - [ ]* 2.3 Tulis property test untuk Property 20 — `store.set` menangani error secara diam-diam
    - **Property 20: `store.set` tidak melempar exception saat `localStorage.setItem` gagal**
    - **Validates: Requirements 8.7**
    - Mock `localStorage.setItem` agar selalu throw; panggil `store.set`; verifikasi tidak ada exception yang terlempar ke pemanggil
    - Restore mock setelah test

- [ ] 3. Implementasi modul Greeting dan Clock
  - [ ] 3.1 Tulis fungsi `greetWord(hour)` dan `updateClock()` di `js/app.js`
    - `greetWord`: kembalikan "Selamat Pagi" (0–11), "Selamat Siang" (12–16), "Selamat Sore" (17–20), "Selamat Malam" (21–23)
    - `updateClock`: baca `store.get('userName','')`, gabungkan salam + nama (format `"Selamat Pagi, Rosi!"` atau `"Selamat Pagi!"`), tampilkan di `#greeting`; format tanggal lokal Indonesia (`weekday:'long', year:'numeric', month:'long', day:'numeric'`) di `#datetime`; tambahkan `HH:MM:SS` (format 24 jam, `hour12:false`)
    - Panggil `updateClock()` sekali saat load; jalankan `setInterval(updateClock, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.6, 2.7_
  - [ ]* 3.2 Tulis property test untuk Property 1 — cakupan rentang waktu `greetWord` exhaustif
    - **Property 1: `greetWord(hour)` — exhaustive time-range coverage**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - `fc.assert(fc.property(fc.integer({min:0, max:23}), (h) => ['Selamat Pagi','Selamat Siang','Selamat Sore','Selamat Malam'].includes(greetWord(h))))`
    - Verifikasi pula bahwa setiap jam menghasilkan tepat satu salam (tidak ada overlap)
  - [ ]* 3.3 Tulis property test untuk Property 5 — nama pengguna muncul dalam teks salam
    - **Property 5: nama pengguna selalu muncul sebagai substring dalam output `updateClock`**
    - **Validates: Requirements 2.6**
    - Untuk setiap string non-kosong `n`: set `store.set('userName', n)`, panggil `updateClock()`, periksa `greetingEl.textContent.includes(n)`

- [ ] 4. Implementasi modul Custom Name (modal nama)
  - [ ] 4.1 Tulis event listener untuk modal nama di `js/app.js`
    - Klik `#greeting` → isi `#nameInput` dengan nilai tersimpan, tampilkan modal (hapus class `hidden`)
    - Saat halaman pertama dimuat: jika `store.get('userName') === null`, tampilkan modal otomatis
    - Fungsi `saveName()`: trim nilai input; jika non-kosong: `store.set('userName', trimmed)`, tutup modal, panggil `updateClock()`; jika kosong/spasi: modal tetap terbuka, tidak menyimpan
    - Hubungkan `saveName` ke klik `#nameSave` dan `keydown Enter` pada `#nameInput`
    - Klik backdrop modal (`e.target === modal`) menutup modal tanpa menyimpan
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8_
  - [ ]* 4.2 Tulis property test untuk Property 3 — round-trip persistensi nama pengguna
    - **Property 3: round-trip `store.set/get` untuk `userName`**
    - **Validates: Requirements 2.3, 2.8**
    - `fc.assert(fc.property(fc.string({minLength:1}).map(s => s.trim()).filter(s => s.length > 0), (s) => { store.set('userName', s); return store.get('userName','') === s; }))`
  - [ ]* 4.3 Tulis property test untuk Property 4 — nama berisi spasi saja ditolak
    - **Property 4: input yang hanya berisi whitespace tidak mengubah `userName` tersimpan**
    - **Validates: Requirements 2.4**
    - Buat arbitrary string yang `trim()` menghasilkan string kosong (spaces, tabs, newlines)
    - Simpan nilai awal `userName`; panggil logika `saveName` dengan input whitespace-only; verifikasi `store.get('userName','')` tidak berubah

- [ ] 5. Implementasi modul Theme (light/dark toggle)
  - [ ] 5.1 Tulis fungsi `applyTheme(theme)` dan event listener `#themeToggle` di `js/app.js`
    - `applyTheme('light'|'dark')`: set `document.documentElement.setAttribute('data-theme', theme)`, update ikon tombol (🌙 untuk light → dark, ☀️ untuk dark → light), panggil `store.set('theme', theme)`
    - Saat load: `applyTheme(store.get('theme', 'light'))`
    - Klik `#themeToggle`: baca `data-theme` saat ini, toggle, panggil `applyTheme`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 5.2 Tulis property test untuk Property 6 — theme toggle adalah involusi
    - **Property 6: `applyTheme` double-toggle mengembalikan nilai awal**
    - **Validates: Requirements 3.2, 3.3**
    - `fc.assert(fc.property(fc.constantFrom('light','dark'), (t) => { applyTheme(t); const opp = t==='dark'?'light':'dark'; applyTheme(opp); applyTheme(t); return document.documentElement.getAttribute('data-theme')===t && store.get('theme','light')===t; }))`

- [ ] 6. Implementasi modul Focus Timer
  - [ ] 6.1 Tulis fungsi `pad(n)`, `formatTime(secs)`, state timer, dan fungsi `renderTimer()` di `js/app.js`
    - `pad(n)`: `String(n).padStart(2,'0')`
    - `formatTime(secs)`: kembalikan `${pad(Math.floor(secs/60))}:${pad(secs%60)}`
    - State: `timerDuration` (dari store, default 25), `timeLeft = timerDuration * 60`, `timerInterval = null`, `timerRunning = false`
    - `renderTimer()`: update `#timerDisplay`, toggle class `running`/`done`, set `disabled` pada tombol Start (saat running atau `timeLeft===0`) dan Stop (saat tidak running)
    - _Requirements: 4.1, 4.8, 4.9, 4.10_
  - [ ]* 6.2 Tulis property test untuk Property 2 — format display MM:SS selalu valid
    - **Property 2: `formatTime(secs)` selalu menghasilkan string berformat `^\d{2}:\d{2}$`**
    - **Validates: Requirements 1.1, 4.1**
    - `fc.assert(fc.property(fc.nat(), (secs) => /^\d{2}:\d{2}$/.test(formatTime(secs))))`
  - [ ] 6.3 Tulis fungsi `startTimer()`, `stopTimer()`, `resetTimer()` dan hubungkan ke tombol
    - `startTimer()`: guard (`timerRunning || timeLeft===0`), set `timerRunning=true`, set status "Sesi fokus sedang berlangsung", mulai `setInterval` 1 detik; saat `timeLeft<=0` stop dan tampilkan "Sesi selesai! Istirahat sejenak."
    - `stopTimer()`: guard (!timerRunning), `clearInterval`, `timerRunning=false`, status "Dijeda"
    - `resetTimer()`: `clearInterval`, `timerRunning=false`, `timeLeft=timerDuration*60`, hapus status, panggil `renderTimer()`
    - Event: `#timerStart click` → `startTimer()`, `#timerStop click` → `stopTimer()`, `#timerReset click` → `resetTimer()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 6.4 Tulis property test untuk Property 17 — reset timer mengembalikan durasi penuh
    - **Property 17: `resetTimer()` selalu menghasilkan `timeLeft === timerDuration * 60`**
    - **Validates: Requirements 4.5, 5.3, 5.4**
    - `fc.assert(fc.property(fc.integer({min:1, max:120}), (d) => { timerDuration=d; resetTimer(); return timeLeft===d*60; }))`
  - [ ] 6.5 Tulis editor durasi Pomodoro (Challenge #3) — fungsi validasi dan event listener
    - Klik `#editDuration`: toggle visibilitas `#durationEditor`, isi `#durationInput` dengan nilai saat ini
    - Fungsi `saveDuration()`: `parseInt` input; jika `val<1 || val>120 || isNaN(val)`: tampilkan indikator error pada input dan return tanpa menyimpan; jika valid: `timerDuration=val`, `store.set('timerDuration', val)`, tutup editor, panggil `resetTimer()`
    - Hubungkan ke klik `#durationSave` dan `Enter` pada `#durationInput`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  - [ ]* 6.6 Tulis property test untuk Property 18 — durasi di luar rentang ditolak
    - **Property 18: durasi di luar 1–120 tidak disimpan**
    - **Validates: Requirements 5.8**
    - `fc.assert(fc.property(fc.oneof(fc.integer({max:0}), fc.integer({min:121})), (d) => { const prev=timerDuration; /* call validation logic */ saveDuration(d); return timerDuration===prev && store.get('timerDuration',25)!==d; }))`

- [ ] 7. Checkpoint — Uji modul store, clock, theme, dan timer
  - Pastikan semua test di `tests/pbt.html` untuk Property 1, 2, 6, 17, 18, 19, 20 lulus.
  - Pastikan timer berjalan dan berhenti dengan benar di `index.html`, tema bisa di-toggle, dan nama tersimpan persisten setelah reload halaman.
  - Pastikan semua tests pass, tanya kepada user jika ada pertanyaan.

- [ ] 8. Implementasi modul To-Do List
  - [ ] 8.1 Tulis state, `saveTodos()`, `updateBadge()`, `renderTodos()`, dan `addTodo(text)` di `js/app.js`
    - State: `todos = store.get('todos', [])`, `editingId = null`
    - `saveTodos()`: `store.set('todos', todos)`
    - `updateBadge()`: hitung `done` dan `total`; tulis ke `#todoCount` format `"{done} / {total} selesai"` (jika total=0: `"0 tasks"`)
    - `renderTodos()`: bersihkan `#todoList`, tampilkan "Belum ada tugas. Tambahkan di atas!" jika kosong; untuk tiap task buat `<li>` dengan checkbox, teks (class `done` jika `task.done`), tombol edit dan hapus; panggil `updateBadge()`
    - `addTodo(text)`: trim, guard kosong, buat Task `{id: Date.now().toString(), text:trimmed, done:false}`, push, `saveTodos()`, `renderTodos()`
    - Event: submit `#todoForm` → `addTodo(todoInput.value)`, reset input
    - _Requirements: 6.1, 6.2, 6.11, 6.12_
  - [ ]* 8.2 Tulis property test untuk Property 7 — penambahan tugas valid menambah panjang array tepat 1
    - **Property 7: `addTodo(text)` menambah `todos.length` sebesar 1 untuk teks non-kosong**
    - **Validates: Requirements 6.1**
    - `fc.assert(fc.property(fc.string({minLength:1}).filter(s=>s.trim().length>0), (text) => { const before=todos.length; addTodo(text); return todos.length===before+1 && todos[todos.length-1].done===false; }))`
  - [ ]* 8.3 Tulis property test untuk Property 8 — teks berisi spasi saja tidak menambah tugas
    - **Property 8: `addTodo(text)` tidak mengubah array untuk teks whitespace-only**
    - **Validates: Requirements 6.2**
    - Buat arbitrary string yang `trim()` menghasilkan `""`; verifikasi `todos.length` tidak berubah
  - [ ]* 8.4 Tulis property test untuk Property 12 — badge kemajuan selalu akurat
    - **Property 12: teks badge selalu mencerminkan `done/total` dengan tepat**
    - **Validates: Requirements 6.11**
    - Buat arbitrary array Task; set `todos` ke array tersebut; panggil `updateBadge()`; baca `#todoCount.textContent`; verifikasi cocok dengan format yang dihitung manual
  - [ ] 8.5 Tulis `toggleTodo(id)`, `deleteTodo(id)`, `openEditModal(id)`, `saveEdit()`, `closeEditModal()` di `js/app.js`
    - `toggleTodo(id)`: cari task, flip `done`, `saveTodos()`, `renderTodos()`
    - `deleteTodo(id)`: filter, `saveTodos()`, `renderTodos()`
    - `openEditModal(id)`: set `editingId`, isi `#editInput`, tampilkan `#editModal`
    - `saveEdit()`: trim input, guard kosong/null editingId, update `task.text`, `saveTodos()`, `renderTodos()`, `closeEditModal()`
    - `closeEditModal()`: tambahkan class `hidden` pada `#editModal`, reset `editingId`
    - Event: klik `#editSave` → `saveEdit()`, klik `#editCancel` → `closeEditModal()`, `Enter`/`Escape` pada `#editInput`
    - Event backdrop: klik backdrop `#editModal` menutup modal
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [ ]* 8.6 Tulis property test untuk Property 9 — toggle done adalah involusi
    - **Property 9: `toggleTodo(id)` dua kali mengembalikan `done` ke nilai semula**
    - **Validates: Requirements 6.6, 6.7**
    - Tambahkan task uji; catat nilai `done` awal; panggil `toggleTodo` dua kali; verifikasi `done` kembali ke nilai awal
  - [ ]* 8.7 Tulis property test untuk Property 10 — penghapusan tugas menghapus tepat satu task
    - **Property 10: `deleteTodo(id)` mengurangi `todos.length` sebesar 1 dan tidak ada id yang tersisa**
    - **Validates: Requirements 6.8**
    - `fc.assert(fc.property(fc.nat({max:9}), (idx) => { /* setup array, pick id, delete, verify */ }))`
  - [ ]* 8.8 Tulis property test untuk Property 11 — round-trip persistensi array todos
    - **Property 11: `store.set/get` untuk array Task mempertahankan struktur secara penuh**
    - **Validates: Requirements 6.9, 6.10**
    - Buat arbitrary array Task objects; `store.set('todos', arr)`; bandingkan `store.get('todos',[])` dengan nilai asli menggunakan deep equality

- [ ] 9. Implementasi modul Quick Links
  - [ ] 9.1 Tulis state, `saveLinks()`, `faviconFor(url)`, `renderLinks()`, `addLink(label, url)`, dan `deleteLink(id)` di `js/app.js`
    - State: `links = store.get('quickLinks', [])`
    - `saveLinks()`: `store.set('quickLinks', links)`
    - `faviconFor(url)`: `try { return new URL(url).origin + '/favicon.ico'; } catch { return ''; }`
    - `renderLinks()`: bersihkan `#linkList`, tampilkan "Belum ada tautan. Tambahkan di atas!" jika kosong; untuk tiap link buat anchor dengan `target="_blank" rel="noopener noreferrer"`, favicon img dengan `onerror = () => img.remove()`, tombol hapus
    - `addLink(label, url)`: trim label dan url, guard kosong; prepend `https://` jika tidak ada skema `http://` atau `https://`; `try { new URL(u) } catch { return false }`; push link baru, `saveLinks()`, `renderLinks()`, return true
    - `deleteLink(id)`: filter, `saveLinks()`, `renderLinks()`
    - Event: submit `#linkForm` → `addLink(...)`: jika false set `linkUrlEl.style.borderColor='var(--danger)'` selama 1500ms
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_
  - [ ]* 9.2 Tulis property test untuk Property 13 — URL yang valid selalu disimpan sebagai URL absolut
    - **Property 13: `addLink` menyimpan URL yang selalu diawali `http://` atau `https://`**
    - **Validates: Requirements 7.1, 7.2**
    - Buat arbitrary URL valid (dengan dan tanpa skema); panggil `addLink`; verifikasi `links[links.length-1].url` cocok dengan `/^https?:\/\//`
  - [ ]* 9.3 Tulis property test untuk Property 14 — URL tidak valid ditolak
    - **Property 14: `addLink` mengembalikan false untuk URL yang tidak dapat diparsing**
    - **Validates: Requirements 7.3**
    - Buat arbitrary string yang tidak bisa diparsing bahkan setelah prepend `https://` (misal: `"not a url !!"`); verifikasi `addLink` return `false` dan `links.length` tidak berubah
  - [ ]* 9.4 Tulis property test untuk Property 15 — penghapusan link menghapus tepat satu link
    - **Property 15: `deleteLink(id)` mengurangi `links.length` sebesar 1 dan menghapus id yang tepat**
    - **Validates: Requirements 7.5**
    - Mirip dengan Property 10 tapi untuk array links
  - [ ]* 9.5 Tulis property test untuk Property 16 — round-trip persistensi array links
    - **Property 16: `store.set/get` untuk array Link mempertahankan struktur secara penuh**
    - **Validates: Requirements 7.6, 7.7**
    - Buat arbitrary array Link objects; `store.set('quickLinks', arr)`; bandingkan `store.get('quickLinks',[])` dengan nilai asli

- [ ] 10. Penyambungan akhir dan penyempurnaan
  - [ ] 10.1 Pastikan urutan inisialisasi di `js/app.js` sudah benar — semua modul diinisialisasi dalam urutan: store → clock (greetWord, updateClock, setInterval) → custom name (first-visit check) → theme (applyTheme) → timer (renderTimer) → todos (renderTodos) → links (renderLinks) → backdrop modal listeners
    - Pastikan tidak ada referensi DOM sebelum elemen tersedia (gunakan script di akhir `<body>` atau `defer`)
    - Pastikan `'use strict'` ada di baris pertama
    - _Requirements: 8.1, 8.3, 8.4, 9.3_
  - [ ] 10.2 Pastikan seluruh teks UI berbahasa Indonesia yang sesuai — salam (`greetWord`), status timer, pesan kosong todo/link, format tanggal (`'id-ID'` locale), format badge
    - Ganti string bahasa Inggris yang tersisa: "Good morning/afternoon/evening/night" → "Selamat Pagi/Siang/Sore/Malam", "No tasks yet" → "Belum ada tugas. Tambahkan di atas!", "No links yet" → "Belum ada tautan. Tambahkan di atas!", "Paused" → "Dijeda", "Focus session in progress" → "Sesi fokus sedang berlangsung", "Session complete!" → "Sesi selesai! Istirahat sejenak."
    - Ganti `toLocaleDateString(undefined, ...)` → `toLocaleDateString('id-ID', ...)`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 4.4, 4.7, 4.10, 6.12, 7.9_
  - [ ] 10.3 Verifikasi aksesibilitas minimal — pastikan semua elemen interaktif memiliki atribut `aria-label` atau teks terlihat; pastikan semua modal memiliki `role="dialog"` dan `aria-modal="true"`; pastikan timer display memiliki `aria-live="polite"`
    - _Requirements: 9.1_

- [ ] 11. Checkpoint akhir — Jalankan seluruh property test dan smoke test
  - Buka `tests/pbt.html` di browser dan verifikasi semua 20 property test lulus (Property 1–20).
  - Buka `index.html` dan lakukan smoke test manual: tambah tugas → reload (data muncul kembali); ganti tema → reload (tema bertahan); simpan nama → reload (nama muncul di salam); atur durasi timer → verifikasi reset ke durasi baru.
  - Pastikan semua tests pass, tanya kepada user jika ada pertanyaan.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan nomor requirement spesifik untuk keterlacakan
- Property test menggunakan `fast-check` dimuat via CDN di `tests/pbt.html`, tanpa npm/build step
- Unit test berbasis contoh (greeting format, date format, timer state machine, badge edge cases) cukup dilakukan manual atau ditambahkan ke `tests/pbt.html` sebagai test biasa
- Fungsi `greetWord`, `formatTime`, `pad`, `addTodo`, `toggleTodo`, `deleteTodo`, `addLink`, `deleteLink`, `store.get`, `store.set` harus dapat diakses dari `tests/pbt.html` — ekspos melalui `window` atau simpan referensinya di object global `App` sebelum file test dimuat

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1", "5.1", "6.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.2", "6.2", "6.3"] },
    { "id": 5, "tasks": ["6.4", "6.5", "8.1"] },
    { "id": 6, "tasks": ["6.6", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 7, "tasks": ["8.6", "8.7", "8.8", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4", "9.5", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3"] }
  ]
}
```
