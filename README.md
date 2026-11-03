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

## Mulai Kerja

```bash
cp .env.example .env.local      # isi DRIVE_ROOT sesuai perangkat
npm run sync:pull               # tarik perubahan terbaru
npm install --prefix apps/operations-cockpit
npm run dev                     # jalankan cockpit di http://localhost:3000
```

## Perintah Penting

| Perintah | Fungsi |
| :--- | :--- |
| `npm run check` | Periksa companion `.md`, status dokumen, ukuran & duplikat file |
| `npm run sync:dwsim` | Ekstrak data DWSIM ke `hmb_streams.json` |
| `npm run sync:push -- "pesan"` | Commit aman + push (menolak file liar) |
| `npm run sync:pull` | Tarik perubahan terbaru (`pull --rebase`) |
| `npm run build` | Build produksi cockpit |

## Aturan Inti (ringkas dari Blueprint)
1. **Satu master per data.** File turunan (CSV snapshot, JSON ekspor) tidak diedit manual.
2. **Biner CAD/PDF di Google Drive**, bukan di Git (`.dwg`, `.dwt`, `.dxf`, `.pdf` di-ignore).
3. **Status dokumen:** `Draft → WIP → Review Internal → Diajukan → ACC Pembimbing`. Status ACC wajib ada bukti (MoM/WO).
4. **Nilai tanpa sumber ditandai `PLACEHOLDER`** dan tidak boleh dikutip ke laporan.
5. **Catat setiap sesi kerja** di log riwayat.
