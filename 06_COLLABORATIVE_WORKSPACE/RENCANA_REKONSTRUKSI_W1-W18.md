---
id: "PLAN-RECON-DME-001"
title: "Rencana Rekonstruksi Timeline, Gantt & Work Order Minggu 1–18 (PSTF 1)"
category: "Project Plan"
standard: "Panduan Capstone DTNTF 2026 (Tahap 1–3, logbook Lampiran 2)"
target_files: []
generated_by: "Claude Code dari perubahan.md (PM, 2026-11-05)"
source_data:
  - "perubahan.md (riwayat mingguan dari PM)"
  - "06_COLLABORATIVE_WORKSPACE/google_workspace_registry.json (section_owners, section_reviewers)"
  - "PROJECT_HISTORY_AND_AUDIT_LOG.md LOG-016…043 (pekerjaan minggu 12)"
author: "Rahul Ghulam Hidayatulloh (PM)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-05"
tags: ["Timeline", "Gantt", "Work Order", "Rekonstruksi"]
---

# Rencana Rekonstruksi Timeline, Gantt & Work Order (W1–W18)

> 📝 **DRAF UNTUK REVIEW PM.** Belum ada yang dimasukkan ke cockpit. Jawab keputusan di §1, koreksi tabel §3–§5, lalu agent membuat berkas impor (§7).

## 0. Prinsip Pencatatan (target vs aktual)
- **`dueDate` WO / minggu Gantt = TARGET** sesuai timeline. Dengan ini Gantt tetap menunjukkan rencana yang rapi.
- **`completedAt` = tanggal AKTUAL selesai.**
  - Minggu 1–11: diambil dari `perubahan.md`, yaitu Kamis saat hasil dipaparkan/dikumpulkan.
  - Minggu 12 dan seterusnya: tanggal nyata saat selesai.
- **`createdAt` = tanggal WO benar-benar dibuat di sistem** (2026-11-05 untuk rekonstruksi). Deskripsi WO rekonstruksi diberi tanda `[Rekonstruksi dari perubahan.md]`.
- Pekerjaan yang terlambat **tetap tercatat terlambat** (mis. timeline proyek: target W5, selesai W12).
- **Logbook** minggu 1–11 yang ditulis sekarang diberi tanda *"ditulis ulang 2026-11-05 dari catatan PM"*. `verifiedByLecturer` hanya `true` bila memang sudah diparaf dosen. Panduan mewajibkan logbook diisi ≤ 1×24 jam setelah pertemuan dan diparaf tiap minggu, jadi entri lama tidak boleh tampil seolah ditulis tepat waktu.

## 1. Keputusan yang Dibutuhkan dari PM
| # | Pertanyaan | Usulan agent |
| :---: | :--- | :--- |
| K1 ✅ | **DIPUTUSKAN PM 2026-11-05 (sudah dikonfirmasi dosen): minggu efektif tanpa UTS → G1 akhir W15 kalender (29 Nov), G2 15 Des.** Kapan G1 (ACC draf Laporan PSTF 1)? Panduan: "akhir minggu 13 PSTF 1", Evaluasi minggu 14–16. Bila dihitung kalender (W1 = 17 Agu), G1 = **15 Nov** dan Evaluasi 16 Nov–6 Des. Bila 2 minggu UTS tidak dihitung (16 minggu efektif), G1 = **29 Nov** dan Evaluasi 30 Nov–20 Des, cocok dengan tenggat FEED **15 Des** (RFP) yang sudah dipakai cockpit. | **Minggu efektif (tanpa UTS)**: G1 akhir W15 kalender (29 Nov), G2 15 Des. Konfirmasi ke dosen pada Bimbingan 7. |
| K2 | Bimbingan 6 (Kamis 5 Nov, hari ini): apa yang dipaparkan dan apa arahan dosen? | Isi di MoM W12; WO W13 menyesuaikan. |
| K3 ✅ | **Tekno-ekonomi (Bab 4, Heidi): BELUM dikerjakan sama sekali** (PM, 2026-11-05). | Jalur kritis: WO W13–W15 (lihat §5), dibantu PM. |
| K4 | PIC setiap pekerjaan W1–W11 di §3 diisi agent dari `section_owners` registry. Benar? | Koreksi kolom PIC. |
| K5 | Ada bukti per minggu (foto kelas, file PFD/URS/Bab 1 di Drive, tanda tangan logbook)? | Tautkan sebagai `evidenceUrl` WO. Tanpa bukti, WO tetap Selesai dengan catatan "bukti belum dilampirkan". |
| K6 ✅ | (Ekspor 2026-11-04 diterima.) Data cockpit lama (Gantt, WO, logbook, rencana mingguan di Firestore) ditimpa atau digabung? | **Ekspor dulu** (menu Ekspor/Impor → Ekspor JSON) dan kirim ke agent. Impor menimpa seksi yang diimpor; WO lama dengan kode sama akan tertimpa. |

