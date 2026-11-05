---
id: "CAD-LIB-DME-001"
title: "Library Simbol AutoCAD (ISO 10628, ISA-5.1/5.2/5.4/101/62443, API RP 551)"
category: "CAD Standards"
standard: "ISO 10628 / ISA-5.1 / ISA-5.2 / ISA-5.4 / ISA-101.01 / ISA/IEC 62443 / API RP 551"
target_files: []
external_files:
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISO10628_Equipment.dxf"
    sha256_prefix: "c8c41de4c5b62582"
    size_kb: 4118
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISA51_Instruments.dxf"
    sha256_prefix: "c22f73ed1008f512"
    size_kb: 3860
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISA52_LogicGates.dxf"
    sha256_prefix: "ca68453a4a9e493b"
    size_kb: 3669
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISA54_LoopDiagrams.dxf"
    sha256_prefix: "4932690ac57f07c5"
    size_kb: 3121
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/APIRP551_Hookup.dxf"
    sha256_prefix: "42760f3c408e7557"
    size_kb: 3763
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISA101_HMI.dxf"
    sha256_prefix: "970d3d5175e61e87"
    size_kb: 3734
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISA62443_Security.dxf"
    sha256_prefix: "00eaf28ca2ad7b75"
    size_kb: 3157
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/DME_PID_Master_Legend.dxf"
    sha256_prefix: "bfeec58dd8355ff4"
    size_kb: 4230
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/DME_PID_Master_Legend_Rev1.dxf"
    sha256_prefix: "eb57e78bc4461434"
    size_kb: 4241
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/DME_PID_Master_Legend_Rev1_preview.png"
    sha256_prefix: "cb61e77cc425591e"
    size_kb: 616
generated_by: ""
source_data: []
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-05"
tags: ["AutoCAD", "Symbol Library", "Block"]
---

# Companion Kolektif: Library Simbol AutoCAD

> 📁 **Lokasi file:** sejak Fase 1.5 (LOG-004), seluruh file library disimpan di Google Drive (`DRIVE_ROOT/03_CAD_DWG/symbol_libraries/`), bukan di Git.

## 1. Daftar Library

| File | Standar | Isi (berdasarkan nama & draf awal) |
| :--- | :--- | :--- |
| `ISO10628_Equipment.dxf` | ISO 10628 | Simbol peralatan: reaktor fixed bed, kolom distilasi, heat exchanger, pompa sentrifugal |
| `ISA51_Instruments.dxf` | ISA-5.1 | Bubble field/DCS/SIS, control valve, ESDV, PSV |
| `ISA52_LogicGates.dxf` | ISA-5.2 | Gerbang AND, OR, NOT, time delay |
| `ISA54_LoopDiagrams.dxf` | ISA-5.4 | Elemen loop diagram (terminal, marshalling) |
| `APIRP551_Hookup.dxf` | API RP 551 | Hook-up transmitter tekanan (root valve, manifold, pipe stand) |
| `ISA101_HMI.dxf` | ISA-101.01 | Elemen grafis HMI |
| `ISA62443_Security.dxf` | ISA/IEC 62443 | Diagram zona & conduit keamanan siber |
| `DME_PID_Master_Legend.dxf` | ISA-5.1 / ISO 10628 | Lembar legenda P&ID (DME-LEG-001) **Rev 0** — arsip, digantikan Rev 1 |
| `DME_PID_Master_Legend_Rev1.dxf` (+ `_preview.png`) | ISA-5.1 / ISO 10628 | Legenda P&ID **Rev 1 (IFR, 05-11-26)**: bahasa Inggris + kunci penomoran jalur 6 segmen (lihat §1a) |

### 1a. Penomoran Jalur Pipa (Legend Rev 1, keputusan PM 2026-11-05)

Format **6 segmen** `SIZE-FLUID-AREA-SEQ-CLASS-INSUL`, contoh `6"-EFF-10-1005-S3A-IH`:

| No | Segmen | Arti | Kode |
| :---: | :--- | :--- | :--- |
| 1 | Size | Ukuran nominal pipa (NPS, inci) | `3"`, `6"` |
| 2 | Fluid code | Jenis fluida | `ME` metanol, `EFF` efluen reaktor, `DME` produk DME, `DMV` uap kaya DME, `WW` air buangan, utilitas (`MPS`, `LPS`, `CWS`, `IA`, `N2`, `FLR`, …) |
| 3 | Area code | Area pabrik | `10` Area 1 reaktor (firma ini) · `20` Area 2 kolom DME · `30` Area 3 recovery metanol |
| 4 | Line seq. no. | Digit area + nomor stream | `1001` = S-101, `1005` = S-105, `1014` = S-114 |
| 5 | Piping class | Spesifikasi material & rating | `A1A` CS 150# · `A3A` CS 300# · `S3A` SS316L 300# |
| 6 | Insulation | Jenis insulasi | `IH` heat conservation · `IC` cold · `PP` personnel protection · `NI` none |

- Kode fluida tidak boleh mengandung tanda hubung (bentrok dengan pemisah segmen); `DME-L`/`DME-V` di Rev 0 menjadi `DME`/`DMV`.
- **P&ID Rev B masih memakai format 5 segmen** (`6"-P-105-A1A-IH`); diganti di Rev C (WO-026, JN).
- Kelas pipa & insulasi di P&ID masih **TBC** (catatan 5 P&ID). Temuan untuk JN: CS Class 150 (A1A) menurut ASME B16.5 hanya ±12 barg pada 250 °C, sedangkan S-104/S-105 beroperasi 13,7 barg → perlu dicek, kemungkinan Class 300.
- Contoh Area 2/3 di legend (`3"-DME-20-2008…`, `4"-WW-30-3011…`) bersifat ilustrasi format; nomor jalur final ditetapkan kelompok Area 2/3.

> File recovery AutoCAD `ISO10628_Equipment_recover.dwg` (sha256 `0b88eb2af89ac562…`) **dihapus** pada 2026-11-03 atas keputusan PM, karena isinya sama dengan `ISO10628_Equipment.dxf` (LOG-005).

## 2. Asal-usul File (penting)
- Skrip bootstrap `generate_libraries.js` (dihapus di Fase 1.5) hanya menghasilkan 4 library pertama dalam bentuk DXF sederhana (puluhan entitas, tanpa header `$ACADVER`). File di Drive berukuran 3–4 MB dengan header AutoCAD (`AC1009`), dan `plot.log` mencatat file tersebut dibuka & di-plot di AutoCAD pada 2026-11-01.
- Kesimpulannya, library ini adalah **file CAD hasil kerja manual di AutoCAD**, bukan file hasil generate. Jangan dibuat ulang dari skrip.

## 3. Cara Memakai
1. Pastikan Google Drive for Desktop sudah sinkron (Fase 2), lalu buka folder `DRIVE_ROOT/03_CAD_DWG/symbol_libraries/`.
2. Sisipkan blok ke gambar P&ID lewat `INSERT` atau DesignCenter (`ADCENTER`).
3. Jangan mengedit library yang sama di dua perangkat sekaligus (Blueprint §8.4).

## 4. Yang Perlu Diverifikasi PIC
- Kesesuaian setiap simbol dengan standar acuannya.
- Atribut blok instrumen (tag) harus bisa dibaca `validate_tags.py` (Fase 3): gunakan atribut bernama tetap, misal `TAG`.

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Companion kolektif dibuat; file dipindah ke Drive; hash dicatat (LOG-004). |
| 0.2 | 2026-11-03 | Claude Code (AI) | `ISO10628_Equipment_recover.dwg` dihapus atas keputusan PM (LOG-005). |
| 0.3 | 2026-11-05 | Claude Code (AI) | Legend Rev 1 (arahan dosen Bimbingan 6): seluruh teks ke bahasa Inggris, kunci penomoran jalur 6 segmen + arti tiap segmen, tag pabrik (R-101, E-101, E-102, P-101, T-101, CSCOL-01/02), area 10/20/30 = Area 1/2/3, item SIS diberi label PSTF 2 (LOG-059). |
