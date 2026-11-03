---
id: "DATA-TAGVAL-DME-001"
title: "Laporan Validasi Tag Lintas Dokumen Area 1"
category: "Validation Report"
standard: "ISA-5.1; konvensi tag Blueprint §2.3"
target_files:
  - "tag_validation_report.json"
generated_by: "tools/validate_tags.py (npm run validate:tags)"
source_data:
  - "Master_Instrument_Index_DME.csv, ../tag_map.csv (FINAL), Cause_and_Effect_Matrix_ESD.csv, Master_Alarm_Database_ISA182.csv, mirrors/FDS-IC-DME-2026-001.md"
author: "Jonathan Pangihutan Michael Siahaan (PIC tag); validator oleh Claude Code (AI)"
reviewer: "Ihsaan Zauhair Tsaqif Prawira"
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Validation", "Tag", "ISA-5.1", "Generated"]
---

# Laporan Validasi Tag (`tag_validation_report.json`)

> 🔄 **FILE HASIL GENERATE.** Buat ulang dengan `npm run validate:tags` (tambahkan `-- --dxf <file P&ID>.dxf` setelah Draf P&ID tersedia). Jangan edit JSON.

## 1. Apa yang Diperiksa
| Kode | Tingkat | Arti |
| :--- | :--- | :--- |
| `DWSIM_TAG` | ERROR | Tag internal DWSIM (`PUMP-01`, `S-08`, `E-01`) dipakai di dokumen; harus tag pabrik dari `tag_map.csv` |
| `WILD_TAG` | ERROR | Tag 2 digit yang tidak ada di `tag_map.csv` (`REAC-01`, `C-01`, `HEATER-01`) |
| `UNKNOWN_EQUIPMENT` | ERROR | Tag peralatan/stream 3 digit yang tidak ada di `tag_map.csv` |
| `PHANTOM_INSTRUMENT` | ERROR | Instrumen dirujuk dokumen tetapi loop-nya tidak ada di index |
| `PHANTOM_IN_DRAWING` | ERROR | Instrumen digambar di P&ID tetapi tidak terdaftar persis di index |
| `LOOP_FUNCTION_NOT_LISTED` | WARNING | Fungsi loop (alarm `TAH`, switch `TSHH`, dll.) dirujuk, loop-nya ada, tetapi tidak terdaftar sebagai tag sendiri. Putuskan: daftarkan (mis. bila SIS memakai sensor terpisah) atau biarkan sebagai fungsi loop |
| `AREA_SCOPE` | WARNING | Tag Area 2/3 (2xx/3xx) di dokumen firma Area 1 |
| `NOT_IN_DRAWING` | WARNING | Instrumen di index tidak ditemukan di gambar P&ID |
| `FORMAT` | WARNING | Format tag index tidak baku |

Teks yang bukan tag diabaikan: nomor jalur (`6"-PL-101`), nomor dokumen/gambar (`DWG-PID-001`), `SIL-3`, `LOG-xxx`, rujukan standar. Bagian dokumen berjudul *Catatan Inkonsistensi* dan *Log Revisi* dilewati karena memang menyebut tag lama sebagai riwayat.

## 2. Hasil Pertama (2026-11-03, tanpa P&ID): 14 ERROR, 33 WARNING

| Masalah | Dokumen | Perbaikan | PIC |
| :--- | :--- | :--- | :--- |
| `PUMP-01` (C&E "PUMP-01-TRIP") | C&E | Ganti `P-101` | AL |
| `HEATER-01`, `E-01` | Alarm DB | `HEATER-01` → `E-101`; "kondenser E-01" adalah peralatan kolom Area 2 | AL |
| `S-08` | Index (AIC-201 lokasi) | Aliran Area 2; ikut keputusan loop kolom | JN |
| `C-01`, `C-02` | Index, C&E, Alarm, FDS Bab 4 | Kolom milik Area 2/3; keluarkan atau ubah jadi antarmuka | JN, AL |
| `ESDV-201`, `FCV-202`, `TCV-201` (phantom) | C&E | Milik Area 2/3; keluarkan dari C&E Area 1 | AL |
| 2xx di index (`PIC-201`, `PCV-201`, `LIC-202`, `AIC-201`), C&E, alarm, FDS | semua | Keputusan lingkup (LOG-014/015): keluarkan atau tandai sinyal antarmuka | JN, AL |
| `TSHH-101`, `TAL/TAH/TAHH-101` | C&E, Alarm, FDS | Loop TIC-101 ada. `TSHH-101` (SIL-3) sebaiknya sensor terpisah dari TIC-101 (independensi SIS, IEC 61511) → daftarkan di index | AL, JN |

Rincian lengkap per temuan ada di JSON (`findings[]`).

## 3. Sisa untuk DoD Fase 3
Validator sudah teruji pada P&ID DXF sintetis (`tools/test_validate_tags.py`). DoD butir 4 tercentang setelah dijalankan pada **minimal satu lembar Draf P&ID DXF asli** dari JN.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Validator + laporan pertama lintas dokumen (LOG-021). |
