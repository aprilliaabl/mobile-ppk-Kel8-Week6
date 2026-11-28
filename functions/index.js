/**
 * FR-22: pengirim push notification berbasis kejadian Firestore.
 *  - sesi dibuka        -> praktikan pada kelas sesi tersebut
 *  - jadwal sesi berubah -> praktikan pada kelas sesi tersebut
 *  - izin diputuskan    -> praktikan yang mengajukan izin
 *
 * Perlu paket Firebase Blaze (bayar sesuai pemakaian; kuota gratis bulanan cukup untuk tugas ini).
 */
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

const REGION = 'asia-southeast2'; // Jakarta
const CHANNEL_ID = 'default';

/** Kumpulkan UID praktikan untuk kelas (dan laboratorium, bila sesi punya) tertentu. */
async function uidPraktikanKelas(kelas, labId) {
  const ids = new Set();
  const kelasNorm = String(kelas || '').trim().toUpperCase();
  if (!kelasNorm) return ids;

  // 1) Profil yang kelasnya sama.
  const profil = await db.collection('users').where('kelas', '==', kelasNorm).get();
  profil.forEach((d) => {
    const x = d.data();
    const roles = Array.isArray(x.roles) ? x.roles : [x.role];
    if (roles.includes('praktikan') && x.accountStatus === 'active') ids.add(d.id);
  });

  // 2) Keanggotaan laboratorium sebagai praktikan pada kelas tersebut.
  const anggota = await db.collection('laboratoriumAnggota').where('kelas', '==', kelasNorm).get();
  anggota.forEach((d) => {
    const x = d.data();
    if (x.role !== 'praktikan') return;
    if (labId && x.laboratoriumId !== labId) return;
    ids.add(x.userId);
  });
  return ids;
}

async function kumpulkanToken(uids) {
  const tokens = [];
  await Promise.all(
    [...uids].map(async (uid) => {
      const snap = await db.collection('users').doc(uid).collection('fcmTokens').get();
      snap.forEach((t) => tokens.push({ uid, token: t.id }));
    })
  );
  return tokens;
}

async function kirim(uids, notification, data) {
  const daftar = await kumpulkanToken(uids);
  if (daftar.length === 0) return;

  for (let i = 0; i < daftar.length; i += 500) {
    const potongan = daftar.slice(i, i + 500);
    const res = await getMessaging().sendEachForMulticast({
      tokens: potongan.map((x) => x.token),
      notification,
      data,
      android: { priority: 'high', notification: { channelId: CHANNEL_ID } },
    });
    // Bersihkan token yang sudah tidak berlaku.
    await Promise.all(
      res.responses.map(async (r, idx) => {
        const kode = r.error && r.error.code;
        if (kode === 'messaging/registration-token-not-registered' || kode === 'messaging/invalid-registration-token') {
          const { uid, token } = potongan[idx];
          await db.collection('users').doc(uid).collection('fcmTokens').doc(token).delete().catch(() => {});
        }
      })
    );
  }
}

const FIELD_JADWAL = ['waktuMulai', 'waktuSelesai', 'ruang', 'laboratoriumId', 'kelas', 'nama'];

exports.notifikasiSesi = onDocumentUpdated({ document: 'sesi/{sesiId}', region: REGION }, async (event) => {
  const sebelum = event.data.before.data();
  const sesudah = event.data.after.data();
  if (!sebelum || !sesudah) return;

  const dibuka = sebelum.status !== 'dibuka' && sesudah.status === 'dibuka';
  const jadwalBerubah = !dibuka && sebelum.status === sesudah.status && FIELD_JADWAL.some((f) => sebelum[f] !== sesudah[f]);
  if (!dibuka && !jadwalBerubah) return;

  const penerima = await uidPraktikanKelas(sesudah.kelas, sesudah.laboratoriumId);
  if (penerima.size === 0) return;

  const data = { tipe: dibuka ? 'sesi_dibuka' : 'jadwal_berubah', sesiId: event.params.sesiId, kelas: String(sesudah.kelas || '') };
  if (dibuka) {
    await kirim(
      penerima,
      { title: 'Sesi praktikum dibuka', body: `${sesudah.nama} (${sesudah.kelas}) sudah dibuka. Segera lakukan presensi di ${sesudah.ruang || 'laboratorium'}.` },
      data
    );
  } else {
    await kirim(
      penerima,
      { title: 'Jadwal praktikum berubah', body: `Jadwal ${sesudah.nama} (${sesudah.kelas}) diperbarui. Cek jadwal terbaru di aplikasi.` },
      data
    );
  }
});

exports.notifikasiIzin = onDocumentUpdated({ document: 'izin/{izinId}', region: REGION }, async (event) => {
  const sebelum = event.data.before.data();
  const sesudah = event.data.after.data();
  if (!sebelum || !sesudah) return;
  if (sebelum.status !== 'pending' || !['disetujui', 'ditolak'].includes(sesudah.status)) return;

  const disetujui = sesudah.status === 'disetujui';
  await kirim(
    new Set([sesudah.praktikanId]),
    {
      title: disetujui ? 'Izin disetujui' : 'Izin ditolak',
      body: `Pengajuan izin untuk ${sesudah.namaSesi} ${disetujui ? 'disetujui' : 'ditolak'} oleh asisten.`,
    },
    { tipe: 'izin_diputuskan', izinId: event.params.izinId, status: sesudah.status }
  );
});
