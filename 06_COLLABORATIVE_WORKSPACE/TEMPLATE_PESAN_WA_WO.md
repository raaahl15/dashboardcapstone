---
id: "COMM-WA-WO-001"
title: "Template Pesan WhatsApp Work Order (Siklus Mingguan)"
category: "Project Communication"
standard: "Blueprint §7.4 Siklus Mingguan WO"
target_files: []
generated_by: ""
source_data:
  - "Keputusan PM 2026-11-05 (Kronologi #18, LOG-061/062)"
author: "Rahul Ghulam Hidayatulloh (PM); disusun Rakai / Claude Code (AI)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-05"
tags: ["WhatsApp", "Work Order", "Komunikasi", "Siklus Mingguan"]
---

# Template Pesan WhatsApp Work Order

Setiap pesan dibuka dengan perkenalan **Rakai**, agen AI Claude Code sekaligus asisten AI Rahul (PM). Status "Revisi" dan jam tenggat **ditulis di pesan**, karena cockpit belum mendukungnya (Blueprint §7.5 UPD-01/02).

**Cara pakai:** salin blok template, ganti semua `[...]`, hapus baris yang tidak dipakai. Format WhatsApp: `*tebal*`, `_miring_`.

| Kode | Kapan dikirim | Isi |
| :---: | :--- | :--- |
| T1 | Minggu 07.00 | Status revisi Sabtu + penugasan WO baru |
| T2 | Selasa 12.00 *(opsional)* | Pengingat tenggat pengajuan Selasa 19.00 |
| T3 | Selasa ≤ 22.00 | WO disetujui PM |
| T4 | Selasa ≤ 22.00 | WO revisi dari PM (tenggat Rabu 23.59) |
| T5 | Kamis 12.00 | WO revisi dari dosen (tenggat Sabtu 19.00) |
| T6 | Kamis 12.00 | WO selesai tanpa revisi dosen |

Link cockpit: https://dashboardcapstonearea1.vercel.app/

---

## T1 · Minggu 07.00 — Status revisi Sabtu + WO baru

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

🔁 *STATUS REVISI BIMBINGAN [N-1]*
_(dikumpulkan Sabtu, [tgl] pukul 19.00)_
• *[WO-xxx]* – [judul] → ✅ *SELESAI*
• *[WO-xxx]* – [judul] → 🔁 *MASIH REVISI*: [catatan singkat], dilanjutkan di WO minggu ini

📋 *WORK ORDER MINGGU [N] – AREA 1 DME*
Terbit: Minggu, [tgl] pukul 07.00
⏰ Ajukan ke PM: *Selasa, [tgl] pukul 19.00*
🗣️ Dipaparkan: *Bimbingan [N], Kamis [tgl]*

1. *[WO-xxx] – [judul]*
   👤 PIC: [nama] | Pendukung: [nama]
   📝 Tugas: [instruksi singkat]
   📦 Output: [hasil yang diserahkan]
   📁 File: [link Drive/Docs/Sheets]

2. *[WO-xxx] – [judul]*
   👤 PIC: [nama]
   📝 Tugas: [instruksi singkat]
   📦 Output: [hasil yang diserahkan]
   📁 File: [link]

📌 Detail & checklist: https://dashboardcapstonearea1.vercel.app/ → Work Order
Kalau sudah selesai, ubah status WO di cockpit menjadi *Diajukan* paling lambat Selasa 19.00.

Semangat, terima kasih! 🙏
— Rakai, atas nama Rahul (PM)
```

## T2 · Selasa 12.00 (opsional) — Pengingat tenggat

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

⏰ *PENGINGAT: tenggat pengajuan WO hari ini pukul 19.00*

WO yang belum diajukan:
• *[WO-xxx]* – [judul] (PIC: [nama]) – checklist [x/y]
• *[WO-xxx]* – [judul] (PIC: [nama]) – checklist [x/y]

Ajukan lewat cockpit (status *Diajukan*). Kalau ada kendala, kabari Rahul sebelum 19.00 ya.
https://dashboardcapstonearea1.vercel.app/

— Rakai, atas nama Rahul (PM)
```

## T3 · Selasa ≤ 22.00 — WO disetujui PM

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

✅ *WO DISETUJUI PM*
• *[WO-xxx]* – [judul] (PIC: [nama])
• *[WO-xxx]* – [judul] (PIC: [nama])

Status: *SELESAI (review PM)*. WO ini siap dipaparkan di *Bimbingan [N], Kamis [tgl]*.
Mohon siapkan penjelasan singkat untuk bagian masing-masing.

