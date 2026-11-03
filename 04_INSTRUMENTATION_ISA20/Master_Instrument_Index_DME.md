---
id: "INST-IDX-DME-001"
title: "Master Instrument Index & I/O List Pabrik DME Area 1"
category: "Instrumentation Database"
standard: "ISA-5.1 / ISA-TR20.00.01 / API RP 554 (I/O List)"
target_files:
  - "Master_Instrument_Index_DME.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — master sekarang di Google Sheets (registry key: instrument_index, LOG-010); CSV menjadi snapshot read-only"
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: "https://docs.google.com/spreadsheets/d/1-BvV9mhCch-APvT72VyMZlRTp4wXACQ_lQA2tuYV5kM/edit"
last_updated: "2026-11-03"
tags: ["Instrument Index", "IO List", "ISA-5.1"]
---

# Panduan Penggunaan: Master_Instrument_Index_DME.csv

> ⚠️ **DATA CONTOH (PLACEHOLDER).** Baris-baris di CSV berasal dari skrip bootstrap (LOG-004), belum diturunkan dari Draf P&ID. Mulai **Fase 2**, master index berada di **Google Sheets**; file CSV ini hanya snapshot yang diperbarui oleh `tools/sync/pull_sheets.py` dan **tidak boleh diedit langsung**.

> 📄 **Master Google Sheets** (dibuat 2026-11-03, LOG-010): [Master Instrument Index & IO List DME Area 1](https://docs.google.com/spreadsheets/d/1-BvV9mhCch-APvT72VyMZlRTp4wXACQ_lQA2tuYV5kM/edit). Tab `Instrument_Index` (diisi manual, kolom sama dengan CSV + kolom `DATA_STATUS`), `IO_List` (formula `FILTER` dari Instrument_Index, tanpa tag `Mechanical`, + ringkasan jumlah per IO_TYPE), `Catatan` (status & inkonsistensi). CSV ini belum disinkron ulang; kolom `DATA_STATUS` akan muncul di CSV pada sinkronisasi `pull_sheets` pertama.

## 1. Aturan Penomoran Tag (lihat juga Blueprint §2.3)
- Format instrumen: `<huruf fungsi ISA-5.1>-<area><nomor loop>`, contoh `FT-101`, `TIC-102`.
- Digit pertama nomor loop = area: **1xx** Reaksi (Area 100), **2xx** Pemurnian DME (Area 200), **3xx** Utilitas (Area 300).
- Huruf pertama = variabel terukur (`T`, `P`, `F`, `L`, `A`); huruf berikutnya = fungsi (`I` indikator, `C` kontroler, `T` transmitter, `V` katup, `S` switch, `A` alarm).
- Tag peralatan di kolom lokasi wajib memakai **tag pabrik** dari `tag_map.csv`, bukan tag DWSIM.

## 2. Catatan Inkonsistensi Data Contoh (Re-audit 2026-11-03)
1. Tag peralatan bercampur: `REAC-01`, `C-01` (index) vs `RC-01`, `CSCOL-01` (DWSIM).
2. Tag yang dirujuk C&E Matrix tetapi **tidak ada** di index: `TSHH-101`, `PSHH-201`, `LSHH-202`, `LSLL-202`, `ESDV-201`, `FCV-202`, `TCV-201`.
3. Alarm tekanan kolom: index `PIC-201` H = 13,5 bar vs alarm database `PAH-201` H = 12,5 bar(a).

## 3. Kolom CSV
`TAG_NUMBER, P_AND_ID_NO, SERVICE_DESCRIPTION, LOCATION, LINE_EQUIPMENT_NO, SIGNAL_TYPE, IO_TYPE, RANGE_MIN, RANGE_MAX, ENG_UNIT, SETPOINT_ALARM, FAIL_MODE, CONTROLLER_TYPE, SAFETY_CRITICAL`

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; catatan inkonsistensi tag (LOG-004). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Master dipindah ke Google Sheets; `google_ref` diisi (LOG-010). |
