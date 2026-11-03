---
id: "CALC-ASME-TW-001"
title: "Verifikasi Frekuensi Wake & Kekuatan Thermowell"
category: "Engineering Calculator"
standard: "ASME PTC 19.3 TW-2016"
target_files:
  - "CALC_ASME_Thermowell.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — kecepatan & properti fluida belum dari hmb_streams.json"
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Temperature", "Thermowell", "Vibration", "Area-100", "Area-200"]
---

# Panduan Penggunaan: CALC_ASME_Thermowell.csv

> ⚠️ **DATA PLACEHOLDER — JANGAN DIKUTIP KE LAPORAN.**
> Seluruh nilai berasal dari skrip bootstrap (LOG-004). Frekuensi alami dan frekuensi wake belum dihitung.
>
> **Belum diotomasi (LOG-020).** Berbeda dengan tiga kalkulator lain, tidak ada pustaka terbuka yang mengimplementasikan ASME PTC 19.3 TW-2016, dan proyek belum memegang salinan standar beserta contoh soalnya. Mengimplementasikan persamaan dari ingatan tanpa contoh verifikasi akan melanggar Blueprint §3.2 butir 5. Langkah: (1) PIC (JN) menyediakan salinan ASME PTC 19.3 TW-2016 (cek perpustakaan/akses standar UGM); (2) implementasi `tools/calc/thermowell.py` + uji terhadap contoh di standar. Baris TW-201/202 di CSV adalah lingkup Area 2 dan akan dikeluarkan saat CSV dibuat ulang. Kecepatan uap di sekitar R-101 sudah bisa diturunkan dari HMB S-104 (0,272 m³/s) begitu diameter pipa/nozzle ditetapkan.

## 1. Cakupan
Memverifikasi thermowell terhadap resonansi akibat *vortex shedding* (frekuensi wake), tegangan statik dan dinamik, serta tekanan hidrostatik eksternal sesuai ASME PTC 19.3 TW-2016.

## 2. Kriteria Utama
- Frekuensi wake: $f_s = \dfrac{N_S\, V}{B}$ ($N_S$ = bilangan Strouhal, $V$ = kecepatan fluida, $B$ = diameter tip).
- Frekuensi alami terpasang $f_{n,c}$ dihitung dengan koreksi massa fluida, massa sensor, dan kelenturan dudukan (*mounting compliance*).
- Batas frekuensi: untuk thermowell yang tidak diizinkan melewati resonansi, $f_s < 0{,}8\, f_{n,c}$; kondisi lain mengikuti kriteria tegangan dinamik pada standar.
- Pemeriksaan tegangan statik/dinamik dan tekanan eksternal **juga wajib**; lolos rasio frekuensi saja tidak cukup.

## 3. Catatan Inkonsistensi pada Data Placeholder (Re-audit 2026-11-03)
1. `TW-101` dan `TW-102` memiliki frekuensi alami & wake identik walaupun suhu prosesnya berbeda.
2. Belum ada pemeriksaan tegangan dan tekanan eksternal.
3. Kecepatan fluida (mis. 18,5 m/s) tidak memiliki sumber dari HMB + ukuran pipa.

## 4. SOP (berlaku mulai Fase 3)
1. Hitung kecepatan fluida dari laju volumetrik (`hmb_streams.json`) dan diameter dalam pipa.
2. Hitung manual $f_s$, $f_{n,c}$, tegangan, dan tekanan sesuai ASME PTC 19.3 TW; tuliskan di laporan PSTF 2 Bab 2.
3. Verifikasi silang dengan implementasi skrip + contoh soal dari standar.

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
