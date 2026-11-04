# Audit Konsep, Kelayakan & Kegunaan Operations Cockpit (Fase 4)

**Tanggal:** 2026-11-04 · **Auditor:** Claude Code (AI agent) · **Diminta oleh:** PM (Rahul)
**Objek:** branch `fase-4-cockpit` (setelah merge `main` dan bundel ulang data, LOG-027)
**Acuan:** Blueprint v2.3 BAB I (prinsip), BAB III §3.6, BAB IV (12 modul), BAB VI Fase 4–5; Panduan Capstone DTNTF 2026; RFP KAK-IC-DME-2026-001
**Catatan independensi:** kode Fase 4 sebagian dibuat Claude Code (LOG-023). Sesuai Blueprint §9.2 butir 4, audit ini **bukan** re-audit akhir Fase 5; re-audit akhir tetap oleh Antigravity atau reviewer lain.

---

## 1. Ringkasan

| Pertanyaan | Jawaban singkat |
| :--- | :--- |
| Apakah sesuai konsep (Blueprint)? | **PARSIAL.** Tiga modul baru (DWSIM, Library, G-Workspace) dan panel Kesehatan Data sesuai konsep. Modul lama masih melanggar tiga prinsip Blueprint: status baku §1.4, ketertelusuran §1.3 (ada teks/angka palsu), dan satu master per data §1.2. |
| Apakah layak dipakai? | **Layak secara teknis** (`tsc` 0 error, build sukses 5 s). **Belum layak merge** sampai syarat P0 (§6) dipenuhi, terutama R-13 dan uji browser. |
| Apakah ramah pengguna? | **Cukup.** Komponen dasar baik (target sentuh 44 px, ARIA, error boundary, state kosong). Masalahnya ada di struktur: 12 menu datar tanpa grup, Homepage terlalu padat (±14 kartu), dan bahasa campur Inggris–Indonesia. |
| Ada fitur yang sama/tumpang tindih? | **Ya, 7 klaster** (§4). Yang terberat: lima jenis "tugas" yang berbeda, empat tempat status dokumen dengan tiga kosakata berbeda, dan dua ukuran "kesiapan sidang" yang tidak saling terhubung. |

**Rekomendasi utama:** sebelum G2 (15 Des 2026), kerjakan **P0 + sebagian P1** saja: hapus konten palsu, satukan status, perbaiki bug, lalu merge. **Penyederhanaan menu 12 → 8 (P2) ditunda sampai setelah G2** agar tim tidak harus belajar ulang aplikasi di minggu penulisan laporan.

---

## 2. Metode & Bukti

| Pemeriksaan | Perintah / cara | Hasil | Status |
| :--- | :--- | :--- | :---: |
| Kompilasi tipe | `tsc --noEmit` (worktree branch) | exit 0 | PASS |
| Build produksi | `vite build` | exit 0, built in 1,92 s (total 5 s), 21 chunk; terbesar `vendor-firestore` 409,9 kB (gzip 118,6 kB) | PASS |
| Kesegaran data | `node tools/build_manifest.js --check` | sebelum bundel ulang: 6 sumber basi (efek LOG-024/025); sesudah: bersih | PASS |
| Kebocoran email di data publik | cari `@mail.ugm.ac.id`/`@gmail.com` di `public/data/*.json` | 0 temuan | PASS |
| Tautan Google di data publik | `google_workspace_registry.json` | 11 URL Drive/Docs/Sheets dapat dibaca tanpa login (R-13) | PARSIAL |
| Pembacaan kode | 12 view, Header, App, komponen bersama, `AppContext` (perhitungan), `initialData.ts`, `types` | temuan §3–§5 | — |
| Konsistensi dokumen | seluruh 27 file `.md` repo (blueprint, panduan, RFP, companion) dibandingkan dengan isi UI | temuan §3–§5 | — |
| 12 modul tanpa error console | butuh browser | — | **TIDAK DIUJI** |
| Data live Firestore | butuh login | temuan berbasis *seed* `initialData.ts`; data live bisa sudah diubah tim | **TIDAK DIUJI** |
| Tampilan ponsel / tablet | butuh browser | dinilai dari kelas CSS saja | **TIDAK DIUJI** |
| Preview Vercel branch | butuh akses dashboard | — | **TIDAK DIUJI** |

---

## 3. Kesesuaian per Modul terhadap Blueprint BAB IV

