---
id: "SAFE-ALARM-DME-001"
title: "Database Pengelolaan & Rasionalisasi Alarm"
category: "Functional Safety"
standard: "ANSI/ISA-18.2-2016 / EEMUA Publication 191"
author: "Altaf Ramadhan Parvez"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "Master_Alarm_Database_ISA182.csv"
---

# Panduan Penggunaan: Master_Alarm_Database_ISA182.csv

Rasionalisasi alarm membagi alarm menjadi 3 kelas:
- **Class 1 (Emergency / Critical)**: `TAHH-101`, `PAHH-201`, `LALL-202` (Aksi otomatis interlock, waktu tanggap operator $< 1\text{ menit}$).
- **Class 2 (Medium / High)**: `TAH-101`, `PAH-201`, `LAL-202`, `AAL-201` (Penyimpangan operasional, waktu tanggap $< 5\text{ menit}$).
- **Class 3 (Low / Informative)**: `TAL-101` (Peringatan pemeliharaan preventif).
