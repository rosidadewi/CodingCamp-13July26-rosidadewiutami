# Requirements Document

## Introduction

Personal Dashboard adalah aplikasi web satu halaman yang dibangun menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework. Aplikasi ini menyediakan antarmuka terpusat bagi pengguna untuk memantau waktu, mengelola sesi fokus, mencatat tugas harian, dan mengakses tautan favorit — semuanya berjalan sepenuhnya di sisi klien menggunakan LocalStorage sebagai penyimpanan data.

Fitur MVP mencakup: Greeting (salam + jam/tanggal real-time), Focus Timer (Pomodoro), To-Do List, dan Quick Links. Tiga fitur tambahan (challenge) yang disertakan adalah: Light/Dark Mode, Custom Name pada salam, dan pengaturan durasi timer Pomodoro yang dapat diubah.

---

## Glossary

- **Dashboard**: Halaman utama aplikasi yang memuat seluruh widget dalam satu tampilan.
- **Widget**: Komponen antarmuka mandiri (timer, to-do, quick links, greeting).
- **LocalStorage**: API penyimpanan browser bawaan yang mempertahankan data secara persisten di sisi klien.
- **Store**: Abstraksi JavaScript yang membungkus akses baca/tulis ke LocalStorage.
- **Focus Timer**: Widget timer hitung-mundur berbasis durasi Pomodoro yang dapat dikonfigurasi.
- **To-Do List**: Widget pengelolaan tugas yang memungkinkan penambahan, pengeditan, penyelesaian, dan penghapusan tugas.
- **Quick Links**: Widget tautan cepat ke situs web favorit yang disimpan pengguna.
- **Greeting**: Bagian header yang menampilkan waktu, tanggal, salam berdasarkan waktu, dan nama pengguna.
- **Theme**: Skema warna antarmuka, bernilai `light` atau `dark`.
- **Tema Terang (Light Mode)**: Skema warna dengan latar belakang cerah.
- **Tema Gelap (Dark Mode)**: Skema warna dengan latar belakang gelap.
- **Task**: Satu entri tugas dalam To-Do List, memiliki properti `id`, `text`, dan `done`.
- **Link**: Satu entri tautan dalam Quick Links, memiliki properti `id`, `label`, dan `url`.
- **Pomodoro Duration**: Durasi sesi fokus dalam menit, bernilai antara 1 hingga 120 menit.
- **Browser Modern**: Google Chrome, Mozilla Firefox, Microsoft Edge, dan Safari — 2 major versi terbaru.

---

## Requirements

---

### Kebutuhan 1: Greeting — Tampilan Waktu, Tanggal, dan Salam

**User Story:** Sebagai pengguna, saya ingin melihat waktu, tanggal saat ini, dan salam yang sesuai dengan waktu hari, agar saya merasa disambut dan langsung mengetahui konteks waktu saat membuka dashboard.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menampilkan waktu berjalan dalam format HH:MM:SS (24 jam) yang diperbarui setiap 1 detik.
2. THE Dashboard SHALL menampilkan tanggal lengkap dalam format lokal Indonesia mencakup nama hari, tanggal, nama bulan, dan tahun (contoh: "Jumat, 18 Juli 2025").
3. IF jam lokal berada di antara 00:00 dan 11:59, THEN THE Dashboard SHALL menampilkan salam "Selamat Pagi".
4. IF jam lokal berada di antara 12:00 dan 16:59, THEN THE Dashboard SHALL menampilkan salam "Selamat Siang".
5. IF jam lokal berada di antara 17:00 dan 20:59, THEN THE Dashboard SHALL menampilkan salam "Selamat Sore".
6. IF jam lokal berada di antara 21:00 dan 23:59, THEN THE Dashboard SHALL menampilkan salam "Selamat Malam".

---

### Kebutuhan 2: Custom Name — Nama Pengguna pada Salam

**User Story:** Sebagai pengguna, saya ingin menyimpan nama saya agar salam ditampilkan secara personal dengan nama saya.

#### Kriteria Penerimaan

