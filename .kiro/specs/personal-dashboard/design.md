# Design Document — Personal Dashboard

## Overview

Personal Dashboard adalah aplikasi web satu halaman (_single-page application_) berbasis HTML, CSS, dan Vanilla JavaScript murni yang berjalan seluruhnya di sisi klien. Tidak ada server, tidak ada framework, tidak ada library eksternal. Data pengguna disimpan di LocalStorage browser sehingga tetap tersedia antar sesi tanpa proses login.

**Tujuan utama:**
- Tampilkan konteks waktu (jam, tanggal, salam) secara real-time.
- Berikan alat sesi fokus berbasis Pomodoro yang dapat dikonfigurasi.
- Sediakan manajemen tugas ringan.
- Simpan tautan favorit agar dapat diakses dengan satu klik.
- Dukung tema terang/gelap yang tersimpan persisten.

**Batasan teknis utama:**
- Satu file CSS (`css/style.css`), satu file JS (`js/app.js`), satu file HTML (`index.html`).
- Tidak ada dependensi eksternal — tidak ada npm, tidak ada CDN.
- Harus berjalan langsung dari `file://` maupun server statis sederhana.
- Kompatibel dengan 2 versi mayor terbaru Chrome, Firefox, Edge, Safari.
- Responsif hingga lebar 320 px.

---

## Architecture

### Arsitektur Aplikasi

Aplikasi menggunakan **flat module pattern** di dalam satu file JavaScript. Tidak ada sistem modul (tidak ada `import`/`export`) sehingga semua kode berjalan dalam satu scope yang dilingkupi IIFE implisit via `'use strict'`.

```
┌─────────────────────────────────────────────┐
│                  index.html                  │
│   (struktur DOM tetap, elemen direferensi   │
│    oleh id dari app.js)                      │
└───────────────┬─────────────────────────────┘
                │ <script src="js/app.js">
┌───────────────▼─────────────────────────────┐
│                   app.js                     │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  store   │  │  clock   │  │  theme   │  │
│  │ (helper) │  │ (module) │  │ (module) │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐                 │
│  │  timer   │  │  todos   │                 │
│  │ (module) │  │ (module) │                 │
│  └──────────┘  └──────────┘                 │
│  ┌──────────┐                               │
│  │  links   │                               │
│  │ (module) │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│              LocalStorage                    │
│  Keys: theme | userName | timerDuration      │
│         todos | quickLinks                   │
└─────────────────────────────────────────────┘
```

### Pola Interaksi

```
User Event (click / submit / keydown)
        │
        ▼
Event Listener di app.js
        │
        ├──► State mutation (array / variable)
        │
        ├──► store.set(key, value)   →  LocalStorage
        │
        └──► render*()               →  DOM update
```

Tidak ada framework reaktif — setiap perubahan state diikuti pemanggilan fungsi `render*()` yang meregenerasi bagian DOM yang relevan.

---

## Components and Interfaces

### 1. `store` — LocalStorage Helper

Objek tunggal yang mengabstraksi akses LocalStorage dengan serialisasi JSON dan _silent error handling_.

```
store.get(key, fallback?)  → any
store.set(key, value)      → void
```

- `get`: Baca dari LocalStorage, parse JSON; kembalikan `fallback` jika key tidak ada atau JSON rusak.
- `set`: Serialisasi value ke JSON lalu tulis; tangkap exception (kuota penuh) tanpa melempar ke atas.

### 2. Greeting / Clock Module

**DOM Elements:** `#greeting`, `#datetime`, `#nameModal`, `#nameInput`, `#nameSave`

**Functions:**
- `greetWord(hour: number) → string` — kembalikan salam berdasarkan rentang jam.
- `updateClock() → void` — perbarui teks greeting dan datetime; dipanggil tiap 1 detik via `setInterval`.

**Events:**
- `#greeting click` → buka name modal, isi input dengan nilai tersimpan.
- `#nameSave click` / `Enter` pada `#nameInput` → simpan nama (jika non-kosong setelah trim), tutup modal, perbarui clock.

**Interaksi State:**
- Baca/tulis `userName` via `store`.

### 3. Theme Module

**DOM Elements:** `#themeToggle` button, `<html data-theme>`

**Functions:**
- `applyTheme(theme: 'light' | 'dark') → void` — set atribut `data-theme` pada `<html>`, perbarui ikon tombol, simpan ke store.

**Events:**
- `#themeToggle click` → baca tema saat ini, toggle, panggil `applyTheme`.

**Inisialisasi:** `applyTheme(store.get('theme', 'light'))` dijalankan saat halaman dimuat.

