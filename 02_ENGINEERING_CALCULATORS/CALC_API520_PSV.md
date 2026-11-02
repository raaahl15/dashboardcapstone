---
id: "CALC-API520-001"
title: "Kalkulator Sizing Katup Pelepasan Tekanan Darurat (PSV)"
category: "Engineering Calculator"
standard: "API RP 520 Part I & II / ASME Boiler & Pressure Vessel Code Sec VIII"
author: "Altaf Ramadhan Parvez"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "CALC_API520_PSV.csv"
---

# Panduan Penggunaan: CALC_API520_PSV.csv

## 1. Identifikasi Skenario Relief
- `PSV-101` (Reaktor REAC-01): Skenario Runaway / Blocked Discharge ($W = 14500\text{ kg/h}$, Set Pressure: $16.0\text{ bar(g)}$). Orifice terpilih: **API Letter K (1186 mm²)**.
- `PSV-201` (Kolom C-01): Skenario Reflux Failure ($W = 18200\text{ kg/h}$, Set Pressure: $14.0\text{ bar(g)}$). Orifice terpilih: **API Letter K (1186 mm²)**.
- `PSV-202` (Kolom C-02): Overheating Reboiler Tube Rupture ($W = 11000\text{ kg/h}$, Set Pressure: $6.0\text{ bar(g)}$). Orifice terpilih: **API Letter L (1841 mm²)**.

## 2. Persamaan Luas Orifis Uap API 520
$$A = \frac{W}{C \cdot K_d \cdot P_1 \cdot K_b \cdot K_c} \sqrt{\frac{T \cdot Z}{M}}$$
