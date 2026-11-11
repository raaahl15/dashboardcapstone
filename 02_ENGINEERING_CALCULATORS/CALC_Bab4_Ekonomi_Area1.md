---
id: "CALC-BAB4-EKONOMI-001"
title: "Model Bab 4 Kajian Tekno-Ekonomi Area 1 (CAPEX/OPEX I&C + kelayakan berbasis penjualan produk)"
category: "Financial & Economic Evaluation"
standard: "AACE International RP 18R-97 (klasifikasi estimasi); Towler & Sinnott ed. 2 (korelasi biaya alat); Peters, Timmerhaus & West (faktor Lang)"
target_files:
  - "CALC_Bab4_Ekonomi_Area1.csv"
generated_by: "tools/calc/bab4_ekonomi.py (.venv/Scripts/python -I tools/calc/bab4_ekonomi.py)"
source_data:
  - "04_INSTRUMENTATION_ISA20/Master_Instrument_Index_DME.csv (Rev C, 46 tag, 22 I/O)"
  - "01_PROCESS_SIMULATION_DWSIM/exported_data/hmb_streams.json (S-01, S-08, beban HEAT-01/COOL-01/RC-01)"
  - "Harga & parameter publik (BI, JISDOR, S&P Global Platts, IMARC, Nexizo, Transcat, Chemical Processing) - dicatat per baris INPUT/BASIS di CSV"
author: "Heidi Falina Brilian (PIC WO-027); model disusun Claude Code (AI) atas instruksi PM (LOG-083)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: "https://docs.google.com/document/d/1sR0IRYj7mvfL_qnL9qyKI035ig14XihuafEGQR_c62w/edit"
last_updated: "2026-11-12"
tags: ["Bab 4", "CAPEX", "OPEX", "I&C", "NPV", "IRR", "Sensitivitas", "WO-027"]
---

# Panduan: CALC_Bab4_Ekonomi_Area1.csv

> 🔄 **FILE HASIL GENERATE.** CSV ditulis ulang oleh `tools/calc/bab4_ekonomi.py`. Jangan edit CSV; ubah blok `IN`/`UP` di skrip lalu jalankan ulang. Kasus dasar diverifikasi silang dengan `inputs/NPV-001.yaml` (`npm run calc`, mesin `npv.py`).
>
> ⚠️ **STATUS ASUMSI.** Harga instrumen sebagian dari harga distributor 2026, sebagian asumsi (ditandai di kolom STATUS). Ketelitian setara AACE Class 3–4; RFP menargetkan Class 2 (penawaran vendor di DED).

## 1. Struktur (keputusan PM 2026-11-12: "dua lapis")
| Lapis | Isi | Dasar |
| :--- | :--- | :--- |
| 1 | CAPEX & OPEX I&C, bottom-up dari Instrument Index Rev C | RFP §3.3.1 |
| 2 | Kelayakan Area 1: α × (penjualan DME − biaya metanol) − OPEX Area 1, terhadap CAPEX Area 1 (faktorial peralatan + I&C) | Arahan Bimbingan 6 (basis penjualan produk, per area dulu) |

## 2. Section CSV
`INPUT` (nilai, sumber, status) · `CAPEX_IC` · `OPEX_IC` · `CAPEX_A1` · `PRODUKSI` · `EKONOMI_BASE` · `SENS_RATE` / `SENS_DME` / `SENS_MEOH` / `SENS_ALPHA` · `SKENARIO` (harga Q3 2026) · `IMPAS`.

## 3. Hasil kasus dasar (2026-11-12)
| Besaran | Nilai |
| :--- | ---: |
| CAPEX I&C | 608.099 USD (Rp 10,98 miliar) |
| OPEX I&C | 46.726 USD/tahun |
| CAPEX Area 1 | 1.877.960 USD |
| OPEX Area 1 | 1.298.220 USD/tahun |
| Arus kas bersih Area 1 (α = 1/3) | 398.974 USD/tahun |
| NPV (i = 10 %, 20 tahun) / IRR / PBP | 1.518.727 USD / 20,8 % / 4,7 tahun |
| Harga DME untuk NPV = 0 | 549 USD/t (dasar 560) |
| Skenario harga Q3 2026 (DME 570, metanol 480) | NPV −27,4 juta USD |

Kesimpulan: **layak bersyarat**; risiko dominan adalah selisih harga DME–metanol, bukan suku bunga atau biaya I&C.

## 4. Yang perlu ditindaklanjuti
- α (porsi Area 1) disepakati dengan Area 2/3 berdasarkan CAPEX masing-masing.
- Harga DCS, logic solver SIS, katup kendali, dan ESDV diganti penawaran vendor (target AACE Class 2).
- CEPCI 2025 (nilai absolut berbayar) menggantikan CEPCI 2023 = 797,9.

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-12 | Claude Code (AI) | Model dua lapis Bab 4 dibuat; harga dari riset web dengan sitasi; diisi ke Laporan PSTF 1 Bab 4 (Tabel 4.1–4.7) (LOG-083). |
