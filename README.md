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

<p align="center">
  <b>WEEK 6 — MOBILE PRACTICUM ATTENDANCE</b><br/>
  React Native · Expo · Firebase · AI
</p>