### 4. Focus Timer Module

**DOM Elements:** `#timerDisplay`, `#timerStart`, `#timerStop`, `#timerReset`, `#timerStatus`, `#editDuration`, `#durationEditor`, `#durationInput`, `#durationSave`

**State Variables:**
- `timerDuration: number` — durasi dalam menit (1–120), awal dari `store.get('timerDuration', 25)`.
- `timeLeft: number` — detik tersisa.
- `timerInterval: number | null` — ID setInterval aktif.
- `timerRunning: boolean`.

**Functions:**
- `pad(n) → string` — zero-pad 2 digit.
- `formatTime(secs) → string` — kembalikan string `MM:SS`.
- `renderTimer() → void` — perbarui display, kelas CSS, dan status disabled tombol.
- `startTimer() → void` — mulai interval, set state running.
- `stopTimer() → void` — hapus interval, set state paused, tampilkan pesan.
- `resetTimer() → void` — hapus interval, reset `timeLeft`, hapus pesan status.

**Events:**
- `#timerStart click` → `startTimer()`
- `#timerStop click` → `stopTimer()`
- `#timerReset click` → `resetTimer()`
- `#editDuration click` → toggle visibilitas `#durationEditor`
- `#durationSave click` → validasi, simpan durasi, panggil `resetTimer()`

### 5. To-Do List Module

**DOM Elements:** `#todoForm`, `#todoInput`, `#todoList`, `#todoCount`, `#editModal`, `#editInput`, `#editSave`, `#editCancel`

**State Variables:**
- `todos: Task[]` — array objek Task, awal dari `store.get('todos', [])`.
- `editingId: string | null` — ID task yang sedang diedit.

**Functions:**
- `saveTodos() → void` — panggil `store.set('todos', todos)`.
- `updateBadge() → void` — perbarui `#todoCount` dengan format `"{done} / {total} selesai"`.
- `renderTodos() → void` — regenerasi seluruh `#todoList` dari array `todos`; tampilkan pesan kosong bila array kosong.
- `addTodo(text) → void` — validasi, buat Task baru, push, save, render.
- `toggleTodo(id) → void` — flip `done`, save, render.
- `deleteTodo(id) → void` — filter, save, render.
- `openEditModal(id) → void` — isi input modal, tampilkan modal.
- `saveEdit() → void` — validasi, update `task.text`, save, render, tutup modal.
- `closeEditModal() → void` — sembunyikan modal, reset `editingId`.

### 6. Quick Links Module

**DOM Elements:** `#linkForm`, `#linkLabel`, `#linkUrl`, `#linkList`

**State Variables:**
- `links: Link[]` — array objek Link, awal dari `store.get('quickLinks', [])`.

**Functions:**
- `saveLinks() → void` — panggil `store.set('quickLinks', links)`.
- `faviconFor(url) → string` — kembalikan `{origin}/favicon.ico`; kembalikan string kosong jika URL tidak valid.
- `renderLinks() → void` — regenerasi `#linkList`; tampilkan pesan kosong bila array kosong.
- `addLink(label, url) → boolean` — trim, tambah `https://` jika perlu, validasi dengan `new URL()`, push, save, render; kembalikan `false` jika gagal.
- `deleteLink(id) → void` — filter, save, render.

---

## Data Models

### Task

```js
{
  id:   string,   // Date.now().toString() — unik dalam sesi
  text: string,   // teks tugas, non-kosong setelah trim
  done: boolean   // status penyelesaian
}
```

**LocalStorage key:** `todos`  
**Tipe nilai:** JSON array of Task

### Link

```js
{
  id:    string,  // Date.now().toString()
  label: string,  // label yang ditampilkan, non-kosong setelah trim
  url:   string   // URL absolut (selalu dimulai dengan http:// atau https://)
}
```

**LocalStorage key:** `quickLinks`  
**Tipe nilai:** JSON array of Link

### Primitif LocalStorage Lainnya

| Key             | Tipe    | Default     | Keterangan                                        |
|-----------------|---------|-------------|---------------------------------------------------|
| `userName`      | string  | `null`      | Nama pengguna; `null` berarti belum pernah diatur |
| `theme`         | string  | `"light"`   | Nilai: `"light"` atau `"dark"`                    |
| `timerDuration` | number  | `25`        | Durasi Pomodoro dalam menit (1–120)               |

### CSS Custom Properties (Design Tokens)

Tema dikontrol oleh custom properties pada `:root` dan `[data-theme="dark"]`:

| Token         | Light              | Dark               | Kegunaan                       |
|---------------|--------------------|--------------------|--------------------------------|
| `--bg`        | `#f0f2f5`          | `#0f1117`          | Warna latar halaman            |
| `--surface`   | `#ffffff`          | `#1c1f2a`          | Warna card/header              |
| `--surface-2` | `#f7f8fa`          | `#252837`          | Input, item sekunder           |
| `--border`    | `#e2e5eb`          | `#2e3248`          | Garis tepi                     |
| `--text`      | `#1a1d23`          | `#e8eaf0`          | Warna teks utama               |
| `--muted`     | `#6b7280`          | `#8b93a8`          | Teks sekunder/placeholder      |
| `--primary`   | `#4f46e5`          | `#6c63ff`          | Warna aksen utama              |
| `--danger`    | `#ef4444`          | _(sama)_           | Indikator error/hapus          |
| `--success`   | `#22c55e`          | _(sama)_           | Indikator selesai/berjalan     |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Catatan refleksi properti:** Setelah analisis prework, beberapa properti yang redundan digabungkan:
- Kriteria 1.3–1.6 (rentang jam individual) digabung menjadi satu properti cakupan lengkap.
- Kriteria 5.3 dan 5.4 (durasi timer saat running/tidak) digabung karena invariannya identik.
- Kriteria 6.6 dan 6.7 (toggle done true/false) digabung sebagai satu sifat involusi.
- Kriteria 6.9/6.10 dan 7.6/7.7 tetap sebagai properti terpisah karena traceability ke domain berbeda.

---

### Property 1: Greeting time-range coverage is exhaustive

*For any* integer hour value in the range 0–23, the `greetWord` function SHALL return exactly one of the four greeting strings: "Selamat Pagi" (hours 0–11), "Selamat Siang" (hours 12–16), "Selamat Sore" (hours 17–20), or "Selamat Malam" (hours 21–23). Every hour value in [0, 23] SHALL map to exactly one greeting; no hour SHALL produce an unexpected string.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Timer display format is always MM:SS

*For any* non-negative integer value of seconds, the `formatTime` function SHALL return a string matching the pattern `^\d{2}:\d{2}$` — exactly two digits, a colon, then exactly two digits — with zero-padding applied to both fields.

**Validates: Requirements 1.1, 4.1**

---

### Property 3: Custom name round-trip persistence

*For any* non-empty string `s`, calling `store.set('userName', s.trim())` followed by `store.get('userName', '')` SHALL return `s.trim()` unchanged.

**Validates: Requirements 2.3, 2.8**

---

### Property 4: Whitespace-only name is rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), the save-name operation SHALL NOT modify the stored `userName` value — the previous value SHALL remain unchanged.

**Validates: Requirements 2.4**

---

### Property 5: Name appears in greeting text

*For any* non-empty stored `userName` string `n`, calling `updateClock` SHALL produce a greeting text that contains the substring `n`.

**Validates: Requirements 2.6**

---

### Property 6: Theme toggle is an involution

*For any* initial theme value `t` in `{"light", "dark"}`, calling `applyTheme` with the toggled value and then calling it again with the re-toggled value SHALL restore `document.documentElement.getAttribute('data-theme')` to `t`, and `store.get('theme', 'light')` SHALL also equal `t`.

**Validates: Requirements 3.2, 3.3**

---

### Property 7: Valid task addition grows the list

*For any* existing `todos` array and any string `text` where `text.trim()` is non-empty, calling `addTodo(text)` SHALL result in `todos.length` increasing by exactly 1, and the new task SHALL have `text` equal to `text.trim()` and `done` equal to `false`.

**Validates: Requirements 6.1**

---

### Property 8: Whitespace-only task is rejected

*For any* string `text` where `text.trim()` is the empty string (i.e., the string is empty or contains only whitespace), calling `addTodo(text)` SHALL leave the `todos` array completely unchanged.

**Validates: Requirements 6.2**

---

### Property 9: Toggle done is an involution

*For any* task with id `id` in the `todos` array, calling `toggleTodo(id)` twice in succession SHALL restore `task.done` to its original value.

**Validates: Requirements 6.6, 6.7**

---

### Property 10: Task deletion removes exactly the target

*For any* `todos` array of length `n ≥ 1` and any task id `id` present in the array, calling `deleteTodo(id)` SHALL result in `todos.length` equal to `n - 1`, and no task with id `id` SHALL remain in the array. All other tasks SHALL remain unchanged.

**Validates: Requirements 6.8**

---

### Property 11: Task list persistence round-trip