| No | Modul | Status | Temuan utama |
| :---: | :--- | :---: | :--- |
| 1 | Homepage | PARSIAL | Blueprint: "progres dihitung dari status baku §1.4". Kenyataannya progres deliverable diisi **manual** oleh PM (persen bebas, `AppContext.tsx:2742`). Panel Kesehatan Data ✅. Tombol "Ekspor Paket FEED" hanya `alert()` palsu (`HomepageView.tsx:1342`). |
| 2 | Work Orders | PASS | Status `Ditugaskan → … → Selesai` sesuai, ada riwayat append-only, bukti, dan `wa.me`. Folder Drive bukti masih berupa URL bebas (`evidenceUrl`), belum otomatis ke `08_WORK_ORDERS_EVIDENCE/WO-xxx`. |
| 3 | Schedule & Gantt | PARSIAL | Gantt 4 fase W1–W18, tidak ada milestone **G1** (DoD Fase 4). Footer berisi teks palsu: "Peng-Robinson EOS (DWSIM v8.7)" (model sebenarnya **NRTL, DWSIM 6.5**) dan "Auto-saved to EPC Server • 14:42:09 WIB" statis (`ScheduleView.tsx:915-916`). |
| 4 | Team RACI | PARSIAL | Matriks ada, tetapi tidak terhubung ke pembagian 11 bagian laporan di registry (`section_owners`, LOG-025). Ringkasan RACI di Homepage di-*hardcode* dengan struktur bab lama ("Bab 4 Inst. & SIS", "Bab 5–6 CAPEX") (`HomepageView.tsx:1166-1233`). |
| 5 | Weekly MoM | PARSIAL | Blueprint: "referensi MoM menjadi bukti status ACC Pembimbing". Belum ada kaitan MoM ke status dokumen mana pun. Ringkasan WO antar-rapat ✅. |
| 6 | DWSIM Stream Hub | PASS | Tabel HMB, unit operasi, neraca, sha256, tanggal ekstraksi, catatan sitasi RFP. Minor: pil "galat neraca" selalu hijau walaupun melebihi batas (`DwsimStreamView.tsx:90`). |
| 7 | Workspaces & Deliverables | **FAIL** | Blueprint: 10 deliverable + preview PDF Drive. Kenyataannya 6 kartu ("6 Core Deliverables" di-*hardcode*), status memakai kosakata terlarang `ACC Final`/`In Review Pembimbing` (`types/index.ts:77`), dan tautan *seed* palsu (`drive.google.com/drive/folders/dme-area1-bab1`, `initialData.ts:231-287`). Tidak ada preview PDF. |
| 8 | Standards | PARSIAL | Daftar standar oke. Tiga "regulasi utama" di *seed* memakai URL `ugm.id/...` yang tampaknya fiktif (`initialData.ts:747-761`), padahal ringkasan Panduan dan RFP yang asli ada di Library. |
| 9 | Master Library | PARSIAL | Penjelajah companion, hasil kalkulator, dan validasi tag ✅. Isi `.md` tampil sebagai teks mentah; KaTeX belum ada. |
| 10 | Google Workspace Hub | PASS | Kartu dokumen + folder Drive dari registry. |
| 11 | Logbook | PARSIAL | Ekspor CSV ✅, kuota 72 ✅. **Bug:** tanggal paraf dosen disimpan sebagai teks `'Hari ini'`, bukan tanggal (`AppContext.tsx:1477`), sehingga tanggal paraf di ekspor dan arsip salah selamanya. |
| 12 | Stage-Gate | PARSIAL | Timeline G1–G4 ✅. Indeks kesiapan (%) dihitung dari centang manual rubrik + checklist fisik (`AppContext.tsx:2759`), tidak dari status artefak. Teks statis palsu: "100% Diselaraskan", "Revisi Bab 3 & 4", "Terakhir diperbarui: Hari ini" (`StageGateView.tsx:363,375,412`). |

Ringkas: **4 PASS, 7 PARSIAL, 1 FAIL** dari 12 modul (berdasarkan pembacaan kode + *seed*; uji browser TIDAK DIUJI).

---

## 4. Fitur yang Sama atau Tumpang Tindih

