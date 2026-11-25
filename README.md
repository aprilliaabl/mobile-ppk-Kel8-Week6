# WEEK 6 SRS

### Software Requirements Specification — Mobile Practicum Attendance

menjelaskan kebutuhan fungsional dan pembagian modul pengembangan aplikasi presensi praktikum.

---

## 1. Modul Jadwal & Detail Sesi

**Owner:** `Schedule`

### Software Requirements Specification (SRS)

- **FR-01:** Pemilihan role dan identitas dummy.
- **FR-02:** Menampilkan daftar jadwal praktikum.
- **FR-03:** Menampilkan detail sesi praktikum.

### Programming Tasks

- [ ] Halaman pemilihan role dan identitas.
- [ ] Dashboard jadwal praktikum.
- [ ] Detail sesi yang mencakup nama, kelas, waktu, dan status.
- [ ] Tampilan jadwal kosong dan sesi yang belum dibuka.

**Output:** Alur awal aplikasi yang dapat digunakan oleh kedua role, yaitu praktikan dan asisten.

---

## 2. Modul Pengelolaan Sesi & Rekap

**Owner:** `Assistant`

### Software Requirements Specification (SRS)

- **FR-04:** Membuka sesi praktikum.
- **FR-05:** Menutup sesi praktikum.
- **FR-06:** Menampilkan rekap kehadiran.

### Programming Tasks

- [ ] Dashboard asisten.
- [ ] Tombol buka dan tutup sesi.
- [ ] Modal konfirmasi tindakan.
- [ ] Daftar praktikan dummy beserta waktu kehadiran.
- [ ] Tampilan rekap kosong.

**Output:** Seluruh kontrol sesi praktikum dan rekap kehadiran dari sisi asisten.

---

## 3. Modul Presensi & Riwayat

**Owner:** `Attendance`

### Software Requirements Specification (SRS)

- **FR-07:** Melakukan presensi.
- **FR-08:** Menampilkan hasil presensi dan waktu kehadiran.
- **FR-09:** Menampilkan riwayat presensi praktikan.

### Programming Tasks

- [ ] Halaman presensi praktikan.
- [ ] Validasi bahwa sesi praktikum sedang terbuka.
- [ ] Pencegahan presensi ganda pada sesi yang sama.
- [ ] Feedback berhasil atau gagal menggunakan modal atau pesan.
- [ ] Riwayat presensi dummy.

**Output:** Alur presensi praktikan dari proses presensi hingga melihat riwayat kehadiran.

---

## 4. Functional Requirements Overview (Sprint 1)

| ID    | Functional Requirement               | Module     |
| :---- | :----------------------------------- | :--------- |
| FR-01 | Pemilihan role dan identitas dummy   | Schedule   |
| FR-02 | Menampilkan daftar jadwal praktikum  | Schedule   |
| FR-03 | Menampilkan detail sesi praktikum    | Schedule   |
| FR-04 | Membuka sesi praktikum               | Assistant  |
| FR-05 | Menutup sesi praktikum               | Assistant  |
| FR-06 | Menampilkan rekap kehadiran          | Assistant  |
| FR-07 | Melakukan presensi                   | Attendance |
| FR-08 | Menampilkan hasil dan waktu presensi | Attendance |
| FR-09 | Menampilkan riwayat presensi         | Attendance |

---

## 5. Sprint 1 Goal

Membangun antarmuka dan alur utama aplikasi presensi praktikum yang mencakup pemilihan role, penampilan jadwal, pengelolaan sesi, pencatatan kehadiran, dan riwayat presensi menggunakan data dummy.

---

---

# SPRINT 2 — DATA DINAMIS DENGAN FIREBASE & AI

### Rencana Pengembangan Lanjutan (Kelompok 8)

Pada sprint ini, aplikasi dikembangkan dari data lokal/dummy menjadi sistem **multi-user** dengan penyimpanan persisten dan sinkronisasi **real-time** menggunakan Firebase (Authentication & Cloud Firestore) serta integrasi model **AI** untuk pengajuan izin.

---

## 6. Functional Requirements (Sprint 2)