## 2. Kalender Proyek PSTF 1 (Senin = awal minggu, sesi Kamis)
| W | Senin | Sesi Kamis | Jenis | Ringkasan (perubahan.md) |
| ---: | :--- | :--- | :--- | :--- |
| 1 | 17 Agu | 20 Agu | Kelas koordinator | Pengantar capstone & Panduan; kelompok besar 13 mahasiswa, dibagi 3 area sesuai RFP |
| 2 | 24 Agu | 27 Agu | Kelas koordinator | Rilis RFP; tugas: baca RFP, simulasi DWSIM, neraca massa & energi awal, PFD Area 1; Area 1 terbentuk (PM Rahul + 4 anggota) |
| 3 | 31 Agu | 3 Sep | Kelas koordinator | Kumpul tugas W2 (cetak); materi URS & PFD; tugas: PFD gabungan seluruh area |
| 4 | 7 Sep | 10 Sep | Kelas koordinator | Kumpul PFD gabungan; arahan: mulai timeline/Gantt; mulai bimbingan intensif |
| 5 | 14 Sep | 17 Sep | **Bimbingan 1** | Timeline belum matang → tugas: timeline awal–akhir; sempurnakan PFD & neraca massa |
| 6 | 21 Sep | 24 Sep | **Bimbingan 2** | Timeline belum fix; PFD & neraca disempurnakan; URS + draf Bab 1; lanjut P&ID & FDS |
| 7 | 28 Sep | 1 Okt | **Bimbingan 3** | Paparan P&ID, FDS, URS, PFD terbaru; lanjut sesuai timeline |
| 8 | 5 Okt | – | UTS | Penyempurnaan website dashboard |
| 9 | 12 Okt | – | UTS | Penyempurnaan website dashboard |
| 10 | 19 Okt | 22 Okt | **Bimbingan 4** | P&ID terbaru; fiksasi PFD; lanjut draf Bab 1 |
| 11 | 26 Okt | 29 Okt | **Bimbingan 5** | Fiksasi Bab 1; revisi P&ID (DME-PID-002 Rev A bertanggal 29-10-26); template/legend AutoCAD; dashboard; himpun dokumen acuan |
| 12 | 2 Nov | **5 Nov** | **Bimbingan 6** | (hari ini) pekerjaan W12 di §3 |
| 13 | 9 Nov | 12 Nov | Bimbingan 7 | rencana §5 |
| 14 | 16 Nov | 19 Nov | Bimbingan 8 | rencana §5 |
| 15 | 23 Nov | 26 Nov | Bimbingan 9 | rencana §5 (usulan G1 akhir minggu) |
| 16 | 30 Nov | 3 Des | Bimbingan 10 | rencana §5 |
| 17 | 7 Des | 10 Des | Bimbingan 11 | rencana §5 |
| 18 | 14 Des | 17 Des | Bimbingan 12 | **15 Des: tenggat FEED (RFP) / Evaluasi PSTF 1 (G2)**. Catatan: Bimbingan 12 jatuh setelah tenggat |

**Siklus mingguan (mulai W13):**
1. **Minggu**: PM menerbitkan WO minggu itu.
2. **Senin–Rabu**: anggota mengerjakan.
3. **Kamis**: hasil dipaparkan di bimbingan (WO → `Diajukan`), lalu MoM ditulis dan logbook diisi ≤ 24 jam.
4. **Kamis–Sabtu**: revisi bila ada (`needsRevision`).
5. **Sabtu**: WO `Selesai`, dan WO minggu berikutnya disiapkan.

## 3. Rekonstruksi Work Order W1–W12 (hanya yang tertulis di perubahan.md / log repo)
Kode: RG Rahul (PM), IH Ihsaan, AL Altaf, JN Jonathan, HD Heidi (kode cockpit).

