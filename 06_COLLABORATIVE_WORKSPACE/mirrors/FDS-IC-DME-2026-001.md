---
id: "MIRROR-FDS-IC-DME-2026-001"
title: "Mirror teks FDS-IC-DME-2026-001 (dari Google Docs)"
category: "Mirror"
standard: "ISA-5.06.01 / NAMUR NA 35"
target_files: []
generated_by: "Claude Code via konektor Google Drive (read_file_content), 2026-11-03 (LOG-021)"
source_data:
  - "Google Docs 1PFiIfHzHZzQxRegLekQ-NUGTXEvloy-lQOi0O3T34wg (Rev 0.3)"
author: "Altaf Ramadhan Parvez (PIC dokumen master)"
reviewer: "Jonathan Pangihutan Michael Siahaan"
status: "Draft"
review_evidence: ""
google_ref: "https://docs.google.com/document/d/1PFiIfHzHZzQxRegLekQ-NUGTXEvloy-lQOi0O3T34wg/edit"
last_updated: "2026-11-03"
tags: ["Mirror", "FDS", "Generated"]
---

> 🔁 **MIRROR READ-ONLY.** Master ada di Google Docs (`google_ref`). File ini salinan teks untuk pemeriksaan otomatis (`tools/validate_tags.py`). Jangan edit di sini; perbarui mirror setiap kali master berubah.

# Functional Design Specification (FDS) & Control Narrative
**Proyek:** Pabrik Dimethyl Ether (DME) Berbasis Dehidrasi Metanol, Area 1
**No. Dokumen:** FDS-IC-DME-2026-001
**Standar acuan:** ISA-5.06.01 / NAMUR NA 35
**PIC:** Altaf Ramadhan Parvez
**Reviewer:** Jonathan Pangihutan Michael Siahaan
**Status:** Draft
**Revisi:** 0.3 (2026-11-03)

**Status isi: DRAF KERANGKA (PLACEHOLDER).** Isi Bab 2 sampai 4 adalah contoh awal dari repo (LOG-004), belum diturunkan dari URS dan Draf P&ID. Angka dan tag di dalamnya belum boleh dikutip sebagai hasil desain. Panduan Capstone (BAB III §3.1, Lampiran 3A Bab 2) mewajibkan FDS menjelaskan urutan start-up, operasi normal, dan shutdown otomatis secara sekuensial; bagian itu disediakan di Bab 5 sampai 7 dan masih kosong.

## 1. Ruang Lingkup & Rujukan
[Isi: batas sistem kendali Area 1 (area 100: umpan S-101 sampai efluen S-107 ke Area 2, ditambah recycle masuk S-114 dari Area 3; sinyal antarmuka dengan Area 2 dan Area 3), dokumen rujukan (URS, PFD, Draf P&ID, Master Instrument Index & IO List di Google Sheets), dan daftar singkatan.]

## 2. Loop Kontrol Kaskade Reaktor Dehidrasi (R-101)
- **Master controller (primary):** temperature controller TIC-101 memantau temperatur keluaran E-101 dan titik panas bed katalis R-101.
- **Slave controller (secondary):** flow controller FIC-101 mengatur katup FCV-101 pada pipa discharge P-101.
- **Prinsip operasi:** jika suhu reaksi melampaui setpoint (250 °C), output TIC-101 memodulasi pasokan panas pada E-101 dan membatasi laju umpan metanol melalui FIC-101 untuk mencegah pelepasan panas eksotermik berlebih.

## 3. Sistem Keselamatan Interlock Darurat (SIS / ESD)
- **Trip high-high suhu reaktor (TSHH-101):** jika temperatur bed katalis mencapai 320 °C atau lebih, sinyal dikirim ke logic solver safety (SIL-3).
- **Aksi interlock 1:** menutup emergency shut-off valve ESDV-101 pada jalur inlet umpan dalam waktu kurang dari 2 detik.
- **Aksi interlock 2:** menghentikan motor pompa umpan P-101 dalam waktu kurang dari 1 detik untuk memutus suplai reaktan.

## 4. Loop Kontrol Tekanan & Refluks Kolom Distilasi DME (C-01)
- **Pressure control (PIC-201):** mengatur bukaan katup PCV-201 pada saluran gas atas menuju kondensor untuk menjaga tekanan stabil pada 11,2 bar(a).
- **Purity control (AIC-201):** gas chromatograph online memantau fraksi mol DME. Jika kemurnian turun di bawah 99,99%, sistem otomatis menaikkan rasio refluks pompa puncak.

## 5. Urutan Start-up
[Belum ditulis. Isi langkah sekuensial, kondisi izin (permissive) tiap langkah, dan mode kontroler (MAN/AUTO/CAS) sampai pabrik mencapai kondisi operasi normal.]

## 6. Operasi Normal
[Belum ditulis. Isi setpoint operasi per loop yang diturunkan dari HMB DWSIM, batas operasi aman, dan tanggapan terhadap gangguan umum.]

## 7. Urutan Shutdown Normal & Shutdown Darurat
[Belum ditulis. Pisahkan shutdown terencana dan shutdown otomatis oleh SIS. Rujuk Cause & Effect Matrix ESD untuk aksi per pemicu.]

## 8. Catatan Inkonsistensi (Re-audit 2026-11-03)
1. Batas kemurnian 99,99% (Bab 4) berbeda dengan alarm AAL-201 = 99,90% dan DME.md (> 99,9%).
2. Satu kontroler TIC-101 disebut memantau dua titik (keluaran heater dan bed reaktor); kaskade perlu didefinisikan dengan tag terpisah.
3. Tag peralatan belum mengikuti tag_map.csv (REAC-01, C-01 vs RC-01, CSCOL-01 di DWSIM).
4. TSHH-101 dirujuk di Bab 3 tetapi belum ada di Master Instrument Index.
5. Lingkup Area 1 (keputusan PM 2026-11-03) berakhir di S-107 ke Area 2 (distilasi 1), ditambah recycle masuk S-114 dari Area 3 (distilasi 2). Bab 4 (kolom C-01) berada di lingkup Area 2 dan perlu dikeluarkan atau diubah menjadi deskripsi antarmuka. Tag peralatan mengikuti tag_map.csv (FINAL, LOG-016): R-101 (sebelumnya REAC-01), E-101 pemanas umpan (sebelumnya HEATER-01), E-102, P-101 (sebelumnya PUMP-01); penggantian di Bab 2 dan 3 sudah diterapkan.

## 9. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status Draft dan catatan inkonsistensi (LOG-004). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Dipindah dari repo ke Google Docs sebagai master; ditambah kerangka Bab 1 dan Bab 5 sampai 7 (LOG-010). |
