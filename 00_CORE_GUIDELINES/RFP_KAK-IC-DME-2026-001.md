---
id: "RFP-KAK-IC-DME-2026-001"
title: "RFP / KAK Layanan Konsultansi FEED & DED Sistem I&C Pabrik DME (ringkasan)"
category: "Reference Document"
standard: "Dokumen lelang (TOR/RFP) Dosen Koordinator; ISA, IEC 61508/61511, API 520/526, ISA-75"
target_files: []
external_files:
  - path: "00_CORE_GUIDELINES/KAK-IC-DME-2026-001_RFP.pdf"
    sha256: "6a0b16bbbe9daf34"
    size: "71096 B, 7 halaman"
generated_by: ""
source_data:
  - "PDF asli 77eeb36e85d06a588012c2367a0e7c00.pdf (Downloads PM), terbit 25-08-2026"
author: "DTNTF FT UGM (penerbit); ringkasan oleh Claude Code (AI)"
reviewer: "Rahul Ghulam Hidayatulloh"
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["RFP", "TOR", "KAK", "I&C", "FEED", "DED", "Lingkup"]
---

# RFP / KAK-IC-DME-2026-001: Konsultansi FEED & DED Sistem I&C Pabrik DME

> 📁 PDF asli di Drive `DRIVE_ROOT/00_CORE_GUIDELINES/KAK-IC-DME-2026-001_RFP.pdf` (tidak di Git, kebijakan §2.2). Ringkasan ini untuk penelusuran; **bila berbeda, PDF yang berlaku**. Nomor bagian merujuk PDF.

## 1. Identitas
| Butir | Isi |
| :--- | :--- |
| No. dokumen | KAK-IC-DME-2026-001, terbit 25-08-2026 |
| Penerbit / konsultan utama | DTNTF FT UGM |
| Sifat pengadaan | Spesialisasi Sistem Instrumentasi & Kontrol (I&C) |
| **Batas penawaran** | **FEED 15-12-2026** (= G2 Evaluasi PSTF 1) · **DED 30-06-2027** (acuan G3/G4 PSTF 2) |

## 2. Lingkup (§1.2–1.3)
- **Termasuk:** I&C Design Basis, filosofi operasi, arsitektur DCS/SIS/FGS + integrasi PLC paket; logika keselamatan, SIL assessment & verification, C&E **reaktor dan kolom distilasi**; sizing + datasheet control valve, safety relief valve, transmitter, process analyzer; loop diagram, hook-up, JB wiring, cable schedule; MR & TBE.
- **Tidak termasuk:** sipil/struktur, mekanikal bejana tekan, perpipaan non-instrumen, pengadaan fisik, pabrikasi panel, instalasi, konstruksi, komisioning. Serahan = dokumen rekayasa berstatus AFC.
- **Lingkup firma ini:** RFP mencakup seluruh pabrik; pembagian pabrik ke **3 area** (Area 1 reaktor = firma ini; Area 2 distilasi 1; Area 3 distilasi 2) adalah keputusan PM (LOG-014/015). Persyaratan §2.2 dan baris S-08…S-11 Tabel 1 adalah lingkup Area 2/3.

## 3. Persyaratan Proses & I&C yang Mengikat Area 1 (§2.1, §2.3)
1. Reaksi dehidrasi metanol fase uap, eksotermik & reversibel: 2 CH₃OH ⇌ CH₃OCH₃ + H₂O (ΔH < 0). Risiko utama: *thermal runaway* yang merusak katalis dan membahayakan reaktor.
2. **Pemantauan suhu multi-titik** pada reaktor.
3. **Kontrol kaskade** Temperature Controller pada pemanas ↔ Flow Controller pada pompa umpan.
4. **SIS/ESD trip suhu tinggi-tinggi** yang menutup ESDV di saluran masuk umpan "dalam hitungan detik".
5. Transmitter pintar **HART atau Foundation Fieldbus** untuk pemeliharaan prediktif lewat Asset Management System (AMS); instrumen analitik wajib auto-calibration dan isolasi sampel.
6. SIL ditentukan dari **HAZOP → LOPA** (§3.1.2) dan diverifikasi dengan PFD sesuai **IEC 61508/61511** (§5.2).
7. Sizing katup kontrol & pengaman menurut **ISA-75 dan API 520/526**, termasuk variasi laju, ΔP, viskositas, kavitasi/flashing (§3.2.1).
8. QA: pemeriksaan berjenjang *Check–Review–Approve* oleh Lead Instrument Engineer + inter-discipline check (§5.1), selaras dengan alur reviewer proyek.

