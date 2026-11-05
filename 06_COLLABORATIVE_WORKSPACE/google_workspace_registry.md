---
id: "GWS-REGISTRY-001"
title: "Registry Google Workspace (Drive, Sheets, Docs) Proyek DME Area 1"
category: "Collaborative Workspace"
standard: ""
target_files:
  - "google_workspace_registry.json"
generated_by: ""
source_data:
  - "Konektor Google Drive claude.ai (akun pribadi PM), diverifikasi 2026-11-03 (LOG-010)"
author: "Claude Code (AI)"
reviewer: "Rahul Ghulam Hidayatulloh"
status: "WIP"
review_evidence: ""
google_ref: "https://drive.google.com/drive/folders/1aV2msrsmDPdYxKelZ3UlncmAsO6kmKod"
last_updated: "2026-11-05"
tags: ["Google Workspace", "Registry", "Drive", "Sheets", "Docs"]
---

# Registry Google Workspace

Daftar ID dan URL folder Drive serta dokumen Google (Sheets/Docs) proyek. File ini dibaca cockpit (modul 10 Google Workspace Hub, Fase 4) dan skrip sinkronisasi (`pull_sheets`, Fase 2).

## 1. Aturan
- **Pemilik semua file**: akun Google pribadi PM (Blueprint §3.3). Tim diberi akses Editor, dosen Commenter/Viewer, lewat Share ke email UGM.
- **Pembagian kerja** (LOG-008): Antigravity mengelola folder & file biner di Drive; Claude Code mengelola isi Sheets/Docs dan memperbarui registry ini.
- **ID tidak berubah saat file dipindah** antar folder Drive. Setelah Antigravity membuat folder target (`folders_pending`), dokumen cukup dipindah; ID dan URL di registry tetap berlaku. Tambahkan ID folder baru ke `drive.folders`.
- Registry hanya berisi ID dan URL. Tidak boleh ada token, kunci API, atau kredensial.

## 2. Isi Saat Ini (2026-11-03)
| Key | Jenis | Judul | Folder target | Status |
| :--- | :--- | :--- | :--- | :--- |
| `instrument_index` | Sheets | Master Instrument Index & IO List DME Area 1 | `04_INSTRUMENT_INDEX_SHEETS` | Draft, data PLACEHOLDER |
| `fds` | Docs | FDS-IC-DME-2026-001 | `06_LIVING_REPORTS_GDOCS` | Draft, isi PLACEHOLDER |
| `laporan_pstf1` | Docs | Laporan PSTF 1 FEED (Draf) | `06_LIVING_REPORTS_GDOCS` | Draft, kerangka |

Ketiga dokumen sudah berada di folder targetnya (dipindah Antigravity, LOG-011). Seluruh 7 folder Blueprint §3.3 tercatat di `drive.folders`; `folders_pending` kosong.

Entri Sheets yang disinkron ke repo juga punya `sync_tab`, `key_column`, dan `required_columns`, yang dipakai `tools/sync/pull_sheets.js` untuk validasi.

## 3. Skema
- `drive.root`, `drive.folders[]`: `{key, title, id, url}`.
- `drive.folders_pending[]`: nama folder Blueprint §3.3 yang belum ada di Drive.
- `drive.files[]`: file biner penting di Drive (P&ID DXF, standar PDF) dengan `key`, `title`, `id`, `url`, `folder`, `note` (LOG-038).
- `documents[]`: `{key, type (sheets|docs|slides), title, doc_no, id, url, target_folder, pic, status, data_status}`, ditambah `repo_snapshot` + `sync_direction` untuk Sheets yang disalin ke CSV, atau `repo_companion` untuk Docs yang punya companion di repo.

## 4. SOP Pembaruan
1. Buat atau pindahkan dokumen di Drive.
2. Perbarui entri di `google_workspace_registry.json` (ID diambil dari URL `/d/<id>/`).
3. Perbarui `updated_at`, jalankan `npm run check`, dan catat di log riwayat.

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Registry awal: root + 2 folder Drive, 1 Sheets, 2 Docs (LOG-010). |
| 0.2 | 2026-11-03 | Claude Code (AI) | + 5 folder dari LOG-011; field sinkronisasi untuk `pull_sheets` (LOG-012). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Laporan PSTF 1 mengikuti template LaTeX 5 bab: struktur, `tor_rfp`, pengerja & reviewer 15 bagian (LOG-024). |
| 0.4 | 2026-11-03 | Claude Code (AI) | Koreksi PM: laporan PSTF 1 kembali ke 4 bab Panduan (11 bagian); + `authoring`, `latex_working_copy`, `members` (5 orang) (LOG-025). |
| 0.5 | 2026-11-04 | Claude Code (AI) | + `tor_rfp_pdf` (ID Drive PDF RFP dari unggahan Antigravity, LOG-026); akses umum Drive terverifikasi Dibatasi (LOG-028). |
| 0.6 | 2026-11-04 | Claude Code (AI) | + `drive.files`: P&ID DME-PID-002 Rev B (03_CAD_DWG) dan ASME PTC 19.3 TW-2016 (00_CORE_GUIDELINES), diunggah PM, diverifikasi lewat konektor (LOG-038). |
| 0.7 | 2026-11-05 | Antigravity (AI) | + `drive.files`: P&ID DME-PID-002 Rev B A3 DXF & gambar pratinjau PNG (03_CAD_DWG) diunggah ke Drive (LOG-056). |
| 0.8 | 2026-11-05 | Antigravity (AI) | + `drive.files`: Master Legend P&ID Rev 1 DXF & gambar pratinjau PNG (`03_CAD_DWG/symbol_libraries`) diunggah ke Drive (LOG-060). |