Terima kasih, kerja bagus! 🙌
— Rakai, atas nama Rahul (PM)
```

## T4 · Selasa ≤ 22.00 — WO revisi dari PM

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

🔁 *WO REVISI (REVIEW PM)*

*[WO-xxx] – [judul]*
👤 PIC: [nama]
📝 Catatan revisi:
  1. [catatan 1]
  2. [catatan 2]
📁 File: [link]

Status: *REVISI*
⏰ Tenggat revisi: *Rabu, [tgl] pukul 23.59*
⚠️ Toleransi terakhir: *Kamis, [tgl] pukul 07.00* (sebelum bimbingan)

Setelah diperbaiki, ajukan lagi di cockpit (status *Diajukan*).
— Rakai, atas nama Rahul (PM)
```

## T5 · Kamis 12.00 — WO revisi dari dosen

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

🔁 *WO REVISI – HASIL BIMBINGAN [N] ([tgl])*
Dosen pembimbing: [nama dosen]

1. *[WO-xxx] – [judul]*
   👤 PIC: [nama]
   🗣️ Arahan dosen: [arahan]
   📝 Yang harus dikerjakan:
     • [poin 1]
     • [poin 2]
   📁 File: [link]

2. *[WO-xxx] – [judul]*
   👤 PIC: [nama]
   🗣️ Arahan dosen: [arahan]
   📝 Yang harus dikerjakan: [poin]
   📁 File: [link]

Status: *REVISI (BIMBINGAN)*
⏰ Tenggat revisi: *Sabtu, [tgl] pukul 19.00* (review PM s.d. 22.00)
Status revisi diumumkan Minggu pukul 07.00 bersama WO baru.

— Rakai, atas nama Rahul (PM)
```

## T6 · Kamis 12.00 — WO selesai tanpa revisi dosen

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

✅ *WO SELESAI – BIMBINGAN [N] ([tgl])*
Diterima dosen tanpa revisi:
• *[WO-xxx]* – [judul] (PIC: [nama])
• *[WO-xxx]* – [judul] (PIC: [nama])

Status: *SELESAI (FINAL)*. Terima kasih atas kerjanya! 🎉
Jangan lupa isi logbook pertemuan ini maksimal 1×24 jam ya.

— Rakai, atas nama Rahul (PM)
```

---

## Contoh terisi: T5 Bimbingan 6 (Kamis, 5 Nov 2026, pukul 12.00)

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

🔁 *WO REVISI – HASIL BIMBINGAN 6 (5 Nov 2026)*
Dosen pembimbing: Thomas Oka Pratama, S.T., M.Eng.

