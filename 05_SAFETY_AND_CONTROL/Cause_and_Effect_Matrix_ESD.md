---
id: "SAFE-ESD-DME-001"
title: "Matriks Sebab-Akibat (Cause & Effect) Sistem ESD"
category: "Functional Safety"
standard: "IEC 61511 / ISA-84 / ISA-5.2"
target_files:
  - "Cause_and_Effect_Matrix_ESD.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — belum diturunkan dari HAZOP & penentuan SIL"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["SIS", "ESD", "SIL", "Cause & Effect"]
---

# Panduan Penggunaan: Cause_and_Effect_Matrix_ESD.csv

> ⚠️ **DATA CONTOH (PLACEHOLDER).** Isi berasal dari skrip bootstrap (LOG-004). Nilai SIL (SIL-1 s.d. SIL-3) **belum ditentukan** lewat HAZOP + LOPA/risk graph sesuai IEC 61511, jadi tidak boleh dikutip.

## 1. Fungsi Dokumen
Memetakan setiap pemicu (*cause*: sensor trip) ke aksi keselamatan (*effect*: katup/motor), lengkap dengan target SIL dan waktu respons. Panduan Capstone (BAB IV §4.3) mewajibkan SIL ditentukan dari evaluasi probabilitas kegagalan, bukan ditetapkan langsung.

## 2. Isi Data Contoh
1. `TSHH-101` (suhu bed reaktor ≥ 320 °C) → tutup `ESDV-101` (< 2 s) dan trip pompa umpan (< 1 s).
2. `PSHH-201` (tekanan kolom ≥ 14,5 bar) → trip katup steam reboiler `ESDV-201` (< 3 s).
3. `LSHH-202` / `LSLL-202` (level bawah kolom) → `FCV-202` / `TCV-201`.

## 3. Catatan Inkonsistensi (Re-audit 2026-11-03)
1. `ESDV-201`, `FCV-202`, `TCV-201`, dan seluruh tag switch (`TSHH`, `PSHH`, `LSHH`, `LSLL`) tidak ada di Master Instrument Index.
2. Alarm database memakai `TAHH-101`/`PAHH-201`/`LALL-202` untuk fungsi yang sama; pilih satu konvensi (switch trip vs alarm) dan sinkronkan.
3. Target SIL-3 untuk dua fungsi pertama perlu justifikasi kuat; SIL-3 jarang dipakai di industri proses dan berdampak besar pada arsitektur dan biaya.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; catatan inkonsistensi (LOG-004). |
