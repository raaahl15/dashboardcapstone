---
id: "SAFE-ESD-DME-001"
title: "Matriks Sebab-Akibat (Cause & Effect) Sistem ESD"
category: "Functional Safety"
standard: "IEC 61511 / ISA-84 / ISA-5.2"
target_files:
  - "Cause_and_Effect_Matrix_ESD.csv"
generated_by: ""
source_data:
  - "Fungsi SIS dari Draf P&ID DME-PID-002 Rev B (LOG-036); setpoint & SIL PLACEHOLDER sampai HAZOP + LOPA"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-04"
tags: ["SIS", "ESD", "SIL", "Cause & Effect"]
---

# Panduan Penggunaan: Cause_and_Effect_Matrix_ESD.csv

> ⚠️ **SETPOINT & SIL = PLACEHOLDER.** Sejak LOG-036 tag mengikuti Draf P&ID `DME-PID-002` Rev B dan Master Instrument Index. Setpoint trip dan target SIL **belum ditentukan** lewat HAZOP + LOPA sesuai IEC 61511 (RFP §3.1.2, PSTF 2), jadi tertulis `TBD` dan tidak boleh dikutip.

## 1. Fungsi Dokumen
Memetakan setiap pemicu (*cause*: sensor trip) ke aksi keselamatan (*effect*: katup/motor), lengkap dengan target SIL dan waktu respons. Panduan Capstone (BAB IV §4.3) mewajibkan SIL ditentukan dari evaluasi probabilitas kegagalan, bukan ditetapkan langsung.

## 2. Isi (Area 1, dari P&ID)
1. `TSHH-102`: suhu bed R-101 tinggi-tinggi dari tiga elemen `TE-102A/B/C` (voting 2oo3, terpisah dari `TIC-101`) →
   - tutup katup shut-off umpan `XV-102` lewat solenoid `XY-102` (< 2 s),
   - trip pompa umpan `P-101` (< 1 s),
   - alarm trip `XA-102` di HMI.

Fungsi kolom distilasi (`PSHH-201`, `LSHH-202`, `LSLL-202`, `ESDV-201`, `FCV-202`, `TCV-201`) dikeluarkan karena berada di lingkup Area 2 (keputusan PM LOG-014/015).

## 3. Catatan Inkonsistensi (Re-audit 2026-11-03)
1. `ESDV-201`, `FCV-202`, `TCV-201`, dan seluruh tag switch (`TSHH`, `PSHH`, `LSHH`, `LSLL`) tidak ada di Master Instrument Index.
2. Alarm database memakai `TAHH-101`/`PAHH-201`/`LALL-202` untuk fungsi yang sama; pilih satu konvensi (switch trip vs alarm) dan sinkronkan.
3. Target SIL-3 untuk dua fungsi pertama perlu justifikasi kuat; SIL-3 jarang dipakai di industri proses dan berdampak besar pada arsitektur dan biaya.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; catatan inkonsistensi (LOG-004). |
| 0.3 | 2026-11-04 | Claude Code (AI) | Diselaraskan dengan P&ID DME-PID-002 Rev B: `TSHH-101`/`ESDV-101`/`PUMP-01` → `TSHH-102`/`XV-102`/`P-101`, tambah `XA-102`; setpoint 320 °C dan SIL-3 contoh diganti `TBD`; baris Area 2 dikeluarkan. Catatan inkonsistensi 1–2 selesai, butir 3 terjawab oleh TBD (LOG-036). Perlu review PIC (AL). |
