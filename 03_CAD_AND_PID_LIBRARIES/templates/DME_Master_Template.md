---
id: "CAD-TPL-DME-001"
title: "Template Baku Gambar Teknik AutoCAD P&ID dan PFD"
category: "CAD Standards"
standard: "ISO 5457 (ukuran lembar) / ISO 7200 (title block) / ISA-5.1"
target_files: []
external_files:
  - path: "DRIVE_ROOT/03_CAD_DWG/templates/DME_Master_Template.dwt"
    sha256_prefix: "1fa985b0a0d5880d"
    size_kb: 1047
  - path: "DRIVE_ROOT/03_CAD_DWG/templates/DME_Master_Template.dxf"
    sha256_prefix: "7a49c015b20fa633"
    size_kb: 4415
generated_by: ""
source_data: []
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["AutoCAD", "Template", "Title Block"]
---

# Panduan Penggunaan: DME_Master_Template

> 📁 **Lokasi file:** sejak Fase 1.5 (LOG-004), file biner template disimpan di Google Drive (`DRIVE_ROOT/03_CAD_DWG/templates/`), bukan di Git. Companion ini tetap di repo sebagai dokumentasi. Hash di frontmatter dipakai untuk memastikan versi file yang dipakai sama.

## 1. Format Lembar & Etiket
- Format **A3 landscape** (420 × 297 mm) dan **A1 landscape** (841 × 594 mm).
- Title block memuat: Departemen Teknik Nuklir dan Teknik Fisika UGM, nama proyek, no. dokumen, kode lembar, revisi, dan kolom approval/paraf tim.
- Panduan Capstone mewajibkan lampiran cetak biru **A3 lipat** pada laporan PSTF 1 dan PSTF 2.

## 2. Struktur Layer
| Layer | Warna | Lineweight / Linetype |
| :--- | :--- | :--- |
| `00_BORDER` | 7 (white) | — |
| `01_TITLE_BLOCK` | 7 (white) | — |
| `02_PROCESS_MAJOR` | 4 (cyan) | 0,50 mm |
| `03_PROCESS_MINOR` | 3 (green) | 0,25 mm |
| `04_EQUIPMENT` | 7 (white) | 0,70 mm |
| `05_INST_BUBBLE` | 1 (red) | 0,25 mm |
| `06_INST_ELEC_SIG` | 2 (yellow) | linetype sinyal elektrik (`acad_dme.lin`) |
| `07_INST_PNEUM_SIG` | 6 (magenta) | linetype sinyal pneumatik (`acad_dme.lin`) |
| `08_TEXT_MAJOR`, `09_TEXT_MINOR` | 7 (white) | — |
| `10_DIMENSION` | 8 (grey) | — |

## 3. Riwayat Berkas
- File duplikat `DME_Master_Template.dwg`, `Engineering_Drawing_Template.dwg`, dan `Engineering_Drawing_Template.dxf` (byte-identik dengan `.dwt`/`.dxf` di atas) dihapus pada Fase 1.5. Salinan lengkap riwayat lama ada di bundle backup `dme-capstone-master_BACKUP_2026-11-03_pre-phase1.5.bundle`.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → WIP; file biner dipindah ke Drive; duplikat dihapus (LOG-004). |
