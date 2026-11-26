---
id: "MIRROR-FDS-IC-DME-2026-001"
title: "Mirror teks FDS-IC-DME-2026-001 (dari Google Docs)"
category: "Mirror"
standard: "ISA-5.06.01 / NAMUR NA 35"
target_files: []
generated_by: "Claude Code via konektor Google Docs (read_doc) + doc2md, 2026-11-26 (LOG-088)"
source_data:
  - "Google Docs 1PFiIfHzHZzQxRegLekQ-NUGTXEvloy-lQOi0O3T34wg (Rev 0.4.1, Bab 5-7 oleh AL)"
author: "Altaf Ramadhan Parvez (PIC dokumen master)"
reviewer: "Jonathan Pangihutan Michael Siahaan"
status: "Draft"
review_evidence: ""
google_ref: "https://docs.google.com/document/d/1PFiIfHzHZzQxRegLekQ-NUGTXEvloy-lQOi0O3T34wg/edit"
last_updated: "2026-11-26"
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

**Revisi: 0.4 (2026-11-04)**

**Status isi: DRAF KERANGKA (PLACEHOLDER).** Tag di Bab 2 sampai 4 sudah diselaraskan dengan Draf P&ID DME-PID-002 Rev B dan Master Instrument Index (LOG-036); setpoint dan angka masih contoh/TBD dan belum boleh dikutip sebagai hasil desain. Panduan Capstone (BAB III §3.1, Lampiran 3A Bab 2) mewajibkan FDS menjelaskan urutan start-up, operasi normal, dan shutdown otomatis secara sekuensial; bagian itu disediakan di Bab 5 sampai 7 dan masih kosong.

## 1. Ruang Lingkup & Rujukan

[Isi: batas sistem kendali Area 1 (area 100: umpan S-101 sampai efluen S-107 ke Area 2, ditambah recycle masuk S-114 dari Area 3; sinyal antarmuka dengan Area 2 dan Area 3), dokumen rujukan (URS, PFD, Draf P&ID, Master Instrument Index & IO List di Google Sheets), dan daftar singkatan.]

## 2. Loop Kontrol Kaskade Reaktor Dehidrasi (R-101)

- **Master controller (primary):** temperature controller TIC-101 mengendalikan suhu bed katalis R-101 dari elemen multi-titik TE-101/TT-101. Suhu keluaran E-101 dipantau terpisah oleh TT-104 dengan alarm TAH-104.

- **Slave controller (secondary):** flow controller FIC-101 (pengukuran FT-101 dari orifice FE-101) mengatur katup FV-101 (fail-closed) pada line discharge P-101; setpoint FIC-101 berasal dari output TIC-101.

- **Prinsip operasi:** jika suhu reaksi melampaui setpoint (250 °C), output TIC-101 memodulasi pasokan panas pada E-101 dan membatasi laju umpan metanol melalui FIC-101 untuk mencegah pelepasan panas eksotermik berlebih.

## 3. Sistem Keselamatan Interlock Darurat (SIS / ESD)

- **Trip high-high suhu reaktor (TSHH-102):** tiga elemen suhu TE-102A/B/C yang terpisah dari loop TIC-101 (independensi SIS, IEC 61511) di-voting 2oo3 di logic solver SIS. Setpoint high-high dan target SIL ditetapkan dari HAZOP/LOPA (PSTF 2); nilai 320 °C pada revisi sebelumnya adalah data contoh.

- **Aksi interlock 1:** menutup katup shut-off darurat XV-102 (fail-closed, solenoid XY-102 de-energize) pada line umpan masuk R-101 dalam waktu kurang dari 2 detik; alarm XA-102 tampil di HMI.

- **Aksi interlock 2:** menghentikan motor pompa umpan P-101 dalam waktu kurang dari 1 detik untuk memutus suplai reaktan.

## 4. Antarmuka dengan Area 2 (Kolom Distilasi 1)

- **Batas lingkup: kendali tekanan, refluks, dan kemurnian kolom distilasi 1 berada di lingkup firma Area 2 dan tidak dirinci di FDS Area 1 (keputusan PM, LOG-014/015).**

