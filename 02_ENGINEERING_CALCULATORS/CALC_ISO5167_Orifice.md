---
id: "CALC-ISO5167-001"
title: "Kalkulator Sizing Orifice Plate Flowmeter"
category: "Engineering Calculator"
standard: "ISO 5167-1 / ISO 5167-2 (atau AGA Report No. 3)"
target_files:
  - "CALC_ISO5167_Orifice.csv"
generated_by: ""
source_data:
  - "PLACEHOLDER — belum terhubung ke hmb_streams.json"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Flow", "Orifice", "Area-100", "Instrumentation"]
---

# Panduan Penggunaan: CALC_ISO5167_Orifice.csv

> ⚠️ **DATA PLACEHOLDER — JANGAN DIKUTIP KE LAPORAN.**
> Seluruh nilai di CSV berasal dari skrip bootstrap `generate_libraries.js` (sudah dihapus; lihat LOG-004), bukan hasil simulasi atau perhitungan. Kolom `DATA_STATUS` menandai statusnya per baris. Nilai akan diganti di **Fase 3** dari `hmb_streams.json` + perhitungan manual.

## 1. Tujuan & Ruang Lingkup
Menghitung diameter bore orifice ($d$), rasio diameter ($\beta = d/D$), koefisien debit ($C$), faktor ekspansi ($\varepsilon$), dan rugi tekanan permanen untuk pengukuran laju alir umpan metanol menuju reaktor (tag pabrik ditetapkan lewat `tag_map.csv`).

## 2. Standar Acuan
- **ISO 5167-1** — prinsip umum pengukuran aliran dengan alat beda tekanan.
- **ISO 5167-2** — orifice plate: persamaan Reader-Harris/Gallagher untuk $C$, persamaan $\varepsilon$, batas keberlakuan.
- Panduan Capstone DTNTF 2026 BAB IV §4.1: sizing orifice **wajib dihitung secara numerik dan manual**.

## 3. Parameter Input

| Variabel | Simbol | Satuan | Sumber yang Seharusnya | Status Saat Ini |
| :--- | :---: | :---: | :--- | :---: |
| Laju alir massa | $q_m$ | kg/h | `hmb_streams.json` (stream umpan reaktor) | PLACEHOLDER |
| Tekanan hulu | $P_1$ | bar(a) | `hmb_streams.json` | PLACEHOLDER |
| Suhu hulu | $T_1$ | °C | `hmb_streams.json` | PLACEHOLDER |
| Densitas | $\rho_1$ | kg/m³ | `hmb_streams.json` (model NRTL) | PLACEHOLDER |
| Viskositas | $\mu$ | cP | `hmb_streams.json` | PLACEHOLDER |
| Eksponen isentropik | $\kappa$ | – | `hmb_streams.json` ($C_p/C_v$) | PLACEHOLDER |
| Diameter dalam pipa | $D$ | mm | ASME B36.10M (6" Sch 40) | ASUMSI |
| ΔP desain pada laju maks | $\Delta p$ | kPa | Pemilihan range DP transmitter | ASUMSI |

## 4. Persamaan (ISO 5167-2)
$$q_m = \frac{C}{\sqrt{1 - \beta^4}}\, \varepsilon\, \frac{\pi}{4} d^2 \sqrt{2\, \Delta p\, \rho_1}$$

Batas keberlakuan orifice (flange/corner/D–D/2 tappings): $0{,}1 \le \beta \le 0{,}75$, $d \ge 12{,}5$ mm, $50 \le D \le 1000$ mm, dan batas $Re_D$ minimum sesuai jenis tapping.

## 5. Catatan Inkonsistensi pada Data Placeholder (Re-audit 2026-11-03)
1. Dari input CSV ($d$ = 85,2 mm; $\beta$ = 0,553; $\Delta p$ = 25 kPa; $\rho_1$ = 11,24 kg/m³; $C$ = 0,6012; $\varepsilon$ = 0,985), persamaan di §4 menghasilkan $q_m \approx$ **9.600 kg/h**, bukan 12.500 kg/h.
2. Dari $q_m$ = 12.500 kg/h, $D$ = 154,08 mm, $\mu$ = 0,0165 cP diperoleh $Re_D = 4 q_m / (\pi D \mu) \approx$ **1,7 × 10⁶**, bukan 385.400.
3. Sumber densitas tertulis "DWSIM Peng-Robinson", padahal model simulasi memakai NRTL.
4. Tag `REAC-01` tidak sesuai tag DWSIM (`RC-01`); tag pabrik final mengikuti `tag_map.csv`.

## 6. SOP (berlaku mulai Fase 3)
1. Pastikan `hmb_streams.json` terbaru (cek `meta.extracted_at`).
2. Hitung manual sesuai §4 (iterasi $C$ ↔ $Re_D$) dan tuliskan langkahnya di laporan PSTF 2 Bab 2.
3. Jalankan skrip verifikasi (`tools/calc/`) sebagai **pemeriksa silang** hasil manual; selisih harus < 0,5%.
4. Isi CSV, ubah `DATA_STATUS` menjadi `OK`, lalu ajukan `Review Internal`.

## 7. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal dari skrip bootstrap. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