| ID        | Functional Requirement                                                                                                  |
| :-------- | :---------------------------------------------------------------------------------------------------------------------- |
| **FR-01** | Pengguna dapat melakukan registrasi dengan email, password, nama, dan peran (Praktikan / Asisten)                       |
| **FR-02** | Pengguna dapat login dan logout menggunakan Firebase Authentication                                                     |
| **FR-03** | Aplikasi menampilkan informasi dan aksi yang sesuai dengan peran pengguna                                               |
| **FR-04** | Asisten dapat menambah, melihat, mengubah, dan menghapus data sesi praktikum                                            |
| **FR-05** | Asisten dapat membuka dan menutup sesi praktikum                                                                        |
| **FR-06** | Praktikan dapat melihat jadwal dan informasi sesi praktikum yang berkaitan dengan dirinya                               |
| **FR-07** | Praktikan dapat melakukan presensi saat sesi dibuka dan tidak dapat presensi lebih dari satu kali pada sesi yang sama   |
| **FR-08** | Rekap kehadiran dapat dilihat asisten dan terupdate secara real-time                                                    |
| **FR-09** | Perubahan status sesi dan data praktikum tersinkron real-time tanpa perlu menjalankan ulang aplikasi                    |
| **FR-10** | Data tetap tersedia setelah aplikasi ditutup dan dibuka kembali                                                         |
| **FR-11** | Praktikan dapat mengajukan izin ketidakhadiran untuk sesi tertentu dengan mengisi alasan                                |
| **FR-12** | AI mengklasifikasikan alasan izin secara otomatis saat izin diajukan                                                    |
| **FR-13** | Asisten dapat melihat daftar pengajuan izin beserta hasil klasifikasi AI, lalu menerima atau menolak pengajuan tersebut |
| **FR-14** | Praktikan dapat memantau status pengajuan izinnya secara real-time                                                      |
| **FR-15** | Aplikasi menangani input tidak valid, kegagalan autentikasi, serta kesalahan komunikasi dengan Firestore atau API AI    |
| **FR-16** | Akses dan perubahan data dibatasi sesuai identitas serta peran melalui Firebase Security Rules                          |

---

## 7. Pembagian SRS / Fitur Sprint 2 (Per Programmer)

### 👩‍💻 Aprillia Abel Cleodora — Auth, Keamanan & Validasi

- Aprillia Abel Cleodora - FR-01 : Sebagai pengguna baru, saya dapat melakukan registrasi dengan email, password, nama, dan memilih peran sebagai Praktikan atau Asisten
- Aprillia Abel Cleodora - FR-02 : Sebagai pengguna, saya dapat login dan logout menggunakan Firebase Authentication
- Aprillia Abel Cleodora - FR-03 : Sebagai pengguna, aplikasi menampilkan informasi dan aksi yang sesuai dengan peran saya
- Aprillia Abel Cleodora - FR-15 : Sebagai pengguna, aplikasi menampilkan pesan yang jelas saat terjadi input tidak valid, gagal autentikasi, atau gangguan koneksi
- Aprillia Abel Cleodora - FR-16 : Sebagai pengguna, saya hanya dapat mengakses dan mengubah data sesuai wewenang peran saya melalui Firebase Security Rules

### 👩‍💻 Diah Maulida Pratiwi — Pengelolaan Sesi & Real-time Asisten

- Diah Maulida Pratiwi - FR-04 : Sebagai asisten, saya dapat menambah, melihat, mengubah, dan menghapus data sesi praktikum
- Diah Maulida Pratiwi - FR-05 : Sebagai asisten, saya dapat membuka dan menutup sesi praktikum
- Diah Maulida Pratiwi - FR-06 : Sebagai praktikan, saya dapat melihat jadwal dan informasi sesi praktikum yang berkaitan dengan saya
- Diah Maulida Pratiwi - FR-09 : Sebagai pengguna, perubahan status sesi langsung terlihat tanpa perlu menjalankan ulang aplikasi
- Diah Maulida Pratiwi - FR-10 : Sebagai pengguna, data praktikum tetap tersedia setelah aplikasi ditutup dan dibuka kembali

### 👨‍💻 Wahyu Aji Gumelar Tri Nugroho — Presensi, Pengajuan Izin & Integrasi AI