*For any* array of Task objects `tasks`, calling `store.set('todos', tasks)` followed by `store.get('todos', [])` SHALL return an array structurally equal to `tasks` (same ids, texts, and done values in the same order).

**Validates: Requirements 6.9, 6.10**

---

### Property 12: Todo progress badge is always accurate

*For any* `todos` array, the badge text rendered by `updateBadge` SHALL exactly reflect the count of tasks where `done === true` as the numerator and the total number of tasks as the denominator, in the format `"{done} / {total} selesai"`.

**Validates: Requirements 6.11**

---

### Property 13: Valid link URL is always absolute after addLink

*For any* label string `l` where `l.trim()` is non-empty and any URL string `u` that is parseable by `new URL()` (with `https://` prepended if no scheme is present), calling `addLink(l, u)` SHALL store a link whose `url` property starts with `http://` or `https://`.

**Validates: Requirements 7.1, 7.2**

---

### Property 14: Invalid URL is rejected — list stays unchanged

*For any* URL string `u` that cannot be parsed as a valid URL by `new URL()` even after prepending `https://`, calling `addLink(anyLabel, u)` SHALL return `false` and SHALL NOT modify the `links` array.

**Validates: Requirements 7.3**

---

### Property 15: Link deletion removes exactly the target

*For any* `links` array of length `n ≥ 1` and any link id `id` present in the array, calling `deleteLink(id)` SHALL result in `links.length` equal to `n - 1`, and no link with id `id` SHALL remain in the array. All other links SHALL remain unchanged.

**Validates: Requirements 7.5**

---

### Property 16: Link list persistence round-trip

*For any* array of Link objects `linkArr`, calling `store.set('quickLinks', linkArr)` followed by `store.get('quickLinks', [])` SHALL return an array structurally equal to `linkArr`.

**Validates: Requirements 7.6, 7.7**

---

### Property 17: Timer reset restores full duration

*For any* integer duration `d` where 1 ≤ d ≤ 120, setting `timerDuration = d` and calling `resetTimer()` SHALL result in `timeLeft` equal to `d * 60`.

**Validates: Requirements 4.5, 5.3, 5.4**

---

### Property 18: Out-of-range duration is rejected

*For any* integer `d` where `d < 1` or `d > 120`, attempting to save the duration SHALL NOT update `timerDuration` or `store.get('timerDuration', 25)` — both SHALL retain their previous value.

**Validates: Requirements 5.8**

---

### Property 19: store.set/get round-trip for JSON-serializable values

*For any* JSON-serializable value `v` and any LocalStorage key string `k`, `store.get(k, null)` called immediately after `store.set(k, v)` SHALL return a value structurally equal to `v` (deep equality for objects and arrays, strict equality for primitives).

**Validates: Requirements 8.5**

---

### Property 20: store.set silently handles write errors

*For any* call to `store.set(k, v)` where `localStorage.setItem` throws an exception (e.g., quota exceeded, SecurityError), the exception SHALL NOT propagate to the caller — no unhandled exception SHALL reach the browser console.

**Validates: Requirements 8.7**

---

## Error Handling

### LocalStorage Unavailability

`store.set` wraps all `localStorage.setItem` calls in a try/catch. If LocalStorage is unavailable (private browsing with storage blocked, quota exceeded, or SecurityError), the error is silently discarded and the in-memory state continues to function normally for the current session.

`store.get` similarly wraps `JSON.parse` — if stored data is corrupted, it returns the `fallback` value.

**Rationale:** Dashboard bersifat opsional-persisten; kehilangan data persisten tidak merusak fungsionalitas sesi saat ini.

### URL Validation in Quick Links

Sebelum menyimpan, setiap URL divalidasi dengan `new URL()`. Jika konstruktor melempar exception, `addLink` mengembalikan `false`, menampilkan border merah selama 1500ms pada field URL, dan tidak memodifikasi state. Ini mencegah link yang rusak tersimpan.

### Timer Duration Validation

Input durasi divalidasi: `parseInt` kemudian periksa `val >= 1 && val <= 120`. Jika gagal, fungsi keluar tanpa menyimpan. Atribut HTML `min="1" max="120"` memberi indikator visual awal di browser modern.

### Empty Input Rejection

- Task dan nama pengguna: `text.trim()` harus truthy sebelum disimpan.
- Label link: harus truthy setelah trim.
- Fungsi-fungsi ini mengembalikan awal tanpa modifikasi state jika validasi gagal.

### Favicon Load Error

Setiap elemen `<img>` favicon memiliki handler `onerror = () => img.remove()`. Jika `favicon.ico` mengembalikan 404 atau gagal dimuat karena CORS, gambar dihapus dari DOM secara diam-diam.

