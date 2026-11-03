---
id: "SAFE-ALARM-DME-001"
title: "Database Pengelolaan & Rasionalisasi Alarm"
category: "Functional Safety"
standard: "ANSI/ISA-18.2-2016 / EEMUA Publication 191"
target_files:
  - "Master_Alarm_Database_ISA182.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — setpoint belum diturunkan dari kondisi operasi HMB & batas desain"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Alarm Management", "ISA-18.2", "EEMUA 191"]
---

# Panduan Penggunaan: Master_Alarm_Database_ISA182.csv

> ⚠️ **DATA CONTOH (PLACEHOLDER).** Setpoint dan prioritas belum hasil rasionalisasi alarm. Jangan dikutip ke laporan.

## 1. Fungsi Dokumen
Daftar alarm hasil rasionalisasi ISA-18.2: tag, tipe (L/H/LL/HH), setpoint, prioritas, respons operator, dan konsekuensi jika diabaikan.

## 2. Klasifikasi Prioritas (data contoh)
- **Class 1 (Emergency/Critical)**: `TAHH-101`, `PAHH-201`, `LALL-202`.
- **Class 2 (Medium/High)**: `TAH-101`, `PAH-201`, `LAL-202`, `AAL-201`.
- **Class 3 (Low)**: `TAL-101`.

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
