---
id: "CALC-ISO5167-001"
title: "Kalkulator Sizing Orifice Plate Flowmeter"
category: "Engineering Calculator"
standard: "ISO 5167-1 / ISO 5167-2 (atau AGA Report No. 3)"
target_files:
  - "CALC_ISO5167_Orifice.csv"
  - "inputs/FE-101.yaml"
generated_by: "tools/calc/orifice.py (npm run calc)"
source_data:
  - "hmb_streams.json → S-102 (q_m, P, T, rho, mu fase cair); input lain di inputs/FE-101.yaml"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Flow", "Orifice", "Area-100", "Instrumentation"]
---

# Panduan Penggunaan: CALC_ISO5167_Orifice.csv

> 🔄 **FILE HASIL GENERATE (LOG-020).** CSV ditulis ulang oleh `npm run calc` dari `inputs/FE-101.yaml` + `hmb_streams.json`. Jangan edit CSV; ubah input YAML.
>
> ⚠️ **Status data: PLACEHOLDER** karena diameter pipa (6"-PL-101) masih data contoh dari index. Hasil belum boleh dikutip ke laporan. Status naik otomatis setelah input PLACEHOLDER diganti (status hasil = status input terlemah).

## 1. Tujuan & Ruang Lingkup
Menghitung diameter bore orifice ($d$), rasio diameter ($\beta = d/D$), koefisien debit ($C$), faktor ekspansi ($\varepsilon$), dan rugi tekanan permanen untuk **FE-101** (loop FIC-101), yaitu pengukuran laju umpan metanol **cair** di discharge pompa P-101 (aliran **S-102**, jalur 6"-PL-101). CSV lama memakai uap 250 °C di S-01, padahal FIC-101 menurut index berada di discharge pompa (cair); hal ini dikoreksi.

## 2. Standar Acuan
- **ISO 5167-1** — prinsip umum pengukuran aliran dengan alat beda tekanan.
- **ISO 5167-2** — orifice plate: persamaan Reader-Harris/Gallagher untuk $C$, persamaan $\varepsilon$, batas keberlakuan.
- Panduan Capstone DTNTF 2026 BAB IV §4.1: sizing orifice **wajib dihitung secara numerik dan manual**.

## 3. Parameter Input

| Variabel | Simbol | Nilai | Sumber | Status |
| :--- | :---: | ---: | :--- | :---: |
| Laju alir massa | $q_m$ | 8.321,3 kg/h | `hmb_streams.json` → S-102 | HMB |
| Tekanan hulu | $P_1$ | 15,50 bar(a) | `hmb_streams.json` → S-102 | HMB |
| Suhu hulu | $T_1$ | 25,3 °C | `hmb_streams.json` → S-102 | HMB |
| Densitas cair | $\rho_1$ | 791,7 kg/m³ | `hmb_streams.json` → S-102 (NRTL) | HMB |
| Viskositas cair | $\mu$ | 0,551 cP | `hmb_streams.json` → S-102 | HMB |
| Diameter dalam pipa | $D$ | 154,08 mm | ASME B36.10M 6" Sch 40, dari nomor jalur di index (data contoh) | PLACEHOLDER |
| ΔP desain | $\Delta p$ | 25 kPa | Rentang DP transmitter; tetapkan PIC | ASUMSI |
| Jenis tapping | – | flange | ISO 5167-2 §5.2.1; konfirmasi spesifikasi | ASUMSI |

Untuk cairan $\varepsilon = 1$; eksponen isentropik tidak dipakai.

## 4. Persamaan (ISO 5167-2)
$$q_m = \frac{C}{\sqrt{1 - \beta^4}}\, \varepsilon\, \frac{\pi}{4} d^2 \sqrt{2\, \Delta p\, \rho_1}$$

Batas keberlakuan orifice (flange/corner/D–D/2 tappings): $0{,}1 \le \beta \le 0{,}75$, $d \ge 12{,}5$ mm, $50 \le D \le 1000$ mm, dan batas $Re_D$ minimum sesuai jenis tapping.

## 5. Hasil Skrip (verifikasi silang, LOG-020)

| Hasil | Nilai | Cek ISO 5167-2 §5.3.1 |
| :--- | ---: | :--- |
| Diameter bore $d$ | 27,95 mm | ≥ 12,5 mm ✅ |
| $\beta$ | 0,181 | 0,10–0,75 ✅ |
| $C$ (Reader-Harris/Gallagher) | 0,5984 | – |
| $Re_D$ | 34.688 | ≥ max(5000; 170 β² D) ✅ |
| Kecepatan di pipa | 0,157 m/s | – |
| Rugi tekanan permanen | 24,0 kPa | – |

**Temuan:** kecepatan cairan 0,16 m/s menunjukkan pipa 6" terlalu besar untuk 10,5 m³/h (kecepatan cairan lazim 1–2 m/s, kira-kira setara 2"). Ukuran jalur perlu ditetapkan lewat line sizing sebelum orifice dihitung final; β akan naik bila D mengecil.

**Uji verifikasi** (`tools/calc/test_verification.py`): $C$ dari skrip dibandingkan dengan implementasi **independen** persamaan (4) ISO 5167-2 yang ditulis langsung dari standar (3 kasus, selisih < 10⁻⁵), dan laju alir dihitung balik dengan persamaan dasar ISO 5167-1 (selisih < 10⁻⁴). Kasus β < 0,10 terbukti ditolak (FAIL).

## 6. Catatan atas CSV Lama (sudah diganti, Re-audit 2026-11-03)
1. Dari input CSV ($d$ = 85,2 mm; $\beta$ = 0,553; $\Delta p$ = 25 kPa; $\rho_1$ = 11,24 kg/m³; $C$ = 0,6012; $\varepsilon$ = 0,985), persamaan di §4 menghasilkan $q_m \approx$ **9.600 kg/h**, bukan 12.500 kg/h.
2. Dari $q_m$ = 12.500 kg/h, $D$ = 154,08 mm, $\mu$ = 0,0165 cP diperoleh $Re_D = 4 q_m / (\pi D \mu) \approx$ **1,7 × 10⁶**, bukan 385.400.
3. Sumber densitas tertulis "DWSIM Peng-Robinson", padahal model simulasi memakai NRTL.
4. Tag `REAC-01` tidak sesuai tag DWSIM (`RC-01`); tag pabrik final mengikuti `tag_map.csv`.

## 7. SOP
1. Pastikan `hmb_streams.json` terbaru (`npm run sync:dwsim`, cek `meta.extracted_at`).
2. Perbarui `inputs/FE-101.yaml` (ganti nilai PLACEHOLDER/ASUMSI dengan sumber yang sah).
3. Hitung manual sesuai §4 (iterasi $C$ ↔ $Re_D$) dan tuliskan langkahnya di laporan PSTF 2 Bab 2.
4. `npm run calc` sebagai **pemeriksa silang**; selisih manual vs skrip harus < 0,5 %. `npm run test:py` harus lulus.
5. Bila semua input berstatus HMB/STANDAR/LITERATUR (atau ASUMSI yang disetujui PIC), ajukan `Review Internal`.

## 8. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
| 1.0 | 2026-11-03 | Claude Code (AI) | Kalkulator skrip `tools/calc/orifice.py`; FE-101 di S-102 (cair); CSV generate; uji verifikasi (LOG-020). |