### Modal Backdrop Click

Klik pada backdrop modal menutup modal tanpa menyimpan perubahan, menjaga konsistensi UX dan menghindari penyimpanan state parsial.

---

## Testing Strategy

### Pendekatan Dual-Track

Aplikasi ini menggunakan fungsi logika murni yang terisolasi dengan baik (validasi string, transformasi array, format waktu) yang sangat cocok untuk property-based testing. Komponen UI (DOM rendering) lebih cocok dengan unit test berbasis contoh.

#### Property-Based Testing

**Library yang direkomendasikan:** [fast-check](https://fast-check.dev/) — library PBT JavaScript yang matang, tidak memerlukan transpiler, dapat dijalankan di Node.js atau browser.

**Konfigurasi:** Setiap property test harus menjalankan minimal 100 iterasi (default fast-check).

**Tag format per test:**
```
Feature: personal-dashboard, Property {N}: {ringkasan singkat properti}
```

**Property yang perlu diimplementasikan:**

| Property # | Fungsi yang diuji                             | Pola                    |
|------------|-----------------------------------------------|-------------------------|
| 1          | `greetWord(hour)`                             | Exhaustive coverage     |
| 2          | `formatTime(secs)`                            | Format invariant        |
| 3          | `store.set/get` (userName)                    | Round-trip              |
| 4          | Whitespace name rejection                     | Error condition         |
| 5          | `updateClock` — name in greeting              | Invariant               |
| 6          | `applyTheme` — double toggle                  | Involution              |
| 7          | `addTodo` — list grows by 1                   | Invariant               |
| 8          | `addTodo` — whitespace rejection              | Error condition         |
| 9          | `toggleTodo` twice                            | Involution              |
| 10         | `deleteTodo` — removes exactly target         | Invariant               |
| 11         | `store.set/get` (todos)                       | Round-trip              |
| 12         | `updateBadge` — progress text accuracy        | Invariant               |
| 13         | `addLink` — URL always absolute               | Invariant               |
| 14         | `addLink` — invalid URL rejection             | Error condition         |
| 15         | `deleteLink` — removes exactly target         | Invariant               |
| 16         | `store.set/get` (quickLinks)                  | Round-trip              |
| 17         | `resetTimer` — timeLeft = duration × 60       | Invariant               |
| 18         | Duration out-of-range rejection               | Error condition         |
| 19         | `store.set/get` (arbitrary JSON values)       | Round-trip              |
| 20         | `store.set` silent error handling             | Error condition         |

#### Unit Tests (Example-Based)

Unit test fokus pada kasus spesifik yang tidak tercakup oleh generator properti:

- **Greeting rendering:** Verifikasi format output `"Selamat Pagi, Rosi!"` dan `"Selamat Pagi!"` (tanpa nama).
- **Date formatting:** Verifikasi format lokal Indonesia (hari, tanggal, bulan, tahun).
- **Timer format:** `formatTime(0)` → `"00:00"`, `formatTime(3661)` → `"61:01"`.
- **Timer state machine:** Start saat `timeLeft === 0` tidak melakukan apa-apa; Stop saat tidak berjalan tidak melakukan apa-apa.
- **Todo badge:** `"0 tasks"` saat array kosong; `"2 / 5 selesai"` saat 2 dari 5 selesai.
- **Link form submit:** URL tanpa skema mendapat prefix `https://`; URL tidak valid menampilkan border merah.
- **Modal:** Klik backdrop menutup modal; menekan Cancel tidak menyimpan perubahan edit.
- **Theme init:** Jika tidak ada nilai di LocalStorage, tema `"light"` diterapkan sebagai default.

#### Integration / Smoke Tests

- Buka `index.html` di browser; verifikasi semua 4 widget ditampilkan tanpa error konsol.
- Isi form tugas, reload halaman; tugas harus muncul kembali (LocalStorage persistence).
- Ganti tema, reload halaman; tema harus tetap (theme persistence).
- Simpan nama, reload; nama harus muncul di salam (userName persistence).

#### Batasan Testing

- **Tidak ada pengujian visual otomatis** untuk transisi CSS atau apakah tampilan "terasa menyenangkan" — ini memerlukan manual review.
- **Tidak ada pengujian aksesibilitas otomatis penuh** — atribut ARIA sudah disertakan di HTML, namun validasi screen reader memerlukan pengujian manual.
- **Tidak ada end-to-end test** dengan browser automation — untuk proyek vanilla JS client-only ini, integration test manual sudah memadai.
