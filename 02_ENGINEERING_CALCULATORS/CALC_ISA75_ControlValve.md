---
id: "CALC-ISA75-001"
title: "Kalkulator Sizing Katup Kendali (Control Valves)"
category: "Engineering Calculator"
standard: "ANSI/ISA-75.01.01 / IEC 60534-2-1"
target_files:
  - "CALC_ISA75_ControlValve.csv"
  - "inputs/FCV-101.yaml"
generated_by: "tools/calc/control_valve.py (npm run calc)"
source_data:
  - "hmb_streams.json → S-102 (q_m, P, T, rho, mu fase cair); input lain di inputs/FCV-101.yaml"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Control Valve", "Cv", "Area-100", "Instrumentation"]
---

# Panduan Penggunaan: CALC_ISA75_ControlValve.csv

> 🔄 **FILE HASIL GENERATE (LOG-020).** CSV ditulis ulang oleh `npm run calc` dari `inputs/FCV-101.yaml` + `hmb_streams.json`. Jangan edit CSV; ubah input YAML.
>
> ⚠️ **Status data: PLACEHOLDER** (diameter pipa dari index masih data contoh; ΔP katup, faktor laju maksimum, FL/Fd, dan ukuran katup = ASUMSI). Belum boleh dikutip ke laporan.

## 1. Cakupan
Menghitung $K_v$/$C_v$ pada laju normal dan maksimum, serta memeriksa choked flow, laminar, dan flashing untuk katup kendali cair **Area 1**: saat ini **FCV-101** (umpan metanol, discharge P-101, S-102). Tag Area 2/3 di CSV lama (PCV-201, LCV-202) bukan lingkup firma Area 1 dan sudah dikeluarkan. TCV-102 (steam pemanas) belum dihitung karena utilitas steam belum ada di model DWSIM. Pemilihan ukuran bodi, trim, dan fail action tetap dari katalog vendor.

## 2. Standar Acuan
- **ISA-75.01.01 / IEC 60534-2-1** — persamaan aliran untuk sizing control valve.
- Panduan Capstone DTNTF 2026 BAB IV §4.1: nilai $C_v$ **serta analisis pencegahan kavitasi** wajib dihitung.

## 3. Persamaan Utama (cair, aliran turbulen non-choked)
$$C_v = \frac{Q}{N_1 F_P} \sqrt{\frac{\rho_1/\rho_0}{\Delta p}}$$
dengan pemeriksaan choked flow: $\Delta p_{choked} = F_L^2 \,(p_1 - F_F\, p_v)$. Untuk gas/uap memakai bentuk persamaan dengan faktor ekspansi $Y$ dan rasio $x_T$.

## 4. Input & Hasil FCV-101 (LOG-020)

| Input | Nilai | Status |
| :--- | ---: | :---: |
| $q_m$, $\rho$, $\mu$, $T_1$, $P_1$ | 8.321,3 kg/h; 791,7 kg/m³; 0,551 cP; 25,3 °C; 15,50 bar(a) | HMB (S-102) |
| ΔP katup | 1,0 bar | ASUMSI (tidak ada katup di model DWSIM) |
| Faktor laju maksimum | 1,25 × normal | ASUMSI (tetapkan dari URS) |
| $p_v$ | Antoine metanol NIST (pendekatan campuran x MeOH 0,983) | LITERATUR |
| $p_c$ | 81 bar (NIST) | LITERATUR |
| $F_L$ / $F_d$ | 0,90 / 0,46 (globe single-port tipikal) | ASUMSI (ganti data vendor) |
| $D$ pipa / ukuran katup | 154,08 mm / sama dengan pipa | PLACEHOLDER / ASUMSI |

| Hasil | Normal | Maksimum |
| :--- | ---: | ---: |
| $Q$ | 10,51 m³/h | 13,14 m³/h |
| $K_v$ | 9,36 m³/h | 11,70 m³/h |
| $C_v$ | 10,8 | 13,5 |
| Choked / laminar / flashing | tidak / tidak / tidak ✅ | tidak / tidak ✅ |

$p_v$ pada 25,3 °C = 17,2 kPa. Setelah ukuran katup dipilih dari katalog, ubah `d_valve` dan jalankan ulang (faktor $F_P$ berubah bila ada reducer).

**Uji verifikasi:** IEC 60534-2-1 contoh 1 (globe, $K_v$ = 165,0 m³/h) dan contoh 2 (ball, $K_v$ = 238,1 m³/h) direproduksi; persamaan Antoine diuji pada titik didih normal metanol (337,8 K → 1,013 bar, selisih < 1 %).

## 5. Catatan atas CSV Lama (sudah diganti, Re-audit 2026-11-03)
1. `TCV-102` menulis `450 kg/h` di kolom `FLOW_M3_H` (satuan tidak konsisten).
2. Belum ada kolom $p_v$, $F_L$, $F_F$, sehingga pemeriksaan kavitasi yang diwajibkan panduan belum ada.
3. Kolom gas (`PCV-201`) memakai format kolom yang sama dengan cair; persamaan gas membutuhkan $M$, $Z$, $\kappa$, $x_T$.

## 6. SOP
1. Kondisi proses diambil otomatis dari `hmb_streams.json` (rujukan stream di YAML memakai tag pabrik).
2. Hitung manual $C_v$ pada laju min/normal/maks + cek kavitasi; tuliskan di laporan PSTF 2 Bab 2.
3. `npm run calc` sebagai verifikasi silang (library `fluids`, IEC 60534-2-1); selisih < 0,5 %.
4. Pilih ukuran katup sehingga bukaan pada laju normal berada di rentang wajar (sekitar 20–80 %), lalu perbarui `d_valve`, $F_L$, $F_d$ dari data vendor.

## 7. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
| 1.0 | 2026-11-03 | Claude Code (AI) | Kalkulator skrip `tools/calc/control_valve.py`; FCV-101 dari HMB; tag Area 2/3 dikeluarkan; uji IEC (LOG-020). |
