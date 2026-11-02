---
id: "CAD-TPL-DME-001"
title: "Template Baku Gambar Teknik AutoCAD P&ID dan PFD"
category: "CAD Standards"
standard: "ISO 5457 (Drawing Sheet Sizes) / ISO 7200 (Title Blocks) / ISA-5.1"
author: "Jonathan Pangihutan Michael Siahaan"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "DME_Master_Template.dwt"
---

# Panduan Penggunaan: DME_Master_Template.dwt

## 1. Format Lembar & Etiket
- Standar Layout: Format **A3 Landscape** ($420 \times 297\text{ mm}$) dan **A1 Landscape** ($841 \times 594\text{ mm}$).
- Title Block mencakup identitas resmi: Departemen Teknik Nuklir dan Teknik Fisika UGM, Nama Proyek, No. Dokumen, Kode Lembar, dan Kolom Approval Paraf Tim.

## 2. Struktur Layer Terstandarisasi
- `00_BORDER` (White/Color 7)
- `01_TITLE_BLOCK` (White/Color 7)
- `02_PROCESS_MAJOR` (Cyan/Color 4, Tebal: 0.50 mm)
- `03_PROCESS_MINOR` (Green/Color 3, Tebal: 0.25 mm)
- `04_EQUIPMENT` (White/Color 7, Tebal: 0.70 mm)
- `05_INST_BUBBLE` (Red/Color 1, Tebal: 0.25 mm)
- `06_INST_ELEC_SIG` (Yellow/Color 2, Linetype: DASHDOT)
- `07_INST_PNEUM_SIG` (Magenta/Color 6, Linetype: TRACKS)
