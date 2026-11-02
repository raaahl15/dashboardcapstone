---
id: "CALC-ISA75-001"
title: "Kalkulator Sizing Katup Kendali (Control Valves)"
category: "Engineering Calculator"
standard: "ANSI/ISA-75.01.01 (IEC 60534-2-1 Mod)"
author: "Altaf Ramadhan Parvez & Jonathan Pangihutan"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "CALC_ISA75_ControlValve.csv"
---

# Panduan Penggunaan: CALC_ISA75_ControlValve.csv

## 1. Cakupan Katup Kendali
Dokumen ini mengkalkulasi koefisien aliran ($C_v$), ukuran bodi, karakteristik trim, dan aksi kegagalan (*fail-safe*) untuk 4 katup proses utama:
- `FCV-101`: Feed Flow Control (Metanol Cair, $C_v$ Desain: 24.6, Terpilih: 35.0, 2" EQ%, Fail Closed).
- `PCV-201`: DME Column Overhead Pressure ($C_v$ Desain: 52.4, Terpilih: 75.0, 3" Linear, Fail Open).
- `LCV-202`: DME Column Bottom Level ($C_v$ Desain: 12.8, Terpilih: 20.0, 1.5" EQ%, Fail Closed).
- `TCV-102`: Preheater Steam Temp ($C_v$ Desain: 18.4, Terpilih: 28.0, 1.5" Linear, Fail Closed).

## 2. Formula Aliran Cairan Tak Mampu Mampat
$$C_v = \frac{q}{N_1 \cdot F_p} \sqrt{\frac{G_f}{\Delta P}}$$
Di mana $G_f = \rho / 1000$ adalah spesific gravity fluida.
