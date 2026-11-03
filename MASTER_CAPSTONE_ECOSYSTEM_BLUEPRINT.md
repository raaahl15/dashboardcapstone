# MASTER BLUEPRINT: EKOSISTEM DATABASE TERPADU & OPERATIONS COCKPIT
**Proyek Capstone:** Front-End Engineering Design (FEED) Pabrik Dimethyl Ether (DME)  
**Program Studi:** Teknik Fisika, Departemen Teknik Nuklir dan Teknik Fisika (DTNTF FT UGM)  
**Tahun Akademik:** 2026/2027  
**Dokumen Kontrol:** DOC-CAPSTONE-DME-2026-MASTER-001  
**Status Anggaran:** Bebas biaya (Rp 0), berbasis FOSS, free tier, dan akun UGM — lihat batasan di BAB VII  
**Versi:** 2.3 (Revisi Konsep pasca Re-Audit Fase 1 + Fase 1.5 + pemetaan Stage-Gate + hosting Vercel)  
**Status Dokumen:** Disetujui PM (2026-11-03)  
**Catatan Riwayat Pengerjaan:** [`PROJECT_HISTORY_AND_AUDIT_LOG.md`](PROJECT_HISTORY_AND_AUDIT_LOG.md)

---

## RIWAYAT REVISI DOKUMEN

| Versi | Tanggal | Penyusun | Ringkasan |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-11-02 | Antigravity (AI agent) + PM | Konsep awal 8 bab, 5 pilar, roadmap 5 fase. |
| 2.0 | 2026-11-03 | Claude Code (AI agent) + PM | Revisi konsep berdasarkan re-audit Fase 1: matriks kepemilikan data (SSOT), siklus status dokumen, aturan companion `.md` yang bisa diaudit, mesin kalkulator berbasis skrip, kebijakan penyimpanan Git vs Drive, pemisahan folder Git dan Drive, WhatsApp gateway dijadikan opsional, Fase 1.5 Remediasi, dan Definition of Done per fase. |
| 2.3 | 2026-11-03 | Claude Code (AI agent) + PM | Hosting resmi pindah ke **Vercel** (website sudah live); remote GitHub = `raaahl15/dashboardcapstone`; `vercel.json` dikembalikan; risiko R-11 (push = deploy produksi). |
| 2.2 | 2026-11-03 | Claude Code (AI agent) + PM | Sign-off Fase 1.5; pemetaan Stage-Gate G1–G4 ke panduan (§1.7); keputusan tim tetap 5 orang (R-09); status Fase 2 berjalan (Drive diunggah via web, R-10). |
| 2.1 | 2026-11-03 | Claude Code (AI agent) | Penyesuaian dari eksekusi Fase 1.5 (LOG-004): library simbol CAD ternyata file AutoCAD manual (bukan hasil generate) → disimpan di Drive; `generate_libraries.js` dihapus; pemeriksa repo ditulis di Node.js (`check_companions.js`) karena Python belum terpasang; panduan mewajibkan sizing manual → skrip kalkulator menjadi verifikasi silang; catatan Stage-Gate vs panduan; status Fase 1.5 SELESAI. |

### Ringkasan Perubahan v1.0 → v2.0

| Area | Konsep v1.0 | Masalah yang Ditemukan | Konsep v2.0 |
| :--- | :--- | :--- | :--- |
| SSOT | "Satu sumber kebenaran" tanpa rincian | Sheets dan CSV sama-sama bisa diedit, tidak jelas mana master | **Matriks kepemilikan data**: tiap jenis data punya tepat satu master, salinan lain read-only (§1.2) |
| Status dokumen | Bebas diisi | 11 file berstatus `ACC Final` tanpa review | **Siklus status baku** + bukti wajib untuk `ACC` (§1.4) |
| Companion `.md` | Nama sama persis untuk semua file teknis | Aturan tidak bisa dipenuhi untuk file hasil generate dan multi-format; klaim 100% padahal ~50% | **Companion per artefak** (bukan per format), daftar pengecualian, dan pengecekan otomatis (§5) |
| Pipeline DWSIM | Skrip Python mengekstrak T, P, flow | Skrip (JS) hanya mengambil nama tag; status `Converged` ditulis hardcoded | **Spesifikasi skema output + validasi neraca massa**; status dibaca dari file (§3.1) |
| Kalkulator | File CSV statis | Angka tidak bisa dihitung ulang dan tidak konsisten (q_m dan Re salah) | **Mesin kalkulator Python** (input YAML → hasil CSV), CSV menjadi output yang di-generate (§3.2) |
| Penyimpanan | Git untuk kode, Drive untuk biner | DXF 3–4 MB/file masuk Git (6,9 juta baris); file duplikat | **Kebijakan penyimpanan per jenis file** (§2.2); hasil generate tidak di-commit |
| Sinkronisasi | Folder monorepo disinkronkan Drive | Folder `.git` di dalam Drive berisiko korup | **Folder Git dan folder Drive dipisah**, dihubungkan lewat `DRIVE_ROOT` (§8.2) |
| WhatsApp | Gateway Baileys sebagai pilar utama | Protokol tidak resmi, risiko nomor diblokir | **Tautan `wa.me` sebagai jalur utama**; Baileys opsional dengan nomor cadangan (§3.5) |
| Audit | Klaim "100% PASS" | Klaim tidak disertai bukti dan denominator | **Audit berbasis bukti**: tiap klaim disertai perintah dan output (§9.2) |
| Roadmap | 5 fase | Fase 1 belum tuntas | **Fase 1.5 Remediasi** + Definition of Done terukur per fase (BAB VI) |

---

