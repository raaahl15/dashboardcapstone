---
id: "RPT-PSTF1-LATEX"
title: "Laporan Kerja LaTeX PSTF 1 FEED Pabrik DME Area 1"
category: "Final Deliverable"
standard: "Panduan Capstone DTNTF 2026, Lampiran 3A (struktur 4 bab); template LaTeX resmi DTNTF (format)"
target_files:
  - "laporan_pstf1/laporan_pstf1.tex"
generated_by: ""
source_data:
  - "../../00_CORE_GUIDELINES/templates/PSTF1_LaTeX/laporan_pstf1.tex (template resmi, tidak diubah)"
  - "Google Docs laporan_pstf1 (master narasi, lihat 06_COLLABORATIVE_WORKSPACE/google_workspace_registry.json)"
author: "Rahul Ghulam Hidayatulloh (PIC); salinan kerja disiapkan Claude Code (AI)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: "https://docs.google.com/document/d/1sR0IRYj7mvfL_qnL9qyKI035ig14XihuafEGQR_c62w/edit"
last_updated: "2026-11-03"
tags: ["Laporan", "LaTeX", "PSTF 1", "FEED"]
---

# Laporan Kerja LaTeX PSTF 1

Salinan kerja dari template resmi. Draf ditulis di Google Docs (master narasi); isi dipindah ke file ini saat finalisasi (keputusan PM, opsi 1, LOG-025).

## 1. Perubahan terhadap Template
1. **Anggota ke-5**: makro `\namaE`/`\nimE` ditambahkan. Barisnya muncul di sampul, lembar pengesahan, pakta integritas (tanda tangan Anggota 5 di baris tersendiri), dan ringkasan eksekutif.
2. **Struktur isi = Panduan Lampiran 3A (4 bab)**: 1 Konseptualisasi · 2 FDS/Control Narrative (start-up, operasi normal termasuk CV/MV/DV, shutdown otomatis) · 3 Basic Engineering (PFD, neraca massa & termal, alur Draf P&ID) · 4 Kajian Tekno-Ekonomi (CAPEX, OPEX, NPV/IRR/payback) · Lampiran A Draf P&ID (A3) · Lampiran B Logbook. Bab Kajian Keselamatan dan subbab matriks pembobot dari contoh template tidak dipakai; HAZOP dan SIL (LOPA) masuk PSTF 2.
3. Teks contoh template ("Proses ZXY pada Plant XYZ") dihapus; setiap subbab berisi penanda `[...]`.

## 2. Data Identitas yang Belum Diisi
- NIM kelima anggota, tanggal penulisan dan ujian, nama Dosen Koordinator (dan NIP), dua Praktisi Industri.
- Judul `\judul` masih **usulan**, perlu disetujui PM dan Dosen Pembimbing.
- Nama dan NIP Kadep diambil apa adanya dari template resmi; cek ulang saat finalisasi.

## 3. Kompilasi
pdfLaTeX dari folder `laporan_pstf1/`. Logo dibaca dari folder template lewat `\graphicspath` (repo melarang file duplikat); di Overleaf, unggah `logoUGM.png` dari template ke folder yang sama. Paket: geometry, babel indonesian, setspace, titlesec, tabularx, graphicx, ulem, amsmath). Belum dikompilasi di repo karena PC ini tidak memasang TeX; gunakan Overleaf.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Salinan kerja dibuat: anggota ke-5, struktur 4 bab Panduan (LOG-025). |
