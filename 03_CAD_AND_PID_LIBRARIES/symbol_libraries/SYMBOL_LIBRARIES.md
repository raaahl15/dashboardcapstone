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
  - path: "DRIVE_ROOT/03_CAD_DWG/symbol_libraries/ISO10628_Equipment_recover.dwg"
    sha256_prefix: "0b88eb2af89ac562"
    size_kb: 1348
generated_by: ""
source_data: []
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
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
| `DME_PID_Master_Legend.dxf` | ISA-5.1 / ISO 10628 | Lembar legenda P&ID |
| `ISO10628_Equipment_recover.dwg` | — | **File recovery AutoCAD** (crash/autosave). PIC perlu memeriksa apakah berisi perubahan yang belum tersimpan di `ISO10628_Equipment.dxf`, lalu menggabungkan atau menghapusnya. |

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
