---
id: "LOGBOOK-W13-DME-001"
title: "Draf Entri Logbook W13 (Bimbingan 7, 12 Nov 2026): Kelompok Area 1 + 5 Anggota"
category: "Project Plan"
standard: "Panduan Capstone DTNTF 2026 (Lampiran 2 Logbook)"
target_files: []
generated_by: "Claude Code (Rakai) atas permintaan PM, 2026-11-12"
source_data:
  - "PROJECT_HISTORY_AND_AUDIT_LOG.md LOG-076…084"
  - "WO-024…031 (cockpit, dump 10 Nov) dan isi dokumen Drive"
author: "Rahul Ghulam Hidayatulloh (PM)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-12"
tags: ["Logbook", "W13", "Bimbingan 7"]
---

# Draf Entri Logbook W13 — Bimbingan 7 (Kamis, 12 Nov 2026)

**Cara pakai**: buka cockpit → Rapat & Logbook → **Tambah logbook**. Pilih entitas, lalu salin isi kolom di bawah:
- **Minggu**: 13
- **Tanggal**: 12 Nov 2026

**Sebelum disimpan:**
- Ganti `[arahan dosen: …]` dengan arahan nyata dari sesi Bimbingan 7.
- Panduan meminta logbook diisi paling lambat 1×24 jam setelah sesi, yaitu sampai Jumat 13 Nov.

**Catatan atribusi:** logbook menjadi dasar nilai individu. Karena itu, pekerjaan yang diselesaikan PM bersama agen AI ditulis apa adanya dan tidak diklaim sebagai pekerjaan anggota. Bagian `[isi: …]` diisi sendiri oleh anggota yang bersangkutan.

---

## 1. Kelompok Area 1

**Uraian**
> Bimbingan 7 – Hasil W13 menuju draf PSTF 1 (G1): Dipaparkan hasil WO minggu 13.
> - FDS Bab 5–7 berisi urutan start-up, operasi normal, dan shutdown (WO-024).
> - Bab 3.1–3.2 berisi narasi PFD, HMB 8 aliran tag pabrik, verifikasi neraca manual R-101/E-101/E-102, dan utilitas (WO-025). PFD DME-PFD-001 Rev A digambar ulang sesuai DWSIM, dalam bentuk PFD murni; I&C hanya di P&ID.
> - Master Instrument Index Rev C memuat 46 tag dan 22 I/O, dengan loop baru 103/104/111/112/113 (data WO-026).
> - Bab 4 tekno-ekonomi (WO-027):
>   - CAPEX I&C 608.099 USD;
>   - OPEX I&C 46.726 USD/tahun;
>   - kelayakan Area 1: NPV 1,52 juta USD, IRR 20,8 %, PBP 4,7 tahun.
> - Laporan PSTF 1 dirapikan sesuai template LaTeX: A4, margin 4/3 cm, sampul, pengesahan, pakta.
>
> Arahan dosen: [arahan dosen: …]

**Kendala**
> Konfigurasi T-101 belum final: catatan Bimbingan 6 menyebut T-101 sebagai drum campur setelah P-101, sedangkan PFD menaruhnya sebelum P-101. Gambar P&ID Rev C belum dibuat. Porsi α pembagian margin penjualan DME antar-area belum disepakati.

**Solusi**
> - Keputusan T-101 dikonfirmasi ke dosen pada sesi ini.
> - P&ID Rev C dan Bab 3.3 dikerjakan W14.
> - α disepakati dengan Area 2/3 sebelum kompilasi G1 (W15).

---

## 2. Rahul Ghulam Hidayatulloh (RG, PM)

**Uraian**
> Bimbingan 7 – Koordinasi W13 dan penyusunan laporan PSTF 1 (WO-028/029):
> - Memeriksa progres WO-024…031 per anggota.
> - Menetapkan keputusan desain firma bersama agen AI:
>   - TBD-05: R-101 multitubular dengan pendingin air ketel → kukus 21 bar(a);
>   - TBD-06: E-101 dipanasi minyak panas 300/200 °C;
>   - PFD tanpa overlay I&C.
> - Menyelesaikan bagian WO-025 yang tertinggal, menyusun data Instrument Index Rev C, dan menyusun draf Bab 4. Model ekonomi diverifikasi silang dengan kalkulator NPV-001 (NPV 1.518.731 USD).
> - Merapikan format Laporan PSTF 1 sesuai template LaTeX.
>
> Arahan dosen: [arahan dosen: …]

**Kendala**
> Beberapa WO jalur kritis (WO-026, WO-027) belum ada hasil dari PIC sampai H-1 bimbingan. Logo, daftar isi, dan nomor halaman romawi tidak bisa dibuat otomatis di Google Docs.

**Solusi**
> - Draf disiapkan PM bersama agen, lalu diserahkan ke PIC untuk direview dan dilengkapi.
> - Logo, daftar isi, dan nomor halaman disisipkan manual di Docs.
> - WO W14 diterbitkan sesuai arahan sesi ini.

---

## 3. Altaf Ramadhan Parvez (AL)

