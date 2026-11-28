import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { buatTemplatCSV, GalatImpor, NAMA_TEMPLAT, type JenisImpor } from './laboratoriumDistribution';

/** FR-06: menyimpan templat CSV ke cache lalu membuka lembar bagikan/simpan milik sistem. */
export async function unduhTemplat(jenis: JenisImpor): Promise<void> {
  if (Platform.OS === 'web') throw new GalatImpor('Unduh templat hanya tersedia di aplikasi Android/iOS.');
  const file = new File(Paths.cache, NAMA_TEMPLAT[jenis]);
  if (file.exists) file.delete();
  file.create();
  file.write(buatTemplatCSV(jenis));
  if (!(await Sharing.isAvailableAsync())) {
    throw new GalatImpor('Perangkat ini tidak mendukung berbagi file.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: `Simpan ${NAMA_TEMPLAT[jenis]}`,
    UTI: 'public.comma-separated-values-text',
  });
}

/** Memilih file CSV dari perangkat dan mengembalikan isinya. null jika pengguna membatalkan. */
export async function pilihFileCSV(): Promise<{ nama: string; isi: string } | null> {
  const hasil = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (hasil.canceled || !hasil.assets?.[0]) return null;
  const aset = hasil.assets[0];
  if (aset.size && aset.size > 1024 * 1024) throw new GalatImpor('Ukuran file terlalu besar (maksimal 1 MB).');
  if (!/\.(csv|txt)$/i.test(aset.name)) throw new GalatImpor('Format file harus .csv. Simpan dari Excel dengan "CSV (Comma delimited)".');
  const isi = await new File(aset.uri).text();
  return { nama: aset.name, isi };
}