- Wahyu Aji Gumelar Tri Nugroho - FR-07 : Sebagai praktikan, saya dapat melakukan presensi saat sesi dibuka dan tidak dapat presensi lebih dari satu kali pada sesi yang sama
- Wahyu Aji Gumelar Tri Nugroho - FR-08 : Sebagai asisten, saya dapat melihat rekap kehadiran yang terupdate secara real-time
- Wahyu Aji Gumelar Tri Nugroho - FR-11 : Sebagai praktikan, saya dapat mengajukan izin ketidakhadiran untuk sesi tertentu dengan mengisi alasan
- Wahyu Aji Gumelar Tri Nugroho - FR-12 : Sebagai sistem, alasan izin yang diajukan praktikan diklasifikasikan secara otomatis oleh AI sebagai referensi bagi asisten
- Wahyu Aji Gumelar Tri Nugroho - FR-13 : Sebagai asisten, saya dapat melihat daftar pengajuan izin beserta hasil klasifikasi AI, lalu menerima atau menolak pengajuan tersebut
- Wahyu Aji Gumelar Tri Nugroho - FR-14 : Sebagai praktikan, saya dapat memantau status pengajuan izin saya secara real-time

---

## 8. Alur Demonstrasi Utama

- **Alur Presensi:** Asisten login → membuka sesi → praktikan login dan melakukan presensi → data tersimpan di Firestore → asisten melihat rekap kehadiran secara real-time → asisten menutup sesi.
- **Alur Izin & AI:** Praktikan login → mengajukan izin → AI mengklasifikasikan alasan → asisten memeriksa dan memberikan keputusan → praktikan melihat status pengajuannya.

---

---

# SPRINT 3 — LOKASI, MAPS & PUSH NOTIFICATION

### Rencana Pengembangan Lanjutan (Kelompok 8)

Pada sprint ini, presensi dikembangkan menjadi **presensi berbasis lokasi**: praktikan hanya dapat hadir apabila berada dalam radius laboratorium. Aplikasi juga menampilkan **peta laboratorium Informatika** beserta aktivitas praktikumnya, dan mengirim **push notification** ketika ada informasi penting (sesi dibuka, jadwal berubah, keputusan izin).

**Referensi teknis:**

- Push Notification: https://medium.com/@silverskytechnology/rich-push-notifications-in-react-native-a-complete-guide-797dd9747366
- Maps: https://medium.com/@silverskytechnology/implementing-google-maps-and-routes-tracking-in-react-native-a-starter-guide-9768282594b8

---

## 9. Functional Requirements (Sprint 3)

| ID        | Functional Requirement                                                                                                                                                                         |
| :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-17** | Tersedia halaman presensi khusus (terpisah dari detail sesi) yang menampilkan informasi sesi, status sesi, dan aksi presensi                                                                   |
| **FR-18** | Presensi divalidasi lokasi: hanya dicatat jika sesi dibuka dan perangkat berada dalam radius laboratorium; hasil pemeriksaan (termasuk di luar radius atau lokasi tidak tersedia) ditampilkan; tidak dapat presensi ganda |
| **FR-19** | Asisten dapat mengelola lokasi laboratorium (nama, koordinat, radius) yang disimpan di Firestore dan menjadi acuan validasi presensi                                                           |
| **FR-20** | Halaman Maps menampilkan marker laboratorium dan marker posisi pengguna yang ikut berubah mengikuti lokasi perangkat; pengguna dapat memilih marker untuk melihat info laboratorium            |
| **FR-21** | Setiap laboratorium menampilkan praktikum yang sedang berlangsung dan berikutnya (nama praktikum, kelas, waktu, status sesi) dari Firestore secara real-time                                   |
| **FR-22** | Push notification dikirim ke pengguna yang berkepentingan ketika sesi dibuka, jadwal berubah, atau pengajuan izin diterima/ditolak                                                             |
| **FR-23** | Aplikasi meminta izin lokasi dan notifikasi, serta memberi pesan jelas saat izin ditolak, layanan lokasi mati, lokasi belum tersedia, koneksi bermasalah, atau notifikasi tidak dapat diterima |
| **FR-24** | *(Opsional)* Presensi dengan QR Code: asisten menampilkan QR, praktikan memindainya                                                                                                            |

