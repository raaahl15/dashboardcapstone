---
id: "CALC-ISO5167-001"
title: "Kalkulator Sizing Orifice Plate Flowmeter"
category: "Engineering Calculator"
standard: "ISO 5167-2:2003 / AGA Report No. 3"
source_simulation: "DME.dwxmz (Stream S-01 Inlet REAC-01)"
author: "Altaf Ramadhan Parvez"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "CALC_ISO5167_Orifice.csv"
---

# Panduan Penggunaan: CALC_ISO5167_Orifice.csv

## 1. Tujuan Perhitungan
Menghitung bukaan diameter orifice ($d = 85.20\text{ mm}$) dan rasio diameter $\beta = d/D = 0.553$ pada pipa umpan metanol 6 inch Schedule 40 ($D = 154.08\text{ mm}$) menuju reaktor `REAC-01`.

## 2. Persamaan Rekayasa (ISO 5167-2)
$$q_m = \frac{C}{\sqrt{1 - \beta^4}} \cdot \epsilon \cdot \frac{\pi}{4} d^2 \sqrt{2 \Delta P \cdot \rho_1}$$
Batasan standar:
- $0.10 \le \beta \le 0.75$ (Rekomendasi optimal: $0.20 \le \beta \le 0.70$)
- Hasil perancangan: $\beta = 0.553$ (**PASS / Sesuai Standar**).

## 3. SOP Verifikasi
1. Ambil nilai laju alir massa $q_m = 12500\text{ kg/h}$ dan massa jenis $\rho_1 = 11.24\text{ kg/m}^3$ dari file HMB DWSIM.
2. Pastikan pressure drop diferensial $\Delta P$ berada di bawah batas kavitasi dan akurasi transmitter.
