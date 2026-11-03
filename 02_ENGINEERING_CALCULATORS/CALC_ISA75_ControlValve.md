---
id: "CALC-ISA75-001"
title: "Kalkulator Sizing Katup Kendali (Control Valves)"
category: "Engineering Calculator"
standard: "ANSI/ISA-75.01.01 / IEC 60534-2-1"
target_files:
  - "CALC_ISA75_ControlValve.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — belum terhubung ke hmb_streams.json"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Control Valve", "Cv", "Area-100", "Area-200", "Instrumentation"]
---

# Panduan Penggunaan: CALC_ISA75_ControlValve.csv

> ⚠️ **DATA PLACEHOLDER — JANGAN DIKUTIP KE LAPORAN.**
> Seluruh nilai berasal dari skrip bootstrap (LOG-004), bukan hasil perhitungan. Nilai akan diganti di **Fase 3**.

## 1. Cakupan
Menghitung koefisien aliran $C_v$, memeriksa choked flow/kavitasi (cair) dan choked flow (gas), memilih ukuran bodi, karakteristik trim, dan aksi gagal (*fail action*) untuk katup kendali proses. Daftar tag mengikuti Master Instrument Index.

## 2. Standar Acuan
- **ISA-75.01.01 / IEC 60534-2-1** — persamaan aliran untuk sizing control valve.
- Panduan Capstone DTNTF 2026 BAB IV §4.1: nilai $C_v$ **serta analisis pencegahan kavitasi** wajib dihitung.

## 3. Persamaan Utama (cair, aliran turbulen non-choked)
$$C_v = \frac{Q}{N_1 F_P} \sqrt{\frac{\rho_1/\rho_0}{\Delta p}}$$
dengan pemeriksaan choked flow: $\Delta p_{choked} = F_L^2 \,(p_1 - F_F\, p_v)$. Untuk gas/uap memakai bentuk persamaan dengan faktor ekspansi $Y$ dan rasio $x_T$.

## 4. Catatan Inkonsistensi pada Data Placeholder (Re-audit 2026-11-03)
1. `TCV-102` menulis `450 kg/h` di kolom `FLOW_M3_H` (satuan tidak konsisten).
2. Belum ada kolom $p_v$, $F_L$, $F_F$, sehingga pemeriksaan kavitasi yang diwajibkan panduan belum ada.
3. Kolom gas (`PCV-201`) memakai format kolom yang sama dengan cair; persamaan gas membutuhkan $M$, $Z$, $\kappa$, $x_T$.

## 5. SOP (berlaku mulai Fase 3)
1. Ambil kondisi proses dari `hmb_streams.json` per tag (lewat `tag_map.csv`).
2. Hitung manual $C_v$ pada laju min/normal/maks + cek kavitasi; tuliskan di laporan PSTF 2 Bab 2.
3. Verifikasi silang dengan skrip `tools/calc/` (library `fluids`, IEC 60534).
4. Pilih ukuran katup sehingga bukaan pada laju normal berada di rentang wajar (sekitar 20–80%).

## 6. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