**Uraian**
> Bimbingan 7 – FDS urutan operasi (WO-024): Menyusun FDS Bab 5–7.
> - Bab 5 start-up: 8 langkah dengan permissive dan mode MAN/AUTO/CAS.
> - Bab 6 operasi normal: setpoint per loop dari HMB dan tabel gangguan.
> - Bab 7 shutdown: shutdown normal, trip SIS yang merujuk C&E, dan posisi aman katup.
>
> [isi: rincian tambahan pekerjaanmu sendiri]
>
> Arahan dosen: [arahan dosen: …]

**Kendala**
> Tabel 6.2 alarm L/H/HH masih TBD. Nilai WO-031 (L 250 °C sama dengan setpoint; H 360 °C) belum layak dipakai langsung. Narasi FDS belum mengikuti loop baru Rev C (TIC-104, PIC-103, PIC-111, LIC-113), posisi T-101, dan media pemanas E-101.

**Solusi**
> - Menetapkan L/H/HH bersama IH (WO-031) lalu memasukkannya ke FDS 6.2.
> - Menyelaraskan narasi dengan Instrument Index Rev C.
> - Menaikkan log revisi FDS ke 0.5 dan mengisi Bab 1 FDS.

---

## 4. Ihsaan Zauhair Tsaqif Prawira (IH)

**Uraian**
> Bimbingan 7 – Bab 3.1–3.2 dan batas suhu reaktor (WO-025, WO-031):
> - Menyusun draf awal 3.1–3.2: tabel aliran dan HMB, serta awal verifikasi neraca manual R-101.
> - Menetapkan usulan batas suhu R-101 (L 250 °C, H 360 °C, HH 400 °C) dengan suhu adiabatik 371,2 °C.
> - Draf 3.1–3.2 kemudian dilengkapi PM bersama agen AI:
>   - narasi PFD;
>   - tag pabrik khusus Area 1;
>   - verifikasi R-101 dengan basis S-104 termasuk daur ulang S-114;
>   - verifikasi E-101/E-102;
>   - utilitas.
>
> [isi: rincian tambahan pekerjaanmu sendiri]
>
> Arahan dosen: [arahan dosen: …]

**Kendala**
> - Verifikasi awal R-101 memakai basis umpan segar tanpa daur ulang, sehingga metanol keluar 51,94 vs 63,95 kmol/jam.
> - Nilai L dan H belum memberi margin alarm yang wajar.
> - HH 400 °C untuk katalis γ-Al₂O₃ belum bersumber.

**Solusi**
> - Mereview 3.1–3.2 versi lengkap.
> - Meninjau ulang L/H/HH bersama AL (WO-031) dengan sitasi sumber katalis.
> - Menyimpan bukti ke 08_WORK_ORDERS_EVIDENCE.

---

## 5. Jonathan Pangihutan Michael Siahaan (JN)

**Uraian**
> Bimbingan 7 – P&ID Rev C (WO-026): Data Master Instrument Index Rev C sudah tersedia (46 tag, 22 I/O) sebagai dasar gambar Rev C. Data ini disiapkan PM bersama agen.
>
> [isi: pekerjaan P&ID/AutoCAD yang kamu kerjakan minggu ini]
>
> Arahan dosen: [arahan dosen: …]

**Kendala**
> Gambar P&ID Rev C belum diperbarui. File terakhir di 03_CAD_DWG masih Rev B (4–5 Nov). Posisi T-101 menunggu keputusan final.

**Solusi**
> Menggambar P&ID Rev C pada W14 mengikuti Instrument Index Rev C:
> - FE-101;
> - loop 103/104/111/112/113;
> - nomor line 6 segmen;
> - posisi T-101 sesuai keputusan sesi ini.
>
> Setelah itu menyusun Bab 3.3.

---

## 6. Heidi Falina Brilian (HD)

**Uraian**
> Bimbingan 7 – Bab 4 Kajian Tekno-Ekonomi (WO-027, jalur kritis G1): Draf Bab 4 sudah tersedia di Laporan PSTF 1. Draf ini disusun PM bersama agen AI karena jalur kritis.
> - CAPEX I&C bottom-up 608.099 USD.
> - OPEX I&C 46.726 USD/tahun.
> - CAPEX Area 1 1.877.960 USD.
> - NPV 1,52 juta USD, IRR 20,8 %, PBP 4,7 tahun.
> - Sensitivitas: impas pada harga DME 549 USD/t.
>
> [isi: kontribusimu (pengecekan harga/sumber, review draf, dll.)]
>
> Arahan dosen: [arahan dosen: …]

**Kendala**
> Ketelitian estimasi masih setara AACE Class 3–4, sedangkan RFP meminta Class 2 dengan penawaran vendor. Porsi α (1/3) masih asumsi sementara. Dengan harga pasar Q3 2026, NPV menjadi negatif.

**Solusi**
> - Mereview dan memahami Bab 4 sebagai PIC.
> - Mencari penawaran vendor DCS/SIS/katup.
> - Menyepakati α dengan Area 2/3.
> - Menyiapkan penjelasan risiko harga untuk sidang.
