---
id: "DATA-HMB-DME-001"
title: "Kamus Data: hmb_streams.json (Ekspor Heat & Material Balance DWSIM)"
category: "Process Data Export"
standard: "Skema internal proyek (Blueprint §3.1, skema v1)"
target_files:
  - "hmb_streams.json"
generated_by: "tools/dwsim/export_hmb.py (npm run sync:dwsim)"
source_data:
  - "../simulation_files/DME.dwxmz (sha256 5a03365ee9fa…, DWSIM 6.5.0.0, disimpan 2021-05-25 +05:30)"
  - "../tag_map.csv (FINAL)"
author: "Ihsaan Zauhair Tsaqif Prawira (PIC); ekstraktor oleh Claude Code (AI)"
reviewer: "Altaf Ramadhan Parvez"
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["DWSIM", "HMB", "JSON", "Generated", "Area-100"]
---

# Kamus Data: hmb_streams.json

> ⚠️ **FILE HASIL GENERATE — jangan edit manual.** Buat ulang dengan `npm run sync:dwsim` setiap kali `DME.dwxmz` berubah, lalu commit keduanya dalam satu commit.
>
> **Status WIP:** nilai berasal dari model DWSIM (bukan placeholder). Asal-usul model **terjawab (LOG-024)**: Tabel 1 RFP KAK-IC-DME-2026-001 mengutip fraksi mol yang identik dengan model ini, jadi model adalah **referensi klien dari dokumen lelang** (menjelaskan metadata simpan 2021-05-25, DWSIM 6.5, +05:30). Sebelum angka dikutip, IH menulis sitasi RFP dan rujukan literatur kondisi operasi (Blueprint §3.1).

## 1. Skema v1

| Field | Isi | Satuan / catatan |
| :--- | :--- | :--- |
| `meta.source_sha256` | Hash file `.dwxmz` | Untuk memastikan HMB cocok dengan versi model |
| `meta.dwsim_build`, `meta.model_saved_on` | Versi DWSIM & waktu simpan model | Dibaca dari `GeneralInfo` |
| `meta.solver_status` | `AllObjectsCalculated` / `NotConverged` | **Diturunkan** dari `Calculated=true` dan `ErrorMessage` kosong di setiap objek; file DWSIM tidak menyimpan status konvergensi global |
| `meta.property_package`, `meta.compounds` | NRTL; Methanol, Water, Dimethyl ether | Dibaca dari file |
| `streams[].dwsim_tag`, `plant_tag`, `area`, `scope` | Tag & lingkup | Dari `tag_map.csv`; `plant_tag` kosong untuk Area 2/3 |
| `streams[].T`, `P` | Suhu, tekanan | degC, bar(a) |
| `streams[].mass_flow`, `molar_flow` | Laju alir | kg/h, kmol/h |
| `streams[].vapor_fraction` | Fraksi mol uap | 0–1 |
| `streams[].mole_fractions` | Komposisi mol keseluruhan | jumlah = 1 (kecuali stream tanpa aliran) |
| `streams[].props` | ρ, μ, Cp, MW campuran | kg/m3, cP, kJ/(kg.K), kg/kmol; μ hanya diisi bila satu fase |
| `streams[].props_by_phase` | Properti fase `vapor` / `liquid`: ρ, μ, Cp, Cv, k = Cp/Cv, Z, MW | `null` bila fase tidak ada; Z hanya bermakna untuk uap (cair → `null`). Ditambahkan di extractor 1.1.0 untuk API 520 (LOG-020) |
| `unit_operations[]` | Tag, tipe, `duty_kW`, inlet/outlet | `duty_kW` = `DeltaQ` DWSIM; kosong untuk mixer, kolom CAPE-OPEN, recycle |
| `validation.mass_balance[]` | Neraca massa per unit | Batas galat 0,5%; skrip **gagal** bila terlampaui |
| `validation.warnings[]` | Hal yang perlu diperhatikan | Contoh: stream tanpa aliran |

Konversi satuan dari internal DWSIM: K → degC (−273,15), Pa → bar (÷10⁵), kg/s → kg/h (×3600), mol/s → kmol/h (×3,6), Pa·s → cP (×1000). NaN/Infinity ditulis sebagai `null`.

