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

## 4. Functional Requirements Overview

| ID | Functional Requirement | Module |
|:---|:---|:---|
| FR-01 | Pemilihan role dan identitas dummy | Schedule |
| FR-02 | Menampilkan daftar jadwal praktikum | Schedule |
| FR-03 | Menampilkan detail sesi praktikum | Schedule |
| FR-04 | Membuka sesi praktikum | Assistant |
| FR-05 | Menutup sesi praktikum | Assistant |
| FR-06 | Menampilkan rekap kehadiran | Assistant |
| FR-07 | Melakukan presensi | Attendance |
| FR-08 | Menampilkan hasil dan waktu presensi | Attendance |
| FR-09 | Menampilkan riwayat presensi | Attendance |

---

## 5. Sprint 1 Goal

Membangun antarmuka dan alur utama aplikasi presensi praktikum yang mencakup pemilihan role, penampilan jadwal, pengelolaan sesi, pencatatan kehadiran, dan riwayat presensi menggunakan data dummy.

---

<p align="center">
  <b>WEEK 6 — MOBILE PRACTICUM ATTENDANCE</b><br/>
  React Native · Expo
</p>