1. WHEN kunci `userName` tidak ada di LocalStorage saat halaman pertama kali dimuat, THE Dashboard SHALL menampilkan modal input nama secara otomatis.
2. WHEN pengguna mengklik area salam pada header, THE Dashboard SHALL membuka modal input nama.
3. WHEN pengguna menyimpan nama melalui modal dengan input non-kosong (setelah trim), THE Store SHALL menyimpan nama tersebut ke LocalStorage dengan kunci `userName`.
4. IF input nama hanya berisi spasi atau kosong saat tombol simpan ditekan, THEN THE Dashboard SHALL tidak menyimpan nilai tersebut dan modal tetap terbuka.
5. WHEN pengguna menutup modal tanpa menyimpan, THE Dashboard SHALL tidak mengubah nama yang tersimpan.
6. WHEN nama pengguna tersedia di LocalStorage, THE Dashboard SHALL menampilkan nama tersebut sebagai bagian dari teks salam (contoh: "Selamat Pagi, Rosi!").
7. WHEN nama pengguna kosong atau tidak tersedia di LocalStorage, THE Dashboard SHALL menampilkan salam tanpa nama (contoh: "Selamat Pagi!").
8. THE Store SHALL mempertahankan nama pengguna di antara sesi browser sehingga tidak perlu diisi ulang setiap kali halaman dibuka.

---

### Kebutuhan 3: Light/Dark Mode — Pengaturan Tema Antarmuka

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tema terang dan gelap agar tampilan dashboard nyaman di berbagai kondisi pencahayaan.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menampilkan tombol toggle tema di area header yang dapat diklik.
2. WHEN pengguna mengklik tombol toggle tema, THE Dashboard SHALL memperbarui atribut `data-theme` pada elemen `<html>` menjadi `"dark"` jika sebelumnya `"light"`, atau menjadi `"light"` jika sebelumnya `"dark"`.
3. WHEN pengguna mengklik tombol toggle tema, THE Store SHALL menyimpan nilai tema baru ke LocalStorage dengan kunci `theme`.
4. WHEN halaman dimuat, THE Dashboard SHALL membaca kunci `theme` dari LocalStorage dan menerapkan tema tersebut sebelum konten pertama kali ditampilkan.
5. IF tidak ada nilai tersimpan di LocalStorage untuk kunci `theme`, THEN THE Dashboard SHALL menerapkan tema `"light"` sebagai nilai default.
6. WHEN pengguna mengklik tombol toggle tema, THE Dashboard SHALL menerapkan perubahan tema melalui transisi CSS dengan durasi tidak lebih dari 300ms tanpa reload halaman.

---

### Kebutuhan 4: Focus Timer — Timer Hitung-Mundur Pomodoro

**User Story:** Sebagai pengguna, saya ingin menggunakan timer hitung-mundur untuk sesi fokus agar saya dapat bekerja dengan metode Pomodoro secara disiplin.

#### Kriteria Penerimaan

1. THE Focus_Timer SHALL menampilkan waktu tersisa dalam format MM:SS dengan padding nol di kiri.
2. WHEN pengguna mengklik tombol Start, THE Focus_Timer SHALL memulai hitung-mundur dan memperbarui tampilan setiap 1 detik.
3. WHEN pengguna mengklik tombol Stop, THE Focus_Timer SHALL menghentikan hitung-mundur sementara tanpa mereset waktu tersisa.
4. WHEN pengguna mengklik tombol Stop, THE Focus_Timer SHALL menampilkan pesan status "Dijeda".
5. WHEN pengguna mengklik tombol Reset, THE Focus_Timer SHALL menghentikan hitung-mundur dan mengembalikan waktu ke durasi penuh yang aktif.
6. WHEN pengguna mengklik tombol Reset, THE Focus_Timer SHALL menghapus pesan status yang sebelumnya ditampilkan.
7. WHEN hitung-mundur mencapai 00:00, THE Focus_Timer SHALL berhenti secara otomatis dan menampilkan pesan "Sesi selesai! Istirahat sejenak." di area status.
8. WHILE hitung-mundur sedang berjalan, THE Focus_Timer SHALL menonaktifkan tombol Start untuk mencegah duplikasi interval.
9. WHILE hitung-mundur sedang berjalan, THE Focus_Timer SHALL menonaktifkan tombol Stop hanya saat timer tidak berjalan.
10. WHILE hitung-mundur sedang berjalan, THE Focus_Timer SHALL menampilkan pesan status "Sesi fokus sedang berlangsung".

