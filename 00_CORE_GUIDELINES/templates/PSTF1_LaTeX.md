---
id: "TPL-PSTF1-LATEX"
title: "Template LaTeX Laporan PSTF 1 (resmi DTNTF)"
category: "Report Template"
standard: "Panduan Capstone DTNTF 2026, Lampiran 3A"
target_files:
  - "PSTF1_LaTeX/laporan_pstf1.tex"
  - "PSTF1_LaTeX/logoUGM.png"
generated_by: ""
source_data:
  - "Folder 'LaporanPSTF1 (1)' dari PM (Downloads), sha256 tex 768575a7bb2b190e, logo be158a703272e932"
author: "DTNTF FT UGM (template); catatan oleh Claude Code (AI)"
reviewer: "Rahul Ghulam Hidayatulloh"
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Template", "LaTeX", "Laporan", "PSTF 1"]
---

# Template LaTeX Laporan PSTF 1

> ⚠️ File di `PSTF1_LaTeX/` adalah **template asli, jangan diubah**. Laporan kerja dibuat sebagai salinan (lihat §4). Isi teks contoh di template membahas "Proses ZXY pada Plant XYZ" dan **bukan** bahan untuk disalin ke laporan; angka contohnya (mis. 120 °C, CAPEX 116.000 USD) tidak boleh dikutip.

## 1. Isi Template
> **Keputusan PM (LOG-025):** template dipakai **hanya untuk format dan halaman awal**. Struktur isi laporan mengikuti **Panduan Lampiran 3A (4 bab)**: 1 Konseptualisasi · 2 FDS/Control Narrative · 3 Basic Engineering · 4 Tekno-ekonomi · Lampiran A Draf P&ID (A3) · Lampiran B Logbook. Tabel di bawah hanya mencatat isi contoh template.

Halaman awal: sampul, lembar pengesahan (Dosen Koordinator + 2 Praktisi Industri, Kadep), pakta integritas (e-meterai), ringkasan eksekutif, daftar isi.

| Bab | Subbab di contoh template |
| :--- | :--- |
| 1 Konseptualisasi | 1.1 Latar Belakang Dokumen Lelang TOR · 1.2 Penurunan Teori Model Sains Sistem · 1.3 Parameter Batas Operasional Teknis (URS) |
| 2 Functional Design | 2.1 Logika Pergerakan Proses Kendali (ISA-5.06.01: startup, CV/MV/DV, interlock, FBD) |
| 3 Basic Engineering | 3.1 Matriks Analitis Pembobot Opsi Desain · 3.2 PFD (ISO 10628) · 3.3 Neraca Massa dan Neraca Termal · 3.4 Identifikasi Variabel Kendali (CV/MV/DV) · 3.5 Penjelasan Alur Draf P&ID (ISA-5.1) |
| 4 Kajian Keselamatan | 4.1 HAZOP · 4.2 Penentuan SIL |
| 5 Kajian Tekno-Ekonomi | 5.1 CAPEX · 5.2 OPEX · 5.3 Analisis Kelayakan Finansial (NPV, payback, IRR, sensitivitas) |
| Lampiran | A Draf P&ID (A3) · B Kumpulan Salinan Logbook |

Format: A4, 12 pt, margin kiri 4 cm / atas 3 cm / kanan 3 cm / bawah 3 cm, `report`, babel Indonesia.

## 2. Selisih Template dengan Panduan
Contoh template berisi 5 bab: menambah **Bab 4 Kajian Keselamatan (HAZOP, SIL)** serta subbab 3.1 matriks pembobot dan 3.4 identifikasi CV/MV/DV. LOG-024 sempat mengikuti struktur ini; **LOG-025 mengembalikannya ke 4 bab Panduan**. HAZOP dan SIL masuk PSTF 2 (Panduan BAB IV), identifikasi CV/MV/DV dibahas di Bab 2 FDS (operasi normal), dan matriks pembobot opsi desain tidak menjadi subbab wajib.

## 3. Keputusan (LOG-025)
1. **Struktur isi**: 4 bab Panduan Lampiran 3A (lihat §1).
2. **Anggota ke-5**: laporan kerja menambah makro `\namaE`/`\nimE` dan barisnya di sampul, pengesahan, pakta integritas, dan ringkasan eksekutif. Konfirmasi dengan Dosen Koordinator bila format dikunci.
3. **Alat tulis: opsi 1.** Draf ditulis di Google Docs (master narasi) dengan struktur yang sama, lalu dipindah ke LaTeX saat finalisasi.
4. **Metode SIL** (untuk PSTF 2): contoh template memakai *risk graph*; RFP §3.1.2 mensyaratkan **LOPA**, jadi ikuti RFP.

## 4. Cara Memakai
1. Laporan kerja sudah dibuat di `07_FINAL_DELIVERABLES/reports/laporan_pstf1/` (companion `laporan_pstf1.md`); template di folder ini tetap asli.
2. Isi data identitas (`\judul`, NIM, penilai, tanggal) di laporan kerja.
3. Kompilasi dengan pdfLaTeX, mis. di Overleaf (paket: geometry, babel indonesian, setspace, titlesec, tabularx, graphicx, ulem, amsmath).

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Template disimpan + catatan struktur dan keputusan (LOG-024). |
| 0.2 | 2026-11-03 | Claude Code (AI) | Koreksi PM: isi mengikuti 4 bab Panduan, template hanya format; anggota ke-5 dan opsi 1 diputuskan; laporan kerja dibuat (LOG-025). |
