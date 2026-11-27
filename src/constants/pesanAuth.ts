/** FR-15: mengubah galat Firebase Authentication/Firestore menjadi pesan yang jelas bagi pengguna. */
export function pesanAuth(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan kamu.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Gunakan email lain atau masuk.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/operation-not-allowed':
      return 'Login email/password belum diaktifkan di Firebase Console.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Data ditolak server. Pastikan data valid (mis. kode asisten benar dan NIM belum dipakai).';
    case 'unavailable':
    case 'firestore/unavailable':
      return 'Server tidak dapat dihubungi. Periksa koneksi internet.';
    default:
      return 'Terjadi kesalahan. Silakan coba kembali.';
  }
}
