---
id: "INST-IDX-DME-001"
title: "Master Instrument Index & I/O List Pabrik DME Area 1"
category: "Instrumentation Database"
standard: "ISA-5.1 / ISA-TR20.00.01 / API RP 554 (I/O List)"
target_files:
  - "Master_Instrument_Index_DME.csv"
generated_by: "tools/sync/pull_sheets.js (npm run pull:sheets -- --key instrument_index --from-file <csv>)"
source_data:
  - "Google Sheets (registry key: instrument_index); tag diturunkan dari Draf P&ID DME-PID-002 Rev B (LOG-036); CSV = snapshot read-only"
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: "Altaf Ramadhan Parvez"
status: "Draft"
review_evidence: ""
google_ref: "https://docs.google.com/spreadsheets/d/1-BvV9mhCch-APvT72VyMZlRTp4wXACQ_lQA2tuYV5kM/edit"
last_updated: "2026-11-04"
tags: ["Instrument Index", "IO List", "ISA-5.1"]
---

# Panduan Penggunaan: Master_Instrument_Index_DME.csv

> ⚠️ **STATUS DATA: ASUMSI / sebagian PLACEHOLDER (LOG-036).** Sejak 2026-11-04 daftar tag **diturunkan dari Draf P&ID `DME-PID-002` Rev B**: 30 tag, satu baris per instrumen yang digambar, ditambah `FE-101` (orifice dari kalkulator, belum digambar). Rentang dan setpoint kontrol adalah usulan agent dari titik operasi HMB (`ASUMSI`). Setpoint trip SIS dan alarm `TBD` dari HAZOP/LOPA dan rasionalisasi alarm (`PLACEHOLDER`). Baris contoh bootstrap (LOG-004), termasuk loop 2xx Area 2, sudah dihapus. Master ada di **Google Sheets**; CSV ini hanya snapshot dari `tools/sync/pull_sheets.js` dan **tidak boleh diedit langsung**.

> 📄 **Master Google Sheets** (dibuat 2026-11-03, LOG-010): [Master Instrument Index & IO List DME Area 1](https://docs.google.com/spreadsheets/d/1-BvV9mhCch-APvT72VyMZlRTp4wXACQ_lQA2tuYV5kM/edit). Tab `Instrument_Index` (diisi manual, kolom sama dengan CSV + kolom `DATA_STATUS`), `IO_List` (formula `FILTER` dari Instrument_Index, tanpa tag `Mechanical` dan `Soft`, + ringkasan jumlah per IO_TYPE), `Catatan` (status & inkonsistensi). Sinkronisasi pertama Sheets → CSV: 2026-11-03 (LOG-012), menambah kolom `DATA_STATUS`; nilai lain tidak berubah.

> 🔄 **Cara memperbarui CSV ini** (jangan edit CSV langsung): di Sheets buka tab `Instrument_Index` → *File → Download → Comma Separated Values (.csv)*, lalu jalankan `npm run pull:sheets -- --key instrument_index --from-file <path-csv>`. Tambahkan `--dry-run` untuk melihat ringkasan perbedaan tanpa menulis. Skrip menolak CSV tanpa kolom wajib atau dengan `TAG_NUMBER` kosong/ganda.

## 1. Aturan Penomoran Tag (lihat juga Blueprint §2.3)
- Format instrumen: `<huruf fungsi ISA-5.1>-<area><nomor loop>`, contoh `FT-101`, `TIC-102`.
- Digit pertama nomor loop = area pabrik: **1xx** Area 1 reaktor (firma ini), **2xx** Area 2 distilasi 1, **3xx** Area 3 distilasi 2 (LOG-015). Index firma Area 1 hanya berisi tag **1xx**; tag 2xx/3xx hanya boleh muncul sebagai sinyal antarmuka.
- Huruf pertama = variabel terukur (`T`, `P`, `F`, `L`, `A`); huruf berikutnya = fungsi (`I` indikator, `C` kontroler, `T` transmitter, `V` katup, `S` switch, `A` alarm).
- Tag peralatan di kolom lokasi wajib memakai **tag pabrik** dari `tag_map.csv`, bukan tag DWSIM.

## 2. Konvensi Isi (LOG-036)
- `IO_TYPE`: `AI`/`AO`/`DI`/`DO` = I/O fisik; `Soft` = fungsi di DCS/SIS tanpa I/O fisik (kontroler `FIC`/`TIC`/`LIC`, alarm `TAH`/`LAL`/`XA`, trip `TSHH`); `Mechanical` = tanpa sinyal (elemen `TE`/`FE`, gauge `PI`/`LG`, `PSV`). Tab `IO_List` mengecualikan `Soft` dan `Mechanical`.
- Item perpipaan (katup tangan `HV`, check valve `NRV`, strainer `ST`) masuk line list/valve list, **tidak** masuk index. `validate_tags.py` mengecualikannya.
- Elemen SIS redundan ditulis per kanal (`TE-102A`, `TE-102B`, `TE-102C`); di gambar boleh disingkat `TE-102A/B/C`.
- Catatan inkonsistensi re-audit 2026-11-03 (REAC-01/C-01, tag C&E tanpa index, alarm PIC-201) sudah selesai: tag kini sama dengan P&ID, C&E, alarm database, dan FDS Rev 0.4.

## 3. Kolom CSV
`TAG_NUMBER, P_AND_ID_NO, SERVICE_DESCRIPTION, LOCATION, LINE_EQUIPMENT_NO, SIGNAL_TYPE, IO_TYPE, RANGE_MIN, RANGE_MAX, ENG_UNIT, SETPOINT_ALARM, FAIL_MODE, CONTROLLER_TYPE, SAFETY_CRITICAL, DATA_STATUS`

`DATA_STATUS`: `PLACEHOLDER` (nilai belum ada sumber, mis. setpoint TBD) atau `ASUMSI` (tag dari P&ID, nilai usulan beralasan). Status lebih tinggi setelah dikonfirmasi PIC. Daftar kolom wajib ada di `required_columns` registry.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; catatan inkonsistensi tag (LOG-004). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Master dipindah ke Google Sheets; `google_ref` diisi (LOG-010). |
| 0.4 | 2026-11-03 | Claude Code (AI) | CSV disinkron dari Sheets via `pull_sheets.js`: + kolom `DATA_STATUS` (LOG-012). |
| 0.5 | 2026-11-03 | Claude Code (AI) | `REAC-01` → `R-101` (tag_map FINAL) di Sheets lalu disinkron; reviewer Altaf (LOG-016). |
| 0.6 | 2026-11-04 | Claude Code (AI) | Index dibangun ulang dari Draf P&ID DME-PID-002 Rev B (30 tag, FCV-101 → FV-101, ESDV-101 → XV-102, + SIS 2oo3 TE-102A/B/C/TSHH-102); loop 2xx dihapus; IO_List mengecualikan `Soft`; disinkron via `pull_sheets.js` (LOG-036). Perlu review JN/AL. |