| Kode | Pekerjaan | PIC (usulan) | Diberikan | Target (dueDate) | Aktual selesai | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| WO-001 | Membaca & meringkas RFP KAK-IC-DME-2026-001 | RG (semua) | W2 | Kam 3 Sep | 3 Sep | Selesai |
| WO-002 | Simulasi DWSIM awal proses dehidrasi metanol | IH | W2 | Kam 3 Sep | 3 Sep | Selesai |
| WO-003 | Neraca massa & energi awal Area 1 | IH | W2 | Kam 3 Sep | 3 Sep | Selesai |
| WO-004 | PFD Area 1 awal (cetak) | IH, JN | W2 | Kam 3 Sep | 3 Sep | Selesai |
| WO-005 | PFD gabungan seluruh area (koordinasi Area 2/3) | IH | W3 | Kam 10 Sep | 10 Sep | Selesai |
| WO-006 | **Timeline proyek awal–akhir & Gantt** | RG | W4 (diulang W5) | Kam 17 Sep | **belum (selesai lewat rekonstruksi ini, W12)** | Dikerjakan, **terlambat** |
| WO-007 | Penyempurnaan PFD & neraca massa (komentar Bimbingan 1) | IH | W5 | Kam 24 Sep | 24 Sep | Selesai |
| WO-008 | URS (User Requirement Specification) | IH, AL | W5 | Kam 24 Sep | 24 Sep (draf) | Selesai |
| WO-009 | Draf Bab 1 Konseptualisasi | RG, IH | W5 | Kam 24 Sep | 24 Sep (draf), fiks 29 Okt | Selesai |
| WO-010 | Draf P&ID Area 1 | JN | W6 | Kam 1 Okt | 1 Okt | Selesai |
| WO-011 | Draf FDS / Control Narrative | AL | W6 | Kam 1 Okt | 1 Okt | Selesai |
| WO-012 | Penyempurnaan website dashboard (cockpit) | RG | W8 (UTS) | Sab 17 Okt | 17 Okt | Selesai |
| WO-013 | Revisi P&ID (paparan Bimbingan 4) | JN | W7 | Kam 22 Okt | 22 Okt | Selesai |
| WO-014 | Fiksasi PFD | IH | W10 | Kam 29 Okt | 29 Okt | Selesai |
| WO-015 | Fiksasi Bab 1 | RG, IH | W10 | Kam 29 Okt | 29 Okt | Selesai |
| WO-016 | Revisi P&ID → DME-PID-002 Rev A (29-10-26) | JN | W10 | Kam 29 Okt | 29 Okt | Selesai |
| WO-017 | Template acuan, legend & simbol AutoCAD | JN | W10 | Kam 29 Okt | 29 Okt | Selesai |
| WO-018 | Himpun dokumen acuan sesuai Panduan (00_CORE_GUIDELINES) | RG | W10 | Kam 29 Okt | 29 Okt | Selesai |
| WO-019 | Ekstraksi HMB DWSIM, tag_map FINAL, validasi neraca (LOG-016/019) | RG (+IH, JN) | W12 | Kam 5 Nov | 3 Nov | Selesai |
| WO-020 | Kalkulator rekayasa + line sizing + thermowell TW-104 (LOG-020/035/036) | RG (+JN, AL) | W12 | Kam 5 Nov | 4 Nov | Selesai (data ASUMSI, review JN) |
| WO-021 | P&ID Rev B + Instrument Index dari gambar + C&E/alarm/FDS Rev 0.4 (LOG-036) | RG (+JN, AL) | W12 | Kam 5 Nov | 4 Nov | Selesai |
| WO-022 | Cockpit fase 4–5 rilis + uji console (LOG-029…040) | RG | W12 | Kam 5 Nov | 4 Nov | Selesai |
| WO-023 | Rekonstruksi timeline, Gantt & WO W1–W18 (dokumen ini) | RG | W12 | Sab 7 Nov | – | Dikerjakan |

W1 dan W9 tidak punya WO (kelas pengantar / UTS); cukup dicatat di MoM. WO-019…022 dikerjakan PM bersama Claude Code, dengan anggota sebagai pendukung/reviewer. Assignee tidak diatribusikan ke anggota yang tidak mengerjakannya.

**WO W13 (terbit 5 Nov, tenggat Kamis 12 Nov):** WO-024 FDS urutan operasi (AL) · WO-025 Bab 3.1–3.2 (IH) · WO-026 P&ID Rev C + konfirmasi data kalkulator (JN) · **WO-027 Bab 4 asumsi & CAPEX I&C (HD, Kritis)** · WO-028 kerangka laporan + MoM W12 + pengingat logbook (RG).