## DAFTAR ISI
1. [BAB I: Visi Arsitektur & Prinsip Desain](#bab-i-visi-arsitektur--prinsip-desain)
2. [BAB II: Struktur Monorepo, Kebijakan Penyimpanan & Konvensi Penamaan](#bab-ii-struktur-monorepo-kebijakan-penyimpanan--konvensi-penamaan)
3. [BAB III: Arsitektur Integrasi (6 Pilar Sistem)](#bab-iii-arsitektur-integrasi-6-pilar-sistem)
4. [BAB IV: Spesifikasi 12 Modul Website Area-1 Cockpit](#bab-iv-spesifikasi-12-modul-website-area-1-cockpit)
5. [BAB V: Standar Companion Markdown (.md System)](#bab-v-standar-companion-markdown-md-system)
6. [BAB VI: Roadmap Eksekusi & Definition of Done](#bab-vi-roadmap-eksekusi--definition-of-done)
7. [BAB VII: Tata Kelola Tim (RACI) & Jaminan Bebas Biaya](#bab-vii-tata-kelola-tim-raci--jaminan-bebas-biaya)
8. [BAB VIII: Sinkronisasi Multi-Device (Desktop PC ⟷ Laptop)](#bab-viii-sinkronisasi-multi-device-desktop-pc--laptop)
9. [BAB IX: Tata Kelola Pencatatan Riwayat & Audit](#bab-ix-tata-kelola-pencatatan-riwayat--audit)
10. [Lampiran A: Register Risiko](#lampiran-a-register-risiko)

---

## BAB I: Visi Arsitektur & Prinsip Desain

Sistem Master Database Capstone menyatukan artefak rekayasa proses, instrumentasi, kendali, keselamatan, ekonomi, dan manajemen proyek ke dalam satu ekosistem. **Setiap angka teknis harus bisa ditelusuri ke sumbernya dan dihitung ulang oleh siapa pun di tim.**

### 1.1 Diagram Alur Data

```mermaid
flowchart TD
    subgraph Core["1. Process Data Core (Master: DWSIM)"]
        DWSIM["DME.dwxmz"]
        HMB["hmb_streams.json<br/>(T, P, flow, komposisi, properti)"]
        TAGMAP["tag_map.csv<br/>(tag DWSIM ↔ tag pabrik)"]
        DWSIM -->|tools/dwsim/export_hmb.py| HMB
    end

    subgraph Calc["2. Engineering Calculators (Master: input YAML)"]
        INPUT["inputs/*.yaml<br/>(asumsi desain + rujukan stream)"]
        ENGINE["tools/calc/*.py<br/>(library fluids, ISO/IEC/API)"]
        RESULT["CALC_*.csv<br/>(hasil generate, read-only)"]
        HMB --> ENGINE
        INPUT --> ENGINE
        ENGINE --> RESULT
    end

    subgraph Inst["3. Instrumentasi (Master: Google Sheets)"]
        SHEET["Sheets: Master Instrument Index"]
        IDXCSV["Master_Instrument_Index_DME.csv<br/>(snapshot read-only)"]
        SHEET -->|tools/sync/pull_sheets.js| IDXCSV
    end

    subgraph CAD["4. Drawing (Master: DWG di Drive)"]
        DWG["P&ID .dwg"]
        DXF["Ekspor .dxf"]
        DWG -->|SAVEAS/ODA| DXF
    end

    VALID["tools/validate_tags.py"]
    DXF --> VALID
    IDXCSV --> VALID
    TAGMAP --> VALID

    subgraph Web["5. Operations Cockpit (Firebase)"]
        APP["React + Vite"]
        FS["Firestore: WO, MoM, logbook"]
        APP <--> FS
    end

    HMB -->|dibundel saat build| APP
    RESULT -->|dibundel saat build| APP
    VALID -->|laporan konsistensi| APP
```

### 1.2 Prinsip 1 — Single Source of Truth dengan Matriks Kepemilikan Data

Setiap jenis data memiliki **tepat satu master**. Semua salinan lain bersifat turunan (*derived*), **read-only**, dan wajib bisa dibuat ulang dari master.

| Domain Data | Master (tempat edit) | Turunan (read-only) | Arah Sinkronisasi | PIC (R) |
| :--- | :--- | :--- | :--- | :--- |
| Neraca massa & energi (HMB) | `DME.dwxmz` (DWSIM) | `hmb_streams.json`, tampilan cockpit | DWSIM → JSON (skrip) | IH |
| Pemetaan tag | `tag_map.csv` (Git) | Kolom tag di semua dokumen lain | Satu arah ke dokumen | IH + JN |
| Asumsi desain kalkulator | `inputs/*.yaml` (Git) | — | — | AL / HD |
| Hasil kalkulasi | Dihitung oleh `tools/calc/*.py` | `CALC_*.csv`, datasheet, cockpit | Skrip → CSV | AL / HD |
| Master Instrument Index & IO List | Google Sheets | `Master_Instrument_Index_DME.csv` | Sheets → CSV (satu arah) | JN |
| Narasi FDS & laporan bab 1–4 | Google Docs | Mirror PDF/MD di `06_.../mirrors/` | Docs → mirror | Per bab (RACI) |
| Gambar P&ID & template | `.dwg` di Google Drive | `.dxf` ekspor, `.pdf` plot | DWG → DXF/PDF | JN |
| Library simbol CAD | `.dxf` di Google Drive (diedit di AutoCAD) | — (companion `SYMBOL_LIBRARIES.md` di Git) | — | JN |
| Work Order, MoM, logbook | Cloud Firestore | Ekspor/backup JSON | — | RG |
| Kode web & skrip | Git (GitHub private) | — | — | RG |

**Aturan turunan:** file turunan **tidak boleh diedit manual**. Kalau ada yang salah, perbaiki di master, lalu jalankan ulang skripnya. File turunan mencantumkan baris header `GENERATED — jangan edit manual; sumber: <master>; dibuat: <timestamp>` jika formatnya mengizinkan.

### 1.3 Prinsip 2 — Ketertelusuran Data (*Data Provenance*)

1. Setiap nilai input pada kalkulator atau datasheet mencantumkan **sumber yang spesifik**: tag stream DWSIM + timestamp ekstraksi HMB, nomor standar + klausul, atau `ASUMSI` beserta alasannya.
2. Nilai yang belum punya sumber **wajib ditandai `PLACEHOLDER`**. Placeholder tidak boleh berstatus di atas `Draft`.
3. Skrip **dilarang menulis nilai hardcoded yang terlihat seperti hasil** (contoh: `"status": "Converged"` tanpa membaca file). Jika data tidak ditemukan, skrip **gagal dengan pesan jelas**, bukan diam-diam menulis nilai default.
4. Angka hasil harus **bisa dihitung ulang**. Satu perintah (`npm run calc` / `python -m tools.calc`) menghasilkan ulang seluruh CSV hasil dari HMB + input YAML.

### 1.4 Prinsip 3 — Siklus Status Dokumen Baku

```text
Draft ──► WIP ──► Review Internal ──► Diajukan ──► ACC Pembimbing
  ▲                     │                 │
  └──── Revisi ◄────────┴─────────────────┘
```

| Status | Arti | Siapa yang boleh menetapkan | Bukti wajib |
| :--- | :--- | :--- | :--- |
| `Draft` | Kerangka atau isi masih placeholder | Siapa saja | — |
| `WIP` | Sedang dikerjakan, sebagian data riil | PIC (R) | — |
| `Review Internal` | Selesai menurut PIC, menunggu cek silang | PIC (R) | Nama reviewer internal |
| `Diajukan` | Dikirim ke dosen pembimbing | PM (A) | Tanggal pengajuan + kode WO |
| `ACC Pembimbing` | Disetujui dosen pembimbing | PM (A) **setelah** ada persetujuan dosen | Referensi MoM atau dokumen persetujuan |
| `Revisi` | Dikembalikan dengan catatan | PM (A) | Referensi MoM |

**AI agent (Antigravity, Claude Code, dll.) tidak boleh menetapkan status di atas `Review Internal`.**

### 1.5 Prinsip 4 — Companion Markdown per Artefak

Setiap **artefak teknis** (bukan setiap format file) didampingi satu file `.md` yang menjelaskan tujuan, sumber data, rumus, SOP, dan batasannya. Aturan lengkap ada di BAB V.

### 1.6 Prinsip 5 — Audit Berbasis Bukti

Setiap klaim "selesai" atau "PASS" harus disertai **perintah yang dijalankan, output aktual, dan denominator yang jujur** (contoh: "12 dari 22 artefak", bukan "100%"). Aturan lengkap ada di BAB IX.

### 1.7 Prinsip 6 — Kesiapan Audit Akademik (DTNTF FT UGM)

Seluruh artefak terikat pada rubrik Capstone DTNTF 2026 dan dapat dikompilasi ke bundel sidang. Hanya artefak berstatus `Diajukan` atau `ACC Pembimbing` yang masuk bundel.

#### Pemetaan Stage-Gate ke Panduan Capstone (ditetapkan PM 2026-11-03, v2.2)

Panduan resmi hanya mendefinisikan **dua evaluasi formal**, tetapi juga mewajibkan **ACC Dosen Pembimbing sebagai syarat maju** ke tiap evaluasi (Lampiran 1). Keempat gate proyek diikat ke keempat titik kontrol tersebut:

| Gate | Titik Kontrol di Panduan | Waktu | Penentu Lolos | Bukti Wajib | Isi Bundel Minimum |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **G1** | ACC Pembimbing atas draf Laporan PSTF 1 (Lampiran 1, Tahap 2, syarat maju presentasi) | Akhir minggu 13 PSTF 1 | Dosen Pembimbing | Paraf/ACC tercatat di MoM | Laporan PSTF 1 Bab 1–4, PFD + neraca massa & panas, Draf P&ID A3, tekno-ekonomi, logbook |
| **G2** | **Evaluasi PSTF 1** — panel Koordinator + Pembimbing + Praktisi (Tahap 3) | Minggu 14–16 PSTF 1 (jadwal cockpit: **15 Des 2026**) | Panel evaluasi: *Layak* / *Revisi Mayor* | Berita acara / nilai Lampiran 4A–4B | Bundel G1 versi final + slide presentasi tender |
| **G3** | ACC final Pembimbing atas kalkulasi sizing & DED (Lampiran 1, Tahap 4) | Akhir minggu 13 PSTF 2 | Dosen Pembimbing | Paraf/ACC tercatat di MoM | Laporan PSTF 2 Bab 1–6, P&ID Final, ISA-20, loop & logic, hook-up, BoM, Virtual FAT |
| **G4** | **Evaluasi Akhir PSTF 2** (Tahap 5) | Minggu 14–16 PSTF 2 | Panel evaluasi | Nilai Lampiran 5A–5B | Bundel G3 final + cetak biru A3 |

Aturan: gate berikutnya tidak bisa dibuka sebelum gate sebelumnya lolos (sesuai sifat prasyarat PSTF 1 → PSTF 2). Ringkasan panduan: [`00_CORE_GUIDELINES/Panduan_Capstone_DTNTF_2026.md`](00_CORE_GUIDELINES/Panduan_Capstone_DTNTF_2026.md).

---

## BAB II: Struktur Monorepo, Kebijakan Penyimpanan & Konvensi Penamaan

### 2.1 Struktur Direktori

Root kerja: **`D:\rahul\dme-capstone-master`** (di laptop boleh di lokasi lain; semua skrip memakai path relatif).

Legenda: `[ADA]` sudah ada · `[BARU]` belum dibuat · `[GEN]` hasil generate, tidak di-commit · `[DRIVE]` disimpan di Google Drive, bukan Git

```text
dme-capstone-master/
├── 00_CORE_GUIDELINES/
│   ├── Panduan_Capstone_DTNTF_2026.pdf          [DRIVE] rujukan eksternal
│   ├── Panduan_Capstone_DTNTF_2026.md           [ADA] ringkasan tahapan, rubrik, matriks nilai
│   └── standards/                               [BARU] ringkasan ISA 5.1, ISO 10628, API 520, ASME PTC 19.3, IEC 60534
│
├── 01_PROCESS_SIMULATION_DWSIM/
│   ├── simulation_files/
│   │   ├── DME.dwxmz                            [ADA] master HMB (±110 KB, tetap di Git untuk versioning)
│   │   └── DME.md                               [ADA]
│   ├── exported_data/
│   │   ├── hmb_streams.json                     [ADA→REVISI] skema baru §3.1
│   │   └── hmb_streams.md                       [ADA] kamus skema & satuan
│   ├── tag_map.csv                              [ADA, USULAN, LOG-014] tag DWSIM ↔ tag pabrik
│   └── tag_map.md                               [ADA]
│
├── 02_ENGINEERING_CALCULATORS/
│   ├── inputs/                                  [ADA, LOG-020] master asumsi desain (YAML): FE-101, FCV-101, PSV-101, NPV-001
│   │   ├── orifice_FE-101.yaml
│   │   └── ...
│   ├── CALC_ISO5167_Orifice.csv / .md           [ADA→GEN] CSV menjadi hasil generate
│   ├── CALC_ISA75_ControlValve.csv / .md        [ADA→GEN]
│   ├── CALC_API520_PSV.csv / .md                [ADA→GEN]
│   ├── CALC_ASME_Thermowell.csv / .md           [ADA→GEN]
│   └── CALC_TeknoEkonomi_NPV.csv / .md          [ADA→GEN]
│
├── 03_CAD_AND_PID_LIBRARIES/
│   ├── templates/
│   │   ├── DME_Master_Template.dwt / .dxf       [DRIVE] satu-satunya template (duplikat dihapus)
│   │   ├── DME_Master_Template.md               [ADA]
│   │   ├── acad_dme.lin                         [ADA]
│   │   └── acad_dme.md                          [ADA] (dulu acad_dme_lin.md)
│   └── symbol_libraries/
│       ├── *.dxf                                [DRIVE] file AutoCAD manual, bukan hasil generate
│       └── SYMBOL_LIBRARIES.md                  [ADA] satu companion untuk seluruh library
│
├── 04_INSTRUMENTATION_ISA20/
│   ├── Master_Instrument_Index_DME.csv / .md    [ADA] snapshot dari Google Sheets
│   └── datasheets/                              [BARU] DS_ISA20_*.csv / .md
│
├── 05_SAFETY_AND_CONTROL/
│   ├── Cause_and_Effect_Matrix_ESD.csv / .md    [ADA]
│   ├── FDS_Control_Narrative_ISA506.md          [ADA] (master pindah ke Google Docs di Fase 2)
│   └── Master_Alarm_Database_ISA182.csv / .md   [ADA]
│
├── 06_COLLABORATIVE_WORKSPACE/
│   ├── google_workspace_registry.json           [BARU] ID & URL Docs/Sheets/Drive
│   ├── Google_Workspace_Guide.md                [BARU]
│   └── mirrors/                                 [BARU] mirror teks Docs/Sheets
│
├── 07_FINAL_DELIVERABLES/                       [DRIVE] DWG & PDF final; di Git hanya .md indeksnya
│   ├── drawings/DELIVERABLES_DRAWINGS.md        [BARU]
│   └── reports/DELIVERABLES_REPORTS.md          [BARU]
│
├── apps/operations-cockpit/                     [ADA] React + Vite + Firebase (9 dari 12 modul)
│
├── tools/
│   ├── dwsim/export_hmb.py                      [ADA, LOG-019] HMB skema v1 + test_export_hmb.py
│   ├── calc/                                    [ADA, LOG-020] orifice, control_valve, psv, npv, run_all + test_verification
│   ├── sync/pull_sheets.js                      [ADA, LOG-012] Sheets → CSV (Node)
│   ├── validate_tags.py                         [ADA, LOG-021] + test_validate_tags.py
│   ├── sync/sync.js                             [ADA] sync:push / sync:pull yang aman (§8.3)
│   ├── check_companions.js                      [ADA] pengecek companion, status, ukuran & duplikat (`npm run check`)
│   ├── export_dwsim_hmb.js                      [DIHAPUS, LOG-019] ekstraktor v0, diganti dwsim/export_hmb.py
│   ├── upload_to_gdrive.js                      [ADA] unggahan awal DRIVE_ROOT → Drive via CLI `gdrive` (tidak idempoten)
│   ├── lib/env.js                               [ADA] loader .env.local (DRIVE_ROOT, GDRIVE_ROOT_FOLDER_ID)
│   ├── build_manifest.js                        [ADA, LOG-022] bundel data rekayasa → apps/operations-cockpit/public/data/ (+ --check kesegaran)
│   ├── requirements.txt                         [BARU] fluids, ezdxf, pyyaml, numpy-financial
│   └── whatsapp-bot/                            [OPSIONAL] lihat §3.5
│
├── .env.example                                 [ADA] DRIVE_ROOT, dll.
├── README.md                                    [ADA] orientasi singkat (bukan salinan blueprint)
├── MASTER_CAPSTONE_ECOSYSTEM_BLUEPRINT.md       [ADA] dokumen ini
└── PROJECT_HISTORY_AND_AUDIT_LOG.md             [ADA] riwayat pengerjaan & audit
```

**Keputusan struktur v2.0:**
- **Semua skrip otomasi berada di `tools/`.** Folder `01_.../scripts/` yang kosong dihapus agar tidak ada dua lokasi skrip.
- **Bahasa pipeline data rekayasa: Python.** Alasannya: tersedia library teknik gratis yang sudah tervalidasi (`fluids` untuk ISO 5167, IEC 60534/ISA-75, API 520; `ezdxf` untuk membaca DXF), dan lebih familiar bagi tim teknik. Node.js tetap dipakai untuk web cockpit, tool kebersihan repo (`check_companions.js`, `sync.js`, `build_manifest.js`), dan gateway WhatsApp.
- **Prasyarat Python:** per 2026-11-03 Python **belum terpasang** di PC desktop. Pasang Python 3.12+ (python.org atau `winget install Python.Python.3.12`) sebelum Fase 3.

### 2.2 Kebijakan Penyimpanan (Git vs Google Drive)

| Jenis File | Lokasi | Alasan |
| :--- | :--- | :--- |
| Kode (`.ts`, `.tsx`, `.js`, `.py`), konfigurasi, `.md` | **Git** | Teks kecil, perlu riwayat & review |
| Data teks kecil (`.csv`, `.json`, `.yaml`, `.lin`) | **Git** | Bisa di-diff, ukuran kecil |
| `DME.dwxmz` (±110 KB) | **Git** | Master HMB; versinya harus terikat dengan hasil ekstraksi |
| Hasil build (`dist/`, `node_modules/`) | **Tidak disimpan** (`.gitignore`) | Dibuat ulang dari kode |
| `.dwg`, `.dwt`, `.dxf` (template, library simbol, P&ID) | **Drive** (`03_CAD_DWG/`) | Biner besar, tidak bisa di-diff; di-ignore Git |
| PDF plot, PDF panduan, FEED book | **Drive** | Biner besar |
| Bukti Work Order (foto, scan, lampiran) | **Drive** (`08_WORK_ORDERS_EVIDENCE/`) | Biner, sering bertambah |
| File sementara AutoCAD (`*_recover.dwg`, `*.bak`, `*.dwl`, `*.dwl2`, `plot.log`) | **Diabaikan** (`.gitignore`) | Sampah kerja |

Batas praktis: **tidak ada file > 5 MB di Git.** Git LFS tidak dipakai karena kuota gratis GitHub terbatas.

### 2.3 Konvensi Penamaan & Tag

1. **Tag pabrik (plant tag)** adalah satu-satunya tag yang dipakai di P&ID, datasheet, FDS, C&E, alarm database, dan laporan. Format mengikuti ISA-5.1 dengan nomor area:
   - Peralatan: `<kode>-<area><nomor>` → contoh `P-101`, `R-101`, `E-101`, `T-201`.
   - Instrumen: `<fungsi ISA>-<area><nomor loop>` → contoh `FT-101`, `TIC-102`, `PSV-103`.
   - Stream: `S-<area><nomor>` → contoh `S-101`.
2. **Tag DWSIM** (`S-01`, `RC-01`, `CSCOL-01`, …) hanya dipakai di dalam simulasi. Pemetaannya ke tag pabrik **wajib** tercatat di `tag_map.csv`:

   ```csv
   dwsim_tag,plant_tag,object_type,description,area
   S-01,S-101,MaterialStream,Umpan metanol cair,100
   PUMP-01,P-101,Pump,Pompa umpan metanol,100
   RC-01,R-101,ConversionReactor,Reaktor dehidrasi metanol,100
   CSCOL-01,T-201,DistillationColumn,Kolom pemurnian DME,200
   ```
   *(Nilai di atas contoh format; isi final ditetapkan oleh IH dan JN.)*

   **Pembaruan LOG-014/015 (keputusan PM 2026-11-03):** pabrik DME dibagi **3 area**, masing-masing satu kelompok: **Area 1 reaktor** (firma ini, kode tag **1xx**), **Area 2 distilasi 1** (`CSCOL-01`, kode **2xx**), **Area 3 distilasi 2** (`CSCOL-02` + loop recycle, kode **3xx**; penempatan loop recycle sementara). Lingkup firma Area 1 = `S-101`…`S-107` + recycle masuk `S-114` dari Area 3, sehingga firma Area 1 hanya menerbitkan tag **1xx** (contoh di atas yang memakai `T-201` tidak berlaku untuk Area 1). Penomoran mengikuti nomor objek DWSIM dengan gaya tag pabrik; dua heat exchanger bernomor sama diurutkan menurut arah aliran (`HEAT-01 → E-101`, `COOL-01 → E-102`). Kolom CSV final: `dwsim_tag, plant_tag, object_type, description, area, scope, from, to, status` (lihat `01_PROCESS_SIMULATION_DWSIM/tag_map.md`).
3. Variasi tag liar seperti `REAC-01`, `R-01`, dan `RC-01` untuk objek yang sama **tidak diperbolehkan**. `validate_tags.py` akan menandainya.

---

## BAB III: Arsitektur Integrasi (6 Pilar Sistem)

### 3.1 Pilar 1 — Simulator Proses DWSIM

* **File master:** `01_PROCESS_SIMULATION_DWSIM/simulation_files/DME.dwxmz`.
* **Model:** dehidrasi metanol fase gas $2\,\text{CH}_3\text{OH} \rightarrow \text{CH}_3\text{OCH}_3 + \text{H}_2\text{O}$ ($\Delta H_r \approx -23{,}4\ \text{kJ/mol}$, eksotermik), property package NRTL. Nilai $\Delta H_r$ dan kondisi operasi harus dikonfirmasi IH terhadap literatur dan dicantumkan rujukannya di `DME.md`.
* **Skrip ekstraksi:** `tools/dwsim/export_hmb.py`.
  1. Membuka arsip `.dwxmz` (ZIP) dan **mencari file XML di dalamnya secara dinamis** (nama XML tidak boleh di-hardcode).
  2. Membaca setiap material stream: suhu, tekanan, laju alir massa & molar, fraksi uap, komposisi mol, densitas, viskositas, Cp, dan MW per fase.
  3. Membaca status solver, property package, dan daftar komponen **dari file**, bukan ditulis tetap.
  4. Mengonversi satuan internal DWSIM (SI: K, Pa, kg/s) ke satuan rekayasa, dan mencatat satuan di JSON.
  5. **Validasi:** neraca massa per unit operasi harus tertutup (selisih ≤ 0,5%). Objek tanpa tag, stream tanpa nilai, atau tag duplikat menyebabkan skrip **gagal** dengan daftar masalah.
  6. Menulis `hmb_streams.json` dengan skema berikut:

```json
{
  "meta": {
    "source_file": "DME.dwxmz",
    "source_sha256": "<hash file simulasi>",
    "extracted_at": "2026-11-05T10:00:00+07:00",
    "extractor_version": "1.0.0",
    "solver_status": "<dibaca dari file>",
    "property_package": "<dibaca dari file>",
    "compounds": ["Methanol", "Water", "Dimethyl ether"],
    "units": { "T": "degC", "P": "bar(a)", "mass_flow": "kg/h", "rho": "kg/m3", "mu": "cP" }
  },
  "streams": [
    {
      "dwsim_tag": "S-01",
      "plant_tag": "S-101",
      "T": 0.0, "P": 0.0, "mass_flow": 0.0, "molar_flow": 0.0,
      "vapor_fraction": 0.0,
      "mole_fractions": { "Methanol": 0.0, "Water": 0.0, "Dimethyl ether": 0.0 },
      "props": { "rho": 0.0, "mu": 0.0, "cp": 0.0, "mw": 0.0 }
    }
  ],
  "unit_operations": [
    { "dwsim_tag": "RC-01", "plant_tag": "R-101", "type": "Conversion Reactor", "duty_kW": 0.0, "inlets": ["S-04"], "outlets": ["S-05"] }
  ],
  "validation": { "mass_balance_max_error_pct": 0.0, "warnings": [] }
}
```
*(Angka `0.0` hanya penanda skema.)*

* **Konsumen data:** mesin kalkulator (§3.2) dan modul `DwsimStreamView` di cockpit (dibundel saat build, §3.6).
* **SOP:** setelah DWSIM dijalankan dan konvergen → simpan `.dwxmz` → jalankan `npm run sync:dwsim` → jalankan `npm run calc` → commit `.dwxmz`, `hmb_streams.json`, dan seluruh CSV hasil **dalam satu commit** supaya versi simulasi dan hasil kalkulasi selalu cocok.

### 3.2 Pilar 2 — Mesin Kalkulator Rekayasa

File CSV statis tidak bisa dihitung ulang, sehingga kesalahannya tidak terdeteksi. Pada v2.0, kalkulator menjadi **skrip** dan CSV menjadi **laporan hasil**.

> **Posisi terhadap Panduan Capstone (v2.1):** panduan mewajibkan sizing **dihitung manual** (Lampiran 1 Tahap 4), dan rubriknya menilai "sizing via kalkulator web tanpa rumusan standar" hanya *Cukup (60–69)*. Nilai *Sangat Baik* diberikan untuk "sizing manual **&** software presisi tinggi". Karena itu, **perhitungan manual lengkap (rumus, substitusi, iterasi) tetap ditulis di laporan PSTF 2 Bab 2**, sedangkan skrip berfungsi sebagai **verifikasi silang** (selisih hasil manual vs skrip < 0,5%) dan penjaga konsistensi data.

| Kalkulator | Standar | Implementasi (Python, gratis) | Input dari HMB |
| :--- | :--- | :--- | :--- |
| Orifice plate | ISO 5167-1/2 | `fluids.flow_meter` (Reader-Harris/Gallagher, faktor ekspansi) | q_m, P, T, ρ, μ, κ |
| Control valve | ISA-75.01 / IEC 60534-2-1 | `fluids.control_valve` (`size_control_valve_l/_g`) | q, P1, P2, ρ, μ, Pv |
| PSV | API 520 Part I | `fluids.safety_valve` (`API520_A_g`, `API520_A_L`) | W, P_set, T, MW, Z, k |
| Thermowell | ASME PTC 19.3 TW-2016 | Implementasi manual + uji kasus contoh dari standar | v, ρ, μ |
| Tekno-ekonomi | — | Python (`numpy-financial`) | Kapasitas & utilitas dari HMB |

**Alur kerja:**
1. Asumsi desain yang **bukan** dari HMB (diameter pipa, ΔP desain, material, harga, umur pabrik) ditulis di `02_ENGINEERING_CALCULATORS/inputs/<tag>.yaml`, lengkap dengan sumbernya.
2. Rujukan ke HMB ditulis sebagai tag stream (contoh `stream: S-101`). Skrip mengambil nilainya dari `hmb_streams.json`.
3. `npm run calc` menghasilkan ulang semua `CALC_*.csv` dan menulis timestamp HMB yang dipakai.
4. **Pemeriksaan otomatis:** batas standar (contoh β 0,10–0,75 dan Re_D minimum pada ISO 5167) diperiksa skrip. Pelanggaran dilaporkan sebagai `FAIL`.
5. Setiap kalkulator memiliki **minimal satu uji verifikasi** terhadap contoh soal dari standar atau buku acuan. Ini menjadi bukti kebenaran saat sidang.

### 3.3 Pilar 3 — Google Workspace (Drive, Docs, Sheets, Calendar)

* **Akun pemilik Drive & dokumen:** **akun Google pribadi PM** (keputusan PM 2026-11-03, LOG-009), karena folder `CAPSTONE_DME_AREA1` sudah diunggah ke Drive pribadi. Konektor Google Drive di claude.ai juga terhubung ke akun ini.
  - Anggota tim dan dosen diberi akses lewat **Share** ke email UGM masing-masing (Editor untuk tim, Commenter/Viewer untuk dosen).
  - Akun UGM tetap dipakai untuk login cockpit, Calendar/Meet bimbingan, dan identitas resmi.
  - Kuota: Drive pribadi gratis 15 GB (dibagi dengan Gmail & Photos). Isi proyek saat ini ±40 MB, jadi masih aman; pantau saat bukti WO bertambah.
* **Folder Drive `CAPSTONE_DME_AREA1/` adalah folder terpisah dari monorepo Git** (lihat §8.2). Isinya biner dan dokumen kolaborasi:
  - `00_CORE_GUIDELINES/` — PDF panduan & standar
  - `03_CAD_DWG/` — `.dwg`/`.dwt` master gambar & template
  - `04_INSTRUMENT_INDEX_SHEETS/` — Google Sheets master
  - `06_LIVING_REPORTS_GDOCS/` — Google Docs laporan & FDS
  - `07_FINAL_DELIVERABLES_PDF/` — PDF plot & FEED book
  - `08_WORK_ORDERS_EVIDENCE/WO-XXX/` — bukti Work Order
  - `09_STAGE_GATES_SUBMISSIONS/` — bundel sidang
* **Google Sheets → CSV (satu arah):** **`tools/sync/pull_sheets.js`** (`npm run pull:sheets`, Node, LOG-012; menggantikan rencana `pull_sheets.py` selama Python belum terpasang) memvalidasi CSV dari Sheets terhadap `required_columns`/`key_column` di `google_workspace_registry.json`, lalu menulis snapshot ke repo. Sumber CSV, berurutan dari yang dipakai sekarang:
  1. **Jalur aktif:** *File → Download → CSV* dari tab `sync_tab`, lalu `npm run pull:sheets -- --key <key> --from-file <csv>`. Claude Code juga bisa membuat CSV ini dari konektor Google Sheets.
  2. Opsional nanti: unduh otomatis lewat service account Google Cloud (akun pemilik kini akun pribadi PM, jadi pembuatan project GCP tidak bergantung pada izin UGM).
  CSV di repo **tidak pernah diedit langsung**; perubahan selalu lewat Sheets.
* **Google Docs:** master narasi laporan dan FDS. Cockpit menyimpan tautannya di `google_workspace_registry.json`.
* **Google Calendar & Meet:** jadwal bimbingan dosen.

### 3.4 Pilar 4 — AutoCAD Drafting & Validasi Tag

* **Library simbol:** file AutoCAD manual di Drive (`DRIVE_ROOT/03_CAD_DWG/symbol_libraries/`), didokumentasikan oleh `SYMBOL_LIBRARIES.md` beserta hash SHA-256 tiap file. (Skrip bootstrap `generate_libraries.js` dihapus di Fase 1.5 karena hanya menghasilkan DXF sederhana dan juga menimpa CSV kalkulator dengan data contoh.)
* **Gambar P&ID:** master `.dwg` di Drive. Untuk validasi dan web, gambar diekspor:
  - ke **DXF** (perintah `SAVEAS` di AutoCAD, atau ODA File Converter yang gratis) untuk dibaca skrip;
  - ke **PDF** (A1/A3) untuk dibaca dosen dan cockpit.
* **`tools/validate_tags.py`** (memakai `ezdxf`):
  1. Membaca atribut blok instrumen dan peralatan dari DXF P&ID.
  2. Membandingkannya dengan `Master_Instrument_Index_DME.csv`, `tag_map.csv`, dan tag yang disebut di FDS / C&E / alarm database.
  3. Mengeluarkan laporan: tag di gambar tapi tidak di index (*phantom tag*), tag di index tapi tidak di gambar, dan tag yang melanggar format §2.3.
  4. Laporan ditulis ke `exported_data/tag_validation_report.json` dan ditampilkan di cockpit.

### 3.5 Pilar 5 — Notifikasi WhatsApp Grup

* **Jalur utama: tautan `wa.me` / `https://wa.me/?text=...`** dari cockpit. Pesan sudah terformat, PIC cukup menekan Kirim. Tanpa server, tanpa risiko, Rp 0.
* **Jalur opsional: gateway lokal Baileys** (`tools/whatsapp-bot/`) untuk kirim otomatis.
  - **Risiko:** Baileys memakai protokol WhatsApp Web yang **tidak resmi**. Penggunaan otomatis dapat melanggar ketentuan WhatsApp dan berisiko **nomor diblokir**.
  - **Mitigasi wajib:** gunakan **nomor cadangan**, bukan nomor pribadi PM; batasi frekuensi kirim; folder sesi `auth_info/` tidak pernah di-commit.
  - Dikerjakan hanya jika seluruh Fase 1.5–4 sudah selesai (masuk Fase 5, opsional).
* **Pemicu notifikasi:** WO baru/kritis, deadline H-2, ringkasan action item MoM.

### 3.6 Pilar 6 — Cloud & Database (Firebase Spark Plan)

* **Paket:** Firebase Spark (gratis, tanpa kartu kredit) untuk **Authentication + Firestore**. Kuota Firestore: 50.000 baca & 20.000 tulis per hari.
* **Hosting tunggal: Vercel** (keputusan PM 2026-11-03, v2.3), karena website sudah live di Vercel. Alurnya:
  - Repo GitHub **`raaahl15/dashboardcapstone`** (privat) adalah remote monorepo ini. Setiap push ke `main` memicu deploy otomatis Vercel.
  - Setelan Vercel: **Root Directory = `apps/operations-cockpit`**, dan aktifkan *Skip deployments when there are no changes to the root directory*, supaya commit yang hanya mengubah dokumen/CAD tidak memicu deploy.
  - `apps/operations-cockpit/vercel.json` berisi SPA rewrite + header keamanan (HSTS, X-Frame-Options, nosniff, dll.) dan **wajib dipertahankan**.
  - Variabel `VITE_FIREBASE_*` disimpan di *Environment Variables* Vercel, bukan di repo.
  - `firebase.json` tetap dipakai untuk deploy `firestore.rules` (`firebase deploy --only firestore:rules`); bagian `hosting`-nya tidak dipakai.
* **Model data Firestore (kondisi saat ini):**
  - koleksi `users`
  - koleksi `workOrders` (satu dokumen per WO)
  - dokumen tunggal `projectData/area1` (data bersama lainnya)
* **Risiko batas dokumen 1 MiB:** `projectData/area1` akan terus membesar karena MoM, logbook, dan jadwal. **Aturan:** jika ukuran dokumen > 500 KB, data yang tumbuh (MoM, logbook) dipindah ke koleksi tersendiri (`moms`, `logbook`), mengikuti pola `workOrders`.
* **Data rekayasa statis** (HMB, hasil kalkulasi, laporan validasi tag, manifest `.md`) **tidak disimpan di Firestore**. Data itu dibundel ke aplikasi saat build (`apps/operations-cockpit/public/data/`). Konsekuensinya, data di web hanya sesegar deploy terakhir, dan tanggal ekstraksinya ditampilkan di UI.

---

## BAB IV: Spesifikasi 12 Modul Website Area-1 Cockpit

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   AREA-1 DME OPERATIONS COCKPIT                        │
├─────────────────┬─────────────────────┬────────────────────────────────┤
│ GOVERNANCE      │ ENGINEERING HUB     │ DTNTF ACADEMIC                 │
├─────────────────┼─────────────────────┼────────────────────────────────┤
│ 1. Homepage     │ 6. DWSIM Stream Hub │ 11. Logbook Presensi UGM       │
│ 2. Work Orders  │ 7. Workspaces       │ 12. Stage-Gate & Sidang Rubrik │
│ 3. Schedule     │ 8. Standards        │                                │
│ 4. Team RACI    │ 9. Master Library   │                                │
│ 5. Weekly MoM   │ 10. Google Workspace│                                │
└─────────────────┴─────────────────────┴────────────────────────────────┘
```

| No | Modul (komponen) | Status | Sumber Data | Fungsi |
| :---: | :--- | :---: | :--- | :--- |
| 1 | Homepage (`HomepageView.tsx`) | Ada | Firestore | Dashboard eksekutif: progres deliverable, banner, jadwal bimbingan terdekat. Progres dihitung dari status baku §1.4. |
| 2 | Work Orders (`WorkOrdersView.tsx`) | Ada | Firestore `workOrders` | Tiket kerja berbasis bukti, board/list, status `Ditugaskan → Dikerjakan → Blocked → Diajukan → Selesai`, tautan folder Drive, tombol `wa.me`. |
| 3 | Schedule & Gantt (`ScheduleView.tsx`) | Ada | Firestore | Timeline 16 minggu, jalur kritis, terhubung dengan penutupan WO. |
| 4 | Team RACI (`TeamRaciView.tsx`) | Ada | Firestore | Matriks RACI per bab dan gambar, profil tim. |
| 5 | Weekly MoM (`WeeklyMoMView.tsx`) | Ada | Firestore | Notulensi bimbingan, action item menjadi WO, **referensi MoM menjadi bukti status `ACC Pembimbing`**. |
| 6 | DWSIM Stream Hub (`DwsimStreamView.tsx`) | Ada (LOG-022) | `public/data/hmb_streams.json` | Tabel HMB (T, P, flow, fraksi uap, komposisi) dengan tag pabrik + tanggal ekstraksi; filter lingkup Area 1; unit operasi & neraca massa. |
| 7 | Workspaces & Deliverables (`WorkspacesView.tsx`) | Ada | Firestore + Drive | Pelacak 10 deliverable FEED, preview PDF dari Drive. |
| 8 | Standards (`StandardsView.tsx`) | Ada | Statis + Drive | Rujukan standar ISA/ISO/API/ASME/IEC. |
| 9 | Master Library (`MasterLibraryView.tsx`) | Ada (LOG-022) | `public/data/library_manifest.json`, `calc_results.json`, `tag_validation_report.json` (dari `build_manifest.js`) | Penjelajah artefak + pembaca `.md` (teks; rumus KaTeX belum dirender) + status; tab hasil kalkulator & validasi tag. |
| 10 | Google Workspace Hub (`GoogleWorkspaceView.tsx`) | Ada (LOG-022) | `public/data/google_workspace_registry.json` | Tautan ke Docs, Sheets, folder Drive + PIC/status. |
| 11 | Logbook Presensi (`LogbookView.tsx`) | Ada | Firestore | Logbook harian/mingguan + ekspor rekap untuk Simaster. |
| 12 | Stage-Gate (`StageGateView.tsx`) | Ada | Firestore + manifest | Evaluasi kesiapan G1–G4 sesuai pemetaan §1.7 terhadap rubrik DTNTF; hanya artefak berstatus `Diajukan`/`ACC Pembimbing` yang dihitung. LOG-022: panel garis waktu G1–G4 (konfigurasi tetap dari §1.7, tanggal dari `config`); milestone Gantt G1/G3/G4 ditambahkan PM lewat UI Schedule. |

**Tambahan v2.0:** panel **"Kesehatan Data"** di Homepage menampilkan umur `hmb_streams.json`, jumlah `FAIL` kalkulator, jumlah inkonsistensi tag, dan jumlah artefak tanpa companion.

---

## BAB V: Standar Companion Markdown (.md System)

### 5.1 Aturan Penamaan & Cakupan

1. **Satu companion per artefak, bukan per format.** Artefak yang punya beberapa format (contoh `DME_Master_Template.dwt/.dwg/.dxf/.pdf`) cukup punya **satu** `DME_Master_Template.md`. Semua formatnya didaftarkan di `target_files`.
2. **Nama companion = nama dasar artefak + `.md`.** Ekstensi tidak ikut nama (`acad_dme.lin` → `acad_dme.md`).
3. **Wajib companion:** simulasi (`.dwxmz`), input & hasil kalkulator, index & datasheet instrumen, C&E, alarm database, template & gambar CAD, data ekspor (`hmb_streams.json`), dan dokumen rujukan PDF.
4. **Satu companion kolektif boleh dipakai** untuk sekumpulan file sejenis (contoh: seluruh `symbol_libraries/*.dxf` → `SYMBOL_LIBRARIES.md`).
4a. **File yang disimpan di Drive** didaftarkan di field `external_files` (path relatif `DRIVE_ROOT`, prefix SHA-256, ukuran). Field `target_files` hanya untuk file yang ada di repo, dan keberadaannya diperiksa otomatis.
5. **Tidak wajib companion:** kode sumber (dokumentasi lewat komentar & README), file konfigurasi, file sementara.
6. **Pengecekan otomatis:** `tools/check_companions.js` (`npm run check`) melaporkan artefak tanpa companion, `target_files` yang tidak ada, status di luar daftar §1.4, dan status `ACC Pembimbing` tanpa `review_evidence`. Laporan ini menjadi angka resmi kepatuhan (bukan hitungan manual).

### 5.2 Format Header YAML

```markdown
---
id: "CALC-ISO5167-FE101"
title: "Sizing Orifice Plate FE-101 (Umpan Metanol ke R-101)"
category: "Engineering Calculator"
standard: "ISO 5167-1:2022 / ISO 5167-2:2022"
target_files:
  - "CALC_ISO5167_Orifice.csv"
  - "inputs/orifice_FE-101.yaml"
generated_by: "tools/calc/orifice.py"
source_data:
  - "hmb_streams.json → S-101 (extracted_at: 2026-11-05T10:00+07:00)"
author: "Altaf Ramadhan Parvez"
reviewer: "Jonathan Pangihutan Michael Siahaan"
status: "Draft"            # Draft | WIP | Review Internal | Diajukan | ACC Pembimbing | Revisi
review_evidence: ""        # wajib jika status Diajukan/ACC Pembimbing: kode WO atau referensi MoM
google_ref: ""
last_updated: "2026-11-05"
tags: ["Flow", "Orifice", "Area-100", "Instrumentation"]
---
```
*(Seluruh nilai di atas adalah contoh format.)*

### 5.3 Isi Wajib Companion

1. **Tujuan & ruang lingkup** — apa yang dihitung atau digambar, untuk tag mana.
2. **Standar acuan** — nomor standar + klausul yang dipakai.
3. **Tabel parameter input** — variabel, simbol, satuan, **sumber spesifik** (tag stream / asumsi / standar), status (`OK` / `PLACEHOLDER`).
4. **Persamaan** — rumus utama (LaTeX/KaTeX) dan batas keberlakuannya.
5. **Hasil & pemeriksaan batas** — ringkasan hasil dan status `PASS/FAIL` terhadap batas standar.
6. **Verifikasi** — contoh kasus uji yang dipakai untuk membuktikan perhitungan benar.
7. **SOP** — langkah memperbarui hasil (perintah skrip yang dijalankan).
8. **Log revisi** — Rev, tanggal, penulis, deskripsi.

---

## BAB VI: Roadmap Eksekusi & Definition of Done

```text
┌───────────────┬────────────────────────────────────────────────────────┬──────────────┐
│ FASE 1        │ Konsolidasi Monorepo & Companion .md                   │ via 1.5      │
│ FASE 1.5      │ Remediasi Fondasi (BARU)                               │ SELESAI      │
│ FASE 2        │ Cloud Backbone: GitHub, Google Drive & Workspace       │ DITUTUP*     │
│ FASE 3        │ Pipeline Data: DWSIM → Kalkulator → Validasi Tag       │ BERJALAN     │
│ FASE 4        │ Upgrade Cockpit: 3 Modul Baru + Panel Kesehatan Data   │ Rencana      │
│ FASE 5        │ Validasi Lintas Sistem, Otomasi Akademik & Rilis       │ Rencana      │
└───────────────┴────────────────────────────────────────────────────────┴──────────────┘
```
\* Fase 2 ditutup dengan catatan: 2 butir DoD ditangguhkan atas keputusan PM (uji laptop, konfirmasi akses tim). Lihat Fase 2 dan LOG-018.

Setiap fase dinyatakan selesai **hanya jika semua butir Definition of Done (DoD) terpenuhi dan dibuktikan** di log riwayat (BAB IX). Pengecualian hanya boleh diputuskan PM, harus menyebut butir yang ditangguhkan beserta syarat penutupannya, dan dicatat di log.

#### FASE 1: Konsolidasi Monorepo & Companion `.md` — Status: PARSIAL → dituntaskan lewat Fase 1.5
* **Sudah tercapai:** struktur folder, pemindahan aset CAD/simulasi/kalkulator, integrasi source cockpit ke monorepo, `tsc --noEmit` 0 error.
* **Belum tercapai (dipindah ke Fase 3):** ekstraksi HMB berisi data proses.

#### FASE 1.5: Remediasi Fondasi (BARU) — Status: SELESAI (2026-11-03, LOG-004)
* **Aktivitas:**
  1. ✅ Semua `status: "ACC Final"` diubah menjadi `Draft` (data contoh) atau `WIP` (hasil kerja riil).
  2. ✅ Kolom `DATA_STATUS` (`PLACEHOLDER` / `ASUMSI`) ditambahkan di semua CSV kalkulator.
  3. ✅ File duplikat dihapus; biner CAD & PDF dipindah ke folder staging Drive `D:\rahul\CAPSTONE_DME_AREA1`.
  4. ✅ `symbol_libraries/*.dxf` dikeluarkan dari Git (file AutoCAD manual → Drive; bukan hasil generate).
  5. ✅ Pola file sementara AutoCAD & biner CAD/PDF ditambahkan ke `.gitignore`.
  6. ✅ Riwayat Git dibersihkan dari file besar (disetujui PM; backup bundle dibuat lebih dulu).
  7. ✅ `acad_dme_lin.md` → `acad_dme.md`; dibuat `SYMBOL_LIBRARIES.md`, `hmb_streams.md`, `Panduan_Capstone_DTNTF_2026.md`.
  8. ✅ `README.md` diganti orientasi singkat.
  9. ✅ `sync:push`/`sync:pull` diganti `tools/sync/sync.js`. *(Penghapusan `vercel.json` di butir ini **dibatalkan** pada v2.3 setelah PM menetapkan Vercel sebagai hosting; file dikembalikan, LOG-007.)*
  10. ✅ `tools/check_companions.js` dibuat (Node.js, karena Python belum terpasang).
* **DoD:**
  - [x] `npm run check` melaporkan 0 artefak wajib tanpa companion dan 0 status tidak valid.
  - [x] Tidak ada blob > 1 MB di riwayat Git (`git rev-list --objects --all` + `git cat-file`).
  - [x] File sementara AutoCAD ter-ignore (`git check-ignore` pada contoh nama file).
  - [x] Tidak ada file duplikat (hash identik) di repo.
  - [x] Entri log riwayat Fase 1.5 lengkap dengan bukti (LOG-004).
* **Sign-off:** ✅ disetujui PM pada 2026-11-03 (LOG-005). Tindak lanjut sudah ditutup: folder staging diunggah ke Google Drive oleh PM; `ISO10628_Equipment_recover.dwg` dihapus (isinya sama dengan `.dxf`); ukuran tim **tetap 5 orang** (keputusan PM).

#### FASE 2: Cloud Backbone — Estimasi 2 hari — Status: DITUTUP DENGAN CATATAN (2026-11-03, LOG-018)
* **Penutupan (keputusan PM, 2026-11-03):** Fase 2 ditutup dengan **dua butir DoD ditangguhkan**, sebagai pengecualian atas aturan BAB VI ("fase selesai hanya jika semua DoD terpenuhi"). Kedua butir **tidak** dianggap lulus; masing-masing punya syarat penutupan sendiri (lihat DoD di bawah) dan wajib dicentang lewat entri log tersendiri. Fase 3 boleh berjalan karena tidak bergantung pada kedua butir tersebut.
* **Sudah:** isi folder staging diunggah ke Google Drive (2026-11-03, via `tools/upload_to_gdrive.js` + CLI `gdrive`; belum ada Google Drive for Desktop di PC ini).
* **Repo GitHub:** ✅ memakai repo yang sudah ada, **`raaahl15/dashboardcapstone`** (privat, terhubung ke Vercel). Riwayat 12 commit cockpit dipertahankan lewat merge, dan push pertama berupa fast-forward tanpa force push (`5cf0c38..fa70e69`, LOG-007). Root Directory Vercel sudah diubah PM ke `apps/operations-cockpit`.
* **Catatan build:** di shell agent, `npx vite build` macet karena `npx` tidak pernah memanggil Vite. Gunakan `npm run build` atau `node node_modules/vite/bin/vite.js build` (build ±35 detik).
* **Pembagian kerja Google Workspace** (keputusan PM, 2026-11-03, LOG-008):

  | Lingkup | Pelaksana | Contoh |
  | :--- | :--- | :--- |
  | **File & folder di Drive** — unggah, struktur folder, pindah/hapus file biner, sinkronisasi `DRIVE_ROOT` | **Antigravity** | CAD `.dwg/.dxf`, PDF, bukti WO, folder `08_WORK_ORDERS_EVIDENCE/WO-xxx/` |
  | **Isi dokumen Google** — membuat & mengisi Google Sheets/Docs/Slides, menyelaraskan Sheets ↔ CSV repo, mengisi `google_workspace_registry.json` | **Claude Code** | Master Instrument Index & IO List (Sheets), FDS & laporan Bab 1–4 (Docs) |

  Aturan batas: Claude Code tidak mengunggah/menghapus file biner di Drive; Antigravity tidak mengubah isi Sheets/Docs. Prasyarat untuk Claude Code: **konektor Google Drive diaktifkan di claude.ai → Settings → Connectors** dengan akun Google pribadi PM (✅ sudah dihubungkan 2026-11-03; aktif mulai sesi Claude Code berikutnya).
* **Google Workspace (Claude Code, LOG-010):** ✅ konektor terverifikasi (folder `CAPSTONE_DME_AREA1` terbaca, pemilik akun pribadi PM). ✅ Google Sheets **Master Instrument Index & IO List** (tab `Instrument_Index`, `IO_List` berbasis formula, `Catatan`). ✅ Google Docs **FDS-IC-DME-2026-001** (master FDS; companion repo menjadi arsip Rev 0.2). ✅ Google Docs **kerangka Laporan PSTF 1** (Lampiran 3A). ✅ `06_COLLABORATIVE_WORKSPACE/google_workspace_registry.json` + companion. ✅ 7 folder Drive §3.3 lengkap dan dokumen sudah di foldernya (Antigravity, LOG-011). ✅ `pull_sheets.js` + sinkronisasi pertama index → CSV (LOG-012). Data tetap PLACEHOLDER/Draft.
* **Catatan:** selama Drive for Desktop belum terpasang, `D:\rahul\CAPSTONE_DME_AREA1\` adalah salinan lokal yang **tidak** tersinkron otomatis. Perubahan di salah satu sisi harus disalin manual, atau pasang Drive for Desktop lalu arahkan `DRIVE_ROOT` ke folder Drive (direkomendasikan).
* **Aktivitas:** buat repo GitHub private + push; buat folder Drive `CAPSTONE_DME_AREA1/` terpisah dari monorepo; isi `.env.local` dengan `DRIVE_ROOT`; buat Google Sheets Master Instrument Index & IO List; buat Google Docs FDS & laporan; isi `google_workspace_registry.json`; buat `pull_sheets` (versi Node `pull_sheets.js`).
* **DoD:**
  - [ ] **DITANGGUHKAN:** `git clone` di laptop + `npm install` + `npm run build` berhasil tanpa langkah manual tambahan. *(LOG-013: `postinstall` ditambahkan; simulasi clone bersih di PC Desktop lulus.)* **Syarat penutupan:** uji di laptop anggota saat kerja kelompok (Node 24 LTS, README "Setup Perangkat Baru"), ketiga perintah exit 0 dan `npm run check` PASS, dicatat di log.
  - [x] `pull_sheets` menghasilkan CSV yang sama kolomnya dengan Sheets (versi Node `pull_sheets.js`, 15 kolom, LOG-012).
  - [ ] **DITANGGUHKAN:** Semua URL di registry bisa dibuka oleh seluruh anggota tim. **Syarat penutupan:** (a) Antigravity membagikan folder `CAPSTONE_DME_AREA1` ke 4 email UGM anggota sebagai Editor (LOG-017); (b) Claude Code memverifikasi izin lewat konektor; (c) minimal satu anggota membuka ketiga URL dokumen dengan akun UGM. Akses dosen menyusul (ditunda PM).

#### FASE 3: Pipeline Data DWSIM → Kalkulator → Validasi Tag — Estimasi 4–5 hari — Status: BERJALAN (mulai 2026-11-03)
* **Prasyarat:** ✅ Python 3.13.17 terpasang di PC Desktop (per-user, winget) + virtual env `.venv` dari `tools/requirements.txt` (numpy, fluids, numpy-financial, ezdxf, PyYAML, pytest), uji asap lulus (LOG-016). ✅ `tag_map.csv` FINAL (LOG-016).
* **Aktivitas:** `tools/dwsim/export_hmb.py` (skema §3.1); `tag_map.csv`; mesin kalkulator `tools/calc/` + input YAML; uji verifikasi per kalkulator; `validate_tags.py`.
* **DoD:**
  - [x] `hmb_streams.json` memuat T, P, flow, komposisi, dan properti untuk seluruh stream; status solver dibaca dari file. *(LOG-019: 14 stream; status diturunkan dari `Calculated`/`ErrorMessage` per objek karena DWSIM tidak menyimpan status global.)*
  - [x] Neraca massa tertutup ≤ 0,5% untuk semua unit operasi. *(LOG-019: 10 unit, galat maks 0,027 % di M-101; divalidasi otomatis setiap ekstraksi.)*
  - [ ] `npm run calc` menghasilkan ulang semua `CALC_*.csv` dari nol; setiap kalkulator lulus minimal satu uji verifikasi. *(LOG-020: 4 dari 5 selesai (orifice, control valve, PSV, NPV) dengan uji ISO 5167-2 independen, IEC 60534-2-1 contoh 1–2, API 520 contoh 1–2, dan contoh NPV. **Thermowell ASME PTC 19.3 TW belum**: menunggu salinan standar + contoh soal.)*
  - [ ] `validate_tags.py` berjalan pada minimal satu P&ID DXF dan menghasilkan laporan. *(LOG-021: validator selesai, lintas dokumen jalan (14 ERROR, 33 WARNING), pembaca DXF teruji pada P&ID sintetis. Tinggal dijalankan pada Draf P&ID DXF asli dari JN.)*
  - [x] Tidak ada nilai di CSV hasil yang tidak bisa ditelusuri ke HMB, YAML, atau standar. *(LOG-021: 4 CSV kalkulator dari YAML bersumber; angka bootstrap thermowell dihapus, berstatus BELUM DIHITUNG.)*

#### FASE 4: Upgrade Cockpit — Estimasi 3–4 hari — Status: KODE SELESAI di branch `fase-4-cockpit` (LOG-022), menunggu uji browser PM di preview Vercel lalu merge
* **Selesai (LOG-022):** `tools/build_manifest.js` (data → `public/data/`, dicek kesegarannya oleh `npm run check`); modul `DwsimStreamView`, `MasterLibraryView`, `GoogleWorkspaceView`; panel Kesehatan Data (HMB, kalkulator, tag, companion, ukuran `projectData/area1`); tombol `wa.me` di detail WO, Tracker Action, dan setiap Meeting Log; panel G1–G4 di Stage-Gate; rute & navigasi baru. **Belum:** milestone Gantt G1 (dan G3/G4 semester depan) ditambahkan PM lewat UI Schedule; pembaca rumus KaTeX di Master Library.
* **Aktivitas:** `StageGateView` & Gantt mengikuti pemetaan G1–G4 (§1.7): milestone G1/G2 di jadwal PSTF 1, G3/G4 di jadwal PSTF 2, checklist bundel per gate. Data live ada di Firestore (seed `initialData.ts` hanya dipakai saat dokumen kosong), jadi perubahan harus lewat UI/migrasi data, bukan hanya mengubah seed. `DwsimStreamView`, `MasterLibraryView` (+ `build_manifest.js`), `GoogleWorkspaceView`, panel Kesehatan Data, tombol `wa.me` di WO & MoM, rute baru di `Header.tsx`/`App.tsx`, `npm run build` menyalin data rekayasa ke `public/data/`.
* **DoD:**
  - [x] `tsc --noEmit` 0 error dan `npm run build` sukses (waktu build dicatat). *(LOG-022: tsc exit 0; build 1.710 modul, 4–8 detik di PC Desktop.)*
  - [ ] 12 modul dapat dibuka tanpa error di console browser. *(Butuh browser: PM membuka preview Vercel branch `fase-4-cockpit`, klik ke-12 modul + DevTools Console. Agent tidak punya browser.)*
  - [x] Data HMB di web sama dengan `hmb_streams.json` terbaru (dicek tanggal ekstraksinya). *(LOG-022: `build_manifest.js --check` membandingkan hash sumber; `npm run check`/`sync:push` menolak bila basi; tanggal ekstraksi tampil di modul.)*

#### FASE 5: Validasi Lintas Sistem, Otomasi Akademik & Rilis — Estimasi 3 hari — Status: PERANGKAT LUNAK SIAP (LOG-022), kegiatan rilis & serah terima menunggu tim
* **Perangkat lunak (LOG-022):** validasi tag menyeluruh (`npm run validate:tags`, LOG-021); ekspor logbook CSV (kolom Lampiran 2 Panduan; format unggah Simaster belum terdokumentasi, CSV umum); indikator ukuran `projectData/area1` di panel Kesehatan Data. **Kegiatan manusia:** merge ke `main` (rilis Vercel), `firebase deploy --only firestore:rules` (butuh login Firebase PM), login + WO percobaan oleh tiap anggota, kompilasi bundel Stage-Gate di Drive (Antigravity), re-audit akhir oleh agent/pihak **selain** pelaksana (§7.2). Langkah di README "Rilis Produksi & Serah Terima".
* **Aktivitas:** validasi tag menyeluruh; ekspor Logbook ke format Simaster; kompilasi bundel Stage-Gate di Drive; rilis produksi di Vercel (push ke `main`) + deploy `firestore.rules`; serah terima ke tim; **(opsional)** gateway WhatsApp Baileys dengan nomor cadangan.
* **DoD:**
  - [ ] Laporan validasi tag: 0 phantom tag pada P&ID yang berstatus `Diajukan`.
  - [ ] Seluruh anggota tim berhasil login dan membuat WO percobaan di versi produksi.
  - [ ] Ukuran dokumen `projectData/area1` tercatat dan < 500 KB. *(LOG-022: indikator tersedia di panel Kesehatan Data; tinggal dibaca & dicatat PM setelah rilis.)*
  - [ ] Re-audit akhir tercatat di log riwayat.

---

## BAB VII: Tata Kelola Tim (RACI) & Jaminan Bebas Biaya

### 7.1 Pembagian Peran Anggota Tim

| Anggota Tim | Posisi & Inisial | Email Resmi UGM | Tanggung Jawab Utama dalam Sistem |
| :--- | :--- | :--- | :--- |
| **Rahul Ghulam Hidayatulloh** | Project Manager (RG) | `rahulghulamhidayatulloh2004@mail.ugm.ac.id` | **Accountable (A)**: otorisasi monorepo, review WO, penetapan status `Diajukan`/`ACC Pembimbing`, persetujuan perubahan blueprint, otorisasi rilis Stage-Gate. |
| **Ihsaan Zauhair Tsaqif Prawira** | Lead Process Engineer (IH) | `ihsaanzauhairtsaqifprawira@mail.ugm.ac.id` | **Responsible (R)**: DWSIM (`DME.dwxmz`), validasi neraca massa & energi, `tag_map.csv`, PFD ISO 10628. |
| **Altaf Ramadhan Parvez** | Lead Instrument Engineer 1 (AL) | `altaframadhanparvez@mail.ugm.ac.id` | **Responsible (R)**: kalkulator Orifice & Control Valve (input YAML + uji verifikasi), FDS ISA-5.06, matriks C&E ESD. |
| **Jonathan Pangihutan Michael Siahaan** | Lead Instrument Engineer 2 (JN) | `jonathanpangihutanms@mail.ugm.ac.id` | **Responsible (R)**: template & library AutoCAD, P&ID ISA-5.1, Master Instrument Index (Sheets), validasi tag. |
| **Heidi Falina Brilian** | Cost Engineer (HD) | `heidifalinabrilian@mail.ugm.ac.id` | **Responsible (R)**: kalkulator tekno-ekonomi (CAPEX, OPEX, NPV, IRR), estimasi harga peralatan. |

### 7.2 Peran AI Agent

| Agent | Peran | Batasan |
| :--- | :--- | :--- |
| Antigravity | Agen eksekusi di IDE (kode, skrip, file); **pengelola file & folder Google Drive** | Tidak boleh menetapkan status di atas `Review Internal`; wajib mencatat setiap sesi kerja di log riwayat. |
| Claude Code | Agen eksekusi & auditor independen di IDE; **pengelola isi Google Sheets/Docs/Slides** (via konektor claude.ai) | Sama seperti di atas. Agen yang mengerjakan suatu fase **tidak boleh menjadi satu-satunya auditor** fase tersebut. |
| Claude (Projects / chat) | Reviewer eksternal bab laporan & simulasi tanya-jawab sidang | Tidak mengubah file repo secara langsung. |

### 7.3 Jaminan Bebas Biaya & Batasannya

| Komponen | Skema Gratis | Batasan / Risiko |
| :--- | :--- | :--- |
| DWSIM | Open source (GPL-3) | — |
| Python + `fluids`, `ezdxf`, `numpy-financial` | Open source (MIT) | — |
| Google Drive/Docs/Sheets | Akun Google pribadi PM (15 GB gratis) | Kuota dibagi dengan Gmail/Photos; dokumen bergantung pada satu akun pribadi (R-12) |
| Google Calendar/Meet | Akun `@mail.ugm.ac.id` | Kebijakan admin UGM dapat membatasi berbagi eksternal |
| Firebase | Spark Plan, tanpa kartu kredit | Kuota harian (§3.6); tidak ada Cloud Functions di Spark |
| Vercel | Paket Hobby (gratis) | Untuk penggunaan non-komersial; batas build & bandwidth bulanan paket Hobby |
| GitHub | Repo private gratis | Batas file 100 MB; LFS tidak dipakai |
| WhatsApp | `wa.me` (utama); Baileys (opsional) | Baileys tidak resmi → risiko blokir nomor |
| AutoCAD | Lisensi Autodesk Education | Hanya untuk keperluan pendidikan, non-komersial |
| ODA File Converter (opsional) | Gratis | Diperlukan hanya jika ekspor DXF tidak dilakukan dari AutoCAD |

---

## BAB VIII: Sinkronisasi Multi-Device (Desktop PC ⟷ Laptop)

### 8.1 Visi Kerja Lintas Perangkat
- **Desktop PC (rumah/kost):** DWSIM, AutoCAD skala besar, gateway WhatsApp (jika dipakai).
- **Laptop (kampus):** bimbingan dosen, diskusi lab, presentasi progres, perbaikan kode ringan.

AI agent (Antigravity atau Claude Code) dapat dipakai di kedua perangkat karena seluruh konteks proyek ada di repo (blueprint + log riwayat).

```mermaid
flowchart TD
    subgraph Desktop["Desktop PC"]
        PC_Repo["Monorepo Git<br/>D:\\rahul\\dme-capstone-master"]
        PC_Drive["Folder Drive<br/>CAPSTONE_DME_AREA1 (terpisah)"]
    end

    subgraph Hub["Cloud (gratis)"]
        GitHub["GitHub private<br/>raaahl15/dashboardcapstone<br/>(kode, .md, CSV, JSON, .dwxmz)"]
        GDrive["Google Drive<br/>(.dwg, PDF, bukti WO)"]
        Firestore["Firestore<br/>(WO, MoM, logbook)"]
        Hosting["Vercel<br/>(root: apps/operations-cockpit)"]
    end

    subgraph Laptop["Laptop"]
        Lap_Repo["Monorepo Git<br/>(lokasi bebas)"]
        Lap_Drive["Folder Drive<br/>(lokasi bebas)"]
        Browser["Browser → Cockpit"]
    end

    PC_Repo <-->|push / pull| GitHub
    GitHub <-->|pull / push| Lap_Repo
    PC_Drive <-->|Drive for Desktop| GDrive
    GDrive <-->|Drive for Desktop| Lap_Drive
    GitHub -->|auto-deploy saat push ke main| Hosting
    Browser <--> Firestore
```

### 8.2 Empat Lapisan Sinkronisasi

1. **Git & GitHub (teks dan file kecil)** — kode, `.md`, CSV, JSON, YAML, `.dwxmz`.
2. **Google Drive for Desktop (biner besar)** — `.dwg`, `.dwt`, PDF, bukti WO.
   - **Folder monorepo Git TIDAK BOLEH berada di dalam folder yang disinkronkan Drive.** Drive dan Git sama-sama menulis ke folder `.git`, sehingga riwayat bisa korup atau muncul file konflik.
   - Monorepo merujuk folder Drive lewat variabel `DRIVE_ROOT` di `.env.local` (contoh desktop: `G:\My Drive\CAPSTONE_DME_AREA1`; laptop bisa berbeda).
3. **Path relatif & environment** — skrip memakai path relatif terhadap root repo dan membaca `DRIVE_ROOT` dari `.env.local`. Tidak ada path absolut di kode.
4. **Firestore (data operasional)** — WO, MoM, logbook, jadwal tersinkron real-time lewat cockpit.

### 8.3 Skrip Sinkronisasi yang Aman

`git add .` tanpa pemeriksaan berisiko ikut meng-commit file sementara. Skrip `sync:push` v2.0 harus:
1. Menolak berjalan jika ada file untracked yang tidak dikenali (menampilkan daftarnya).
2. Menjalankan `git pull --rebase` sebelum push.
3. Meminta pesan commit yang deskriptif (bukan pesan generik `sync: automatic update`).

### 8.4 SOP Pindah Perangkat

| Aksi | Di perangkat yang ditinggalkan | Di perangkat tujuan |
| :--- | :--- | :--- |
| **Mulai kerja** | — | 1. `git pull --rebase`<br>2. Pastikan Drive for Desktop selesai sinkron (ikon centang). |
| **Selesai kerja** | 1. Simpan & tutup file AutoCAD/DWSIM.<br>2. `git status` → pastikan hanya file yang dimaksud.<br>3. Commit dengan pesan jelas → `git push`.<br>4. Catat sesi di log riwayat (BAB IX). | — |
| **Bekerja dari laptop tanpa clone** | Aktifkan VS Code Remote Tunnels di PC | Buka tunnel dari browser laptop |

**Larangan:** jangan membuka file `.dwg` yang sama di dua perangkat sekaligus. Drive tidak menggabungkan file biner, dan perubahan salah satu perangkat akan hilang atau menjadi file "conflicted copy".

---

## BAB IX: Tata Kelola Pencatatan Riwayat & Audit

### 9.1 Kewajiban Pencatatan

**Setiap sesi kerja yang mengubah repo, konsep, atau keputusan proyek wajib dicatat di [`PROJECT_HISTORY_AND_AUDIT_LOG.md`](PROJECT_HISTORY_AND_AUDIT_LOG.md)**, baik dikerjakan oleh anggota tim maupun AI agent. Format entri ada di dokumen tersebut. Entri tidak boleh dihapus; koreksi dilakukan dengan entri baru yang merujuk entri lama.

### 9.2 Aturan Audit

1. Setiap klaim disertai **perintah yang dijalankan dan output aktualnya** (dikutip ringkas).
2. Setiap persentase disertai **pembilang dan penyebut** serta definisi penyebutnya.
3. Status audit hanya: `PASS`, `PARSIAL`, `FAIL`, atau `TIDAK DIUJI`. Item yang tidak dijalankan ditulis `TIDAK DIUJI`, bukan `PASS`.
4. Auditor fase tidak boleh hanya agen/orang yang mengerjakan fase tersebut.
5. Sign-off gerbang fase dilakukan oleh **PM**, bukan oleh auditor.

---

## Lampiran A: Register Risiko

| ID | Risiko | Dampak | Kemungkinan | Mitigasi | PIC |
| :--- | :--- | :---: | :---: | :--- | :---: |
| R-01 | Angka kalkulator salah dan masuk laporan/sidang | Tinggi | Tinggi (sudah terjadi) | Mesin kalkulator skrip + uji verifikasi (§3.2) | AL/HD |
| R-02 | Status dokumen menyesatkan (ACC tanpa review) | Tinggi | Tinggi (sudah terjadi) | Siklus status baku + `check_companions.js` (§1.4, §5.1) | RG |
| R-03 | Tag tidak konsisten antar dokumen | Tinggi | Sedang | `tag_map.csv` + `validate_tags.py` (§2.3, §3.4) | JN |
| R-04 | Riwayat Git membengkak / korup | Sedang | Tinggi (sudah terjadi) | Kebijakan penyimpanan + pemisahan folder Drive (§2.2, §8.2) | RG |
| R-05 | Nomor WhatsApp diblokir | Sedang | Sedang | `wa.me` sebagai jalur utama; Baileys hanya dengan nomor cadangan (§3.5) | RG |
| R-06 | Dokumen Firestore `projectData/area1` melewati 1 MiB | Tinggi | Sedang | Pantau ukuran; pecah ke koleksi saat > 500 KB (§3.6) | RG |
| R-07 | Konflik file `.dwg` di dua perangkat | Sedang | Sedang | SOP §8.4 (satu perangkat per file) | JN |
| R-08 | Kebijakan akun UGM membatasi API Google | Rendah | Rendah (Drive kini di akun pribadi) | Fallback unduh CSV manual (§3.3) | JN |
| R-13 | File di `public/data/` (HMB, kalkulator, companion, registry Google) dapat diunduh **tanpa login** dari website produksi; login Firebase hanya melindungi tampilan. Registry memuat tautan folder Drive yang saat ini berstatus "siapa saja yang memiliki link" | Sedang | Sedang | Sebelum merge Fase 4 ke `main`: ubah akses umum folder `CAPSTONE_DME_AREA1` ke **Dibatasi** dan bagikan per email; jangan menaruh data rahasia (kredensial, data pribadi) di folder `0x_` yang dibundel | RG |
| R-12 | Seluruh Drive/Docs/Sheets dimiliki satu akun pribadi PM; jika akun bermasalah atau akses tim terlewat dibagikan, dokumen tidak bisa diakses | Sedang | Rendah | Bagikan folder induk `CAPSTONE_DME_AREA1` ke email UGM seluruh anggota (Editor); salinan teks penting tetap di Git (CSV snapshot, mirror Docs di `06_.../mirrors/`) | RG |
| R-09 | Tim 5 orang, sedangkan panduan menyebut firma 3–4 orang; penilaian individu memakai logbook (anti *free-rider*) | Sedang | Sedang | Keputusan PM: tetap 5 orang. RACI per deliverable dibuat tegas, dan logbook tiap anggota wajib spesifik & lengkap 12 baris agar kontribusi individu terbukti | RG |
| R-11 | Setiap push ke `main` memicu deploy produksi Vercel; deploy gagal/rusak memengaruhi website live | Tinggi | Sedang | Root Directory `apps/operations-cockpit` + skip deploy tanpa perubahan; `npm run build` lokal sebelum push perubahan web; rollback lewat *Instant Rollback* Vercel ke deployment sebelumnya | RG |
| R-10 | Salinan Drive di web dan folder lokal `CAPSTONE_DME_AREA1` tidak sinkron | Sedang | Sedang | Integrasi Drive oleh Antigravity (Fase 2); opsi: pasang Google Drive for Desktop dan arahkan `DRIVE_ROOT` ke sana. Jangan menjalankan ulang `upload_to_gdrive.js` ke folder yang sudah terisi | RG |