---

### Kebutuhan 5: Pengaturan Durasi Timer (Change Pomodoro Time)

**User Story:** Sebagai pengguna, saya ingin mengubah durasi timer Pomodoro sesuai preferensi saya, agar saya tidak terbatas pada 25 menit.

#### Kriteria Penerimaan

1. THE Focus_Timer SHALL menyediakan tombol "Edit" untuk membuka editor durasi.
2. WHEN pengguna membuka editor durasi, THE Focus_Timer SHALL menampilkan input angka yang menerima nilai antara 1 hingga 120 menit.
3. WHEN pengguna menyimpan durasi baru yang valid (1–120 menit) dan timer sedang tidak berjalan, THE Focus_Timer SHALL mereset timer ke durasi baru dan menutup editor.
4. WHEN pengguna menyimpan durasi baru yang valid (1–120 menit) dan timer sedang berjalan, THE Focus_Timer SHALL menghentikan timer, mereset ke durasi baru, dan menutup editor.
5. THE Store SHALL menyimpan nilai durasi yang ditetapkan ke LocalStorage dengan kunci `timerDuration`.
6. WHEN pengguna membuka aplikasi, THE Focus_Timer SHALL memuat durasi yang tersimpan di LocalStorage sebagai durasi default.
7. WHEN tidak ada durasi tersimpan, THE Focus_Timer SHALL menggunakan durasi default 25 menit.
8. IF pengguna memasukkan nilai di luar rentang 1–120 menit, THEN THE Focus_Timer SHALL menampilkan indikator error pada field input dan tidak menyimpan nilai tersebut.

---

### Kebutuhan 6: To-Do List — Pengelolaan Tugas

**User Story:** Sebagai pengguna, saya ingin menambah, mengedit, menandai selesai, dan menghapus tugas harian, agar saya dapat melacak pekerjaan saya langsung dari dashboard.

#### Kriteria Penerimaan

1. WHEN pengguna mengisi form dan menekan tombol Add dengan teks non-kosong (setelah trim), THE Todo_List SHALL menambahkan tugas baru ke daftar dengan properti `id` (unik), `text`, dan `done: false`.
2. IF teks input tugas kosong atau hanya berisi spasi, THEN THE Todo_List SHALL tidak menambahkan tugas.
3. WHEN pengguna mengklik tombol edit pada suatu tugas, THE Todo_List SHALL membuka modal edit dengan teks tugas yang sudah diisi.
4. WHEN pengguna menyimpan perubahan dari modal edit dengan teks non-kosong (setelah trim), THE Todo_List SHALL memperbarui teks tugas yang bersangkutan.
5. IF teks pada modal edit kosong atau hanya berisi spasi saat disimpan, THEN THE Todo_List SHALL tidak menyimpan perubahan dan modal tetap terbuka.
6. WHEN pengguna mencentang checkbox pada suatu tugas, THE Todo_List SHALL mengubah properti `done` menjadi `true` dan menampilkan coretan pada teksnya.
7. WHEN pengguna menghapus centang pada suatu tugas, THE Todo_List SHALL mengubah properti `done` menjadi `false` dan menghapus coretan.
8. WHEN pengguna mengklik tombol hapus pada suatu tugas, THE Todo_List SHALL menghapus tugas tersebut dari daftar.
9. WHEN terjadi perubahan pada daftar tugas (tambah, edit, toggle, hapus), THE Store SHALL menyimpan seluruh array tugas ke LocalStorage dengan kunci `todos`.
10. WHEN pengguna membuka aplikasi, THE Todo_List SHALL memuat dan menampilkan seluruh tugas yang tersimpan di LocalStorage.
11. THE Todo_List SHALL menampilkan penghitung kemajuan dalam format "{jumlah selesai} / {total} selesai" di bagian header widget.
12. WHEN daftar tugas kosong, THE Todo_List SHALL menampilkan pesan "Belum ada tugas. Tambahkan di atas!".

---

### Kebutuhan 7: Quick Links — Tautan Cepat ke Situs Favorit

**User Story:** Sebagai pengguna, saya ingin menyimpan dan mengakses tautan ke situs web favorit dengan satu klik, agar saya tidak perlu mengetik URL setiap kali.