## 2. Ringkasan HMB Area 1 (ekstraksi 2026-11-03)

| Plant tag | DWSIM | T (°C) | P (bar a) | Laju (kg/h) | Fraksi uap | x MeOH | x H₂O | x DME |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| S-101 | S-01 | 25,0 | 1,00 | 8.321,3 | 0,00 | 0,983 | 0,017 | 0,000 |
| S-102 | S-02 | 25,3 | 15,50 | 8.321,3 | 0,00 | 0,983 | 0,017 | 0,000 |
| S-103 | S-03 | 25,3 | 15,50 | 10.553,2 | 0,00 | 0,966 | 0,022 | 0,012 |
| S-104 | S-04 | 250,0 | 14,70 | 10.553,2 | 1,00 | 0,966 | 0,022 | 0,012 |
| S-105 | S-05 | 250,0 | 14,70 | 10.553,2 | 1,00 | 0,193 | 0,409 | 0,398 |
| S-106 | S-06 | 250,0 | 14,70 | 0,0 | – | – | – | – |
| S-107 → Area 2 | S-07 | 89,0 | 10,40 | 10.553,2 | 0,07 | 0,193 | 0,409 | 0,398 |
| S-114 ← Area 3 | S-14 | 25,3 | 15,50 | 2.234,7 | 0,00 | 0,903 | 0,041 | 0,056 |

| Unit | Duty (kW) | Neraca massa |
| :--- | ---: | :--- |
| P-101 pompa umpan | 5,6 | 0,000% |
| M-101 mixer | – | 0,027% (toleransi konvergensi recycle) |
| E-101 pemanas umpan | 4.726,1 | 0,000% |
| R-101 reaktor (isotermal 250 °C) | −733,0 (panas reaksi dilepas) | 0,000% |
| E-102 pendingin efluen | 3.245,6 | 0,000% |

Tabel di atas hanya ringkasan; angka acuan selalu `hmb_streams.json` terbaru (cek `meta.extracted_at` dan `meta.source_sha256`).

## 3. Temuan dari Ekstraksi Pertama
1. **Konversi metanol R-101 ≈ 80 %** (fraksi mol 0,966 → 0,193), produk DME di Area 2 (S-08) 5.891,5 kg/h murni. IH perlu mencocokkan dengan target kapasitas TOR dan konversi kesetimbangan literatur.
2. **S-107 di model: 89,0 °C, 10,4 bar, fraksi uap 0,07.** Logbook/MoM cockpit menyebut efluen "terkunci pada 45 °C dan 10 bar" dengan komposisi MeOH 0,18 / DME 0,41 / H₂O 0,41. Komposisi hampir sama, **suhu berbeda 44 °C**. Perlu disepakati dengan Area 2 mana yang berlaku, lalu model atau dokumen diperbarui.
3. **S-106 (outlet cair reaktor) laju alirnya nol**, konsisten dengan reaktor fase gas. Tag tetap dipertahankan (keputusan tag_map FINAL).
4. **Duty R-101 negatif** artinya panas dilepas reaktor (eksotermik); sistem pendingin reaktor perlu dirancang untuk ±733 kW.
5. Model terakhir dihitung dan disimpan **2021-05-25 (+05:30)**: model referensi klien dari RFP (terverifikasi LOG-024).

## 4. SOP
1. Jalankan DWSIM sampai konvergen, simpan `DME.dwxmz`.
2. `npm run sync:dwsim` (Python 3.12+, hanya pustaka standar). Skrip gagal dan **tidak** menulis file bila ada tag hilang/duplikat, nilai kosong, fraksi mol tidak 1, objek belum terhitung, atau neraca massa > 0,5%.
3. `npm run test:py` (butuh `.venv`, lihat README) untuk uji ekstraktor.
4. Commit `DME.dwxmz` + `hmb_streams.json` dalam satu commit.

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Companion dibuat; keterbatasan skema v0 didokumentasikan (LOG-004). |
| 1.0 | 2026-11-03 | Claude Code (AI) | Skema v1 dari `export_hmb.py`: T, P, laju alir, komposisi, properti, duty, validasi neraca; ringkasan & temuan Area 1 (LOG-019). |