- **Antarmuka Area 1: efluen S-107 (dua fase, 89 °C, 10,4 bar(a); HMB) keluar battery limit melalui line 3"-P-107. Suhunya dikendalikan TIC-109 (TT-109) yang memodulasi katup air pendingin TV-109 (fail-open) pada E-102.**

## 5. Urutan Start-up

Urutan berikut disusun pada tingkat konseptual (FEED) untuk beban nominal HMB. Pada awal start-up, S-114 belum tersedia karena Area 3 baru beroperasi setelah Area 2 menerima S-107, sehingga umpan reaktor semula hanya berasal dari S-102. 

| **No** | **Langkah** | **Kondisi izin (permissive)** | **Mode kontroler** |
| :--- | :--- | :--- | :--- |
| 1 | Pemeriksaan awal: tidak ada alarm aktif di HMI, XV-102 tertutup, udara instrumen dan pendingin E-102 tersedia, blok PSV-101 dan PSV-102 terbuka | Sistem SIS siap [LINGKUP PSTF 2] | Semua MAN |
| 2 | P-101 dijalankan dan T-101 diisi hingga level 50% (LT-105, dikonfirmasi LG-105). FIC-101 pada beban minimum [TBD]. Urutan P-101 terhadap T-101 mengikuti P&ID final [TBD-07] | PI-107 normal (lokal), level T-101 di atas LAL-105 [TBD] | FIC-101 MAN, LIC-105 MAN |
| 3 | LIC-105 dialihkan ke AUTO sehingga LV-105 mengalirkan metanol ke E-101. TIC-109 dialihkan ke AUTO, XV-102 dibuka | Level T-101 stabil pada setpoint, tidak ada trip SIS [LINGKUP PSTF 2], Area 2 siap menerima S-107 | LIC-105 AUTO, TIC-109 AUTO |
| 4 | Pemanasan bertahap hingga TT-104 mencapai 250°C (HMB S-104, beban E-101 4.726 kW). Laju pemanasan [TBD, TBD-04]. Metode pemanasan awal reaktor [TBD, disiplin proses dan HAZOP]. Pengaturan media pemanas dilakukan operator secara manual [TBD: belum ada elemen kendali di MMI Rev B] | Aliran melalui E-101 terbentuk, TAH-104 tidak aktif | TIC-101 MAN |
| 5 | Stabilisasi suhu bed: profil TE-101/TT-101 dipantau, pembuangan panas R-101 diaktifkan [TBD-05] | TT-104 stabil di sekitar 250°C, tidak ada lonjakan suhu bed | TIC-101 MAN, FIC-101 MAN |
| 6 | Laju umpan dinaikkan bertahap menuju 8.321 kg/jam (HMB S-102). Laju awal dan langkah kenaikan [TBD] | Suhu bed stabil | FIC-101 AUTO (setpoint lokal) |
| 7 | Transfer ke kaskade | TT-101 dalam ±1,5 °C dari 250°C (URS-012) selama [TBD] menit, FIC-101 stabil dalam ±2,0% (URS-011) | TIC-101 AUTO, FIC-101 CAS |
| 8 | Penerimaan S-114 dari Area 3 setelah Area 3 stabil. Laju S-103 bergeser bertahap menuju ±10.553 kg/jam dan komposisinya berubah. LIC-105 dan TIC-101 menyerap gangguan ini | Koordinasi dengan Area 3 | Mode operasi normal |

## 6. Operasi Normal

**6.1 Setpoint Operasi per Loop**

Nilai acuan adalah beban nominal HMB DWSIM (ekstraksi 2026-11-03, galat neraca massa maksimum 0,027 %). 

