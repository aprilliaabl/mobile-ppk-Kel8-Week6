import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { bukaSesi, tutupSesi, useRekapSesi } from "../constants/dummy";
import { Sesi } from "../constants/types";
import { W } from "../constants/warna";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { ConfirmModal } from "./ConfirmModal";

/**
 * FR-05: tombol Buka/Tutup sesi beserta bottom sheet (form catatan) dan modal konfirmasi.
 * mode "ganda": dua tombol berdampingan (Dashboard). mode "tunggal": hanya tombol yang relevan (halaman detail).
 */
export function KontrolSesi({
  sesi,
  mode = "ganda",
}: {
  sesi: Sesi;
  mode?: "ganda" | "tunggal";
}) {
  const [bukaOpen, setBukaOpen] = useState(false);
  const [tutupOpen, setTutupOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState<"buka" | "tutup" | null>(null); // mencegah ketukan ganda
  const [gagal, setGagal] = useState<string | null>(null);
  const jumlahHadir = useRekapSesi(sesi.id, "asisten").length;

  const pesanError = (e: unknown) =>
    e instanceof Error
      ? e.message
      : "Terjadi gangguan. Periksa koneksi lalu coba lagi.";

  const mulaiBuka = () => {
    setGagal(null);
    setBukaOpen(true);
  };
  const mulaiTutup = () => {
    setGagal(null);
    setTutupOpen(true);
  };

  const konfirmasiBuka = async () => {
    if (proses) return;
    setProses("buka");
    setGagal(null);
    try {
      await bukaSesi(sesi.id, catatan);
      setCatatan("");
      setBukaOpen(false);
    } catch (e) {
      setGagal(pesanError(e));
    } finally {
      setProses(null);
    }
  };

  const konfirmasiTutup = async () => {
    if (proses) return;
    setProses("tutup");
    setGagal(null);
    try {
      await tutupSesi(sesi.id);
      setTutupOpen(false);
    } catch (e) {
      setGagal(pesanError(e));
    } finally {
      setProses(null);
    }
  };

  const tombolBuka = (
    <View style={{ flex: 1 }}>
      <Button
        label={sesi.status === "dibuka" ? "Sesi Sedang Dibuka" : "Buka Sesi"}
        variant="success"
        onPress={mulaiBuka}
        disabled={sesi.status !== "belum_dibuka"}
      />
    </View>
  );
  const tombolTutup = (
    <View style={{ flex: 1 }}>
      <Button
        label={sesi.status === "ditutup" ? "Sesi Telah Ditutup" : "Tutup Sesi"}
        variant="danger"
        onPress={mulaiTutup}
        disabled={sesi.status !== "dibuka"}
      />
    </View>
  );

  return (
    <>
      {mode === "ganda" ? (
        <View style={styles.row}>
          {tombolBuka}
          {tombolTutup}
        </View>
      ) : sesi.status === "belum_dibuka" ? (
        tombolBuka
      ) : (
        tombolTutup
      )}

      <BottomSheet
        visible={bukaOpen}
        onClose={() => setBukaOpen(false)}
        title="Buka sesi praktikum?"
      >
        <Text style={styles.desc}>
          {sesi.nama} • Kelas {sesi.kelas}. Setelah dibuka, praktikan dapat
          langsung melakukan presensi.
        </Text>
        <View>
          <Text style={styles.label}>Catatan untuk praktikan (opsional)</Text>
          <TextInput
            value={catatan}
            onChangeText={setCatatan}
            placeholder="Contoh: Bawa laptop dan modul 5"
            placeholderTextColor={W.sub}
            style={styles.input}
            multiline
            maxLength={120}
          />
        </View>
        {!!gagal && <Text style={styles.error}>{gagal}</Text>}
        <Button
          label={proses === "buka" ? "Membuka..." : "Ya, buka sesi"}
          variant="success"
          onPress={konfirmasiBuka}
          disabled={proses !== null}
        />
        <Button
          label="Batal"
          variant="ghost"
          onPress={() => setBukaOpen(false)}
        />
      </BottomSheet>

      <ConfirmModal
        visible={tutupOpen}
        onClose={() => setTutupOpen(false)}
        ikon="kunci"
        tone="danger"
        title="Tutup sesi ini?"
        message={
          gagal ??
          `${jumlahHadir} dari ${sesi.jumlahPeserta} praktikan sudah presensi. Setelah ditutup, praktikan tidak dapat presensi lagi.`
        }
        actions={
          <>
            <Button
              label={proses === "tutup" ? "Menutup..." : "Ya, tutup sesi"}
              variant="danger"
              onPress={konfirmasiTutup}
              disabled={proses !== null}
            />
            <Button
              label="Batal"
              variant="ghost"
              onPress={() => setTutupOpen(false)}
            />
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  desc: { fontSize: 14, color: W.sub, lineHeight: 20, marginTop: -6 },
  label: { fontSize: 13, fontWeight: "700", color: W.text, marginBottom: 6 },
  error: { fontSize: 13, color: W.red, fontWeight: "600" },
  input: {
    minHeight: 72,
    borderWidth: 1.5,
    borderColor: W.cardAlt,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: W.text,
    textAlignVertical: "top",
    backgroundColor: W.bg,
  },
});
