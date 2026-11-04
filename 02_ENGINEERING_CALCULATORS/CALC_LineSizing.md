---
id: "CALC-LINE-001"
title: "Line Sizing Pipa Proses Area 1 (Kecepatan, ΔP, Erosi)"
category: "Engineering Calculator"
standard: "ASME B36.10M; Darcy–Weisbach + Colebrook; API RP 14E (dua fase)"
target_files:
  - "CALC_LineSizing.csv"
  - "inputs/LINE-S-101.yaml"
  - "inputs/LINE-S-102.yaml"
  - "inputs/LINE-S-103.yaml"
  - "inputs/LINE-S-104.yaml"
  - "inputs/LINE-S-105.yaml"
  - "inputs/LINE-S-107.yaml"
  - "inputs/LINE-S-114.yaml"
generated_by: "tools/calc/line_sizing.py (npm run calc)"
source_data:
  - "hmb_streams.json → S-101…S-107, S-114 (laju massa, ρ, μ, fraksi uap); kriteria di inputs/LINE-*.yaml"
author: "Jonathan Pangihutan Michael Siahaan (PIC P&ID / line list)"
reviewer: "Ihsaan Zauhair Tsaqif Prawira"
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-04"
tags: ["Piping", "Line Sizing", "Area-100", "Hydraulics"]
---

# Panduan Penggunaan: CALC_LineSizing.csv

> 🔄 **FILE HASIL GENERATE (LOG-036).** CSV ditulis ulang oleh `npm run calc` dari `inputs/LINE-*.yaml` + `hmb_streams.json`. Jangan edit CSV; ubah input YAML.
>
> ⚠️ **Status data: ASUMSI.** Data proses dari HMB, dimensi pipa dari ASME B36.10M, tetapi batas kecepatan isap, batas ΔP, dan pilihan Sch 40 adalah aturan praktis usulan agent. Konfirmasi JN (line list, kelas pipa A1A) sebelum dikutip.

## 1. Cakupan
Menentukan ukuran nominal pipa (NPS) setiap line proses Area 1 dari HMB DWSIM, sebagai dasar nomor line di P&ID `DME-PID-002` dan input kalkulator instrumen (orifice FE-101, control valve FV-101, thermowell TW-104). Ukuran terpilih = **NPS terkecil yang lolos semua kriteria**. Ukuran tidak lazim (1-1/4", 2-1/2", 3-1/2", 5") dilewati.

Tidak dicakup: NPSH pompa (perlu tata letak & elevasi), panjang ekuivalen nyata (fitting), rating kelas pipa/tebal minimum B31.3, dan surge.

## 2. Persamaan
$$V = \frac{\dot m}{\rho\,\pi D^2/4},\qquad Re = \frac{\rho V D}{\mu},\qquad \frac{\Delta P}{L} = f\,\frac{\rho V^2}{2D}$$
$f$ dari Colebrook (solusi Clamond, `fluids.friction_factor`), kekasaran ε = 0,045 mm.

Dua fase (S-107) memakai **model homogen**: $\rho_m$ dari HMB, kualitas massa $x = y_v M_v / M$, viskositas McAdams $1/\mu_m = x/\mu_v + (1-x)/\mu_l$, dan kecepatan erosi API RP 14E $V_e = C/\sqrt{\rho_m}$ (US) $= 1{,}2199\,C/\sqrt{\rho_m}$ (SI), C = 100.

## 3. Kriteria (input YAML)
| Layanan | V maks | ΔP maks | Sumber | Status |
| :--- | ---: | ---: | :--- | :---: |
| Isap pompa (S-101) | 1,0 m/s | 0,1 bar/100 m | Aturan praktis (NPSH) | ASUMSI |
| Discharge cair (S-102, S-103, S-114) | 3,0 m/s | 0,5 bar/100 m | V: Towler & Sinnott Tabel 5.3 (cairan dipompa 1–3 m/s); ΔP: aturan praktis | LITERATUR / ASUMSI |
| Uap (S-104, S-105) | 30 m/s | 0,5 bar/100 m | V: Towler & Sinnott Tabel 5.3 (gas & uap 15–30 m/s); ΔP: aturan praktis | LITERATUR / ASUMSI |
| Dua fase (S-107) | V ≤ V_e, ≤ 15 m/s | 0,5 bar/100 m | API RP 14E | LITERATUR / ASUMSI |

## 4. Hasil (LOG-036)
| Stream | Line di P&ID | Fasa | NPS terpilih | V (m/s) | ΔP (bar/100 m) | Di Rev A | Keterangan |
| :--- | :--- | :--- | :---: | ---: | ---: | :---: | :--- |
| S-101 | P-101 | cair, isap | **3"** | 0,61 | 0,041 | 3" | 2" ditolak (1,35 m/s > 1,0) |
| S-102 | P-102 | cair | **2"** | 1,35 | 0,297 | 3" | 1-1/2" ditolak (ΔP 1,05) |
| S-103 | P-103 | cair | **2"** | 1,71 | 0,467 | 3" | mendekati batas ΔP; 3" bila jalur panjang |
| S-104 | P-104 | uap | **6"** | 14,6 | 0,115 | 3" | 4" ditolak (33,1 m/s > 30); 3" = 57 m/s |
| S-105 | P-105 | uap | **6"** | 14,6 | 0,115 | 3" | sama dengan S-104 |
| S-107 | P-107 | dua fase (x = 0,096) | **3"** | 4,63 | 0,330 | 3" | V_e = 10,6 m/s |
| S-114 | – (belum bernomor) | cair | **1-1/2"** | 0,60 | 0,088 | – | 1" ditolak (ΔP) |

Ukuran ini sudah diterapkan ke nomor line Draf P&ID **DME-PID-002 Rev B** (P-102/P-103 → 2", P-104/P-105 → 6").

## 5. Verifikasi (tools/calc/test_verification.py)
| Uji | Hasil |
| :--- | :--- |
| ID ASME B36.10M (2" & 6" Sch 40, 3" Sch 80) | cocok ±0,02 mm |
| Colebrook vs diagram Moody (Re 1e5, ε/D 1e-4 → 0,0185; Re 1e6 halus → 0,0116) | cocok < 0,5 % |
| Hitung tangan V, Re, ΔP Darcy–Weisbach | identik |
| Konversi API RP 14E (1 lb/ft³, C = 100 → 100 ft/s = 30,48 m/s) | identik |
| Pemilihan NPS (uap 10 553 kg/h → 6", 4" ditolak) & layanan tak dikenal ditolak | lolos |

## 6. SOP
1. Pastikan `hmb_streams.json` terbaru (`npm run sync:dwsim`).
2. JN menetapkan kelas pipa (A1A), schedule, dan kriteria final di `inputs/LINE-*.yaml`; ubah status ASUMSI → LITERATUR/STANDAR setelah sumber dikonfirmasi.
3. `npm run calc`; perbarui nomor line di P&ID bila NPS berubah, lalu `npm run validate:tags -- --dxf <P&ID>`.
4. Hitung manual satu line per layanan di laporan (Bab 3.3 alur P&ID / PSTF 2) sebagai verifikasi.

## 7. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-04 | Claude Code (AI) | Kalkulator `tools/calc/line_sizing.py`, 7 line Area 1, 5 uji verifikasi; hasil diterapkan ke P&ID Rev B (LOG-036). |
