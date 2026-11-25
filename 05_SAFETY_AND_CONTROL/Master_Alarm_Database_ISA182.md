---
id: "SAFE-ALARM-DME-001"
title: "Database Pengelolaan & Rasionalisasi Alarm"
category: "Functional Safety"
standard: "ANSI/ISA-18.2-2016 / EEMUA Publication 191"
target_files:
  - "Master_Alarm_Database_ISA182.csv"
generated_by: ""
source_data:
  - "Alarm dari Draf P&ID DME-PID-002 Rev B (LOG-036) + Instrument Index Rev C (LOG-082); TAL/TAH/TAHH-101 dari WO-031 (diterima dosen Bimbingan 8); setpoint lain PLACEHOLDER (TBD) sampai rasionalisasi alarm"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-26"
tags: ["Alarm Management", "ISA-18.2", "EEMUA 191"]
---

# Panduan Penggunaan: Master_Alarm_Database_ISA182.csv

> ✅ **Batas suhu bed R-101 (WO-031) sudah ditetapkan:** `TAL-101` = 250 °C, `TAH-101` = 360 °C, `TAHH-101` = 400 °C. Nilai dari Ihsan (WO-031), **diterima dosen pada Bimbingan 8 (19 Nov 2026)**. Dasar: titik operasi 250 °C (HMB), suhu adiabatik 371,2 °C (Bab 1, Pers. 1.2), batas deaktivasi katalis 400 °C (Turton).
>
> ⚠️ Setpoint lain (`TAH-104`, `LAL-105`, `LAL-113`) masih **PLACEHOLDER (TBD)** sampai rasionalisasi alarm. Prioritas semua alarm masih usulan.

## 1. Fungsi Dokumen
Daftar alarm hasil rasionalisasi ISA-18.2: tag, tipe (L/H/LL/HH), setpoint, prioritas, respons operator, dan konsekuensi jika diabaikan.

## 2. Klasifikasi Prioritas (usulan, belum dirasionalisasi)
- **Class 1 (Emergency/Critical)**: `TAHH-101` (suhu bed R-101 HH), `XA-102` (trip SIS R-101, lingkup PSTF 2).
- **Class 2 (Medium)**: `TAH-101` (suhu bed R-101 H), `TAH-104` (keluaran E-101), `LAL-105` (level T-101), `LAL-113` (level air ketel R-101).
- **Class 3 (Low)**: `TAL-101` (suhu bed R-101 L), `PDAH-112` (ΔP unggun, fouling).

`TAL/TAH/TAHH-101` dimasukkan kembali (Rev 0.4) sebagai penanda L/H/HH pada `TT-101`, sesuai arahan Bimbingan 6 dan Instrument Index Rev C. Alarm contoh lama Area 2 (`PAH/PAHH-201`, `LAL/LALL-202`, `AAL-201`) tetap dikeluarkan.

**Catatan nilai L:** `TAL-101` sama dengan setpoint `TIC-101` (250 °C). Pada DCS alarm ini perlu deadband atau penundaan waktu agar tidak berbunyi terus saat operasi normal. Detailnya diatur saat rasionalisasi alarm.

## 3. Catatan Inkonsistensi (Re-audit 2026-11-03)
1. `AAL-201` di kolom prioritas tertulis `High (Class 2)`, sedangkan alarm Class 2 lain tertulis `Medium (Class 2)`.
2. `PAH-201` = 12,5 bar(a), sedangkan Master Instrument Index menulis alarm H `PIC-201` = 13,5 bar.
3. Batas kemurnian DME: alarm `AAL-201` = 99,90% mol, sedangkan FDS menulis 99,99%.
4. Peralatan `E-01`, `HEATER-01`, `PUMP-02` belum memakai tag pabrik dari `tag_map.csv`.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; catatan inkonsistensi (LOG-004). |
| 0.3 | 2026-11-04 | Claude Code (AI) | Diganti dengan alarm yang digambar di P&ID DME-PID-002 Rev B (`TAH-104`, `LAL-105`, `XA-102`), setpoint `TBD`; alarm Area 2 dikeluarkan; catatan inkonsistensi 1–4 tidak berlaku lagi (LOG-036). Perlu review PIC (AL). |
| 0.4 | 2026-11-26 | Claude Code (AI) | + `TAL/TAH/TAHH-101` = 250/360/400 °C (WO-031, diterima dosen Bimbingan 8), + `PDAH-112` (+25 kPa) dan `LAL-113` (TBD) dari Instrument Index Rev C; prioritas usulan diperbarui (LOG-086). Perlu review PIC (AL). |