| # | Klaster | Di mana saja | Dampak | Usulan |
| :---: | :--- | :--- | :--- | :--- |
| A | **Pelacakan tugas: 5 entitas** | `TaskItem` (arsip checklist lama, Homepage), `WeeklyPlanItem` (Weekly Planner), `GanttTaskItem` (Gantt), `TrackerActionItem` (MoM), `WorkOrder` | Pengguna bingung harus mencatat pekerjaan di mana; status tersebar dan sinkronisasi otomatis WO → Gantt/Weekly Plan menambah kerumitan | **WO = satu-satunya unit kerja.** Tracker Action langsung dibuat sebagai WO (asal `mom` sudah ada). Weekly Planner menjadi tampilan mingguan dari Gantt. `TaskItem` dibekukan (sudah arsip). |
| B | **Status dokumen: 4 tempat, 3 kosakata** | Homepage "Progress Dokumen FEED" + Workspaces (`Draft/In Review Pembimbing/ACC Final/Aktif`, Firestore), Master Library (status baku §1.4 dari companion), G-Workspace (status registry), Homepage "Status ACC Pembimbing" (`Dosen Review/Revisi Mayor/ACC Bersyarat/Full ACC`) | Bisa menunjukkan "ACC Final" untuk dokumen yang di repo masih `Draft` (risiko R-02 berulang); `ACC Final` sudah dilarang sejak Fase 1.5 | Satu kosakata §1.4 untuk semua. Deliverable laporan = 11 bagian registry `laporan_pstf1`; persen progres **dihitung** dari status (usulan: Draft 0, WIP 40, Review Internal 70, Diajukan 90, ACC Pembimbing 100). |
| C | **Kesiapan sidang: 2 ukuran** | Indeks kesiapan Stage-Gate (centang manual), hitungan artefak `Diajukan/ACC` di timeline G1–G4, ditambah "Audit Kecepatan %" manual di Homepage | Angka bisa 85 % "READY" sementara 0 artefak berstatus Diajukan | Indeks kesiapan memakai status artefak (§1.7: hanya `Diajukan`/`ACC Pembimbing` yang dihitung); centang rubrik tetap sebagai self-check, bukan angka utama. "Audit Kecepatan" dihapus. |
| D | **Tenggat 15 Des 2026 di 5 tempat** | Homepage countdown (tanggal di-*hardcode* `HomepageView.tsx:200-201`), kartu "Batas Penyerahan Tender" (*hardcode* `:1028`), pil Workspaces (*hardcode* `WorkspacesView.tsx:97`), teks Stage-Gate (*hardcode* `StageGateView.tsx:184`), timeline G1–G4 (dari `config`) | Mengubah jadwal di `config` tidak mengubah 4 tempat lain | Satu sumber (`config.tenderDeadline` + konstanta RFP); Homepage cukup satu kartu tenggat. |
| E | **Tautan dokumen di 4 modul** | Standards (regulasi), Workspaces (`fileUrl`), G-Workspace (registry), Library (`google_ref`) | Hanya registry dan companion yang terverifikasi asli; dua lainnya *seed* palsu | Semua tautan dokumen diambil dari registry/companion; Workspaces dan Standards tidak menyimpan URL sendiri. |
| F | **RACI di 3 versi** | Team RACI (Firestore), RACI ringkas Homepage (*hardcode*), registry `section_owners`/`section_reviewers` | Tidak konsisten setelah LOG-025 (11 bagian) | Ringkasan Homepage dihitung dari Team RACI; Team RACI menampilkan pembagian bagian laporan dari registry. |
| G | **MoM vs Logbook** | Meeting Log (Weekly MoM) dan logbook kelompok mencatat sesi yang sama | Wajar, karena logbook format Panduan Lampiran 2 dan dinilai. Saat ini diketik dua kali | Tetap terpisah, tetapi tombol "Buat draf logbook dari MoM ini" (aturan 1×24 jam). |

---

## 5. Kegunaan (User-Friendliness)

**Yang sudah baik:** target sentuh ≥ 44 px konsisten; `aria-*` pada menu, tab, dan modal; error boundary untuk chunk gagal muat; pesan kosong ("Belum ada …"); tombol `wa.me`; data rekayasa menampilkan tanggal dan sumber.

**Yang perlu diperbaiki:**

1. **Navigasi 12 menu datar.** Blueprint membaginya menjadi 3 grup (Governance, Engineering Hub, DTNTF Academic), tetapi Header menampilkan 12 pil sejajar (`Header.tsx:105-118`). Di bawah 1280 px menu menjadi strip geser horizontal 12 pil, sehingga sebagian menu tidak terlihat.
2. **Homepage terlalu padat.** Sekitar 14 kartu (sambutan, 3 metrik, pengumuman, kesehatan data, profil, countdown, tugas, status proyek, tenggat, ACC, bimbingan, timeline, RACI, progres, MoM). Tenggat tampil 2 kali di halaman yang sama.
3. **Bahasa campur dan judul tidak informatif:** "Welcome in", "This is your team Schedule!", "Rules The Team !", "Manage Your Progres!" (salah eja), "Our Team and Matrix Raci", sementara isinya bahasa Indonesia. Label menu juga campur ("Work Order", "G-Workspace").
4. **Tautan Kesehatan Data tidak tepat sasaran.** Kartu kalkulator dan tag membuka Library di tab Dokumen, bukan tab Kalkulator atau Validasi Tag (`DataHealthPanel.tsx:68,77`).
5. **Konten dekoratif dengan tag lama** di halaman login (`R-01`, `C-01`, `S-07`, `LoginGateway.tsx:111-472`) dan contoh form WO (`R-01`). Ini bertentangan dengan tag pabrik FINAL (R-101, S-107) dan bisa terbawa ke laporan.
6. **Library menampilkan Markdown mentah**, sehingga rumus companion tidak terbaca nyaman.

