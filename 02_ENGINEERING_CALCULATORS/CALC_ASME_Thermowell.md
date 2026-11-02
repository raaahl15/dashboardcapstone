---
id: "CALC-ASME-TW-001"
title: "Verifikasi Frekuensi Aliran & Kekuatan Thermowell"
category: "Engineering Calculator"
standard: "ASME PTC 19.3 TW-2016"
author: "Jonathan Pangihutan Michael Siahaan"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "CALC_ASME_Thermowell.csv"
---

# Panduan Penggunaan: CALC_ASME_Thermowell.csv

## 1. Kriteria Keselamatan Getaran Wake
Thermowell yang dipasang pada pipa discharge pompa dan outlet reaktor wajib lulus rasio frekuensi:
$$r = \frac{f_s}{f_n} < 0.80$$
Di mana:
- $f_s$: Strouhal vortex shedding wake frequency ($Hz$).
- $f_n$: Frekuensi alami struktur thermowell ($Hz$).

Seluruh 5 tag thermowell (`TW-101` s.d. `TW-202`) memiliki nilai $r \le 0.37$, dinyatakan **LULUS (PASS)** dan aman dari kegagalan fatigue getaran.
