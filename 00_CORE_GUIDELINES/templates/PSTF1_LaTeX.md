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

## 1. Struktur Wajib
Halaman awal: sampul, lembar pengesahan (Dosen Koordinator + 2 Praktisi Industri, Kadep), pakta integritas (e-meterai), ringkasan eksekutif, daftar isi.

| Bab | Subbab di template |
| :--- | :--- |
| 1 Konseptualisasi | 1.1 Latar Belakang Dokumen Lelang TOR · 1.2 Penurunan Teori Model Sains Sistem · 1.3 Parameter Batas Operasional Teknis (URS) |
| 2 Functional Design | 2.1 Logika Pergerakan Proses Kendali (ISA-5.06.01: startup, CV/MV/DV, interlock, FBD) |
| 3 Basic Engineering | 3.1 Matriks Analitis Pembobot Opsi Desain · 3.2 PFD (ISO 10628) · 3.3 Neraca Massa dan Neraca Termal · 3.4 Identifikasi Variabel Kendali (CV/MV/DV) · 3.5 Penjelasan Alur Draf P&ID (ISA-5.1) |
| 4 Kajian Keselamatan | 4.1 HAZOP · 4.2 Penentuan SIL |
| 5 Kajian Tekno-Ekonomi | 5.1 CAPEX · 5.2 OPEX · 5.3 Analisis Kelayakan Finansial (NPV, payback, IRR, sensitivitas) |
| Lampiran | A Draf P&ID (A3) · B Kumpulan Salinan Logbook |

Format: A4, 12 pt, margin kiri 4 cm / atas 3 cm / kanan 3 cm / bawah 3 cm, `report`, babel Indonesia.

## 2. Selisih dengan Struktur Lama Proyek
Ringkasan Panduan (§9) menyebut 4 bab; template resmi menambah **Bab 4 Kajian Keselamatan** serta subbab 3.1 dan 3.4. Struktur Google Docs laporan disesuaikan ke template (LOG-024).

## 3. Hal yang Perlu Diputuskan
1. **Jumlah anggota.** Template hanya punya makro `\namaA` s.d. `\namaD` (4 orang); tim berjumlah 5 (keputusan PM, LOG-005). Laporan kerja perlu makro `\namaE`/`\nimE` dan baris tambahan di sampul, pengesahan, pakta integritas, dan ringkasan eksekutif. Konfirmasi dengan Dosen Koordinator bila format dikunci.
2. **Metode SIL.** Contoh template memakai *risk graph*; RFP §3.1.2 mensyaratkan **LOPA** → ikuti RFP.
3. **Alat tulis.** Template berupa LaTeX (mis. Overleaf). Draf bab ditulis di Google Docs (master narasi, Blueprint §1.2) dengan struktur yang sama persis, lalu dipindah ke LaTeX saat finalisasi; atau tim menulis langsung di LaTeX. Pilihan PM.

## 4. Cara Memakai
1. Salin `PSTF1_LaTeX/` menjadi `07_FINAL_DELIVERABLES/reports/laporan_pstf1/` (laporan kerja).
2. Isi data identitas (`\judul`, nama/NIM, penilai, tanggal) dan tambahkan anggota ke-5.
3. Kompilasi dengan pdfLaTeX (paket: geometry, babel indonesian, titlesec, tabularx, graphicx, ulem, amsmath).

## 5. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Template disimpan + catatan struktur dan keputusan (LOG-024). |