## 4. Gantt (fase & tugas, minggu kalender 1–18)
| Fase | Tugas | PIC | W mulai–akhir (target) | Status per 5 Nov |
| :--- | :--- | :---: | :---: | :--- |
| 1 Inisiasi & Tender | Pengantar, rilis & kajian RFP, pembentukan firma | RG | 1–2 | Selesai |
| 2 Konsep Proses | DWSIM, neraca massa & energi awal | IH | 2–3 | Selesai |
| 2 Konsep Proses | PFD Area 1 & PFD gabungan | IH | 2–4 | Selesai |
| 2 Konsep Proses | Penyempurnaan & fiksasi PFD + HMB | IH | 5–10 | Selesai |
| 3 Manajemen Proyek | Timeline & Gantt | RG | 4–5 | **Terlambat** (selesai W12) |
| 4 Laporan Bab 1 | URS | IH, AL | 5–6 | Selesai |
| 4 Laporan Bab 1 | Draf → fiksasi Bab 1 | RG, IH | 5–11 | Selesai |
| 5 Desain I&C | Draf P&ID → revisi → Rev A → Rev B | JN | 6–12 | Selesai (Rev B) |
| 5 Desain I&C | FDS / control narrative (Bab 2) | AL | 6–14 | Berjalan |
| 5 Desain I&C | Instrument index, C&E, alarm | JN, AL | 12–14 | Berjalan |
| 6 Kalkulasi | Kalkulator verifikasi, line sizing, thermowell | JN, AL | 12–14 | Berjalan (data ASUMSI) |
| 7 Tekno-ekonomi | CAPEX/OPEX, NPV/IRR (Bab 4) | HF | 13–15 | **Belum dimulai** (K3) — jalur kritis G1 |
| 8 Sistem & Dokumen | Cockpit/dashboard & repositori acuan | RG | 8–12 | Selesai |
| 9 Laporan PSTF 1 | Bab 3 (PFD, HMB, alur P&ID), ringkasan eksekutif, kompilasi | semua | 13–15 | Belum |
| 10 Stage-Gate | **G1 ACC draf PSTF 1** (milestone) | RG | 15 | Belum |
| 10 Stage-Gate | Revisi G1, slide tender, cetak A3 | semua | 16–17 | Belum |
| 10 Stage-Gate | **G2 Evaluasi PSTF 1** 15 Des (milestone) | semua | 18 | Belum |

## 5. Rencana WO W13–W18 (K1 = minggu efektif, G1 akhir W15)
| Minggu | WO (target Kamis bimbingan) | PIC |
| :--- | :--- | :---: |
| W13 (B7, 12 Nov) | Bab 2 FDS: lengkapi urutan start-up / operasi normal / shutdown (Bab 5–7 FDS) | AL |
|  | Bab 3.1–3.2: narasi PFD + tabel HMB dari `hmb_streams.json` | IH |
|  | P&ID: simbol FE-101, cek Rev B di AutoCAD, konfirmasi T-101 → Rev C | JN (+IH) |
|  | Bab 4 tekno-ekonomi (mulai dari nol, **jalur kritis**): asumsi ekonomi + sumber, kuantitas instrumen dari Instrument Index, estimasi **CAPEX I&C Class 2** (hardware/software DCS/SIS/FGS, instrumen, katup, kabel, panel, jasa). Lingkup khusus I&C sesuai RFP §3.3.1 (koreksi LOG-049) | HF (+RG) |
|  | MoM + logbook W12–W13; konfirmasi K1 ke dosen | RG |
| W14 (B8, 19 Nov) | Bab 3.3 alur P&ID + logika SIS (TSHH-102 → XV-102) | JN, AL |
|  | Bab 4: OPEX (bahan baku, utilitas dari duty HMB, tenaga kerja), arus kas, NPV/IRR/payback (`CALC_TeknoEkonomi_NPV`, ganti data PLACEHOLDER) | HF (+RG) |
|  | Konfirmasi data ASUMSI kalkulator (line sizing, TW-104, E/S B31.3) | JN |
|  | Review silang Bab 1–3 sesuai `section_reviewers` | semua |
| W15 (B9, 26 Nov) | Kompilasi draf Laporan PSTF 1 Bab 1–4 + Lamp A P&ID A3 + Lamp B logbook → **Diajukan (G1)** | RG |
|  | Bab 4: analisis sensitivitas + kesimpulan kelayakan; Ringkasan eksekutif | HF; RG (rev. HF) |
| W16 (B10, 3 Des) | Revisi pasca-G1; mulai slide presentasi tender | semua |
| W17 (B11, 10 Des) | Finalisasi LaTeX + cetak A3; gladi presentasi; bundel G2 di Drive | RG + semua |
| W18 (15 Des) | **Evaluasi PSTF 1 (G2)** | semua |