---

## 10. Pembagian SRS / Fitur Sprint 3 (Per Programmer)

### 👩‍💻 Aprillia Abel Cleodora — Push Notification, Izin Perangkat & Keamanan

**User story**

- Aprillia Abel Cleodora - FR-22 : Sebagai pengguna, saya menerima push notification ketika sesi dibuka, jadwal berubah, atau pengajuan izin saya diputuskan asisten
- Aprillia Abel Cleodora - FR-23 : Sebagai pengguna, aplikasi meminta izin lokasi dan notifikasi serta menjelaskan dengan jelas kondisi perangkat yang menghambat (izin ditolak, GPS mati, lokasi belum tersedia, koneksi bermasalah)
- Aprillia Abel Cleodora - FR-16 (lanjutan) : Sebagai pengguna, akses ke data baru (laboratorium, token notifikasi, data lokasi presensi) tetap dibatasi sesuai peran melalui Firebase Security Rules

**Programming Tasks**

- [ ] Integrasi push notification (konfigurasi FCM/`expo-notifications`, channel Android, tampilan notifikasi saat aplikasi terbuka maupun tertutup).
- [ ] Simpan token notifikasi ke profil pengguna saat login dan hapus saat logout.
- [ ] Pengirim notifikasi berbasis kejadian dengan penerima yang tepat:
  - sesi dibuka → praktikan pada kelas sesi tersebut;
  - jadwal sesi berubah → praktikan pada kelas sesi tersebut;
  - izin diputuskan → praktikan yang mengajukan izin.
- [ ] Hook bersama `useLokasi()` (izin, status layanan lokasi, posisi saat ini, pemantauan posisi, galat) yang dipakai Arsy dan Wahyu.
- [ ] Layar/banner kondisi perangkat: izin ditolak (dengan tombol buka pengaturan), GPS mati, lokasi belum tersedia, offline, notifikasi tidak aktif.
- [ ] Perbarui `firestore.rules` untuk koleksi/field baru (lihat kontrak data di bawah).

**Output:** Pengguna menerima notifikasi sesuai peran dan kelasnya, dan semua kondisi izin/perangkat ditangani dengan pesan yang jelas.

---

### 🧑‍💻 Arsy Thariq Munawar — Laboratorium & Peta

**User story**

- Arsy Thariq Munawar - FR-19 : Sebagai asisten, saya dapat menambah, melihat, mengubah, dan menghapus laboratorium beserta koordinat dan radius presensinya, serta memilih laboratorium saat membuat atau mengubah sesi
- Arsy Thariq Munawar - FR-20 : Sebagai pengguna, saya dapat melihat peta laboratorium Informatika dengan posisi saya yang diperbarui langsung, lalu memilih marker untuk melihat informasi laboratorium

**Programming Tasks**

- [ ] Koleksi `labs` di Firestore dan halaman kelola laboratorium untuk asisten (tambah, lihat, ubah, hapus).
- [ ] Validasi input laboratorium (nama wajib, latitude −90..90, longitude −180..180, radius > 0) dengan pesan jelas.
- [ ] Tambahkan field `labId` pada sesi; form sesi memiliki pilihan laboratorium (field `ruang` tetap untuk tampilan).
- [ ] Halaman Maps untuk kedua peran: marker semua laboratorium dan marker posisi pengguna yang diperbarui selama halaman dipakai.
- [ ] Detail laboratorium saat marker dipilih (nama, deskripsi, radius) yang menyematkan komponen `AktivitasLab` dari Wahyu.
- [ ] Konfigurasi Google Maps untuk build Android dan tampilan peta saat izin lokasi ditolak atau lokasi belum tersedia (memakai `useLokasi` dari Aprillia).

**Output:** Asisten dapat menentukan lokasi laboratorium, dan semua pengguna dapat membuka peta interaktif.

---

### 👨‍💻 Wahyu Aji Gumelar Tri Nugroho — Presensi Berbasis Lokasi & Aktivitas Laboratorium

**User story**

