# DME Capstone Master — Area 1

Monorepo proyek Capstone **FEED Pabrik Dimethyl Ether (DME)**, Teknik Fisika DTNTF FT UGM 2026/2027.

| Dokumen | Isi |
| :--- | :--- |
| [MASTER_CAPSTONE_ECOSYSTEM_BLUEPRINT.md](MASTER_CAPSTONE_ECOSYSTEM_BLUEPRINT.md) | Konsep sistem, aturan data, roadmap fase (sumber acuan utama) |
| [PROJECT_HISTORY_AND_AUDIT_LOG.md](PROJECT_HISTORY_AND_AUDIT_LOG.md) | Riwayat pengerjaan & hasil audit — **wajib diisi setiap sesi kerja** |
| [00_CORE_GUIDELINES/Panduan_Capstone_DTNTF_2026.md](00_CORE_GUIDELINES/Panduan_Capstone_DTNTF_2026.md) | Ringkasan panduan & rubrik PSTF 1/2 |

## Struktur Singkat

| Folder | Isi |
| :--- | :--- |
| `00_CORE_GUIDELINES/` | Panduan akademik & ringkasan standar |
| `01_PROCESS_SIMULATION_DWSIM/` | Simulasi `DME.dwxmz` + ekspor HMB |
| `02_ENGINEERING_CALCULATORS/` | Kalkulator sizing & tekno-ekonomi |
| `03_CAD_AND_PID_LIBRARIES/` | Companion template & library CAD (file biner di Drive) |
| `04_INSTRUMENTATION_ISA20/` | Master Instrument Index & datasheet |
| `05_SAFETY_AND_CONTROL/` | FDS, C&E matrix, alarm database |
| `06_COLLABORATIVE_WORKSPACE/` | Registry Google Workspace (Fase 2) |
| `07_FINAL_DELIVERABLES/` | Indeks deliverable final (file di Drive) |
| `apps/operations-cockpit/` | Web cockpit React + Vite + Firebase |
| `tools/` | Skrip otomasi (sinkronisasi, pemeriksa, ekstraktor) |

## Setup Perangkat Baru (laptop)

Prasyarat: **Git** dan **Node.js 24 LTS** (minimal 24.12; paket Firebase memintanya). Akses ke repo privat `raaahl15/dashboardcapstone` (login GitHub saat clone).

```bash
git clone https://github.com/raaahl15/dashboardcapstone.git dme-capstone-master
cd dme-capstone-master
npm install                     # sekaligus memasang dependensi cockpit (postinstall)
npm run build                   # harus selesai tanpa error -> DoD Fase 2 butir 1
npm run check                   # harus HASIL: PASS
```

Untuk **menjalankan** cockpit (bukan sekadar build), dua file lokal perlu dibuat. Keduanya di-ignore Git, jadi tidak ikut clone:
1. `apps/operations-cockpit/.env.local`: salin dari `.env.example` di folder itu, isi nilai Firebase dari Vercel → Project → Settings → Environment Variables (atau salin file yang sama dari PC Desktop).
2. `.env.local` di root: salin dari `.env.example`, isi `DRIVE_ROOT` (hanya perlu jika memakai skrip Drive).

Untuk **pipeline rekayasa Python** (Fase 3, opsional di laptop): pasang Python 3.12+ (PC Desktop memakai 3.13), lalu dari root repo:

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r tools/requirements.txt
```

Lalu `npm run dev` → http://localhost:3000.

## Mulai Kerja Harian

```bash
npm run sync:pull               # tarik perubahan terbaru
npm run dev                     # jalankan cockpit di http://localhost:3000
```

## Perintah Penting

| Perintah | Fungsi |
| :--- | :--- |
| `npm run check` | Periksa companion `.md`, status dokumen, ukuran & duplikat file |
| `npm run sync:dwsim` | Ekstrak HMB DWSIM (T, P, laju alir, komposisi, duty) ke `hmb_streams.json` + validasi neraca massa (Python) |
| `npm run calc` | Hitung ulang semua `CALC_*.csv` dari `02_ENGINEERING_CALCULATORS/inputs/*.yaml` + HMB (butuh `.venv`) |
| `npm run validate:tags` | Validasi tag lintas dokumen → `tag_validation_report.json`; tambah `-- --dxf <pid.dxf>` untuk P&ID |
| `npm run test:py` | Uji ekstraktor HMB, kalkulator, dan validator tag (butuh `.venv`) |
| `npm run sync:push -- "pesan"` | Commit aman + push (menolak file liar) |
| `npm run sync:pull` | Tarik perubahan terbaru (`pull --rebase`) |
| `npm run build` | Bundel data rekayasa (`build_manifest.js`) lalu build produksi cockpit |
| `npm run data:cockpit` | Bundel ulang data rekayasa ke `apps/operations-cockpit/public/data/` (wajib setelah mengubah HMB, CSV kalkulator, laporan tag, registry, atau companion `.md`; dicek oleh `npm run check`) |
| `npm run pull:sheets -- --key <key> --from-file <csv>` | Sinkron Google Sheets → snapshot CSV repo |

## Aturan Inti (ringkas dari Blueprint)
1. **Satu master per data.** File turunan (CSV snapshot, JSON ekspor) tidak diedit manual.
2. **Biner CAD/PDF di Google Drive**, bukan di Git (`.dwg`, `.dwt`, `.dxf`, `.pdf` di-ignore).
3. **Status dokumen:** `Draft → WIP → Review Internal → Diajukan → ACC Pembimbing`. Status ACC wajib ada bukti (MoM/WO).
4. **Nilai tanpa sumber ditandai `PLACEHOLDER`** dan tidak boleh dikutip ke laporan.
5. **Catat setiap sesi kerja** di log riwayat.

## Rilis Produksi & Serah Terima (Fase 4–5)

Push ke `main` = deploy produksi Vercel (risiko R-11). Fitur baru dikerjakan di branch lalu dicek di **preview Vercel** sebelum digabung.

1. **Syarat sebelum merge:** akses umum folder Drive `CAPSTONE_DME_AREA1` diubah ke **Dibatasi** dan dibagikan per email (risiko R-13: `public/data/` bisa diunduh tanpa login).
2. **Uji preview:** buka URL preview branch di dashboard Vercel → login → buka ke-12 modul (Homepage, Work Order, Schedule, Team & RACI, Weekly MoM, Standards, Workspaces, DWSIM, Library, G-Workspace, Logbook, Stage-Gate) dengan DevTools Console terbuka; tidak boleh ada error merah.
3. **Merge & rilis:** `git switch main`, `git merge --no-ff <branch>`, `npm run sync:push -- "release: ..."` → cek deployment *Ready* di Vercel. Gagal? *Instant Rollback* di Vercel.
4. **Aturan Firestore:** `cd apps/operations-cockpit` lalu `npx firebase-tools deploy --only firestore:rules` (login Firebase akun PM).
5. **Uji tim:** tiap anggota login di produksi dan membuat satu WO percobaan (tandai "uji" lalu batalkan).
6. **Catat ukuran `projectData/area1`** dari panel Kesehatan Data (harus < 500 KB).
7. **Milestone Gantt G1** (akhir minggu 13 PSTF 1) ditambahkan lewat UI Schedule, centang *Stage-gate milestone*.
8. **Re-audit akhir** oleh agent/pihak **selain** pelaksana (Blueprint §7.2), dicatat di log riwayat.
