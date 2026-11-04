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
  - "Draf P&ID DME-PID-002_Draft_PID_Area1_RevB.dxf (sha256 92135c824e85225c), 2026-11-04 (LOG-036); Rev A: DME-PID-002_Draft_PID_Area1.dxf (sha256 5eaa85cdc0103348)"
author: "Jonathan Pangihutan Michael Siahaan (PIC tag); validator oleh Claude Code (AI)"
reviewer: "Ihsaan Zauhair Tsaqif Prawira"
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-04"
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

## 3. Hasil Kedua (2026-11-04): dengan Draf P&ID asli — 56 ERROR, 40 WARNING
Gambar: **`DME-PID-002_Draft_PID_Area1.dxf`** (sha256 `5eaa85cdc0103348`, 175.330 B, disimpan 2026-10-29 di Drive folder "aa", di luar `CAPSTONE_DME_AREA1`). Dijalankan: `.venv\Scripts\python -I tools/validate_tags.py --dxf <file>`. **DoD Fase 3 butir 4 terpenuhi** (validator berjalan pada P&ID DXF asli). Gambar dibuat **sebelum** `tag_map.csv` FINAL (2026-11-03), jadi sebagian besar temuan adalah ketertinggalan tag, bukan kesalahan validator.

| Temuan dari gambar | Jumlah | Tag | Arti / tindak lanjut | PIC |
| :--- | ---: | :--- | :--- | :--- |
| `PHANTOM_IN_DRAWING` | 34 | FT-101, FV-101, TE-101, TE-102A, TT-101, TT-104, TIC-109, TV-109, TAH-104, TSHH-102, PT-103, PT-106, PI-107, PI-108, PSV-102, LIC-105, LV-105, LG-105, LAL-105, HV-101/102/104–109, NRV-101/102, XV-102, XY-102, XA-102, ST-101, DC-201 | Instrumen ada di gambar tetapi tidak di Master Instrument Index. Index masih **data contoh (PLACEHOLDER)**, sedangkan gambar adalah hasil kerja nyata → index di Sheets perlu **diturunkan dari P&ID** (`DATA_STATUS = P&ID`). HV/NRV (katup manual/check) bisa dikecualikan bila konvensi tim tidak memasukkannya ke index | JN |
| `WILD_TAG` / `DWSIM_TAG` | 6 | REAC-01, HEATER-01, PUMP-01, C-01, C-02, REG-01 | Tag lama/DWSIM di gambar → ganti tag pabrik (R-101, E-101, P-101); C-01/C-02 milik Area 2/3; REG-01 perlu diperiksa | JN |
| `UNKNOWN_EQUIPMENT` | 2 | E-103, T-101 | Peralatan di gambar yang tidak ada di `tag_map.csv` → tambahkan ke tag_map (bila memang peralatan Area 1) atau perbaiki tag | IH + JN |
| `AREA_SCOPE` | 1 | DC-201 | Instrumen bernomor area 2xx di gambar Area 1 | JN |
| `NOT_IN_DRAWING` | 6 | ESDV-101, FCV-101, AIC-201, LIC-202, PCV-201, PIC-201 | Ada di index tetapi tidak di gambar. ESDV-101 (trip suhu RFP §2.3) dan FCV-101 (kaskade TIC–FIC) **wajib ada di P&ID Area 1**; 2xx = lingkup Area 2 | JN |

Temuan lintas dokumen (index, C&E, alarm, FDS) dari Hasil Pertama tetap ada; rincian lengkap di JSON (`findings[]`). DoD Fase 5 ("0 phantom tag pada P&ID berstatus `Diajukan`") baru bisa tercapai setelah gambar dan index diselaraskan.

