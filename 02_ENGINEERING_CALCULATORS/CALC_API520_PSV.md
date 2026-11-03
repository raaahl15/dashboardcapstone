---
id: "CALC-API520-001"
title: "Kalkulator Sizing Katup Pelepas Tekanan (PSV)"
category: "Engineering Calculator"
standard: "API 520 Part I / API 521 / ASME BPVC Sec. VIII"
target_files:
  - "CALC_API520_PSV.csv"
  - "inputs/PSV-101.yaml"
generated_by: "tools/calc/psv.py (npm run calc)"
source_data:
  - "hmb_streams.json → S-104 (W, T, MW, Z, k fase uap); set pressure & skenario di inputs/PSV-101.yaml"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Safety", "PSV", "Relief", "Area-100"]
---

# Panduan Penggunaan: CALC_API520_PSV.csv

> 🔄 **FILE HASIL GENERATE (LOG-020).** CSV ditulis ulang oleh `npm run calc` dari `inputs/PSV-101.yaml` + `hmb_streams.json`. Jangan edit CSV; ubah input YAML.
>
> ⚠️ **Status data: PLACEHOLDER** karena set pressure 16,0 bar(g) masih data contoh dari index. Skenario relief (blocked outlet) dan tekanan balik masih ASUMSI. Belum boleh dikutip ke laporan.

## 1. Cakupan
Menentukan laju relief, luas orifice efektif (API 520 Part I), dan huruf orifice API 526 untuk PSV **Area 1**: saat ini **PSV-101** (proteksi R-101, fase uap). PSV-201/202 di CSV lama adalah lingkup Area 2/3 dan sudah dikeluarkan. Kajian skenario relief lengkap (API 521: kebakaran, kegagalan pendingin, runaway reaction) belum dikerjakan dan **wajib** sebelum hasil final.

## 2. Persamaan Luas Orifice (uap/gas, aliran kritis, API 520 Part I)
$$A = \frac{W}{C\, K_d\, P_1\, K_b\, K_c} \sqrt{\frac{T\, Z}{M}}$$

dengan $P_1 = P_{set}(1 + \text{overpressure}) + P_{atm}$; aliran kritis bila $P_2 < P_1 \left(\frac{2}{k+1}\right)^{k/(k-1)}$, selain itu dipakai persamaan subkritis.

## 3. Input & Hasil PSV-101 (LOG-020)

| Input | Nilai | Status |
| :--- | ---: | :---: |
| Skenario | Blocked outlet R-101: laju relief = laju masuk normal (S-104) | ASUMSI (API 521 §4.4.2) |
| $W$, $T$ | 10.553,2 kg/h; 250,0 °C | HMB (S-104) |
| $M$, $Z$, $k$ | 31,90 kg/kmol; 0,935; 1,215 | HMB (S-104 fase uap) |
| Set pressure | 16,0 bar(g) | PLACEHOLDER (index) |
| Overpressure | 10 % | STANDAR (API 520, satu katup, non-kebakaran) |
| $K_d$ | 0,975 | STANDAR (sizing awal gas) |
| Tekanan balik, $K_b$, $K_c$ | 1,013 bar(a); 1,0; 1,0 | ASUMSI |

| Hasil | Nilai |
| :--- | ---: |
| $P_1$ relief | 18,61 bar(a) |
| Rezim | kritis ($P_{cf}$ = 10,45 bar(a)) |
| Luas efektif $A$ | 885,3 mm² |
| Orifice API 526 | **K** (1.185,8 mm², margin 34 %) |

**Uji verifikasi:** API 520 Part I contoh 1 (kritis, 3.698 mm²) dan contoh 2 (subkritis, 4.248 mm²) direproduksi lewat modul `psv.py` utuh (termasuk penentuan rezim), selisih < 0,1 %.

## 4. Catatan atas CSV Lama (sudah diganti, Re-audit 2026-11-03)
1. **`PSV-101` undersized**: luas terhitung 845,2 mm², tetapi orifice terpilih huruf **J = 830 mm²** (lebih kecil dari kebutuhan). Orifice terpilih harus ≥ luas terhitung.
2. Laju relief (14.500 / 18.200 / 11.000 kg/h) tidak memiliki turunan skenario API 521 (blocked outlet, fire case, reflux failure, dll.).
3. Tag peralatan `REAC-01`, `C-01`, `C-02` belum mengikuti `tag_map.csv`.

## 5. SOP
1. Identifikasi seluruh skenario relief per peralatan berdasarkan API 521; pilih skenario dengan laju terbesar, lalu perbarui `relief_case` dan `W` di `inputs/PSV-101.yaml`.
2. Tetapkan set pressure dari tekanan desain R-101 (ganti PLACEHOLDER) dan tekanan balik dari sistem buang (atmosfer/flare).
3. Hitung manual luas orifice, pilih huruf orifice API 526 ≥ luas terhitung; tuliskan di laporan PSTF 2 Bab 2.
4. `npm run calc` sebagai verifikasi silang (library `fluids.safety_valve`); selisih < 0,5 %.

## 6. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan PSV-101 undersized (LOG-004). |
| 1.0 | 2026-11-03 | Claude Code (AI) | Kalkulator skrip `tools/calc/psv.py`; PSV-101 dari HMB S-104 → orifice K; PSV Area 2/3 dikeluarkan; uji API 520 (LOG-020). |
