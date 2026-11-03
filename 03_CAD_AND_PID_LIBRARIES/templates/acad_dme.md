---
id: "CAD-LIN-DME-001"
title: "Definisi Linetype Sinyal Instrumentasi AutoCAD"
category: "CAD Standards"
standard: "ISA-5.1-2009 (Instrumentation Symbols and Identification)"
target_files:
  - "acad_dme.lin"
generated_by: ""
source_data: []
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["AutoCAD", "Linetype", "ISA-5.1"]
---

# Panduan Konfigurasi: acad_dme.lin

File ini mendefinisikan tipe garis khusus sesuai simbol garis ISA-5.1 untuk AutoCAD:
- Sinyal elektrik (4–20 mA, HART): `-- - -- - --`
- Sinyal pneumatik (3–15 psi): `-- // -- // --`
- Data link / fieldbus (Modbus, Fieldbus, Ethernet): `-- [ ] -- [ ] --`
- Capillary tube: `-- X -- X --`

## Cara Memakai
1. Di AutoCAD: `LINETYPE` → *Load…* → *File…* → pilih `acad_dme.lin` dari repo ini.
2. Pilih linetype yang dibutuhkan, lalu tetapkan pada layer sinyal di template (`06_INST_ELEC_SIG`, `07_INST_PNEUM_SIG`).

## Yang Perlu Diverifikasi PIC
- Kesesuaian setiap pola garis terhadap tabel simbol garis ISA-5.1-2009.
- Skala linetype (`LTSCALE`) untuk lembar A3 dan A1.

## Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal (`acad_dme_lin.md`). |
| 0.2 | 2026-11-03 | Claude Code (AI) | Rename → `acad_dme.md` (aturan nama companion v2.0); status → WIP; tambah cara pakai (LOG-004). |