## 6. Perubahan Sistem yang Diperlukan
1. `config.projectStartDate` di Firestore **sudah 2026-08-17** (ekspor 2026-11-04); nilai seed `2026-09-14` di kode tidak dipakai. Tidak perlu diubah.
2. Tanggal G1 di `StageGateTimeline.tsx` saat ini = akhir minggu 13 dari `projectStartDate`. **K1 = minggu efektif → wajib diubah** agar melewati 2 minggu UTS (W8–9): G1 = 29 Nov. ✅ Branch `g1-minggu-efektif` (`cd4de74`, tsc 0), menunggu preview + merge.
3. Gantt sudah 18 minggu (17 Agu–14 Des) dengan W8–9 ditandai libur; tidak perlu diubah.

## 7. Cara Memasukkan ke Cockpit (setelah review)
1. PM ekspor JSON cadangan dari cockpit (K6) dan kirim ke agent.
2. Agent membuat `cockpit_import_rekonstruksi.json` berisi `config`, `ganttPhases`, `ganttTasks`, `weeklyPlans`, `workOrders`, `meetingLogs`, dan `logbooks`, digabung dengan data lama yang masih relevan.
3. PM impor lewat menu Ekspor/Impor (hanya PM yang bisa), lalu cek Gantt, WO, dan Beranda.
4. Agent mencatat di log riwayat.

## 9. Isi Berkas Impor (LOG-044)
Berkas `cockpit_import_rekonstruksi.json` (di luar repo, scratchpad sesi agent) hanya berisi seksi berikut, masing-masing **menggantikan** isi lama:

| Seksi | Isi | Catatan |
| :--- | :--- | :--- |
| `config` | Fokus W13, bimbingan 7 (12 Nov), banner G1 29 Nov, status deskripsi jujur | `projectStartDate` tetap 2026-08-17 |
| `ganttPhases` / `ganttTasks` | 6 fase / 32 tugas (§4) | Tugas lama dengan klaim yang tidak tercatat di riwayat diganti; HAZOP/LOPA dipindah ke PSTF 2 |
| `weeklyPlans` | W1–W18 (W1–W11 Done berisi fakta perubahan.md, W12 In Progress, W13–W18 Planning) | Klaim lama "kerangka CAPEX W3", "model reaktor stabil W7" dihapus karena tidak didukung riwayat |
| `meetingLogs` | 8 MoM rekonstruksi (W1–W7, W11) + entri asli 22 Okt dengan minggu dikoreksi 5 → 10 | Tiap ringkasan diberi tanda rekonstruksi; kehadiran tidak tercatat |
| `workOrders` | WO-001…028 | `createdAt` = 2026-11-05; `completedAt` = tanggal aktual; WO-006 tetap Dikerjakan (terlambat) |

**Tidak disentuh:** `users`, `logbooks`, `deliverables`, `raciRows`, `trackerActions`, `rubricParameters`, `defenseQuestions`, `physicalChecklist`, `notifications`, `tasks`, `slideDecks`, `regulations`, `standards`.

**Perlu dibersihkan PM lewat UI (data uji / angka tanpa dasar):**
- logbook "a" (terverifikasi "Hari ini");
- tracker ACT-01 "v";
- jawaban sidang q-1…q-4 berisi angka yang belum dihitung (IRR 22,4 %, Monte Carlo, ESDV-01/TT-102 280 °C, S-07 115 °C);
- rubrik "R² = 0,992";
- checklist fisik "6/12 paraf".
## 8. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-05 | Claude Code (AI) | Draf dari perubahan.md: kalender W1–W18, rekonstruksi WO-001…023, Gantt, rencana W13–W18, keputusan K1–K6. |
| 0.2 | 2026-11-05 | Claude Code (AI) | K1 diputuskan (minggu efektif, G1 29 Nov, dikonfirmasi dosen); K3: Bab 4 belum dimulai → WO tekno-ekonomi W13–W15 dirinci sebagai jalur kritis. |
| 0.3 | 2026-11-05 | Claude Code (AI) | Disesuaikan dengan ekspor cockpit (UID, kode HD, projectStartDate sudah 17 Agu); WO-019…022 diatribusikan ke PM; WO W13 = WO-024…028; §9 isi berkas impor. |
| 0.4 | 2026-11-05 | Claude Code (AI) | Koreksi lingkup Bab 4/WO-027: CAPEX/OPEX khusus I&C (RFP §3.3.1, Tabel 3), bukan peralatan proses (LOG-049). |
