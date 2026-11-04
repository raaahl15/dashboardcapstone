---
id: "SAFE-ALARM-DME-001"
title: "Database Pengelolaan & Rasionalisasi Alarm"
category: "Functional Safety"
standard: "ANSI/ISA-18.2-2016 / EEMUA Publication 191"
target_files:
  - "Master_Alarm_Database_ISA182.csv"
generated_by: ""
source_data:
  - "Alarm dari Draf P&ID DME-PID-002 Rev B (LOG-036); setpoint PLACEHOLDER (TBD) sampai rasionalisasi alarm"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-04"
tags: ["Alarm Management", "ISA-18.2", "EEMUA 191"]
---

# Panduan Penggunaan: Master_Alarm_Database_ISA182.csv

> ⚠️ **SETPOINT = PLACEHOLDER (TBD).** Sejak LOG-036 daftar alarm mengikuti alarm yang digambar di Draf P&ID `DME-PID-002` Rev B. Setpoint dan prioritas belum hasil rasionalisasi alarm. Jangan dikutip ke laporan.

## 1. Fungsi Dokumen
Daftar alarm hasil rasionalisasi ISA-18.2: tag, tipe (L/H/LL/HH), setpoint, prioritas, respons operator, dan konsekuensi jika diabaikan.

## 2. Klasifikasi Prioritas (usulan, belum dirasionalisasi)
- **Class 1 (Emergency/Critical)**: `XA-102` (trip SIS R-101).
- **Class 2 (Medium)**: `TAH-104` (keluaran E-101), `LAL-105` (level T-101).

Alarm contoh lama (`TAL/TAH/TAHH-101`, `PAH/PAHH-201`, `LAL/LALL-202`, `AAL-201`) dikeluarkan: loop 2xx berada di lingkup Area 2, sedangkan alarm suhu bed kini dipegang `XA-102` (SIS) dan alarm `TIC-101` lain ditambahkan saat rasionalisasi bila diperlukan.

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