| **Loop** | **Variabel** | **Setpoint / nominal** | **Toleransi** | **Rentang alat (MII)** | **Sumber** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FIC-101 | Laju umpan segar S-102 | 8.321 kg/jam (261,65 kmol/jam) | ±2,0 % | 0–12.500 kg/jam | HMB S-102, URS-011 |
| TIC-101 | Suhu bed R-101 | 250 °C | ±1,5 °C | 0–500 °C | HMB S-105, URS-012 |
| TT-104 | Suhu keluaran E-101 | 250 °C | [TBD] | 0–400 °C | HMB S-104 |
| PT-103 | Tekanan efluen R-101 | 14,7 bar(a) | ±0,5 bar | 0–25 bar(a) | HMB S-105, URS-013 |
| TIC-109 | Suhu keluaran E-102 | 89 °C | ±2,0 °C | 0–200 °C | HMB S-107, URS-014 |
| LIC-105 | Level T-101 | 50 % | [TBD] | 0–100 % | URS-015 |

Pada operasi normal, TIC-101 berada pada AUTO, FIC-101 pada CAS, LIC-105 pada AUTO, dan TIC-109 pada AUTO. Tekanan R-101 hanya dipantau oleh PT-103 dan dilindungi PSV-101, karena belum ada loop kendali tekanan pada MII Rev B. 

**6.2 Batas Operasi Aman** 

Sesuai arahan Bimbingan 6, sensor suhu reaktor berfungsi sebagai indikator dengan penanda batas alarm. Batas suhu bed R-101 (TT-101) ditetapkan lewat WO-031 dan diterima dosen pada Bimbingan 8 (19 Nov 2026): L 250 °C (titik operasi), H 360 °C (di bawah suhu adiabatik 371 °C), HH 400 °C (batas deaktivasi katalis, Turton). Alarm L sama dengan setpoint TIC-101, sehingga di DCS diberi deadband/penundaan waktu. Batas lain masih [TBD] sampai rasionalisasi alarm. 

| **Instrumen** | **L** | **H** | **HH** |
| :--- | :--- | :--- | :--- |
| TT-101 (bed R-101) | TAL-101: 250 °C | TAH-101: 360 °C | TAHH-101: 400 °C (batas katalis); trip TSHH-102 terpisah [LINGKUP PSTF 2] |
| TT-104 (keluaran E-101) | [TBD] | TAH-104:  [TBD] | — |
| LT-105 (level T-101) | LAL-105:  [TBD] | [TBD] | — |
| PT-103 (tekanan R-101) | — | [TBD] | — |

  
Sebagai referensi, suhu adiabatik bila pembuangan panas hilang adalah ≈ 371 °C (Bab 1, Persamaan 1.2). Angka ini bukan setpoint HH. 

**6.3 Tanggapan terhadap Gangguan Umum**

| **Gangguan** | **Tanggapan sistem kendali** | **Tindakan operator** |
| :--- | :--- | :--- |
| Suhu bed naik di atas setpoint | TIC-101 menurunkan setpoint FIC-101 sehingga FV-101 menutup dan panas reaksi berkurang (arah aksi diverifikasi pada simulasi dinamik) | Periksa pembuangan panas R-101 [TBD-05] |
| Perubahan laju atau komposisi S-114 (HMB: 0,9034 metanol, 0,0411 air, 0,0556 DME fraksi mol) | LIC-105 mengatur LV-105 menjaga level, TIC-101 mengompensasi perubahan suhu bed | Pantau TT-101 dan TT-109, koordinasi dengan Area 3 |
| Suhu keluaran E-102 menyimpang | TIC-109 memodulasi TV-109 | Periksa suhu dan laju air pendingin |
| TAH-104 aktif | — | Kurangi media pemanas E-101 dan periksa TT-104 |
| LAL-105 aktif | — | Periksa umpan segar P-101 dan posisi LV-105 |

## 7. Urutan Shutdown Normal & Shutdown Darurat

**7.1** **Shutdown** **Normal (Terencana)**

- Area 2 dan Area 3 diberi tahu bahwa S-107 akan berhenti dan S-114 akan berhenti.

- TIC-101 dan FIC-101 dialihkan ke MAN, lalu laju umpan diturunkan bertahap [TBD].

- Pemanasan E-101 dikurangi lalu dihentikan, dan TT-104 dipantau hingga turun.

- Pembuangan panas R-101 dan air pendingin E-102 (TIC-109) dipertahankan sampai TT-101 berada di bawah ambang aman [TBD].