1. *WO-026 – P&ID Rev C*
   👤 PIC: Jonathan (pendukung: Ihsaan)
   🗣️ Arahan dosen: jalur merah sensor suhu reaktor ke sistem keselamatan dihapus (SIS masuk PSTF 2); sensor suhu cukup indikator dengan penanda batas L/H/HH.
   📝 Yang harus dikerjakan:
     • Hapus jalur merah sensor suhu → SIS
     • Sensor suhu reaktor jadi indikator + penanda L/H/HH (angka boleh "TBD", diisi dari WO-031)
     • Ganti 6 line tag ke format 6 segmen sesuai Legend Rev 1, contoh 6"-EFF-10-1005-S3A-IH
     • Tambah simbol FE-101
     • Cek kelas pipa S-104/S-105 (A1A 150# vs operasi 13,7 barg @250 °C, ASME B16.5)
     • Buka Legend Rev 1 di AutoCAD dan cek tampilannya
   📁 File: P&ID Rev B A3 https://drive.google.com/file/d/139mgb1OOiHVfaICTTI8mvU8B30UethwH/view
            Legend Rev 1 https://drive.google.com/file/d/1hnvC0CsV48WBpg0njxHQGbFbc3ahjBfR/view

2. *WO-024 – FDS (bagian SIS)*
   👤 PIC: Altaf (pendukung: Jonathan)
   🗣️ Arahan dosen: sistem keselamatan (SIS) masuk PSTF 2.
   📝 Yang harus dikerjakan: beri label "Lingkup PSTF 2" pada logika SIS (TSHH-102 2oo3 → XV-102, trip P-101), matriks C&E, dan alarm trip — jangan dihapus.
   📁 File: https://docs.google.com/document/d/1PFiIfHzHZzQxRegLekQ-NUGTXEvloy-lQOi0O3T34wg/edit

3. *WO-029 – Revisi Bab 1*
   👤 PIC: Rahul (pendukung: Ihsaan)
   🗣️ Arahan dosen: review Bab 1 per bab lewat email (sudah dikirim); angka DWSIM diverifikasi dengan hitungan manual.
   📝 Yang harus dikerjakan:
     • Label "Lingkup PSTF 2" pada URS-021 (trip SIS)
     • Review Bab 1 Rev 1 oleh Ihsaan + reviewer bagian (Heidi, Altaf, Jonathan)
     • Tindak lanjuti balasan email dosen bila sudah masuk
   📁 File: https://docs.google.com/document/d/1sR0IRYj7mvfL_qnL9qyKI035ig14XihuafEGQR_c62w/edit

Status: *REVISI (BIMBINGAN)*
⏰ Tenggat revisi: *Sabtu, 7 Nov 2026 pukul 19.00* (review PM s.d. 22.00)
Status revisi diumumkan Minggu, 8 Nov pukul 07.00 bersama WO minggu 7.

— Rakai, atas nama Rahul (PM)
```

---

## T0 · Sekali kirim — Onboarding grup (link + panduan kerja)

Dikirim ke grup WA tim bersama lampiran **Panduan_Kerja_Capstone_DME_Area1.pdf** (Drive `00_CORE_GUIDELINES`). Pesan WO per PIC (Ditugaskan / Direvisi / Disetujui) dikirim dari tombol WhatsApp di detail WO di cockpit (LOG-063/065).

```
Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI Rahul (PM Area 1) 👋

Halo tim Area 1! Mulai minggu ini semua kerja capstone kita jalan lewat satu sistem. Simpan link-link ini ya:

🌐 *Website cockpit* (Work Order, jadwal, MoM, logbook)
https://dashboardcapstonearea1.vercel.app/

💻 *GitHub* (aturan & dokumentasi proyek, publik)
https://github.com/raaahl15/dashboardcapstone

📁 *Google Drive* (AutoCAD, PDF, Docs, Sheets, bukti WO)
https://drive.google.com/drive/folders/1aV2msrsmDPdYxKelZ3UlncmAsO6kmKod

📝 *Laporan PSTF 1* (Google Docs)
https://docs.google.com/document/d/1sR0IRYj7mvfL_qnL9qyKI035ig14XihuafEGQR_c62w/edit

⚙️ *FDS* (Google Docs)
https://docs.google.com/document/d/1PFiIfHzHZzQxRegLekQ-NUGTXEvloy-lQOi0O3T34wg/edit

📊 *Master Instrument Index* (Google Sheets)
https://docs.google.com/spreadsheets/d/1-BvV9mhCch-APvT72VyMZlRTp4wXACQ_lQA2tuYV5kM/edit

📎 *Panduan kerja lengkap* ada di PDF terlampir (13 halaman).

✅ *Yang perlu dilakukan hari ini:*
1. Login website pakai email UGM. Belum punya akun atau lupa password? Japri Rahul.
2. Klik avatar → *Profil* → isi nama panggilan & nomor WA (nomor biasa, misalnya 0812…).
3. Buka Drive. Kalau belum bisa, klik *Minta akses* pakai email UGM.
4. Baca PDF panduan, minimal bab 1 (Mulai Cepat), bab 6 (Work Order), dan bab 9 (kerja dengan AI).

🔁 *Siklus mingguan WO*
• *Minggu 07.00* – WO baru dikirim ke WA masing-masing
• *Selasa 19.00* – batas klik *Ajukan* di website
• Selasa malam – review PM. Kalau revisi: tenggat Rabu 23.59, toleransi Kamis 07.00
• *Kamis* – bimbingan, semua WO dipaparkan
• Kamis 12.00 – revisi dari dosen, tenggat Sabtu 19.00

🤖 Boleh dibantu AI (Claude, Gemini, ChatGPT). Prompt-nya sudah ada di setiap pesan WO. Ingat: angka wajib dicek manual dan jangan pakai nilai PLACEHOLDER.

Kalau ada yang bingung, tanya di grup ya. Semangat! 🙏
— Rakai, atas nama Rahul (PM)
```

## Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-05 | Rakai / Claude Code (AI) | Template T1–T6 + contoh terisi T5 Bimbingan 6 (LOG-062). |
| 0.2 | 2026-11-05 | Rakai / Claude Code (AI) | Tambah T0 onboarding grup (link + panduan kerja PDF) (LOG-068). |
