---
id: "CALC-TEKNOEKONOMI-001"
title: "Model Analisis Kelayakan Tekno-Ekonomi Area 1"
category: "Financial & Economic Evaluation"
standard: "AACE International RP 18R-97 (klasifikasi estimasi)"
target_files:
  - "CALC_TeknoEkonomi_NPV.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — CAPEX/OPEX belum dari BoM/Draf P&ID"
author: "Heidi Falina Brilian (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Economics", "CAPEX", "OPEX", "NPV", "IRR"]
---

# Panduan Analisis Kelayakan: CALC_TeknoEkonomi_NPV.csv

> ⚠️ **DATA PLACEHOLDER — JANGAN DIKUTIP KE LAPORAN.**
> Seluruh nilai berasal dari skrip bootstrap (LOG-004). Nilai akan diganti setelah Draf P&ID dan daftar instrumen tersedia.

## 1. Cakupan
Menurut Panduan Capstone DTNTF 2026 (BAB III §3.3), kajian tekno-ekonomi **berbasis Draf P&ID** dan mencakup: estimasi CAPEX (perangkat keras, software, pipa, jasa engineering), OPEX (listrik, kalibrasi, maintenance), NPV, IRR terhadap suku bunga acuan, dan Payback Period. Rubrik nilai *Sangat Baik* menuntut analisis risiko suku bunga pasar (sensitivitas).

## 2. Persamaan
$$NPV = -CAPEX + \sum_{t=1}^{n} \frac{CF_t}{(1+i)^t}, \qquad CF_t = \text{Savings}_t - OPEX_t$$
IRR adalah nilai $i$ yang membuat $NPV = 0$. Payback sederhana $= CAPEX / CF$ (untuk arus kas konstan).

## 3. Catatan Inkonsistensi pada Data Placeholder (Re-audit 2026-11-03)
Dengan input CSV (CAPEX 4,85 juta USD; savings 1,45 juta; OPEX 0,285 juta → CF = 1,165 juta USD/tahun; i = 10%; n = 20 tahun):

| Indikator | Nilai di CSV | Hitung ulang | Keterangan |
| :--- | :---: | :---: | :--- |
| NPV @10% | 3.742.500 USD | ≈ 5,07 juta USD | Tidak konsisten |
| IRR | 24,8% | ≈ 23,7% | Selisih kecil |
| Payback | 3,8 tahun | ≈ 4,2 tahun | Tidak konsisten (versi lama companion bahkan menulis 3,2 tahun) |

Asumsi umur pabrik 20 tahun dan discount rate 10% juga belum memiliki rujukan.

## 4. SOP
1. Turunkan daftar item CAPEX dari Draf P&ID + Master Instrument Index (jumlah dan jenis instrumen).
2. Cari harga katalog/vendor (cantumkan sumber dan tanggal kurs).
3. Hitung NPV, IRR, Payback, dan sensitivitas terhadap discount rate & harga produk.
4. Verifikasi silang dengan skrip `tools/calc/` (`numpy-financial`).

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; hitung ulang NPV/Payback (LOG-004). |
