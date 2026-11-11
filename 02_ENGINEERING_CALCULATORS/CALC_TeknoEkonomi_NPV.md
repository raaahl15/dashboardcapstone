---
id: "CALC-TEKNOEKONOMI-001"
title: "Model Analisis Kelayakan Tekno-Ekonomi Area 1"
category: "Financial & Economic Evaluation"
standard: "AACE International RP 18R-97 (klasifikasi estimasi)"
target_files:
  - "CALC_TeknoEkonomi_NPV.csv"
  - "inputs/NPV-001.yaml"
generated_by: "tools/calc/npv.py (npm run calc)"
source_data:
  - "tools/calc/bab4_ekonomi.py → CALC_Bab4_Ekonomi_Area1.csv (Instrument Index Rev C + HMB + harga publik 2026)"
author: "Heidi Falina Brilian (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-12"
tags: ["Economics", "CAPEX", "OPEX", "NPV", "IRR"]
---

# Panduan Analisis Kelayakan: CALC_TeknoEkonomi_NPV.csv

> 🔄 **FILE HASIL GENERATE (LOG-020).** CSV ditulis ulang oleh `npm run calc` dari `inputs/NPV-001.yaml`. Jangan edit CSV; ubah input YAML.
>
> ✅ **INPUT KASUS DASAR BAB 4 (LOG-083, status ASUMSI).** Input diganti dengan hasil `tools/calc/bab4_ekonomi.py` (lihat `CALC_Bab4_Ekonomi_Area1.md`): CAPEX Area 1 1.877.960 USD, OPEX 1.298.220 USD/tahun, porsi margin Area 1 1.697.194 USD/tahun, i = 10 %, n = 20 tahun. Hasil: NPV 1.518.731 USD, IRR 20,76 %, payback 4,71 tahun (terdiskonto 6,69 tahun), cocok dengan model Bab 4. Data contoh lama (CAPEX 4,85 jt USD) sudah tidak dipakai.

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
2. Cari harga katalog/vendor (cantumkan sumber dan tanggal kurs) dan isi `inputs/NPV-001.yaml` dengan status yang sesuai.
3. Hitung NPV, IRR, Payback, dan sensitivitas terhadap discount rate & harga produk (sensitivitas belum ada di skrip; tambahkan bila dibutuhkan untuk rubrik *Sangat Baik*).
4. `npm run calc` sebagai verifikasi silang (`numpy-financial`).

**Model skrip:** tahun 0 = −CAPEX, tahun 1..n = pendapatan − OPEX, tanpa pajak/depresiasi/eskalasi. **Uji verifikasi:** contoh buku teks (CAPEX 1.000, CF 500 × 3 tahun, i = 10 %) → NPV 243,43; NPV(IRR) = 0; payback 2,00 tahun; terdiskonto 2,352 tahun.

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; hitung ulang NPV/Payback (LOG-004). |
| 1.0 | 2026-11-03 | Claude Code (AI) | Kalkulator skrip `tools/calc/npv.py` + payback terdiskonto; input contoh dipindah ke YAML (PLACEHOLDER); uji verifikasi (LOG-020). |
| 1.1 | 2026-11-12 | Claude Code (AI) | Input diganti nilai kasus dasar Bab 4 (status ASUMSI); verifikasi silang cocok (LOG-083). |
