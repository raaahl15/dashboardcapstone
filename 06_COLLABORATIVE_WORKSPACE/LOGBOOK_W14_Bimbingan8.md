---
id: "LOGBOOK-W14-DME-001"
title: "Draf Entri Logbook W14 (Bimbingan 8, 19 Nov 2026): Kelompok Area 1 + 5 Anggota"
category: "Project Plan"
standard: "Panduan Capstone DTNTF 2026 (Lampiran 2 Logbook)"
target_files: []
generated_by: "Claude Code (Rakai) atas permintaan PM, 2026-11-26"
source_data:
  - "Keterangan PM 2026-11-26: Bimbingan 8 membahas batas suhu reaktor; nilai WO-031 (Ihsan) dinyatakan aman oleh dosen"
  - "PROJECT_HISTORY_AND_AUDIT_LOG.md LOG-076, LOG-085, LOG-086"
author: "Rahul Ghulam Hidayatulloh (PM)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-26"
tags: ["Logbook", "W14", "Bimbingan 8"]
---

# Draf Entri Logbook W14 — Bimbingan 8 (Kamis, 19 Nov 2026)

> ✅ **Diperbarui 2026-11-26 (LOG-087):** keenam entri W14 sudah ada di cockpit (hadir 5/5 menurut PM). Entri AL, JN, dan HD ditulis agen atas permintaan PM; isinya hanya pembahasan sesi B8 dan keterkaitannya dengan WO masing-masing. Placeholder `[isi: …]` di entri IH dihapus. Draf di bawah ini hanya arsip.

**Cara pakai**: buka cockpit → Rapat & Logbook → **Tambah logbook**. Pilih entitas, lalu salin isi kolom di bawah:
- **Minggu**: 14
- **Tanggal**: 19 Nov 2026

**Catatan:**
- Logbook ini terlambat; Panduan meminta logbook diisi paling lambat 1×24 jam setelah sesi.
- Satu-satunya agenda Bimbingan 8 yang tercatat adalah pertanyaan PM tentang batas suhu reaktor. Bagian `[isi: …]` diisi sendiri oleh anggota. Agen tidak menulis pekerjaan yang tidak bisa diverifikasi.

---

## 1. Kelompok Area 1

**Uraian**
> Bimbingan 8 – Batas suhu reaktor R-101 (WO-031): Dikonsultasikan batas penanda alarm suhu bed R-101 pada TT-101:
> - L = 250 °C (titik operasi HMB);
> - H = 360 °C (di bawah suhu adiabatik 371,2 °C);
> - HH = 400 °C (batas deaktivasi katalis, Turton).
>
> Arahan dosen: nilai batas suhu tersebut sudah aman dan dapat dipakai.

**Kendala**
> Sebelum sesi, nilai L sama dengan setpoint TIC-101 dan nilai H dinilai terlalu dekat dengan puncak adiabatik, sehingga belum dimasukkan ke FDS dan alarm database.

**Solusi**
> - Nilai dipakai sesuai arahan dosen; alarm L diberi deadband/penundaan waktu di DCS.
> - Nilai dimasukkan ke Instrument Index, Alarm Database, FDS 6.2, dan Bab 1 (TBD-04).

---

## 2. Rahul Ghulam Hidayatulloh (RG, PM)

**Uraian**
> Bimbingan 8 – Konsultasi batas suhu reaktor (WO-031): Menanyakan kelayakan batas L/H/HH R-101 (250/360/400 °C) kepada dosen. Hasilnya diterima.
>
> [isi: pekerjaan lain minggu ini]

**Kendala**
> [isi]

**Solusi**
> [isi]

---

## 3. Altaf Ramadhan Parvez (AL)

**Uraian**
> Bimbingan 8 – FDS (WO-024): [isi: pekerjaanmu minggu ini]

**Kendala**
> [isi]

**Solusi**
> [isi]. Catatan: FDS 6.2 sudah diisi nilai L/H/HH (Rev 0.4.1); Rev 0.5 untuk Bab 5–7 dicatat PIC.

---

## 4. Ihsaan Zauhair Tsaqif Prawira (IH)

**Uraian**
> Bimbingan 8 – Batas suhu reaktor (WO-031): Nilai usulan L 250 °C, H 360 °C, HH 400 °C (suhu adiabatik 371,2 °C) dinyatakan aman oleh dosen.
>
> [isi: rincian tambahan pekerjaanmu sendiri]

**Kendala**
> Sumber batas 400 °C berasal dari katalis zeolit (Turton); konfirmasi untuk γ-Al₂O₃ dan sitasi lengkap belum ada.

**Solusi**
> Melengkapi sitasi sumber katalis dan menyimpan bukti WO-031 ke 08_WORK_ORDERS_EVIDENCE.

---

## 5. Jonathan Pangihutan Michael Siahaan (JN)

**Uraian**
> Bimbingan 8 – P&ID Rev C (WO-026): [isi: pekerjaanmu minggu ini]

**Kendala**
> [isi]

**Solusi**
> [isi]

---

## 6. Heidi Falina Brilian (HD)

**Uraian**
> Bimbingan 8 – Bab 4 Tekno-Ekonomi (WO-027): [isi: pekerjaanmu minggu ini]

**Kendala**
> [isi]

**Solusi**
> [isi]