**Usulan struktur menu (P2, setelah G2): 12 → 8, dikelompokkan sesuai Blueprint**

| Grup | Menu | Isi (gabungan modul lama) |
| :--- | :--- | :--- |
| Governance | Beranda | Homepage yang dipangkas + Kesehatan Data |
| | Work Order | Work Orders + Tracker Action (sebagai WO asal MoM) |
| | Jadwal | Gantt + tampilan mingguan (eks Weekly Planner) |
| | Tim & RACI | Team RACI + pembagian bagian laporan |
| Engineering Hub | Data Rekayasa | DWSIM + tab Kalkulator + tab Validasi Tag |
| | Dokumen | Deliverable (status §1.4) + Library companion + Google Workspace + Standar |
| DTNTF Academic | Rapat & Logbook | Weekly MoM + Logbook (tab terpisah) |
| | Stage-Gate | Timeline G1–G4 + kesiapan berbasis status + rubrik |

Perubahan ini mengubah spesifikasi BAB IV, jadi perlu persetujuan PM dan revisi blueprint (usulan v2.4).

---

## 6. Rekomendasi Berprioritas

| Prio | Butir | Pelaksana | Butuh keputusan PM? |
| :---: | :--- | :--- | :---: |
| **P0** | Ubah akses umum folder Drive `CAPSTONE_DME_AREA1` ke **Dibatasi** (R-13: registry di `public/data/` bisa dibaca tanpa login) | PM | — |
| **P0** | Hapus konten palsu/menyesatkan: `alert` Ekspor Paket FEED, footer Schedule (Peng-Robinson v8.7, Auto-saved), teks statis Stage-Gate, RACI ringkas *hardcode* | Claude Code (branch) | Tidak |
| **P0** | Perbaiki bug `verifiedDate: 'Hari ini'` → tanggal ISO; tampilkan dalam format Indonesia | Claude Code (branch) | Tidak |
| **P0** | Uji browser preview Vercel: 12 modul tanpa error console (DoD Fase 4) | PM | — |
| **P1** | Satukan status deliverable ke §1.4 + migrasi data Firestore (`ACC Final` → status baku); progres dihitung dari status | Claude Code + PM (migrasi) | **Ya** (pemetaan status lama → baru, bobot %) |
| **P1** | Tenggat satu sumber; satu kartu tenggat di Homepage | Claude Code | Tidak |
| **P1** | Ganti URL *seed* palsu (Workspaces, Standards) dengan URL registry/Drive asli **di data live** | PM lewat UI, atau Claude Code lewat migrasi | Ya (cek data live) |
| **P1** | Milestone G1 di Gantt (DoD Fase 4) | PM lewat UI | — |
| **P1** | Kartu Kesehatan Data membuka tab yang tepat | Claude Code | Tidak |
| P2 | Navigasi 12 → 8 menu bergrup; Homepage dipangkas; judul berbahasa Indonesia | Claude Code | **Ya** (blueprint v2.4) |
| P2 | Tracker Action = WO; Weekly Planner = tampilan Gantt | Claude Code | **Ya** |
| P2 | KaTeX di Library; tombol "draf logbook dari MoM"; tag pabrik di halaman login | Claude Code | Tidak |

**Urutan yang disarankan:** P0 (satu sesi agent + aksi PM) → merge ke `main` → P1 bertahap sebelum G1 (akhir minggu 13) → P2 setelah G2.

---

## 7. Catatan atas Audit Lama (`docs/audit-report.md`, 2026-11-01)

Audit lama memberi skor "9,2/10 — LAYAK PENUH OPERASIONAL PRODUKSI". Skornya tidak disertai penyebut dan definisi (Blueprint §9.2 butir 2), dan audit itu tidak memeriksa kesesuaian konsep, tumpang tindih fitur, maupun konten palsu. Perbaikan keamanan dan aksesibilitas yang dicatatnya tetap berlaku. Dokumen ini melengkapinya, tidak menggantikannya.

## 8. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-04 | Claude Code (AI) | Audit konsep, kelayakan, kegunaan, dan tumpang tindih fitur cockpit (LOG-027). |
