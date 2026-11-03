---
id: "TAGMAP-DME-001"
title: "Peta Tag DWSIM ke Tag Pabrik, Area 1"
category: "Tag Mapping"
standard: "ISA-5.1 / ISO 10628 (konvensi Blueprint §2.3)"
target_files:
  - "tag_map.csv"
generated_by: ""
source_data:
  - "simulation_files/DME.dwxmz → topologi GraphicObject (konektor masuk/keluar), dibaca 2026-11-03 (LOG-014)"
  - "Keputusan PM 2026-11-03: lingkup Area 1 = S-01…S-07 + S-14; penomoran ikut nomor objek DWSIM dengan gaya tag pabrik"
author: "Ihsaan Zauhair Tsaqif Prawira (PIC); draf disusun Claude Code (AI)"
reviewer: "Jonathan Pangihutan Michael Siahaan"
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Tag Map", "DWSIM", "Plant Tag", "Battery Limit", "Area-100"]
---

# Peta Tag DWSIM ke Tag Pabrik (`tag_map.csv`)

> ⚠️ **USULAN (Draft).** Pemetaan diturunkan otomatis dari topologi model DWSIM dan keputusan PM soal lingkup. Tag pabrik baru final setelah dikonfirmasi PIC (IH) dan reviewer (JN). Selama kolom `status` masih `USULAN`, tag ini belum boleh dipakai di gambar P&ID final.

`tag_map.csv` adalah **master** pemetaan tag (Blueprint §1.2). Tag DWSIM hanya dipakai di dalam simulasi; P&ID, PFD, FDS, Instrument Index, C&E, alarm database, dan laporan memakai `plant_tag`.

## 1. Pembagian Area Pabrik & Lingkup Area 1 (keputusan PM, 2026-11-03)
Pabrik DME dibagi menjadi **3 area**, masing-masing dikerjakan satu kelompok/firma:

| Area | Isi (objek DWSIM) | Kode area tag |
| :--- | :--- | :--- |
| **Area 1 (firma ini)** | Reaktor: S-01…S-07, PUMP-01, MIX-01, HEAT-01, RC-01, COOL-01 + recycle masuk S-14 | 100 |
| Area 2 | Distilasi 1: CSCOL-01, S-08, S-09 | 200 |
| Area 3 | Distilasi 2: CSCOL-02, S-10, S-11 + loop recycle PUMP-02, COOL-02, S-12, S-13, REC-01 *(loop recycle ditempatkan di Area 3 sementara, perlu konfirmasi)* | 300 |

| Aliran antarmuka Area 1 | Arah |
| :--- | :--- |
| S-101 (DWSIM S-01) | Masuk: umpan metanol segar |
| S-107 (DWSIM S-07) | **Keluar ke Area 2** (umpan kolom distilasi 1) |
| S-114 (DWSIM S-14) | **Masuk dari Area 3** (recycle metanol) |

Objek Area 2 dan Area 3 tetap dicantumkan (`plant_tag` kosong) agar seluruh isi model DWSIM tertelusur; tag pabriknya ditetapkan kelompok area masing-masing.

Alur Area 1: `S-101 → P-101 → S-102 → M-101 (+ S-114) → S-103 → E-101 → S-104 → R-101 → S-105 → E-102 → S-107 → [Area 2]`. R-101 juga punya outlet cair S-106.

## 2. Aturan Penomoran
1. Nomor mengikuti **nomor objek DWSIM**, ditulis dengan gaya tag pabrik area 100: `S-0n → S-10n`, `S-14 → S-114`, `PUMP-01 → P-101`, `RC-01 → R-101`, `MIX-01 → M-101`.
2. Heat exchanger memakai kode `E`. Karena HEAT-01 dan COOL-01 sama-sama bernomor 01 di DWSIM, urutan mengikuti **arah aliran**: `HEAT-01 → E-101` (pemanas umpan), `COOL-01 → E-102` (pendingin efluen).
3. Aliran energi DWSIM (`E-01`…`E-10`) **bukan** heat exchanger dan tidak diberi tag pabrik. Formatnya mirip `E-101`, jadi jangan tertukar: `E-01` = daya P-101, `E-02` = duty E-101, `E-03` = duty R-101, `E-04` = duty E-102.
4. Kolom CSV: `dwsim_tag, plant_tag, object_type, description, area, scope, from, to, status`. `scope`: `AREA_1`, `INTERFACE_OUT`, `INTERFACE_IN`, `AREA_1_ENERGY`, `AREA_2`, `AREA_3`. Kolom `area` = kode area tag (100/200/300). `status`: `USULAN` → `FINAL` setelah dikonfirmasi IH + JN.