## 4. Padanan Tag RFP ↔ Tag Pabrik Proyek
RFP memakai nama objek DWSIM/lama. Di dokumen firma wajib memakai tag pabrik (`tag_map.csv` FINAL); kutipan langsung dari RFP boleh tetap memakai nama RFP.

| Tag di RFP | Tag pabrik | Area | Keterangan |
| :--- | :--- | :---: | :--- |
| REAC-01 | **R-101** | 1 | Reaktor dehidrasi (DWSIM RC-01) |
| HEATER-01 | **E-101** | 1 | Pemanas umpan (DWSIM HEAT-01) |
| PUMP-01 | **P-101** | 1 | Pompa umpan (DWSIM PUMP-01) |
| ESDV saluran masuk umpan | **ESDV-101** | 1 | Sudah ada di index |
| C-01 | – | 2 | Kolom distilasi 1 (DWSIM CSCOL-01), tag pabrik oleh Area 2 |
| C-02, COOL-02, PUMP-02 | – | 3 | Distilasi 2 + loop recycle, tag pabrik oleh Area 3 |

## 5. Data DWSIM di RFP = Model Proyek (diverifikasi 2026-11-03, LOG-024)
Tabel 1 RFP mengutip fraksi mol "hasil simulasi DWSIM". Dibandingkan dengan `hmb_streams.json` (ekstraksi `DME.dwxmz`):

| Stream | RFP | HMB proyek | Selisih |
| :--- | :--- | :--- | ---: |
| S-08 x DME | 0,999983 | 0,999983 | 0 |
| S-09 x MeOH / H₂O | 0,3151 / 0,6660 | 0,31503 / 0,66600 | 7×10⁻⁵ / 0 |
| S-10 x MeOH / H₂O | 0,9034 / 0,0411 | 0,903376 / 0,041065 | 2,4×10⁻⁵ / 3,5×10⁻⁵ |
| S-11 x H₂O | 0,9900 | 0,9900 | 0 |

**Kesimpulan:** `DME.dwxmz` adalah **model referensi klien** dari dokumen lelang (menjelaskan metadata simpan 2021 / +05:30, LOG-019). Di laporan, sitasi model sebagai bagian RFP KAK-IC-DME-2026-001; pengembangan/validasi oleh firma ditulis terpisah.

## 6. Serahan FEED (PSTF 1) menurut Tabel 3
| No | Serahan | Format | Padanan di proyek |
| :---: | :--- | :--- | :--- |
| 1 | URS I&C | PDF & Word | Laporan Bab 1.3 |
| 2 | PFD / P&ID I&C overlay | PDF & native DWG | Bab 3.2, 3.5, Lampiran A (P&ID JN) |
| 3 | I&C Design Basis, Control Narrative & Philosophy | PDF & Word | Bab 2 + FDS-IC-DME-2026-001 |
| 4 | Estimasi CAPEX & OPEX I&C (Class 2) | PDF & Excel | Bab 5 + `inputs/NPV-001.yaml` (§3.3.1: CAPEX = hardware/software kontrol, katup, kabel, panel; OPEX = kalibrasi, AMS, lisensi) |

Serahan DED (PSTF 2): arsitektur DCS/SIS/FGS, Master Instrument Index & I/O List (Excel), datasheet & sizing, C&E, loop & hook-up, JB wiring & cable schedule, MR & TBE, BoM.

## 7. Dampak ke Dokumen Proyek
| No | Temuan | Tindak lanjut | PIC |
| :---: | :--- | :--- | :--- |
| 1 | Asal-usul model DWSIM terjawab (§5) | Status `hmb_streams.md` bisa naik setelah IH menulis sitasi | IH |
| 2 | Template laporan resmi punya **5 bab** (ada Bab 4 Kajian Keselamatan) | Struktur Google Docs laporan disesuaikan (LOG-024) | RG |
| 3 | SIL wajib lewat **HAZOP + LOPA** | Laporan Bab 4.2 memakai LOPA (bukan risk graph seperti contoh template) | AL |
| 4 | Transmitter wajib HART/FF + AMS | Kolom `SIGNAL_TYPE` index (mis. "RTD Pt100", "DP Cell 4-20mA") perlu dinyatakan sebagai transmitter HART | JN |
| 5 | CAPEX/OPEX I&C **Class 2** | Estimasi biaya Bab 5 mengikuti AACE Class 2 untuk lingkup I&C | HD |
| 6 | Tenggat DED 30-06-2027 | Acuan jadwal G3/G4 di cockpit | RG |

## 8. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Ringkasan RFP, padanan tag, verifikasi data DWSIM, dampak ke dokumen (LOG-024). |
