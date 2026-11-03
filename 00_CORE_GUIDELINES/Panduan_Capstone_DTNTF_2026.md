---
id: "GUIDE-DTNTF-2026-001"
title: "Ringkasan Panduan Pelaksanaan Perancangan Sistem Teknik Fisika (PSTF) 2026"
category: "Academic Guideline"
standard: "Panduan PSTF Prodi Teknik Fisika DTNTF FT UGM, 2026 (disahkan 20 Agustus 2026)"
target_files: []
external_files:
  - path: "DRIVE_ROOT/00_CORE_GUIDELINES/Panduan_Capstone_DTNTF_2026.pdf"
    size_kb: 1140
    pages: 30
generated_by: ""
source_data:
  - "Ekstraksi teks PDF (30 halaman), 2026-11-03"
author: "Claude Code (AI) — ringkasan"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["Panduan", "Rubrik", "PSTF 1", "PSTF 2", "Stage-Gate"]
---

# Ringkasan Panduan Capstone (PSTF 1 & 2) — DTNTF FT UGM 2026

> 📁 PDF asli disimpan di Google Drive (`DRIVE_ROOT/00_CORE_GUIDELINES/`). Ringkasan ini dibuat dari ekstraksi teks PDF; **jika ada perbedaan, PDF asli yang berlaku**. Nomor halaman merujuk penomoran di PDF.

## 1. Kerangka Umum (BAB I–II)
- Capstone disimulasikan sebagai **proyek EPC**; kelompok bertindak sebagai **Firma Rekayasa** beranggotakan **3–4 orang**, dengan peran internal seperti Project Manager, Lead Process Engineer, dan Lead Instrument Engineer.
- Tata kelola proyek mengikuti **NAMUR NA 35**: Fase 1 *Conceptual*, Fase 2 *Basic Engineering*, Fase 3 *Detail Engineering*.
- **PSTF 1 (Semester 7)** = NAMUR Fase 1 + 2. **PSTF 2 (Semester 8)** = NAMUR Fase 3. PSTF 1 adalah **prasyarat ketat** untuk PSTF 2, dan konsep dasar yang disetujui di PSTF 1 tidak boleh diubah di PSTF 2.
- Aktor: **Dosen Koordinator** (perwakilan klien, menentukan Stage-Gate & kelulusan), **Praktisi Industri** (menilai NPV, BoM, konstruktabilitas, K3), **Dosen Pembimbing** (*Lead Consultant*, memberi **ACC** setiap draf sebelum dinilai).
- Penugasan lewat **tender TOR/RFP** di minggu-minggu awal semester ganjil.

## 2. CPMK
| Kode | Capaian |
| :--- | :--- |
| PSTF1-CPMK1 | Menerapkan matematika & sains teknik untuk memodelkan solusi awal |
| PSTF1-CPMK2 | Merumuskan URS dan batasan desain yang realistis |
| PSTF1-CPMK3 | Menyusun dokumen FEED (kelayakan teknis-ekonomis + desain konseptual) |
| PSTF2-CPMK1 | Menerjemahkan FEED menjadi DED komprehensif |
| PSTF2-CPMK2 | Memvalidasi desain lewat simulasi tingkat lanjut / prototipe |
| PSTF2-CPMK3 | Menghasilkan dokumen teknis akhir & presentasi profesional beretika |

## 3. Luaran PSTF 1 (BAB III)
1. **Conceptual**: pemodelan *first-principle* (persamaan + komputasi numerik yang konvergen), **URS** kuantitatif, dan **FDS / Control Narrative (ISA-5.06.01)** mencakup start-up, operasi normal, dan shutdown otomatis.
2. **Basic Engineering / FEED**: **PFD (ISO 10628) terintegrasi tabel neraca massa & panas** di setiap aliran, dan **Draf P&ID (ISA-5.1)**.
3. **Tekno-ekonomi** berbasis Draf P&ID: CAPEX, OPEX, **NPV, IRR** (vs suku bunga acuan), **Payback Period**.
4. **Evaluasi PSTF 1** (minggu 14–16): presentasi PFD, Draf P&ID, dan kesimpulan tekno-ekonomi di depan Koordinator, Pembimbing, dan Praktisi.

## 4. Luaran PSTF 2 (BAB IV)
1. **P&ID Final** (line sizing, spec break, interlock; ISA-5.1 & 5.2).
2. **Sizing mutlak, dihitung manual**: orifice/flowmeter (**ISO 5167 / AGA 3**), thermowell (**ASME PTC 19.3 TW**), control valve **Cv + kavitasi (ISA-75.01.01 / IEC 60534-2-1)**, PSV (**API 520/521**).
3. **Datasheet ISA-TR20.00.01**, **BoM Final** dengan vendor riil, **I/O List (API RP 554)**, **Loop Diagram (ISA-5.4)**, **Hook-up 3D CAD (API RP 551)**.
4. **Validasi Virtual FAT**: digital twin (mis. DWSIM, Simulink), injeksi skenario stress-test, plot respons (overshoot, settling time), dibandingkan dengan target di URS.
5. **Keselamatan & siber**: HAZOP, SIS/SIL (**IEC 61511 / ISA-84**), HMI (**ISA-101.01**), alarm (**ISA-18.2 / EEMUA 191**), siber (**IEC 62443**).