## 3. Dampak ke Dokumen Lain (perlu ditindaklanjuti PIC masing-masing)
| No | Temuan | Dokumen | PIC |
| :---: | :--- | :--- | :--- |
| 1 | Loop kolom distilasi 1 (`PIC-201`, `PCV-201`, `LIC-202`, `AIC-201`) berada di **lingkup Area 2**. Perlu dikeluarkan dari index Area 1, atau ditandai sebagai sinyal antarmuka bila memang dipertukarkan. | Master Instrument Index (Sheets) | JN |
| 2 | FDS §4 (loop tekanan & refluks kolom C-01) berada di luar lingkup Area 1. | FDS (Docs) | AL |
| 3 | Tag liar `REAC-01`, `C-01`, `HEATER-01` di index/FDS/C&E harus diganti `R-101`, `E-101`; `C-01` milik Area 2. | Index, FDS, C&E, alarm database | JN, AL |
| 4 | Logbook/MoM di cockpit menyebut **"kondensor parsial E-101"** untuk pendingin efluen reaktor. Menurut aturan §2.2 tag itu menjadi **E-102**. Data live ada di Firestore, jadi perlu dikoreksi lewat UI cockpit. | Cockpit (Firestore) | RG |
| 5 | Kode area tag dikoreksi: **1xx = Area 1 reaktor, 2xx = Area 2 distilasi 1, 3xx = Area 3 distilasi 2** (sebelumnya 3xx = utilitas). Firma Area 1 hanya menerbitkan tag 1xx. | Blueprint §2.3, companion index | RG |
| 9 | Penempatan loop recycle (PUMP-02, COOL-02) di Area 3 masih sementara; sepakati dengan kelompok Area 3, termasuk spesifikasi S-114 di battery limit. | tag_map.csv | RG, IH |
| 6 | Re-audit (LOG-002) mencatat "1 unit bertag kosong". Objek itu adalah `GO_MasterTable` (tabel tampilan DWSIM), bukan unit operasi; jumlah unit sebenarnya 10. | `hmb_streams.json` (diperbaiki di Fase 3) | IH |
| 7 | Outlet cair reaktor S-06/S-106 tidak tersambung ke unit lain. Perlu dikonfirmasi apakah laju alirnya nol (reaktor fase gas) atau ada aliran yang belum dimodelkan. | DME.dwxmz | IH |
| 8 | M-101 di P&ID kemungkinan hanya sambungan pipa (tee). Putuskan apakah tetap diberi tag peralatan. | P&ID, PFD | IH, JN |

## 4. SOP Pembaruan
1. Ubah `tag_map.csv` (master di Git) lalu `npm run check`.
2. Bila model DWSIM berubah (objek baru/hapus), cocokkan ulang daftar `dwsim_tag` dengan topologi model.
3. Setelah IH + JN setuju, ubah `status` baris menjadi `FINAL` dan isi `review_evidence` companion ini dengan referensi MoM.
4. Fase 3: `validate_tags.py` memakai file ini untuk memeriksa tag di P&ID, index, FDS, C&E, dan alarm database.

## 5. Verifikasi Draf
Topologi dibaca dari XML di dalam `DME.dwxmz` (salinan di folder sementara; file master tidak diubah): 35 GraphicObject, yaitu 14 aliran material, 10 aliran energi, 10 unit operasi, dan 1 tabel. Konektor masuk/keluar setiap unit dicocokkan satu per satu dengan kolom `from`/`to`.

## 6. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Draf awal dari topologi DWSIM + keputusan lingkup PM (LOG-014). |
| 0.2 | 2026-11-03 | Claude Code (AI) | Pabrik 3 area (Area 2 distilasi 1, Area 3 distilasi 2); S-114 masuk dari Area 3; kode area 100/200/300 (LOG-015). |