## 4. Hasil Ketiga (2026-11-04, LOG-036): Draf P&ID **Rev B** — 0 ERROR, 1 WARNING
Gambar: **`DME-PID-002_Draft_PID_Area1_RevB.dxf`** (sha256 `92135c824e85225c`, 210 661 B). Dibuat agent dari Rev A dengan **hanya mengganti isi teks** (posisi, layer, dan simbol tetap) dan menambah baris revisi B di tabel revisi. File berada di folder staging Drive `CAPSTONE_DME_AREA1/03_CAD_DWG/` dan menunggu diunggah. Perubahan:

| Perubahan | Dasar |
| :--- | :--- |
| `R-101 (REAC-01)`, `E-101 (HEATER-01)`, `(PUMP-01)` → tag pabrik saja; catatan 1 merujuk `tag_map.csv` | tag_map FINAL |
| `E-103` (pendingin efluen) → `E-102` (label, judul, tabel ringkasan) | `COOL-01 → E-102` FINAL |
| `FROM REG-01` → `DARI AREA 3`; `TO DC-201` → `KE AREA 2`; catatan 7 tanpa C-01/C-02 | lingkup 3 area (LOG-014/015) |
| Line `P-102`, `P-103` 3" → **2"**; `P-104`, `P-105` 3" → **6"** | `CALC_LineSizing.csv` |
| Tabel revisi: baris B `04-11-26`; judul REV `A` → `B` | — |

Sekaligus diselaraskan: Master Instrument Index (Sheets, 30 tag dari gambar), `tag_map.csv` (+`T-101` USULAN), C&E, alarm database, FDS Rev 0.4. Validator diperbaiki agar **gelembung dua teks** (`LT` di atas `105`) terbaca, singkatan `TE-102A/B/C` diurai, dan item perpipaan `HV`/`NRV`/`ST` tidak diperiksa sebagai instrumen.

| Temuan | Tag | Tindak lanjut | PIC |
| :--- | :--- | :--- | :--- |
| `NOT_IN_DRAWING` (WARNING) | FE-101 | Gambar simbol orifice FE-101 pada line 2"-P-102 di hulu FT-101 | JN |

Pembanding: Rev A diperiksa ulang dengan index dan validator baru → 8 ERROR (`PUMP-01`, `HEATER-01`, `REAC-01`, `REG-01`, `C-01`, `C-02`, `DC-201`, `E-103`), 2 WARNING (`DC-201` area, `FE-101`). Semua 34 phantom instrumen Rev A hilang karena index kini diturunkan dari gambar.

**DoD Fase 5 butir 1** ("0 phantom tag pada P&ID berstatus `Diajukan`"): gambar Rev B 0 ERROR; **PM menyatakan P&ID sudah direview dan selesai (LOG-039) → butir dicentang.** Catatan awal (sebelum review): Langkah menuju status itu: JN memeriksa Rev B di AutoCAD (tata letak teks, FE-101), IH dan JN mengonfirmasi T-101, lalu PM menetapkan status.

## 5. Sisa Pekerjaan
- JN: buka Rev B di AutoCAD dan periksa tata letak teks yang diganti; tambahkan simbol FE-101; simpan sebagai DWG master dan jalankan ulang `npm run validate:tags -- --dxf <file>`.
- IH + JN: konfirmasi `T-101` (tag_map baris USULAN) dan klarifikasi catatan 6 gambar (tekanan T-101, FEHE di tabel PFD).
- Antigravity/PM: unggah `DME-PID-002_Draft_PID_Area1_RevB.dxf` dari staging ke Drive `03_CAD_DWG/` (Rev A tetap di folder "aa" sebagai arsip).
## 6. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Validator + laporan pertama lintas dokumen (LOG-021). |
| 0.2 | 2026-11-04 | Claude Code (AI) | Dijalankan pada Draf P&ID asli `DME-PID-002` (56 ERROR, 40 WARNING); laporan mencatat nama file + sha256, bukan path absolut (LOG-034). |
| 0.3 | 2026-11-04 | Claude Code (AI) | Draf P&ID Rev B + index dari gambar → 0 ERROR, 1 WARNING; validator: gelembung dua teks, singkatan A/B/C, item perpipaan (LOG-036). |