## 5. Rubrik Penilaian (Tabel 2, ringkas)
| Aspek | Baik (70–79) | Sangat Baik (80–100) |
| :--- | :--- | :--- |
| PSTF 1: Sains & URS | Simulasi model dasar jalan; URS kuantitatif; FDS logis | Model dinamis presisi; URS/FDS selengkap kontrak klien |
| PSTF 1: Basic Eng. | PFD ISO 10628 berneraca massa; Draf P&ID ISA-5.1 masuk akal; NPV/IRR logis | P&ID solid, PFD sangat rinci, NPV/IRR dengan risiko suku bunga |
| PSTF 2: DED | P&ID Final patuh ISA-5.1; ISA-20 & Loop ISA-5.4 akurat; BoM riil | Cetak biru A3 siap tender; hook-up API 551 presisi 3D |
| PSTF 2: Sizing & Safety | ISO 5167, ISA 75.01, ASME 19.3 **dihitung manual**; SIL diulas | Manual + software presisi (termasuk PSV API 520); SIL/SIS paripurna |
| PSTF 2: Virtual FAT | Tahan gangguan; HMI ISA-101 & alarm terstandar; mitigasi siber | Simulasi sangat tangguh dengan statistik valid; hierarki alarm EEMUA sempurna |
| Kinerja tim | Saling menopang, paham standar & asumsi CAPEX | Presentasi level Engineering Manager |

⚠️ Rubrik menilai **"sizing via kalkulator web tanpa rumusan standar"** hanya sebagai *Cukup/Revisi Mayor (60–69)*. Skrip kalkulator di repo harus diposisikan sebagai **verifikasi silang** atas perhitungan manual yang ditulis lengkap di laporan.

## 6. Bobot Formulir Penilaian (Lampiran 4–5)
| Penilai | PSTF 1 | PSTF 2 |
| :--- | :--- | :--- |
| Dosen Koordinator | Model sains & FDS 40% · Integrasi BFD/PFD/Draf P&ID 40% · Kualitas penulisan 20% | Sizing presisi 35% · Kepatuhan kode DED (ISA-5.1/5.4/20) 35% · Validitas Virtual FAT 30% |
| Pembimbing / Praktisi | Tekno-ekonomi & profitabilitas 50% · Kelayakan komersial PFD/P&ID 30% · Presentasi tender 20% | Kelayakan manufaktur & supply chain 40% · K3 (HAZOP/SIL) & audit siber 40% · Etika & presentasi 20% |

## 7. Jadwal & SOP (Lampiran 1)
| Tahap | Waktu | Inti |
| :--- | :--- | :--- |
| 1. Rilis tender & pembentukan firma | Minggu 1–2 PSTF 1 | Koordinator rilis TOR; kelompok 3–4 orang memilih 1 TOR |
| 2. Conceptual & Basic Engineering | Minggu 3–13 PSTF 1 | Simulasi, FDS, PFD, Draf P&ID, tekno-ekonomi; Pembimbing memaraf ACC draf laporan |
| 3. Evaluasi proposal | Minggu 14–16 PSTF 1 | Panel evaluasi: Layak atau Revisi Mayor; laporan final A4 + lampiran A3 disahkan Kadep |
| 4. Detail Engineering & Virtual FAT | Minggu 1–13 PSTF 2 | P&ID Final, ISA-20, sizing manual, hook-up, SIL, BoM; Pembimbing memberi ACC final |
| 5. Evaluasi akhir | Minggu 14–16 PSTF 2 | Evaluasi DED, sizing, HAZOP/SIL, cetak biru A3, simulasi; penilaian kolektif |

## 8. Logbook (Lampiran 2)
- Wajib diisi **maksimal 1×24 jam** setelah pertemuan; diparaf Dosen Pembimbing **setiap minggu**.
- Isi harus **spesifik** (kendala standar, tahap kalkulasi sizing, masalah ekonomi, bug software); kalimat generik ("mencari bahan di perpustakaan") tidak diterima.
- **12 baris** wajib terisi penuh dan diparaf, untuk PSTF 1 maupun PSTF 2.
- Logbook menjadi dasar penyesuaian nilai individu (mencegah *free-rider*).

## 9. Struktur Laporan (Lampiran 3A/3B)
- **PSTF 1** (template: `http://ugm.id/TemplatePSTF1`): Bab 1 Konseptualisasi (TOR, first-principle, URS) · Bab 2 FDS/Control Narrative · Bab 3 Basic Engineering (PFD + neraca massa & panas) · Bab 4 Tekno-ekonomi · Lampiran A Draf P&ID (A3) · Lampiran B Logbook.
- **PSTF 2** (template: `http://ugm.id/TemplatePSTF2`): Bab 1 Review FEED · Bab 2 Sizing & Safety · Bab 3 DED (ISA-20, spec break, BoM) · Bab 4 Kendali, HMI & SIS · Bab 5 Virtual FAT · Bab 6 SOP · Lampiran A–D (P&ID Final, Loop & Logic, Hook-up, Datasheet + BoM).

## 10. Implikasi untuk Sistem Proyek Ini
1. **Ukuran tim**: panduan menyebut firma **3–4 orang**, sedangkan tim tercatat **5 orang**. Perlu dikonfirmasi ke Dosen Koordinator.
2. **Stage-Gate**: panduan mendefinisikan **2 evaluasi formal** (akhir PSTF 1 dan akhir PSTF 2). Istilah "Gate 1–4" di cockpit perlu dipetakan ke tahap Lampiran 1.
3. **Sizing manual wajib**: pipeline kalkulator otomatis hanya sebagai verifikasi silang (Blueprint §3.2).
4. **Logbook**: modul Logbook cockpit perlu menegakkan aturan 1×24 jam, 12 baris, dan paraf mingguan.
5. **HMB**: PFD wajib terintegrasi neraca massa & panas, jadi skema v1 `hmb_streams.json` (Fase 3) termasuk jalur kritis untuk Evaluasi PSTF 1.

## 11. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Ringkasan dibuat dari ekstraksi teks PDF 30 halaman (LOG-004). Perlu dicek PM. |
