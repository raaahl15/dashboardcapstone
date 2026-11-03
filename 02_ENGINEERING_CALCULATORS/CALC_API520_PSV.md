---
id: "CALC-API520-001"
title: "Kalkulator Sizing Katup Pelepas Tekanan (PSV)"
category: "Engineering Calculator"
standard: "API 520 Part I / API 521 / ASME BPVC Sec. VIII"
target_files:
  - "CALC_API520_PSV.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — skenario relief belum diturunkan dari HMB/API 521"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Safety", "PSV", "Relief", "Area-100", "Area-200"]
---

# Panduan Penggunaan: CALC_API520_PSV.csv

> ⚠️ **DATA PLACEHOLDER — JANGAN DIKUTIP KE LAPORAN.**
> Seluruh nilai berasal dari skrip bootstrap (LOG-004). Laju relief, skenario, dan luas orifice belum dihitung. Nilai akan diganti di **Fase 3**.

## 1. Cakupan
Menentukan skenario relief penentu (API 521), laju relief yang dibutuhkan, luas orifice efektif (API 520 Part I), dan pemilihan huruf orifice API 526 untuk setiap PSV.

## 2. Persamaan Luas Orifice (uap/gas, aliran kritis, API 520 Part I)
$$A = \frac{W}{C\, K_d\, P_1\, K_b\, K_c} \sqrt{\frac{T\, Z}{M}}$$

## 3. Catatan Inkonsistensi pada Data Placeholder (Re-audit 2026-11-03)
1. **`PSV-101` undersized**: luas terhitung 845,2 mm², tetapi orifice terpilih huruf **J = 830 mm²** (lebih kecil dari kebutuhan). Orifice terpilih harus ≥ luas terhitung.
2. Laju relief (14.500 / 18.200 / 11.000 kg/h) tidak memiliki turunan skenario API 521 (blocked outlet, fire case, reflux failure, dll.).
3. Tag peralatan `REAC-01`, `C-01`, `C-02` belum mengikuti `tag_map.csv`.

## 4. SOP (berlaku mulai Fase 3)
1. Identifikasi seluruh skenario relief per peralatan berdasarkan API 521; pilih skenario dengan laju terbesar.
2. Ambil properti fluida relief (M, Z, k, T) dari `hmb_streams.json` atau perhitungan kondisi relief.
3. Hitung manual luas orifice, pilih huruf orifice API 526 ≥ luas terhitung; tuliskan di laporan PSTF 2 Bab 2.
4. Verifikasi silang dengan skrip `tools/calc/` (library `fluids.safety_valve`).

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan PSV-101 undersized (LOG-004). |