- Umpan reaktor diisolasi dengan menutup XV-102 [perintah penutupan normal: TBD, LINGKUP PSTF 2].

- FV-101 ditutup, P-101 dihentikan, LV-105 ditutup, dan T-101 diisolasi atau dikosongkan sesuai prosedur [TBD].

- Depresurisasi dan pengurasan R-101 [TBD, disiplin proses].

**7.2** **Shutdown** **Otomatis oleh SIS** 

Logika SIS, matriks Cause & Effect, dan alarm trip dirinci pada PSTF 2 (HAZOP dan LOPA). Rujukan indikatif ke Cause_and_Effect_Matrix_ESD: 

| **Pemicu** | **Aksi** | **Waktu respons** |
| :--- | :--- | :--- |
| TSHH-102 (TE-102A/B/C, voting 2oo3, setpoint HH [TBD]) | XV-102 menutup, XY-102 de-energize | < 2 detik |
| TSHH-102 | P-101 berhenti | < 1 detik |
| TSHH-102 | XA-102 tampil di HMI | < 1 detik |

**7.3** **Posisi Aman Katup Kendali**

| Katup | Posisi aman | Dampak proses |
| :--- | :--- | :--- |
| FV-101 | Tertutup (FC) | Umpan segar terhenti |
| LV-105 | Tertutup (FC) | Aliran T-101 menuju E-101 terhenti, level T-101 naik |
| TV-109 | Terbuka (FO) | Air pendingin E-102 maksimum, suhu S-107 turun |

## 8. Catatan Inkonsistensi (Re-audit 2026-11-03)

- Batas kemurnian 99,99% (Bab 4) berbeda dengan alarm AAL-201 = 99,90% dan DME.md (> 99,9%).

- Satu kontroler TIC-101 disebut memantau dua titik (keluaran heater dan bed reaktor); kaskade perlu didefinisikan dengan tag terpisah.

- Tag peralatan belum mengikuti tag_map.csv (REAC-01, C-01 vs RC-01, CSCOL-01 di DWSIM).

- TSHH-101 dirujuk di Bab 3 tetapi belum ada di Master Instrument Index.

- Lingkup Area 1 (keputusan PM 2026-11-03) berakhir di S-107 ke Area 2 (distilasi 1), ditambah recycle masuk S-114 dari Area 3 (distilasi 2). Bab 4 (kolom C-01) berada di lingkup Area 2 dan perlu dikeluarkan atau diubah menjadi deskripsi antarmuka. Tag peralatan mengikuti tag_map.csv (FINAL, LOG-016): R-101 (sebelumnya REAC-01), E-101 pemanas umpan (sebelumnya HEATER-01), E-102, P-101 (sebelumnya PUMP-01); penggantian di Bab 2 dan 3 sudah diterapkan.

## 9. Log Revisi

| **Rev** | **Tanggal** | **Penulis** | **Deskripsi** |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status Draft dan catatan inkonsistensi (LOG-004). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Dipindah dari repo ke Google Docs sebagai master; ditambah kerangka Bab 1 dan Bab 5 sampai 7 (LOG-010). |
| 0.4 | 2026-11-04 | Claude Code (AI) | Tag Bab 2-3 diselaraskan dengan Draf P&ID DME-PID-002 Rev B dan Master Instrument Index: FCV-101 jadi FV-101, TSHH-101 jadi TSHH-102 (TE-102A/B/C 2oo3), ESDV-101 jadi XV-102/XY-102/XA-102; setpoint trip 320 °C diganti TBD (HAZOP/LOPA); Bab 4 diubah menjadi deskripsi antarmuka Area 2 (LOG-036). Perlu review PIC (AL). |
| 0.4.1 | 2026-11-26 | Claude Code (AI) | Bab 6.2: batas suhu bed R-101 TAL/TAH/TAHH-101 = 250/360/400 °C dari WO-031 (Ihsan), diterima dosen pada Bimbingan 8 (19 Nov 2026). Batas lain tetap [TBD] (LOG-086). Perubahan Bab 5–7 oleh AL (WO-024) dicatat PIC pada Rev 0.5. |