#### Kriteria Penerimaan

1. WHEN pengguna mengisi label non-kosong (setelah trim, maksimal 100 karakter) dan URL yang valid lalu menekan tombol Add, THE Quick_Links SHALL menambahkan tautan baru ke daftar.
2. IF URL yang dimasukkan tidak memiliki skema `http://` atau `https://`, THEN THE Quick_Links SHALL menambahkan `https://` secara otomatis sebelum menyimpan.
3. IF URL yang dimasukkan tidak dapat diparsing sebagai URL yang valid oleh `new URL()`, THEN THE Quick_Links SHALL menampilkan border merah pada field URL selama 1500ms dan tidak menyimpan tautan.
4. WHEN pengguna mengklik suatu tautan, THE Quick_Links SHALL membuka URL tersebut di tab baru menggunakan atribut `target="_blank"` dengan `rel="noopener noreferrer"`.
5. WHEN pengguna mengklik tombol hapus pada suatu tautan, THE Quick_Links SHALL menghapus tautan tersebut dari daftar.
6. WHEN pengguna menambahkan atau menghapus tautan, THE Store SHALL menyimpan seluruh array tautan ke LocalStorage dengan kunci `quickLinks`.
7. WHEN pengguna membuka aplikasi, THE Quick_Links SHALL memuat dan menampilkan seluruh tautan yang tersimpan di LocalStorage.
8. WHEN tautan ditampilkan, THE Quick_Links SHALL mencoba memuat favicon melalui URL `{origin}/favicon.ico`; IF favicon gagal dimuat, THEN elemen gambar SHALL dihapus dari DOM.
9. WHEN daftar tautan kosong, THE Quick_Links SHALL menampilkan pesan "Belum ada tautan. Tambahkan di atas!".

---

### Kebutuhan 8: Batasan Teknis & Kompatibilitas

**User Story:** Sebagai developer, saya ingin aplikasi dibangun dengan teknologi yang sederhana dan berjalan di browser modern tanpa setup tambahan.

#### Kriteria Penerimaan

1. THE Dashboard SHALL dibangun hanya menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework, library eksternal, CDN-loaded scripts, maupun dependensi dari package manager.
2. THE Dashboard SHALL menggunakan tepat satu file CSS yang berada di folder `css/`.
3. THE Dashboard SHALL menggunakan tepat satu file JavaScript yang berada di folder `js/`.
4. THE Dashboard SHALL berjalan sepenuhnya di sisi klien tanpa memerlukan server backend.
5. THE Store SHALL menggunakan LocalStorage API bawaan browser sebagai satu-satunya mekanisme penyimpanan data.
6. THE Dashboard SHALL dapat dibuka dan berfungsi penuh di 2 major versi terbaru dari Chrome, Firefox, Edge, dan Safari.
7. IF LocalStorage tidak tersedia atau penuh saat operasi tulis dilakukan, THEN THE Dashboard SHALL menangani error secara diam-diam (silent catch) tanpa melempar exception yang tidak tertangani ke konsol pengguna.

---

### Kebutuhan 9: Non-Fungsional — Performa, Kesederhanaan, dan Desain Visual

**User Story:** Sebagai pengguna, saya ingin dashboard memiliki tampilan yang bersih, responsif, dan cepat dimuat agar pengalaman menggunakannya menyenangkan.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menampilkan antarmuka yang bersih dan minimal dengan hierarki visual yang jelas menggunakan perbedaan ukuran font, bobot, dan warna antar elemen (NFR-3).
2. THE Dashboard SHALL merespons setiap interaksi pengguna (klik tombol, input teks) dalam waktu tidak lebih dari 100ms secara visual (NFR-2).
3. THE Dashboard SHALL dapat digunakan dengan membuka file `index.html` langsung di browser tanpa proses instalasi, build, atau konfigurasi apapun (NFR-1).
4. THE Dashboard SHALL menampilkan layout yang dapat digunakan pada layar dengan lebar minimal 320px tanpa konten yang terpotong atau tumpang tindih.
5. THE Dashboard SHALL menerapkan transisi CSS dengan durasi antara 150ms dan 300ms pada elemen interaktif (tombol, input, pergantian tema) untuk memberikan umpan balik visual kepada pengguna.