- Wahyu Aji Gumelar Tri Nugroho - FR-17 : Sebagai praktikan, saya memiliki halaman presensi khusus yang menampilkan informasi dan status sesi serta tombol presensi
- Wahyu Aji Gumelar Tri Nugroho - FR-18 : Sebagai praktikan, presensi saya hanya tercatat jika sesi sedang dibuka dan saya berada dalam radius laboratorium, dan saya melihat hasil pemeriksaan lokasinya
- Wahyu Aji Gumelar Tri Nugroho - FR-21 : Sebagai pengguna, saya melihat praktikum yang sedang berlangsung dan berikutnya pada setiap laboratorium
- Wahyu Aji Gumelar Tri Nugroho - FR-24 *(opsional)* : Sebagai praktikan, saya dapat presensi dengan memindai QR Code yang ditampilkan asisten

**Programming Tasks**

- [ ] Halaman presensi baru, terpisah dari detail sesi; tombol di detail sesi mengarah ke halaman ini.
- [ ] Fungsi perhitungan jarak (Haversine) antara posisi perangkat dan laboratorium.
- [ ] Validasi lokasi **di dalam proses pencatatan presensi** (transaksi), bukan hanya tampilan: sesi dibuka, dalam radius, belum pernah presensi.
- [ ] Simpan data presensi tambahan: `labId`, `lokasi`, `jarakMeter`.
- [ ] Tampilan hasil: berhasil, di luar radius (tampilkan jarak dan radius), lokasi tidak tersedia, sesi tidak dibuka, sudah presensi.
- [ ] Hook `useAktivitasLab(labId)` dan komponen `AktivitasLab`: praktikum sedang berlangsung dan berikutnya (nama, kelas, waktu, status), real-time dari data sesi.
- [ ] Rekap kehadiran asisten tetap berjalan real-time dengan data presensi baru.
- [ ] *(Opsional)* Presensi QR Code: tampil di sisi asisten, pindai di sisi praktikan.

**Output:** Presensi hanya berhasil pada sesi yang dibuka dan di dalam radius, dan informasi aktivitas laboratorium tampil sesuai data Firestore.

---

## 11. Kontrak Antar-Modul (Wajib Disepakati Bersama)

| Item | Isi | Pemilik |
| :--- | :--- | :--- |
| Koleksi `labs/{labId}` | `nama`, `deskripsi`, `latitude`, `longitude`, `radiusMeter`, `createdAt`, `updatedAt` | Arsy |
| Field baru `sesi.labId` | ID laboratorium; `ruang` tetap ada untuk tampilan | Arsy |
| Field baru pada `presensi` | `labId`, `lokasi` (`lat`, `lng`, `akurasiMeter`), `jarakMeter` | Wahyu |
| Token notifikasi pada `users/{uid}` | Token perangkat milik pengguna tersebut | Aprillia |
| Hook `useLokasi()` | Izin, status layanan lokasi, posisi, galat, fungsi meminta izin | Aprillia |
| Komponen `AktivitasLab` dan hook `useAktivitasLab(labId)` | Praktikum berlangsung dan berikutnya untuk satu laboratorium | Wahyu |
| Pemicu notifikasi | Pemanggilan dari pembukaan sesi dan perubahan jadwal (kode Arsy) serta keputusan izin (kode Wahyu) ke pengirim notifikasi (kode Aprillia) | Aprillia |

---

## 12. Alur Demonstrasi Utama (Sprint 3)

- **Presensi berbasis lokasi:** Asisten membuka sesi → praktikan membuka halaman presensi → aplikasi memeriksa lokasi perangkat dan radius laboratorium → presensi tercatat jika memenuhi ketentuan → asisten melihat rekap kehadiran.
- **Peta dan informasi laboratorium:** Pengguna membuka halaman Maps → aplikasi menampilkan posisi pengguna dan marker laboratorium → pengguna memilih laboratorium → aplikasi menampilkan praktikum yang sedang berlangsung dan berikutnya dari Firestore.
- **Notifikasi kegiatan:** Asisten membuka sesi, mengubah jadwal, atau memutuskan izin → sistem mengirim push notification → pengguna terkait menerima pemberitahuan.

<p align="center">
  <b>WEEK 6 — MOBILE PRACTICUM ATTENDANCE</b><br/>
  React Native · Expo · Firebase · AI
</p>