# Laporan Audit Perangkat Lunak Menyeluruh: DME Area 1 Engineering Operations & Management Dashboard

Tanggal Audit: 12 Oktober 2026
Peran Auditor: Auditor Perangkat Lunak Senior (Keamanan, Firebase, React/TypeScript, UX)
Metode Bukti: `[DIJALANKAN]`, `[DIBACA DARI KODE]`, `[BELUM DIUJI]`

---

## 1. Ringkasan Eksekutif

Aplikasi **DME Area 1 Engineering Operations & Management Dashboard** telah memiliki fondasi antarmuka React 19 + TypeScript (`strict: true`) yang komprehensif dan telah menghapus celah pembuatan akun otomatis (`createUserWithEmailAndPassword`), sesi lokal palsu (`localStorage`), serta endpoint tulis lokal `/api/project-data`. Meskipun demikian, penelusuran mendalam menemukan **celah keamanan hak akses pada `firestore.rules`**, **ketiadaan debounce pada sinkronisasi real-time per ketikan**, **risiko timpa data (*lost update*) antaranggota pada array dokumen tunggal**, serta **sejumlah fitur yang masih statis/simulasi di antarmuka**.

**5 Temuan Paling Kritis:**
1. **[SEC-01] (Kritis - `[DIBACA DARI KODE]`) Eskalasi Hak Akses Admin pada Bootstrap `users` (`firestore.rules:80-88, 190-191`)**: Fungsi `isCanonicalInitialUserSeed(uid)` mengizinkan anggota tim biasa membuat dokumen `/users/user-rahul` (apabila dokumen belum ada) dengan `email` milik sendiri dan `role: 'admin'`, sehingga langsung mengambil alih hak Admin (`isAdmin()`) di Firestore.
2. **[SEC-02] (Kritis - `[DIBACA DARI KODE]`) Kegagalan Otorisasi Admin Baru & Ketidaksinkronan RBAC Server (`firestore.rules:48-65, 107-114, 162-172`)**: `isAdmin()` hanya memeriksa `/users/$(request.auth.uid)` (yang tidak pernah ada karena aplikasi memakai ID kanonik `'user-...'`) dan `/users/user-rahul`, sehingga anggota yang dipromosikan menjadi Admin ditolak oleh Firestore; selain itu 9 seksi operasional (`raciRows`, `logbooks`, `deliverables`, `weeklyPlans`, `slideDecks`, `trackerActions`, dll.) dapat ditimpa penuh oleh anggota biasa.
3. **[DATA-01] (Kritis - `[DIBACA DARI KODE]`) Ketiadaan Debounce pada `updateDoc` & Banjir Tulis Per Ketikan (`src/context/AppContext.tsx:505-578`, `src/components/views/StageGateView.tsx:408, 419`)**: Setiap perubahan 1 karakter pada input skor/mitigasi Stage-Gate langsung memicu `JSON.stringify` 15 seksi dan `updateDoc` ke Firestore beserta 2-3 evaluasi `get()/exists()` pada `firestore.rules`.
4. **[DATA-02] (Tinggi - `[DIBACA DARI KODE]`) Risiko *Lost Update* (Timpa Array Utuh) Saat Dua Pengguna Menyimpan Bersamaan (`src/context/AppContext.tsx:527-540`)**: Walaupun sinkronisasi telah memakai `updateDoc` per kunci seksi, setiap seksi (`tasks`, `logbooks`, `raciRows`, `trackerActions`) dikirim sebagai array utuh sehingga dua anggota yang menambah logbook atau mencentang tugas secara bersamaan akan saling menimpa.
5. **[SEC-03] (Tinggi - `[DIJALANKAN]` & `[DIBACA DARI KODE]`) Kebocoran Kredensial Historis di Riwayat Git & Potensi *Stored XSS* via Skema URL `javascript:` (`git log`, `src/components/views/WeeklyMoMView.tsx:250`, `WorkspacesView.tsx:172`)**: Commit Git terdahulu (`31ae96b` dan `0ffd670`) masih menyimpan password awal dan `email tim` di riwayat `README.md` serta `project-data.json`; selain itu tautan eksternal (`href`) tidak memvalidasi skema `https?://`.

**Keputusan Kelayakan: LAYAK SETELAH PERBAIKAN SEGERA** (wajib menyelesaikan rekomendasi Kategori A pada `firestore.rules`, debounce sinkronisasi, dan validasi URL sebelum digunakan bersama oleh seluruh anggota tim di lingkungan produksi).

---

## 2. Kartu Skor Per Area

| Area Audit | Nilai (1-5) | Alasan Satu Kalimat |
| :--- | :---: | :--- |
| **1. Fungsional** | **3 / 5** | Seluruh 8 menu utama dan login telah tersedia di kode, tetapi sejumlah fitur kunci (hitung mundur tender, peringatan 24 jam logbook pasca-MoM, jarum speedometer Stage-Gate, kunci status final, dan unggah berkas Workspace) masih berupa teks statis atau simulasi `alert()`. |
| **2. Keamanan** | **2.5 / 5** | Autentikasi sudah mewajibkan Firebase Auth (`signInWithEmailAndPassword`) tanpa mode lokal, namun `firestore.rules` masih memiliki celah pengambilalihan admin saat bootstrap, belum memeriksa `email_verified`, belum membatasi 9 seksi operasional per peran, dan riwayat Git masih memuat kredensial lama. |
| **3. Data & Sinkronisasi** | **2.5 / 5** | Sinkronisasi telah beralih dari `setDoc` penuh ke `updateDoc` per seksi, namun ketiadaan *debounce* pada input teks, potensi *lost update* pada array seksi, dan kegagalan deteksi `isFirestoreMode` pada `sortAndNormalizeUsers` berisiko merusak konsistensi data tim. |
| **4. UI / Desain** | **4 / 5** | Sistem visual *glassmorphism*, palet warna, tipografi `Plus Jakarta Sans` + `Inter`, dan penggunaan ikon outline tanpa emoji sangat rapi, dengan sedikit penyimpangan pada duplikasi komponen kartu antarhalaman dan potensi >1 kartu gelap di halaman Team & RACI. |
| **5. Aksesibilitas** | **2 / 5** | Terdapat rasio kontras yang gagal standar WCAG AA (`2.13:1` untuk `#9FB3C8` di atas putih), banyak tombol ikon berukuran `12x12px` hingga `22x22px` (di bawah `44x44px`), 18 dari 19 modal tanpa atribut `role="dialog"` maupun *focus trap*, serta ketiadaan dukungan `prefers-reduced-motion`. |
| **6. Kinerja** | **3 / 5** | Aplikasi dikemas menjadi satu berkas JS monolitik berukuran `1.042,50 kB` (tanpa *code-splitting* per menu) dan memicu serialisasi JSON 15 seksi di setiap perubahan state tanpa *debounce*. |
| **7. Pemeliharaan** | **3 / 5** | TypeScript `strict: true` telah aktif dan lulus `tsc --noEmit` tanpa penggunaan tipe `any`, tetapi 7 berkas masih berukuran di atas 600 baris dan belum ada pengujian otomatis, *Error Boundary*, maupun konfigurasi CI. |

---

## 3. Inventarisasi Proyek dan Hasil Eksekusi (Tahap 1 & Tahap 2)

### 3.1 Peta Struktur Proyek & Ukuran File (`[DIJALANKAN]`)

Perintah pengukuran jumlah baris dan ukuran byte dijalankan pada seluruh berkas proyek (di luar `node_modules/`, `.git/`, dan `dist/`). Berkas `project-data.json` telah dihapus di *working tree* (`D project-data.json` pada `git status -s`).

| Path File | Jumlah Baris | Ukuran (Byte) | Peran & Keterangan |
| :--- | ---: | ---: | :--- |
| `package-lock.json` | 3.207 | 111.395 | Lockfile dependensi npm |
| `src/components/views/HomepageView.tsx` | 1.459 | 63.070 | Tampilan utama *Executive Cockpit* (>600 baris) |
| `src/context/AppContext.tsx` | 1.242 | 39.960 | Provider state global, Auth, & sinkronisasi Firestore (>600 baris) |
| `src/data/initialData.ts` | 1.070 | 31.360 | Data awal (*seed*) proyek & 5 anggota tim (>600 baris) |
| `src/components/layout/ProfileModal.tsx` | 907 | 37.225 | Modal profil pengguna & manajemen peran PM (>600 baris) |
| `src/components/views/StageGateView.tsx` | 748 | 32.014 | Tampilan *Stage-Gate Readiness*, rubrik, & Q&A sidang (>600 baris) |
| `src/components/views/WeeklyMoMView.tsx` | 683 | 29.835 | Tampilan *Weekly Asistensi*, MoM, Slide, & Tracker (>600 baris) |
| `src/components/views/ScheduleView.tsx` | 649 | 29.463 | Tampilan jadwal induk Gantt 16 minggu & rencana mingguan (>600 baris) |
| `src/components/login/LoginGateway.tsx` | 572 | 31.066 | Halaman gerbang autentikasi Firebase Auth |
| `src/components/views/TeamRaciView.tsx` | 562 | 22.879 | Tampilan direktori tim (*FlipCard*) & matriks RACI |
| `src/components/layout/Header.tsx` | 406 | 16.730 | Navigasi atas, pencarian cepat, notifikasi, & menu profil |
| `src/components/views/LogbookView.tsx` | 400 | 17.081 | Tampilan logbook aktivitas individu & verifikasi paraf |
| `src/utils/migrateUserRefs.ts` | 398 | 12.978 | Utilitas resolusi & migrasi referensi pengguna ke UID kanonik |
| `src/components/views/WorkspacesView.tsx` | 318 | 13.302 | Tampilan repositori berkas & progres *deliverables* |
| `src/components/common/UserChip.tsx` | 313 | 8.445 | Komponen bersama avatar/nama anggota & kartu detail |
| `src/components/views/StandardsView.tsx` | 294 | 12.035 | Tampilan direktori regulasi & standar rekayasa |
| `src/components/layout/ExportImportModal.tsx` | 281 | 11.390 | Modal ekspor/impor JSON, migrasi UID, & reset data |
| `src/types/index.ts` | 240 | 5.474 | Definisi seluruh antarmuka TypeScript |
| `src/context/appContextHelpers.ts` | 239 | 6.589 | Fungsi bantu murni untuk serialisasi, validasi impor, & normalisasi user |
| `src/context/appContextTypes.ts` | 232 | 6.322 | Tipe konteks, `INITIAL_PROJECT_DATA`, & konstanta seksi |
| `firestore.rules` | 220 | 7.992 | Aturan keamanan server Cloud Firestore |
| `src/index.css` | 150 | 3.547 | Konfigurasi Tailwind v4, variabel warna CSS, & kelas `.glass-card` |
| `src/App.tsx` | 130 | 4.802 | Komponen pembungkus tata letak, pemilih tab, & penanganan galat muat |
| `README.md` | 55 | 2.874 | Dokumentasi instalasi dan konfigurasi Firebase |
| `src/firebase.ts` | 32 | 952 | Inisialisasi Firebase App, Auth, dan Firestore |
| `firebase.json` | 31 | 539 | Konfigurasi Firebase Hosting & referensi `firestore.rules` |
| `package.json` | 30 | 796 | Manifes proyek, skrip, dan daftar dependensi |
| `tsconfig.json` | 28 | 558 | Konfigurasi kompilator TypeScript (`"strict": true`) |
| `vite.config.ts` | 22 | 707 | Konfigurasi bundler Vite & plugin React/Tailwind |
| `index.html` | 22 | 1.413 | Dokumen HTML utama & pemuatan font Google |
| `.gitignore` | 16 | 93 | Pengecualian Git (`.env*`, `!.env.example`, `project-data.json`) |
| `.env.example` | 8 | 413 | Contoh variabel lingkungan Firebase (`VITE_FIREBASE_*`) |
| `metadata.json` | 6 | 314 | Metadata deskripsi aplikasi |
| `.env.local` | 5 | 285 | Konfigurasi lokal Firebase (dikecualikan oleh `.gitignore`) |
| `src/main.tsx` | 5 | 159 | Titik masuk (*entry point*) React DOM |
| `.npmrc` | 1 | 21 | Konfigurasi npm (`legacy-peer-deps=true`) |

### 3.2 Teknologi & Daftar Dependensi di `package.json` (`[DIJALANKAN]` & `[DIBACA DARI KODE]`)

- **Identitas Proyek (`package.json:2-5`)**: `"name": "area1-dme-engineering-operations-cockpit"`, `"version": "0.0.0"`, `"private": true`, `"type": "module"`.
- **Skrip (`package.json:6-12`)**:
  - `"dev"`: `"vite --port=3000 --host=0.0.0.0"`
  - `"build"`: `"vite build"`
  - `"preview"`: `"vite preview"`
  - `"clean"`: `"node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""`
  - `"lint"`: `"tsc --noEmit"`
- **Pemeriksaan Pemakaian Dependensi (`[DIJALANKAN]` via pencarian seluruh pernyataan `import` di `src/` dan `vite.config.ts`; `npx --no-install depcheck` membatalkan eksekusi karena paket `depcheck` belum terpasang di `node_modules`)**:

| Nama Paket | Versi di `package.json` | Kelompok | Status Pemakaian | Bukti Lokasi Impor / Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `react` | `^19.0.1` | `dependencies` | **Terpakai** | Diimpor di seluruh komponen `.tsx` dan `src/context/AppContext.tsx` |
| `react-dom` | `^19.0.1` | `dependencies` | **Terpakai** | Diimpor di `src/main.tsx:2` (`react-dom/client`) |
| `firebase` | `13.0.0` | `dependencies` | **Terpakai** | `firebase/app`, `firebase/auth`, `firebase/firestore` di `src/firebase.ts:1-3`, `src/context/AppContext.tsx:5-15` |
| `lucide-react` | `^0.546.0` | `dependencies` | **Terpakai** | Diimpor di seluruh komponen tampilan pada `src/components/**` |
| `vite` | `^8.3.0` | `dependencies` | **Terpakai (Salah Kelompok)** | Diimpor di `vite.config.ts:3`; seharusnya berada di `devDependencies` |
| `@vitejs/plugin-react` | `^6.1.1` | `dependencies` | **Terpakai (Salah Kelompok)** | Diimpor di `vite.config.ts:2`; seharusnya berada di `devDependencies` |
| `@tailwindcss/vite` | `^4.3.3` | `dependencies` | **Terpakai (Salah Kelompok)** | Diimpor di `vite.config.ts:1`; seharusnya berada di `devDependencies` |
| `tailwindcss` | `^4.3.3` | `devDependencies` | **Terpakai** | Diimpor di `src/index.css:1` (`@import "tailwindcss";`) |
| `typescript` | `^7.0.2` | `devDependencies` | **Terpakai** | Digunakan oleh skrip `npm run lint` (`tsc --noEmit`) |
| `@types/react` | `^19.3.0` | `devDependencies` | **Terpakai** | Deklarasi tipe React untuk TypeScript |
| `@types/react-dom` | `^19.3.0` | `devDependencies` | **Terpakai** | Deklarasi tipe React DOM untuk TypeScript |
| `@types/node` | `^22.14.0` | `devDependencies` | **Terpakai** | Digunakan oleh `import path from 'path'` dan `__dirname` di `vite.config.ts:4, 11` |
| `autoprefixer` | `^10.4.21` | `devDependencies` | **TIDAK TERPAKAI** | Tidak ada konfigurasi PostCSS; Tailwind v4 (`@tailwindcss/vite`) menangani vendor prefix secara bawaan |

### 3.3 Peta Aliran Data & Urutan Prioritas Saat Aplikasi Mulai (`[DIBACA DARI KODE]`)

1. **Sumber Data yang Dihapus / Tidak Aktif**:
   - **Endpoint `/api/project-data` di `vite.config.ts`**: Tidak ada lagi middleware/endpoint lokal di `vite.config.ts:1-22`.
   - **File `project-data.json`**: Telah dihapus di *working tree* dan ditambahkan ke `.gitignore:16`.
   - **`BroadcastChannel` & `localStorage`**: Tidak digunakan lagi sebagai penyimpan sesi/data; bahkan saat inisialisasi `AppContext` (`src/context/AppContext.tsx:109-119`), kunci lama `area1_dme_session_user_id`, `area1_dme_project_data`, dan `area1_dme_users_data` dihapus secara aktif dari `window.localStorage`.
2. **Urutan Prioritas Saat Aplikasi Mulai (`src/context/AppContext.tsx:100-502`)**:
   - **Langkah 1 (Inisialisasi Memori)**: State React diinisialisasi dengan nilai bawaan dari `src/data/initialData.ts` (`INITIAL_USERS`, `INITIAL_CONFIG`, `INITIAL_TASKS`, dll.), tetapi `isLoggedIn = false`, `isLoading = true`, dan `isDataLoaded = false` (`AppContext.tsx:100-136`) sehingga layar menampilkan `"Menghubungkan ke Firebase..."` (`src/App.tsx:21-27`).
   - **Langkah 2 (Pemeriksaan Konfigurasi Firebase)**: Di `src/firebase.ts:12-28`, ketujuh variabel `import.meta.env.VITE_FIREBASE_*` diperiksa. Jika tidak lengkap, `isLoading` disetel `false` dan `LoginGateway` menampilkan peringatan konfigurasi.
   - **Langkah 3 (Listener `onAuthStateChanged` - `AppContext.tsx:341-494`)**:
     - Jika belum ada sesi Firebase Auth (`!firebaseUser`), `isLoggedIn = false`, `isLoading = false`, dan pengguna diarahkan ke `<LoginGateway />`.
     - Jika ada sesi Firebase Auth, email dicocokkan terhadap `INITIAL_USERS` (`AppContext.tsx:360-362`). Bila tidak cocok, `signOut(firebaseAuth)` dipanggil. Bila cocok, `currentUserId` disetel ke ID kanonik (`matchedUser.id`, mis. `'user-rahul'`), `isLoggedIn = true`, dan timer batas waktu 15 detik dimulai (`AppContext.tsx:384-392`).
   - **Langkah 4 (Listener Koleksi `users` & Dokumen `projectData/area1`)**:
     - Listener 1 (`onSnapshot` pada koleksi `users`, `AppContext.tsx:396-441`): Jika koleksi kosong dan bukan dari cache, klien menjalankan `setDoc` untuk ke-5 dokumen `INITIAL_USERS` (`baris 404-416`). Jika berisi dokumen, data dinormalisasi melalui `sortAndNormalizeUsers` (`baris 420-427`).
     - Listener 2 (`onSnapshot` pada dokumen `projectData/area1`, `AppContext.tsx:444-493`): Jika dokumen belum ada di server, klien menjalankan `setDoc(projectRef, INITIAL_PROJECT_DATA)` (`baris 453`). Jika dokumen sudah ada, `applyProjectData` (`baris 270-303`) mengisi seluruh 15 state operasional dan menyetel `isDataLoaded = true`.
   - **Langkah 5 (Penulisan Balik ke Firestore - `AppContext.tsx:505-578`)**:
     - Perubahan profil anggota dikirim langsung melalui `updateDoc(doc(db, 'users', targetId), firestorePatch)` di dalam `updateUser()` (`baris 238`).
     - Perubahan pada 15 seksi proyek dideteksi oleh `useEffect` (`baris 505-578`) yang membandingkan hasil `JSON.stringify` tiap seksi terhadap `lastSyncedSections.current` dan memanggil `updateDoc(doc(db, 'projectData', 'area1'), patch)` (`baris 540`).

### 3.4 Tabel Hasil Eksekusi Perintah (Tahap 2)

| Perintah / Pengujian | Status Bukti | Durasi | Status | Error / Peringatan | Ringkasan Output Penting |
| :--- | :---: | ---: | :---: | :--- | :--- |
| `npm run lint` (`tsc --noEmit`) | `[DIJALANKAN]` | `44,91 dtk` (`44910 ms`) | **LULUS** (Exit `0`) | 0 error, 0 peringatan | Kompilasi TypeScript 7.0.2 dengan `"strict": true` lulus bersih tanpa galat tipe pada seluruh berkas `src/`. |
| `npm run build` (`vite build`) | `[DIJALANKAN]` | `24,93 dtk` (`24933 ms`, Vite `9,05 dtk`) | **LULUS DENGAN PERINGATAN** (Exit `0`) | 0 error, **2 peringatan** | Transformasi 1.697 modul berhasil.<br>- `dist/index.html`: `1,51 kB` (gzip `0,68 kB`)<br>- `dist/assets/index-CIMHD0bx.css`: `53,85 kB` (gzip `10,54 kB`)<br>- `dist/assets/index-sRTw7bUh.js`: **`1.042,50 kB`** (gzip `290,20 kB`)<br>- **Peringatan 1**: `Some chunks are larger than 500 kB after minification` (`1.042,50 kB` > `500 kB`).<br>- **Peringatan 2**: `__dirname (vite.config.ts:11:27)` tidak didukung oleh `configLoader: 'native'` di Vite 8; disarankan memakai `import.meta.dirname`. |
| `npm audit` | `[DIJALANKAN]` | `18,97 dtk` (`18968 ms`) | **GAGAL** (Exit `1`) | **4 kerentanan High** (0 Critical, 0 Moderate, 0 Low) | Penyebab: `@grpc/grpc-js <=1.13.5` (GHSA-m9gg-hp2v-232j & GHSA-f596-whhp-79r4) yang ditarik oleh rantai dependensi `firebase@13.0.0` -> `@firebase/firestore-compat` -> `@firebase/firestore` -> `@grpc/grpc-js`. Sesuai aturan audit, `npm audit fix` tidak dijalankan. |
| `npx --no-install depcheck` | `[DIJALANKAN]` | `1,80 dtk` | **DIBATALKAN** (Exit `1`) | Paket `depcheck` belum terpasang | Output: `npm error npx canceled due to missing packages and no YES option: ["depcheck@1.4.7"]`. Pemeriksaan digantikan dengan pemindaian seluruh pernyataan `import` di `src/` dan `vite.config.ts` (`[DIJALANKAN]`). |
| `git log --all --stat -- ".env*" "project-data.json" "README.md"` | `[DIJALANKAN]` | `0,45 dtk` | **LULUS** (Exit `0`) | Temuan riwayat sensitif | `.env.local` tidak pernah ter-commit. Namun `project-data.json` (1.055 baris) dan `README.md` (berisi password awal & `email tim`) tercatat di riwayat commit `31ae96b2df11132ebc86c91fef6fd796b6e55b55` dan `0ffd670c359ba1e145cabe7be9c6e5e00157da3c`. |
| Pengujian Browser Visual (Viewport 390, 768, 1280, 1440, 1920 px) & Uji Login Langsung | `[BELUM DIUJI]` (Visual) / `[DIBACA DARI KODE]` | - | **BELUM DIUJI DI BROWSER** | - | **Alasan**: Lingkungan eksekusi audit ini tidak menyediakan perkakas *headless browser* (Playwright/Puppeteer tidak terpasang di `package.json`, dan aturan audit melarang `npm install` paket baru) serta proyek terhubung ke Firebase nyata. Analisis perilaku login dan tata letak responsif 390–1920 px dilakukan secara statis (`[DIBACA DARI KODE]`) dengan perhitungan piksel grid/kontainer yang akurat. |

---

## 4. Daftar Temuan Lengkap

Setiap temuan di bawah ini memuat ID, judul, tingkat keparahan, status bukti (`[DIJALANKAN]`, `[DIBACA DARI KODE]`, atau `[BELUM DIUJI]`), lokasi berkas dan baris, cuplikan bukti, dampak nyata bagi tim, langkah mereproduksi, saran perbaikan konkret, estimasi usaha (`S <1 jam`, `M <1 hari`, `L >1 hari`), serta prasyarat.

---

### 4.1 Temuan Keamanan, Autentikasi, dan Firestore Rules (`SEC-*`)

#### [SEC-01] Eskalasi Hak Akses Admin Saat Bootstrap Dokumen Kanonik `users`
- **Tingkat**: **Kritis**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `firestore.rules:80-88`, `firestore.rules:190-191`, `firestore.rules:55-59`
- **Cuplikan Bukti**:
  ```javascript
  // firestore.rules:80-88
  function isCanonicalInitialUserSeed(uid) {
    return isAreaOneTeamMember()
      && uid in ['user-rahul', 'user-ihsan', 'user-althaf', 'user-jonathan', 'user-heidi']
      && !exists(/databases/$(database)/documents/users/$(uid));
  }
  // firestore.rules:190-191
  allow create: if isValidUserData(request.resource.data)
    && (isAdmin() || isCanonicalInitialUserSeed(uid));
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  Pada operasi `create` dokumen `/users/{uid}`, fungsi `isCanonicalInitialUserSeed(uid)` mengizinkan anggota tim mana pun membuat dokumen kanonik (termasuk `/users/user-rahul`) selama dokumen tersebut belum ada, tanpa memeriksa apakah `request.resource.data.email` cocok dengan pemilik kanoniknya dan tanpa membatasi `role == 'admin'`. Karena `isAdmin()` (`firestore.rules:55-59`) memberikan hak admin kepada siapa pun yang memiliki `get(.../users/user-rahul).data.email == request.auth.token.email && role == 'admin'`, anggota biasa yang login pertama kali saat koleksi `users` kosong (atau setelah reset koleksi) dapat menyuntikkan email miliknya ke `/users/user-rahul` dan mengambil alih hak Admin PM penuh sekaligus mengunci PM asli.
- **Langkah Mereproduksi**:
  1. Pada lingkungan uji (Firebase Emulator) dengan koleksi `users` kosong, login menggunakan akun anggota biasa (`email tim` non-PM).
  2. Panggil `setDoc(doc(db, 'users', 'user-rahul'), { name: 'Anggota', nickname: 'Anggota', jobdesk: [], role: 'admin', email: '<email_anggota_biasa>' })`.
  3. Operasi `create` diizinkan oleh `isCanonicalInitialUserSeed('user-rahul')`, dan selanjutnya `isAdmin()` bernilai `true` untuk anggota biasa tersebut.
- **Saran Perbaikan Konkret**:
  1. Buat pemetaan eksplisit di `firestore.rules` antara ID kanonik (`'user-rahul'`, dst.) dengan `email tim` masing-masing saat operasi `create` (`isCanonicalInitialUserSeed`), serta batasi `request.resource.data.role == 'admin'` hanya untuk `'user-rahul'` dan `'member'` untuk 4 ID kanonik lainnya.
  2. Tambahkan validasi `.keys().hasOnly(...)` pada `isValidUserData` agar field liar tidak dapat disuntikkan saat `create`.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Deploy ulang `firestore.rules` ke Firebase setelah diperbaiki.

---

#### [SEC-02] Kegagalan `isAdmin()` untuk Admin yang Dipromosikan & Ketidaksinkronan RBAC Server pada 9 Seksi `projectData/area1`
- **Tingkat**: **Kritis**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `firestore.rules:48-65`, `firestore.rules:107-114`, `firestore.rules:162-172`, `src/context/AppContext.tsx:633-918`
- **Cuplikan Bukti**:
  ```javascript
  // firestore.rules:48-60
  function isAdmin() {
    return isAreaOneTeamMember() && (
      request.auth.token.role == 'admin'
      || (exists(/databases/$(database)/documents/users/$(request.auth.uid))
          && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      || (exists(/databases/$(database)/documents/users/user-rahul)
          && get(/databases/$(database)/documents/users/user-rahul).data.email == request.auth.token.email
          && get(/databases/$(database)/documents/users/user-rahul).data.role == 'admin')
    );
  }
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Admin hasil promosi gagal di server**: Seluruh dokumen di koleksi `users` disimpan menggunakan ID kanonik (`'user-rahul'`, `'user-ihsan'`, `'user-althaf'`, `'user-jonathan'`, `'user-heidi'`), bukan Firebase Auth UID (`request.auth.uid`). Jika PM mempromosikan anggota lain (mis. `'user-ihsan'`) menjadi `role: 'admin'` melalui `ProfileModal.tsx:665-714`, UI React menganggapnya `isPM === true`, tetapi `isAdmin()` di `firestore.rules:48-65` tetap bernilai `false` karena hanya memeriksa `/users/$(request.auth.uid)` dan `/users/user-rahul`. Akibatnya admin baru tersebut gagal menyimpan perubahan admin (`permission-denied`).
  2. **Dokumen `/config/adminMeta` tidak pernah ada**: Fungsi `isNotDemotingSoleAdmin(uid)` (`firestore.rules:107-114`) memeriksa `exists(/databases/$(database)/documents/config/adminMeta) && get(.../config/adminMeta).data.adminCount > 1`, padahal aplikasi tidak pernah membuat atau memperbarui `/config/adminMeta`.
  3. **9 seksi operasional tidak dijaga di server maupun `AppContext.tsx`**: `isAllowedProjectUpdate()` (`firestore.rules:162-172`) hanya melindungi 6 kunci (`config`, `ganttTasks`, `meetingLogs`, `standards`, `physicalChecklist`, `users`). Sementara itu, `raciRows` (edit matriks RACI), `deliverables` (bobot & progres dokumen), `weeklyPlans`, `slideDecks`, `trackerActions`, dan `logbooks` (termasuk `verifiedByLecturer`) bebas ditimpa oleh anggota biasa di Firestore; bahkan mutator `updateDeliverable`, `addWeeklyPlan`, `updateWeeklyPlan`, `deleteWeeklyPlan`, `updateRaciCell`, `addSlideDeck`, `deleteSlideDeck`, `addTrackerAction`, `deleteTrackerAction`, `deleteLogbook`, dan `addDefenseQuestion` di `src/context/AppContext.tsx:653-910` belum memiliki guard `if (!isPM) return;`.
- **Langkah Mereproduksi**:
  1. Login sebagai PM (`user-rahul`), buka `ProfileModal`, ubah jabatan anggota kedua menjadi `Admin (PM)`.
  2. Login sebagai anggota kedua tersebut dan ubah pengumuman di Homepage (`config`) -> ditolak oleh Firestore (`permission-denied`).
  3. Sebaliknya, login sebagai anggota biasa (`role: 'member'`) dan panggil `updateDoc(doc(db, 'projectData', 'area1'), { raciRows: [], deliverables: [] })` -> diizinkan oleh `firestore.rules`.
- **Saran Perbaikan Konkret**:
  1. Simpan dokumen `users` menggunakan Firebase Auth UID (`request.auth.uid`) atau simpan pemetaan `adminEmails` di `/config/teamAccess` yang diperbarui saat `updateUser` mengubah `role`, sehingga `isAdmin()` bekerja untuk semua admin tanpa bergantung pada hardcode `/users/user-rahul` maupun `/config/adminMeta`.
  2. Tambahkan `raciRows`, `deliverables`, `weeklyPlans`, `slideDecks`, `trackerActions`, dan `regulations` ke daftar yang memerlukan `isAdmin()` di `firestore.rules:162-172` (serta tambahkan guard `if (!isPM) return;` pada mutator terkait di `src/context/AppContext.tsx`).
- **Estimasi Usaha**: `M (<1 hari)`
- **Prasyarat/Ketergantungan**: Koordinasi dengan keputusan apakah anggota non-PM boleh mengedit `deliverables`/`trackerActions` atau hanya PM.

---

#### [SEC-03] Kredensial Historis di Riwayat Git & Potensi *Stored XSS* melalui Skema URL `javascript:`
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIJALANKAN]` (Riwayat Git) & `[DIBACA DARI KODE]` (Validasi URL)
- **Lokasi**:
  - Riwayat Git: commit `31ae96b2df11132ebc86c91fef6fd796b6e55b55` dan `0ffd670c359ba1e145cabe7be9c6e5e00157da3c` (`README.md`, `project-data.json`)
  - Kode: `src/components/views/HomepageView.tsx:1099`, `src/components/views/WeeklyMoMView.tsx:250, 498-504`, `src/components/views/StandardsView.tsx:119, 190, 260-266`, `src/components/views/WorkspacesView.tsx:172, 239-245`, `src/context/appContextHelpers.ts:175-238`
- **Cuplikan Bukti**:
  ```text
  # Output [DIJALANKAN]: git log --all --stat -- ".env*" "project-data.json" "README.md"
  commit 31ae96b2df11132ebc86c91fef6fd796b6e55b55
   .env.example      |   10 +
   README.md         |   49 +++
   project-data.json | 1055 +++++++++++++++++++++++++++++++++++++++++++++++++++++
  ```
  ```tsx
  // src/components/views/WorkspacesView.tsx:171-175
  <a
    href={item.fileUrl}
    target="_blank"
    rel="noopener noreferrer"
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Riwayat Git**: Walaupun `README.md` dan `project-data.json` pada *working tree* saat ini sudah dibersihkan, kedua commit Git terdahulu masih menyimpan password awal kelima akun dan `email tim`. Siapa pun yang memiliki akses klona repositori Git dapat melihatnya dengan `git show 31ae96b:README.md`.
  2. **Skema URL `javascript:` pada `<a href>`**: Seluruh 5 tautan eksternal (`latestSlideDeck.url`, `deck.url`, `reg.url`, `std.url`, `item.fileUrl`) sudah memiliki `rel="noopener noreferrer"`, namun tidak ada validasi skema `^https?://` baik saat input form (`<input type="url">` di browser menerima `javascript:alert(1)` sebagai URI valid), saat impor JSON (`parseAndValidateImportJson`), maupun saat render. Jika tersimpan URL `javascript:...` di Firestore, anggota tim yang mengklik tombol `"Buka"` akan mengeksekusi skrip di konteks domain aplikasi.
- **Langkah Mereproduksi**:
  1. Jalankan `git log -p -n 2 -- README.md` untuk memverifikasi keberadaan kredensial di riwayat commit lokal.
  2. Pada modal tambah Slide Deck (`WeeklyMoMView.tsx:498`), masukkan `javascript:alert(document.domain)` pada kolom URL tautan, simpan, lalu klik tombol `"Buka"` pada baris slide deck tersebut.
- **Saran Perbaikan Konkret**:
  1. Wajibkan seluruh anggota tim mengganti password akun Firebase Auth masing-masing dan bersihkan riwayat Git menggunakan `git filter-repo` sebelum repositori dibagikan.
  2. Buat helper `sanitizeHttpUrl(rawUrl: string): string` di `src/context/appContextHelpers.ts` yang memvalidasi `new URL(rawUrl).protocol` hanya mengizinkan `'http:'` atau `'https:'` (fallback ke `'#'`), lalu gunakan pada semua mutator URL, `parseAndValidateImportJson`, dan atribut `href`.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [SEC-04] Ketiadaan Pemeriksaan `email_verified`, Hardcode `INITIAL_USERS` di Klien, dan Fallback `isPM = true`
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `firestore.rules:12-34`, `src/context/AppContext.tsx:157-161, 360-379`, `src/components/login/LoginGateway.tsx:177-188, 251-255`
- **Cuplikan Bukti**:
  ```tsx
  // src/context/AppContext.tsx:157-161
  const currentUser =
    users.find(
      (u) => u.id === currentUserId || (Boolean(u.legacyId) && u.legacyId === currentUserId)
    ) || users[0];
  const isPM = currentUser.role === 'admin';
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Fallback `currentUser` ke `users[0]` (`admin`)**: Saat `currentUserId` kosong atau tidak ditemukan di array `users` (misalnya jika kelak dokumen di koleksi `users` memakai Firebase Auth UID asli tanpa `legacyId`), `currentUser` jatuh ke `users[0]` (`user-rahul`, yang berstatus `admin`), sehingga `isPM` bernilai `true` di antarmuka untuk pengguna yang bukan admin!
  2. **Penolakan anggota baru di klien (`AppContext.tsx:360-374`)**: Meskipun `firestore.rules:28-32` mendukung penambahan anggota tim baru melalui `/config/teamAccess.allowedEmails`, `onAuthStateChanged` di `AppContext.tsx:360` hanya mencocokkan email terhadap konstanta statis `INITIAL_USERS`. Jika email tidak ada di `INITIAL_USERS`, aplikasi langsung memanggil `signOut(firebaseAuth)`.
  3. **Belum memeriksa `email_verified` & Case-Sensitivity**: `firestore.rules:12-34` memeriksa `request.auth.token.email in [...]` secara *case-sensitive* tanpa `request.auth.token.email_verified == true`.
  4. **Enumerasi akun di `LoginGateway.tsx:177-188`**: Halaman login publik menampilkan nama lengkap, jabatan, dan mengisi otomatis `email tim` kelima anggota sebelum pengguna melakukan autentikasi. Selain itu, baris `251-255` merender kotak galat merah kosong jika `!firebaseConfigured` bernilai `true` tetapi `errorMsg` dan `authError` kosong.
- **Langkah Mereproduksi**:
  1. Tambahkan email anggota ke-6 di `/config/teamAccess.allowedEmails` dan buat akunnya di Firebase Auth.
  2. Login dengan akun ke-6 tersebut -> `onAuthStateChanged` di `AppContext.tsx:363` tidak menemukannya di `INITIAL_USERS` dan langsung me-*logout* pengguna.
- **Saran Perbaikan Konkret**:
  1. Ubah `isPM` di `src/context/AppContext.tsx:161` menjadi `Boolean(isLoggedIn && currentUserId && matchedCurrentUser && matchedCurrentUser.role === 'admin')` tanpa fallback ke `users[0]` untuk perhitungan hak akses.
  2. Pada `onAuthStateChanged`, izinkan pencocokan pengguna terhadap dokumen koleksi `users` di Firestore jika tidak ditemukan di `INITIAL_USERS`.
  3. Hapus pintasan pengisi otomatis `email tim` dari halaman publik `LoginGateway.tsx` (atau tampilkan hanya inisial tanpa membocorkan alamat email lengkap).
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [SEC-05] Ketiadaan Security Headers di `firebase.json` & Kerentanan Transitive `@grpc/grpc-js`
- **Tingkat**: **Sedang**
- **Status Bukti**: `[DIJALANKAN]` (`npm audit`) & `[DIBACA DARI KODE]` (`firebase.json:18-28`)
- **Lokasi**: `firebase.json:18-28`, `package-lock.json`
- **Cuplikan Bukti**:
  ```json
  // firebase.json:18-28
  "headers": [
    {
      "source": "/assets/**",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. `firebase.json` hanya mengatur `Cache-Control` untuk `/assets/**` dan belum menyertakan header keamanan standar (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Content-Security-Policy`) pada `"source": "**"`.
  2. `npm audit` melaporkan 4 kerentanan tingkat *High* pada `@grpc/grpc-js <=1.13.5` (GHSA-m9gg-hp2v-232j dan GHSA-f596-whhp-79r4) yang ditarik oleh SDK `firebase@13.0.0`. Catatan teknis: di browser, `@firebase/firestore` menggunakan koneksi WebChannel/HTTP, sedangkan `@grpc/grpc-js` hanya digunakan pada lingkungan Node.js, sehingga risiko eksploitasi langsung pada bundel browser (`dist/`) tergolong rendah-sedang namun tetap perlu dipantau atau di-*override* di `package.json`.
- **Langkah Mereproduksi**:
  1. Jalankan `npm audit` di terminal -> keluar dengan kode `1` (4 *high severity vulnerabilities*).
  2. Periksa `firebase.json:18-28`.
- **Saran Perbaikan Konkret**:
  1. Tambahkan blok header keamanan untuk `"source": "**"` di `firebase.json`.
  2. Tambahkan `"overrides": { "@grpc/grpc-js": "^1.13.6" }` di `package.json` saat diizinkan memperbarui lockfile.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

### 4.2 Temuan Data, Sinkronisasi Real-Time, dan Keandalan (`DATA-*`)

#### [DATA-01] Ketiadaan Debounce pada Sinkronisasi `projectData/area1` Memicu `updateDoc` di Setiap Ketikan Huruf
- **Tingkat**: **Kritis**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `src/context/AppContext.tsx:505-578`, `src/components/views/StageGateView.tsx:408, 419`, `src/components/views/HomepageView.tsx:1157-1160`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/views/StageGateView.tsx:417-422
  <input
    type="text"
    value={param.mitigation}
    onChange={(e) => updateRubricMitigation(param.id, e.target.value)}
    placeholder="Ketik langkah mitigasi konkret..."
  ```
  ```tsx
  // src/context/AppContext.tsx:525-540
  const nextSerialized = serializeSections(payload);
  ...
  void updateDoc(doc(db, 'projectData', 'area1'), patch)
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  `useEffect` sinkronisasi di `src/context/AppContext.tsx:505-578` mengeksekusi `serializeSections(payload)` (`JSON.stringify` terhadap ke-15 seksi) dan memanggil `updateDoc` ke Firestore **secara sinkron setiap kali state React berubah tanpa jeda (*debounce*)**. Di `StageGateView.tsx:408` (input angka skor rubrik) dan `baris 419` (input teks rencana mitigasi), event `onChange` langsung memanggil mutator konteks pada setiap ketikan 1 huruf. Mengetik kalimat mitigasi sepanjang 60 karakter akan memicu **60 operasi `updateDoc` berturut-turut**, **120–180 pembacaan dokumen evaluasi `firestore.rules` (`get/exists`)**, serta **60 pancaran `onSnapshot`** ke seluruh anggota tim yang sedang online. Selain menguras kuota harian Firestore gratis (20.000 write / 50.000 read per hari), pantulan snapshot yang datang terlambat dapat menyebabkan kursor input melompat atau karakter yang sedang diketik tertimpa.
- **Langkah Mereproduksi**:
  1. Buka tab **Stage-Gate**, perluas salah satu parameter rubrik, lalu ketik cepat 20 karakter pada kolom `"Rencana Mitigasi & Tindak Lanjut"`.
  2. Amati tab Network (atau log Firestore): muncul 20 permintaan tulis `Write/channel` secara beruntun untuk setiap karakter.
- **Saran Perbaikan Konkret**:
  1. Tambahkan *debounce* `400–500 ms` menggunakan `window.setTimeout` di dalam `useEffect` sinkronisasi (`src/context/AppContext.tsx:505-578`) serta flush saat `beforeunload`.
  2. Gunakan state lokal pada input teks `StageGateView.tsx:408, 419` yang baru memanggil `updateRubricScore` / `updateRubricMitigation` saat `onBlur` atau dengan *debounce* lokal.
  3. Di `HomepageView.tsx:1157-1160`, jangan panggil `updateConfig({ projectStatus: statusKey })` saat pengguna baru memilih radio/opsi di dalam modal; panggil hanya di dalam `handleSaveStatusModal` saat tombol `"Simpan Perubahan"` diklik.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [DATA-02] Risiko *Lost Update* (Timpa Array Utuh) Saat Dua Pengguna Menyimpan Seksi yang Sama Bersamaan
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `src/context/AppContext.tsx:473, 527-557`, `src/context/appContextHelpers.ts:58-66`
- **Cuplikan Bukti**:
  ```tsx
  // src/context/AppContext.tsx:536-540
  for (const key of changedKeys) {
    patch[key] = payload[key];
    lastSyncedSections.current[key] = nextSerialized[key];
  }
  void updateDoc(doc(db, 'projectData', 'area1'), patch)
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  Meskipun penulisan ke `projectData/area1` sudah menggunakan `updateDoc` hanya untuk seksi yang berubah (`changedKeys`), nilai dari setiap seksi (`tasks`, `logbooks`, `raciRows`, `trackerActions`, `defenseQuestions`, dll.) masih berupa **array JSON utuh**. Apabila Anggota A menambahkan entri `logbooks` baru pada saat yang hampir bersamaan dengan Anggota B yang juga menambahkan `logbooks`, klien kedua akan mengirim `patch.logbooks` berisi array versinya sendiri dan **menimpa (menghapus) entri milik Anggota A**. Selain itu:
  1. `computeNextTrackerCode(trackerActions)` (`appContextHelpers.ts:58-66`) menghitung kode `ACT-05` dari state lokal tanpa transaksi, sehingga dua penambahan bersamaan menghasilkan kode `ACT-05` ganda.
  2. Jika `updateDoc` gagal karena gangguan jaringan sesaat (`AppContext.tsx:544-557`), `lastSyncedSections.current[key]` di-reset ke `''`, tetapi tidak ada mekanisme *retry* otomatis, sehingga snapshot berikutnya dari pengguna lain akan langsung menimpa perubahan lokal yang gagal dikirim tadi.
- **Langkah Mereproduksi**:
  1. Buka aplikasi pada 2 tab/perangkat dengan 2 akun anggota berbeda.
  2. Matikan jaringan sementara (atau tekan tombol simpan bersamaan) saat kedua anggota menambahkan entri pada menu **Logbook**.
  3. Entri dari klien yang tulisannya sampai belakangan akan menimpa array `logbooks` dari klien pertama.
- **Saran Perbaikan Konkret**:
  1. Jangka pendek: Gunakan `runTransaction(db, ...)` pada operasi penambahan/penghapusan item koleksi bersama (`logbooks`, `tasks`, `trackerActions`) untuk membaca array terbaru dari server sebelum menyisipkan/memperbarui item berdasarkan `id`.
  2. Jangka menengah (lihat Bagian 7): Pecah array frekuensi tinggi (`logbooks`, `tasks`, `trackerActions`) menjadi subkoleksi Firestore (`projectData/area1/logbooks/{logId}`).
- **Estimasi Usaha**: `M (<1 hari)` (transaksi) / `L (>1 hari)` (migrasi subkoleksi)
- **Prasyarat/Ketergantungan**: Tidak ada untuk pendekatan `runTransaction`.

---

#### [DATA-03] Duplikasi Sumber Kebenaran `users` & Bug Deteksi `isFirestoreMode` pada `sortAndNormalizeUsers`
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `src/context/appContextHelpers.ts:104-106, 156-162`, `src/context/appContextTypes.ts:177`, `src/context/AppContext.tsx:273-288, 345-358, 615-625`
- **Cuplikan Bukti**:
  ```ts
  // src/context/appContextHelpers.ts:104-106
  const isFirestoreMode = validIncoming.some(
    (u) => Boolean(u.legacyId) || !initialById.has(u.id)
  );
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **`isFirestoreMode` selalu `false`**: Koleksi `users` di Firestore di-seed menggunakan ID kanonik `'user-rahul'`, `'user-ihsan'`, dst. (`AppContext.tsx:405`) yang sama persis dengan `initialById` dan tanpa properti `legacyId`. Akibatnya, `isFirestoreMode` di `appContextHelpers.ts:104` selalu bernilai `false`, sehingga blok `if (!isFirestoreMode)` di baris `156-162` selalu menyuntikkan ulang anggota dari `INITIAL_USERS`.
  2. **Race condition saat startup antara `projectData/area1` dan `users`**: `INITIAL_PROJECT_DATA` masih menyertakan `users: INITIAL_USERS` (`appContextTypes.ts:177`). Jika listener `projectData/area1` merespons lebih cepat daripada listener koleksi `users` (`usersCollectionActiveRef.current === false`), `applyProjectData` (`AppContext.tsx:273-288`) akan menimpa state `users` dengan `payload.users` (`INITIAL_USERS`).
  3. **Kebocoran timer & state saat `logout()`**: Fungsi `logout()` (`AppContext.tsx:615-625`) tidak memanggil `window.clearTimeout(loadTimeoutRef.current)` dan tidak mereset state data (`tasks`, `logbooks`, `activeTab`, `lastSyncedSections.current`) ke nilai awal.
- **Langkah Mereproduksi**:
  1. Periksa `src/context/appContextHelpers.ts:104-106` dengan input dokumen dari koleksi `users` yang memiliki `id: 'user-rahul'`..`'user-heidi'` tanpa `legacyId` -> `isFirestoreMode` mengevaluasi `false`.
- **Saran Perbaikan Konkret**:
  1. Hapus logika penyuntikan paksa `if (!isFirestoreMode)` di `sortAndNormalizeUsers` (`src/context/appContextHelpers.ts:156-162`) ketika snapshot berasal dari Firestore, dan hapus field `users` dari `INITIAL_PROJECT_DATA` (`src/context/appContextTypes.ts:177`) agar koleksi `/users` menjadi satu-satunya sumber kebenaran (*single source of truth*).
  2. Pada `logout()` dan cabang `!firebaseUser` di `onAuthStateChanged` (`AppContext.tsx:345-358, 615-625`), bersihkan `loadTimeoutRef.current`, hentikan kedua listener `onSnapshot`, dan reset state ke `INITIAL_*`.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

### 4.3 Temuan Fungsional & Kepatuhan Bisnis (`FUNC-*`)

#### [FUNC-01] Hitung Mundur Tender, Peringatan 24 Jam Logbook Pasca-MoM, Badge RACI Homepage, & Metrik Weekly Reviews Masih Hardcoded Statis
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**:
  - `src/components/views/HomepageView.tsx:311-314, 378, 507-518, 685, 896-898`
  - `src/components/views/LogbookView.tsx:127-137`
  - `src/data/initialData.ts:823-889, 1030-1033`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/views/HomepageView.tsx:513-516 (Hitung mundur statis)
  <span className="font-heading font-extrabold text-xl text-[#0B1B33] tabular-nums">65 hari</span>
  <span className="text-[11px] font-semibold text-[#4A5A72] tabular-nums">12 jam 30 menit</span>

  // src/components/views/LogbookView.tsx:130-132 (Peringatan 24 jam statis)
  <p className="font-semibold leading-relaxed">
    Pengingat: MoM 7 Okt belum memiliki entri logbook dalam 24 jam.
  </p>
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  Lima indikator operasional penting di dashboard ternyata tidak dihitung dari data nyata:
  1. **Hitung mundur tender (`HomepageView.tsx:507-518`)**: Selalu menampilkan `"65 hari"` dan `"12 jam 30 menit"` beserta cincin SVG statis (`strokeDashoffset="75"`), tidak dihitung terhadap `15 Des 2026 23:59 WIB` (`2026-12-15T23:59:00+07:00`).
  2. **Peringatan 24 jam Logbook pasca-MoM (`LogbookView.tsx:127-137`)**: Selalu menampilkan `"Pengingat: MoM 7 Okt belum memiliki entri logbook dalam 24 jam"` meskipun di `INITIAL_LOGBOOKS` (`initialData.ts:826, 834`) sudah ada logbook tanggal 7 dan 8 Okt 2026.
  3. **Badge ringkasan RACI di Homepage (`HomepageView.tsx:896-898`)**: Hardcoded `"5/5 Valid"`, padahal terdapat 6 baris RACI di `raciRows` dan tidak berubah walaupun ada baris RACI yang berstatus peringatan (`0A` atau `>1A`).
  4. **Metrik Weekly Reviews di Homepage (`HomepageView.tsx:378`)**: Menampilkan `{meetingLogs.length + 2}` (menambahkan angka `+ 2` secara semu).
  5. **Ketidaksinkronan data awal Logbook (`initialData.ts:823-889` vs `1031-1032`)**: `INITIAL_LOGBOOKS` memiliki 5 entri terverifikasi dari 6 entri, sedangkan `INITIAL_PHYSICAL_CHECKLIST` (`pb-3`) menulis statis `"Saat ini 6/12 entri terparaf"`.
- **Langkah Mereproduksi**:
  1. Buka **Homepage**: amati hitung mundur `"65 hari 12 jam 30 menit"` yang tidak pernah berkurang dan badge RACI `"5/5 Valid"`.
  2. Ubah salah satu baris di **Team & RACI** sehingga memiliki dua `"A"`; kembali ke **Homepage** -> badge tetap tertulis `"5/5 Valid"`.
  3. Buka **Logbook**: amati kotak kuning `"Pengingat: MoM 7 Okt..."` yang tidak pernah hilang.
- **Saran Perbaikan Konkret**:
  1. Hitung selisih waktu nyata menuju `new Date('2026-12-15T23:59:00+07:00')` menggunakan `useEffect` + interval 60 detik di `HomepageView.tsx`.
  2. Hitung status peringatan 24 jam di `LogbookView.tsx` secara dinamis dengan membandingkan tanggal `meetingLogs` terbaru terhadap tanggal entri `logbooks`.
  3. Hitung jumlah baris RACI yang valid secara dinamis (`raciRows.filter(r => r.validationStatus.startsWith('Valid')).length` / `raciRows.length`) di `HomepageView.tsx:896`.
  4. Ganti `{meetingLogs.length + 2}` di `HomepageView.tsx:378` menjadi `{meetingLogs.length}`.
- **Estimasi Usaha**: `M (<1 hari)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [FUNC-02] Jarum Speedometer Stage-Gate Statis, Tombol "Kunci Status Final" Tidak Mengunci Input, & Ambang Warna Skor Tidak Konsisten
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `src/components/views/StageGateView.tsx:54-57, 118-139, 191-196, 209-223, 325-332`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/views/StageGateView.tsx:191-196
  {/* Needle pointing to ~78% */}
  <g transform="translate(150, 140)">
    <polygon fill="#0B1B33" points="-4,4 4,-4 95,-105 90,-110" />
    <circle cx="0" cy="0" r="8" fill="#0B1B33" />
    <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
  </g>
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Jarum Gauge SVG statis (`StageGateView.tsx:191-196`)**: Poligon jarum speedometer dipaku menunjuk ke arah `~78%`, sementara angka aktual `{stageGateReadinessPercent}%` di bawahnya bernilai `47%` (dan berubah saat checklist dicentang).
  2. **Badge status kesiapan (`StageGateView.tsx:209-223`)**: Sudah menggunakan warna merah (`<70`), kuning (`70-84`), dan hijau (`>=85`), tetapi selalu merender ikon `<AlertTriangle>` (bahkan saat `>=85%`) dan hanya memiliki 2 teks label (`>= 85 ? 'READY FOR STAGE-GATE DEFENSE' : 'CONDITIONAL READY / NEED REVISION'`), sehingga skor `<70%` tetap bertuliskan `'CONDITIONAL READY'`.
  3. **Ketidaksinkronan ambang skor parameter (`StageGateView.tsx:325-332`)**: Badge skor tiap parameter rubrik memakai ambang `>= 80` (hijau) dan `>= 65` (kuning), berbeda dari aturan Stage-Gate `>= 85` dan `>= 70`.
  4. **Tombol `"Kunci Status Final"` tidak mengunci apa pun (`StageGateView.tsx:54-57, 118-139`)**: Mengklik tombol tersebut hanya mengubah boolean `config.readinessLocked`, tetapi seluruh checkbox rubrik, input skor, input mitigasi, dan checklist bundel fisik tetap dapat diubah bebas saat `config.readinessLocked === true`.
- **Langkah Mereproduksi**:
  1. Buka tab **Stage-Gate**: perhatikan angka kesiapan `47%` (merah), tetapi jarum grafik menunjuk ke zona kuning/hijau (`~78%`) dan teks badge tertulis `CONDITIONAL READY / NEED REVISION`.
  2. Klik `"Kunci Status Final"` (berubah menjadi `"Status Terkunci"`), lalu klik checkbox item rubrik -> item tetap berubah.
- **Saran Perbaikan Konkret**:
  1. Rotasikan grup jarum `<g transform={`translate(150, 140) rotate(${(stageGateReadinessPercent / 100) * 180 - 180})`}>` secara dinamis mengikuti `stageGateReadinessPercent`.
  2. Gunakan 3 label dan ikon yang sesuai (`<70`: `'NOT READY / CRITICAL GAP'`, `70-84`: `'CONDITIONAL READY / NEED REVISION'`, `>=85`: `'READY FOR STAGE-GATE DEFENSE'` dengan `CheckCircle2`) serta seragamkan ambang parameter ke `85` dan `70`.
  3. Nonaktifkan mutasi rubrik dan checklist fisik di UI serta `AppContext.tsx` ketika `config.readinessLocked === true`.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [FUNC-03] Fitur Simulasi/Palsu pada Modal "Upload Berkas Baru" Workspace, Tombol Ekspor Paket FEED, Tombol "Mode Edit" RACI, & Ikon Regulasi
- **Tingkat**: **Sedang**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**:
  - `src/components/views/WorkspacesView.tsx:269-311`
  - `src/components/views/HomepageView.tsx:992-994`
  - `src/components/views/TeamRaciView.tsx:56, 93, 266-278`
  - `src/components/views/StandardsView.tsx:98-100, 150-151`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/views/WorkspacesView.tsx:299-302
  onClick={() => {
    setShowUploadModal(false);
    alert('Tautan berkas berhasil ditambahkan ke repositori Workspace!');
  }}
  ```
  ```tsx
  // src/components/views/TeamRaciView.tsx:93
  const isClickable = isPM || isEditMode;
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Modal "Upload Berkas Baru" (`WorkspacesView.tsx:269-311`)**: Input nama berkas, kategori deliverable, dan URL menggunakan `<input>` tanpa state (`uncontrolled`), dan tombol `"Simpan Tautan"` hanya memanggil `alert(...)` tanpa menyimpan data ke `deliverables`! Anggota tim yang mengira tautan berkasnya sudah tersimpan akan kehilangan datanya.
  2. **Tombol `"Mode Edit"` RACI tidak berguna (`TeamRaciView.tsx:56, 93, 266-278`)**: Tombol toggle `"Mode Edit"` hanya ditampilkan untuk `isPM` (`baris 266`), namun di baris `56` dan `93` kondisinya adalah `isPM || isEditMode`. Karena `isPM` selalu `true` bagi PM, sel RACI selalu bisa diklik terlepas dari apakah `"Mode Edit"` aktif atau tidak.
  3. **Tombol `"Ekspor Paket FEED (.zip / PDF)"` (`HomepageView.tsx:992-994`)**: Hanya memunculkan `alert(...)`.
  4. **Tombol ikon `ExternalLink` di kartu Regulasi (`StandardsView.tsx:98-100`)**: Tidak memiliki handler `onClick` maupun tautan `<a>`, serta tombol tambah standar di baris `150-151` merender ikon `<Plus />` ditambah teks `+ Add` sehingga tampil ganda (`+ + Add`).
- **Langkah Mereproduksi**:
  1. Buka **Workspaces**, klik `"Upload Berkas Baru"`, isi formulir, lalu klik `"Simpan Tautan"` -> muncul `alert`, tetapi tidak ada berkas yang bertambah.
  2. Buka **Team & RACI** sebagai PM, jangan aktifkan `"Mode Edit"`, lalu klik sel matriks RACI -> nilai sel langsung berubah.
- **Saran Perbaikan Konkret**:
  1. Hubungkan modal `"Upload Berkas Baru"` di `WorkspacesView.tsx` ke fungsi `updateDeliverable` (atau `addDeliverable`) dengan state terkontrol dan validasi URL.
  2. Ubah kondisi klik sel di `TeamRaciView.tsx:56, 93` menjadi `const isClickable = isPM && isEditMode;` agar PM terlindung dari klik tidak sengaja saat belum mengaktifkan `"Mode Edit"`.
  3. Bungkus ikon `ExternalLink` di `StandardsView.tsx:98-100` dengan `<a href={reg.url} target="_blank" rel="noopener noreferrer">` dan hapus tanda `+` ganda pada baris `151`.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

### 4.4 Temuan UI, Desain, dan Responsivitas (`UI-*`)

#### [UI-01] Cacat Tata Letak Grid Gantt Chart 16 Minggu (`W9-W12` Turun Baris & `W13-W16` Terpotong)
- **Tingkat**: **Tinggi**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `src/components/views/ScheduleView.tsx:343-359, 408-409`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/views/ScheduleView.tsx:343-358
  <div className="grid grid-cols-12 border-b border-[#C9DCEB] bg-white text-[10px] font-bold text-[#4A5A72]">
    <div className="col-span-4 p-2.5 border-r border-[#C9DCEB] flex items-center justify-between">
      <span>Task Name / Responsible</span>
      <span className="text-[9px] text-[#9FB3C8]">16 WEEKS</span>
    </div>
    {Array.from({ length: 12 }).map((_, idx) => (
      <div key={idx} className="col-span-1 p-2 text-center ...">W{idx + 1}</div>
    ))}
  </div>
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Patah baris pada header minggu (`ScheduleView.tsx:343-358`)**: Baris sub-header menggunakan `grid-cols-12`. Kolom pertama (`Task Name / Responsible`) memakai `col-span-4`, sehingga hanya menyisakan **8 kolom** di baris pertama. Karena kode me-render 12 sel minggu (`W1`..`W12`) yang masing-masing `col-span-1`, maka `W1`–`W8` menempati kolom 5–12, sedangkan **`W9`–`W12` terlempar (wrap) ke baris kedua di bawah kolom nama tugas**!
  2. **Minggu 13–16 hilang & batang Fase 4 terjepit (`ScheduleView.tsx:408-409`)**: Header atas menjanjikan `"16 WEEKS"` (4 fase x 4 minggu), tetapi grid hanya merender 12 minggu, dan batang jadwal pada baris `408-409` dipangkas paksa dengan `Math.min(12, gt.startWeek)` dan `Math.min(12, gt.endWeek)`. Akibatnya seluruh tugas Fase 4 (`W12`–`W16` pada `INITIAL_GANTT_TASKS`, `initialData.ts:471-507`) terjepit menjadi satu kotak sempit di kolom `W12`.
- **Langkah Mereproduksi**:
  1. Buka menu **Schedule** pada layar berapa pun.
  2. Perhatikan sub-header tabel Gantt: kolom `W9`, `W10`, `W11`, `W12` jatuh ke baris baru di sisi kiri bawah `"Task Name / Responsible"`, dan tugas Fase 4 (`W12-W16`) tidak memiliki kolom `W13`–`W16`.
- **Saran Perbaikan Konkret**:
  Ubah struktur grid Gantt di `ScheduleView.tsx:321-462` menjadi grid 20 kolom (`grid-cols-[minmax(220px,4fr)_repeat(16,minmax(36px,1fr))]`), render penuh `W1` hingga `W16` (16 minggu = 4 fase x 4 minggu), dan ganti batas `Math.min(12, ...)` pada baris `408-409` menjadi `Math.min(16, ...)`.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [UI-02] Pelanggaran Aturan "Maksimal Satu Kartu Gelap per Halaman" di Team & RACI serta Duplikasi Komponen Kartu di 8 Halaman
- **Tingkat**: **Sedang**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**:
  - `src/components/views/TeamRaciView.tsx:30, 476-478`
  - `src/components/common/UserChip.tsx:137-288`
  - `index.html:17`
  - Seluruh berkas di `src/components/views/*.tsx`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/views/TeamRaciView.tsx:30 & 476
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  // Bagian belakang FlipCard (baris 476):
  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0B1B33] text-white rounded-[24px] p-5 ...">
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **>1 Kartu gelap bersamaan di `TeamRaciView.tsx`**: State `flippedCards` disimpan sebagai map boolean per user ID, sehingga pengguna dapat membalik kelima kartu anggota sekaligus dan menampilkan **5 kartu gelap (`#0B1B33`) secara bersamaan** di satu halaman.
  2. **Duplikasi pola kartu & ketidakkonsistenan `.glass-card`**: Kelas `.glass-card` (`src/index.css:83-90`) hanya dipakai di `HomepageView.tsx` (13 kali), sedangkan 7 tampilan lainnya menyalin manual string kelas `bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card` sebanyak **24 kali** (dan header halaman disalin manual 7 kali).
  3. **Kelas `dark:text-slate-*` liar di `UserChip.tsx:137-288`**: Menggunakan kelas `dark:text-slate-200` dan `dark:bg-slate-800` bawaan Tailwind yang mengikuti mode gelap OS pengguna, padahal seluruh aplikasi bertema terang (`#EAF6FD` / `#FFFFFF`), sehingga teks nama pada `UserChip` berubah menjadi putih pucat di atas kartu putih jika OS pengguna memakai Dark Mode.
  4. **Kelas tidak terdefinisi di `index.html:17`**: `text-on-surface`, `font-body-md`, dan `selection:bg-primary` pada `<body>` tidak memiliki definisi di `src/index.css`.
- **Langkah Mereproduksi**:
  1. Buka **Team & RACI**, klik kelima kartu anggota -> 5 kartu gelap `#0B1B33` tampil bersamaan.
  2. Aktifkan Dark Mode pada OS Windows/macOS -> perhatikan teks nama pada `UserChip` yang memudar.
- **Saran Perbaikan Konkret**:
  1. Ubah state `flippedCards` di `TeamRaciView.tsx:30` menjadi `const [flippedUserId, setFlippedUserId] = useState<string | null>(null)` sehingga maksimal hanya 1 kartu gelap yang terbuka pada satu waktu.
  2. Hapus seluruh awalan `dark:` dan ganti warna `slate-*` dengan variabel desain (`#0B1B33`, `#4A5A72`) di `src/components/common/UserChip.tsx`.
  3. Ekstrak komponen bersama `<PageHeaderCard>`, `<GlassCard>`, dan `<ModalShell>` di `src/components/common/`.
- **Estimasi Usaha**: `M (<1 hari)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

#### [UI-03] Potensi Terpotongnya Popover Notifikasi & Visualisasi 15 Menit pada Layar Mobile (`390px`) serta Ketiadaan Empty State
- **Tingkat**: **Sedang**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**: `src/components/layout/Header.tsx:212`, `src/components/views/HomepageView.tsx:404`, `src/components/views/WeeklyMoMView.tsx:167-174`, seluruh `src/components/views/*.tsx`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/layout/Header.tsx:212
  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-cockpit-pop ...">
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Popover notifikasi (`Header.tsx:212`)**: Memiliki lebar tetap `w-80` (`320px`) dengan posisi `right-0` pada tombol lonceng (yang berjarak `~70px` dari tepi kanan layar karena di sebelah kanan lonceng masih ada tombol profil dan padding). Pada layar `390px`, `320px + 70px = 390px` sehingga tepi kiri popover menempel atau meluber keluar dari sisi kiri layar.
  2. **Banner pengumuman (`HomepageView.tsx:404`)**: Memakai kelas `truncate` (`white-space: nowrap`) sehingga pada layar `390px` dan `768px` pengumuman penting PM terpotong menjadi `...`.
  3. **Bar alokasi waktu 15 menit (`WeeklyMoMView.tsx:167-174`)**: Memiliki tinggi tetap `h-8` (`32px`), sehingga pada layar `390px` teks `"5 menit - Diskusi & Q&A Dosen"` di kolom `w-[33.3%]` terpotong secara vertikal.
  4. **Ketiadaan *Empty State***: Ketika filter penulis di `LogbookView.tsx:194` atau filter kategori di `StageGateView.tsx:491` menghasilkan `0` item, halaman hanya menampilkan ruang kosong tanpa pesan penjelas.
- **Langkah Mereproduksi**:
  1. Kecilkan lebar jendela browser ke `390px`, klik ikon lonceng notifikasi di Header, dan buka menu **Logbook** lalu pilih anggota yang belum memiliki entri.
- **Saran Perbaikan Konkret**:
  1. Gunakan `w-[calc(100vw-2rem)] sm:w-80 right-0` pada popover notifikasi di `Header.tsx:212`.
  2. Ganti `truncate` dengan `line-clamp-2 sm:truncate` pada `HomepageView.tsx:404` dan ubah `h-8` menjadi `min-h-[32px]` pada `WeeklyMoMView.tsx:167`.
  3. Tambahkan tampilan *empty state* yang informatif saat array hasil filter kosong di setiap menu.
- **Estimasi Usaha**: `S (<1 jam)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

### 4.5 Temuan Aksesibilitas (`A11Y-*`)

#### [A11Y-01] Kegagalan Kontras Teks WCAG AA (`2,13:1`), Target Sentuh di Bawah `44x44px`, Ketiadaan `role="dialog"`, & Ketiadaan `prefers-reduced-motion`
- **Tingkat**: **Sedang**
- **Status Bukti**: `[DIBACA DARI KODE]`
- **Lokasi**:
  - Kontras: `src/components/layout/Header.tsx:264`, `src/components/views/ScheduleView.tsx:345`, `src/App.tsx:91`
  - Target sentuh `<44px` & label: `src/components/views/HomepageView.tsx:730-740, 945-957, 1133-1139, 1243-1249`, `src/components/views/ScheduleView.tsx:219-242`, `src/components/views/WeeklyMoMView.tsx:240-247, 354-361`, `src/components/views/LogbookView.tsx:263-276, 284-290`, `src/components/layout/ExportImportModal.tsx:113-118`
  - Animasi: `src/index.css:1-150`
- **Cuplikan Bukti**:
  ```tsx
  // src/components/layout/Header.tsx:264 (Kontras #9FB3C8 di atas #FFFFFF = 2.13:1)
  <span className="text-[10px] text-[#9FB3C8] block mt-1">{notif.timeAgo}</span>

  // src/components/views/HomepageView.tsx:945-956 (Ukuran tombol ikon 12x12px)
  <button onClick={() => handleOpenDeliverableModal(del)} className="text-[#4A5A72] hover:text-[#0062CC]" title="Edit Progres">
    <Pencil className="w-3 h-3" />
  </button>
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Rasio Kontras**: Token `--on-dark-muted` (`#9FB3C8`) yang dirancang untuk latar gelap (`#0B1B33`, kontras `8,45:1`) salah digunakan di atas latar putih `#FFFFFF` pada `Header.tsx:264` dan `ScheduleView.tsx:345`, menghasilkan rasio kontras **`2,13:1`** (gagal standar minimum WCAG AA `4,5:1`). Teks sekunder `#4A5A72` di atas `.glass-card` memenuhi WCAG AA (`5,2:1` hingga `6,8:1`), namun pada `footer` (`src/App.tsx:91`, `bg-white/40` di atas tepi gradien `#007BFF`) turun ke `~2,9:1`.
  2. **Target Sentuh & `aria-label`**: Terdapat lebih dari 15 tombol ikon aksi (edit, hapus, tutup modal) yang berukuran `12x12px` hingga `22x22px` tanpa `min-h-[44px] min-w-[44px]`, serta 5 tombol ikon yang sama sekali tidak memiliki `aria-label` maupun `title`.
  3. **Aksesibilitas Keyboard & Modal**: 18 dari 19 modal (seluruh modal kecuali `ProfileModal.tsx`) belum memiliki `role="dialog"`, `aria-modal="true"`, penutupan dengan tombol `Escape`, maupun *focus trap*. Selain itu, checkbox tugas (`HomepageView.tsx:543`), kartu `FlipCard` (`TeamRaciView.tsx:471`), dan item checklist (`StageGateView.tsx:363, 567`) menggunakan `<div onClick>` tanpa `role="button"` atau `tabIndex={0}`.
  4. **`prefers-reduced-motion`**: `src/index.css` belum mematikan animasi (`animate-pulse`, `animate-bounce`, rotasi 3D) ketika pengguna mengaktifkan pengurangan gerak di sistem operasi.
- **Langkah Mereproduksi**:
  1. Gunakan tombol `Tab` pada keyboard untuk mencoba mencentang tugas di **Homepage** atau membalik kartu anggota di **Team & RACI** -> elemen `<div onClick>` dilewati seluruhnya oleh fokus keyboard.
- **Saran Perbaikan Konkret**:
  1. Ganti `text-[#9FB3C8]` pada latar terang (`Header.tsx:264`, `ScheduleView.tsx:345`) menjadi `text-[#4A5A72]` (`6,89:1`).
  2. Berikan kelas `min-h-[44px] min-w-[44px] inline-flex items-center justify-center` dan `aria-label` eksplisit pada seluruh tombol ikon, serta ubah `<div onClick>` interaktif menjadi `<button type="button">`.
  3. Tambahkan aturan `@media (prefers-reduced-motion: reduce)` di `src/index.css`.
- **Estimasi Usaha**: `M (<1 hari)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

### 4.6 Temuan Kualitas Kode, Kinerja Bundel, dan Pemeliharaan (`QUAL-*`)

#### [QUAL-01] Bundel JS Tunggal `1.042,50 kB`, 7 File Berukuran >600 Baris, Dependensi Salah Kelompok, & Ketiadaan Error Boundary / Pengujian Otomatis
- **Tingkat**: **Sedang**
- **Status Bukti**: `[DIJALANKAN]` (`npm run build`) & `[DIBACA DARI KODE]`
- **Lokasi**:
  - `src/App.tsx:7-14` (impor statis seluruh view)
  - `vite.config.ts:11` (`__dirname`)
  - `package.json:13-29`
  - `src/components/views/StandardsView.tsx:9, 11, 12, 14` dan `src/context/AppContext.tsx:270, 649, 697, 934`
- **Cuplikan Bukti**:
  ```text
  # Output [DIJALANKAN]: npm run build
  dist/assets/index-sRTw7bUh.js   1,042.50 kB │ gzip: 290.20 kB
  (!) Some chunks are larger than 500 kB after minification.
  (!) Your Vite config uses features that are unsupported by `configLoader: 'native'`:
    - `__dirname` (vite.config.ts:11:27). Use `import.meta.dirname` instead
  ```
- **Uraian & Dampak Nyata bagi Tim**:
  1. **Bundel monolitik `1.042,50 kB`**: `src/App.tsx:7-14` mengimpor ke-8 komponen tampilan dan modal secara statis tanpa `React.lazy()` atau `manualChunks` untuk Firebase SDK, sehingga pengguna harus mengunduh seluruh kode 1 MB sekaligus saat membuka halaman login.
  2. **7 file berukuran >600 baris**: `HomepageView.tsx` (`1.459` baris), `AppContext.tsx` (`1.242` baris), `initialData.ts` (`1.070` baris), `ProfileModal.tsx` (`907` baris), `StageGateView.tsx` (`748` baris), `WeeklyMoMView.tsx` (`683` baris), dan `ScheduleView.tsx` (`649` baris).
  3. **Ketiadaan `ErrorBoundary` dan pengujian otomatis**: Jika satu komponen view mengalami error saat render (mis. data tak terduga dari Firestore), seluruh layar aplikasi menjadi putih kosong (*blank screen*) karena tidak ada React Error Boundary di `src/App.tsx`. Selain itu belum ada berkas tes (`Vitest`/`Playwright`) maupun workflow CI.
  4. **Kode mati & dependensi**: `autoprefixer` tidak terpakai di `devDependencies`; `vite`, `@vitejs/plugin-react`, dan `@tailwindcss/vite` diletakkan di `dependencies` alih-alih `devDependencies`; `deleteTask`, `deleteGanttTask`, dan `totalLogbooksCount` di `AppContext.tsx` serta impor `Pencil, Download, X, StandardReferenceItem` di `StandardsView.tsx` tidak pernah digunakan.
  5. **Ketidaksesuaian `README.md` (`baris 43`)**: `README.md:43` menyebutkan *"Salin isi `firestore.rules` ke tab Firestore Database -> Rules... (atau jalankan `npx firebase deploy --only firestore:rules`)"*, namun belum menjelaskan pembuatan dokumen `/config/teamAccess` maupun keharusan membuat ke-5 akun secara manual di Firebase Authentication Console karena fitur auto-signup telah dihapus.
- **Langkah Mereproduksi**:
  1. Jalankan `npm run build` dan amati ukuran `dist/assets/index-*.js` (`1.042,50 kB`) beserta peringatan `__dirname` pada `vite.config.ts:11`.
- **Saran Perbaikan Konkret**:
  1. Gunakan `React.lazy()` + `<Suspense>` untuk ke-8 view di `src/App.tsx` dan pisahkan chunk vendor (`firebase`, `react`, `lucide-react`) di `vite.config.ts`, serta ganti `__dirname` dengan `import.meta.dirname`.
  2. Tambahkan komponen `<ErrorBoundary>` yang membungkus `<main>` di `src/App.tsx`.
  3. Hapus `autoprefixer`, pindahkan paket bundler ke `devDependencies`, dan bersihkan impor/fungsi mati.
- **Estimasi Usaha**: `M (<1 hari)`
- **Prasyarat/Ketergantungan**: Tidak ada.

---

## 5. Hal yang Sudah Baik (Wajib Dipertahankan)

Agar perbaikan selanjutnya tidak merusak bagian yang sudah kokoh, berikut adalah praktik baik yang ditemukan di codebase saat ini:
1. **Autentikasi Murni Firebase Auth (`[DIBACA DARI KODE]` - `src/context/AppContext.tsx:586-613`)**: Pembuatan akun otomatis (`createUserWithEmailAndPassword`), sesi lokal palsu (`localStorage`), `BroadcastChannel`, dan middleware tulis lokal `/api/project-data` di `vite.config.ts` telah dihapus sepenuhnya; aplikasi juga secara aktif membersihkan sisa kunci `localStorage` lama (`AppContext.tsx:109-119`).
2. **TypeScript `"strict": true` Lulus Bersih Tanpa `any` (`[DIJALANKAN]` - `tsconfig.json:7`)**: Pemeriksaan `npm run lint` (`tsc --noEmit`) lulus dengan **0 error** dan **0 penggunaan tipe `any`** di seluruh direktori `src/`.
3. **Pembatasan Field Profil Sensitif pada `update` di `firestore.rules` (`[DIBACA DARI KODE]` - `firestore.rules:92-104`)**: Fungsi `isOwnerAllowedProfileUpdate(uid)` menggunakan `.affectedKeys().hasOnly(['name', 'nickname', 'avatarBg', 'avatarInitial', 'phone', 'photoURL', 'updatedAt', 'updatedBy'])` sehingga pemilik akun biasa tidak dapat menaikkan `role` dirinya sendiri melalui operasi `update`.
4. **Resolusi Referensi Pengguna Idempotent & Kompatibel Mundur (`[DIBACA DARI KODE]` - `src/utils/migrateUserRefs.ts:100-194`)**: Fungsi `resolveUserFromRef` dan `previewMigrateUserRefs` menangani pencocokan ID kanonik, `legacyId`, nama panggilan, kode inisial, hingga `raciTag` dengan aman dan idempotent, dilengkapi antarmuka pratinjau (*dry-run preview*) di `ExportImportModal.tsx:183-254`.
5. **Konsistensi Ikon Outline & Keamanan Tab Baru (`[DIBACA DARI KODE]`)**: Seluruh komponen 100% menggunakan ikon outline `lucide-react` (0 emoji di seluruh `src/`), dan kelima elemen `<a target="_blank">` telah dilengkapi `rel="noopener noreferrer"`.
6. **Modularisasi Awal `AppContext` (`[DIBACA DARI KODE]` - `src/context/appContextTypes.ts`, `src/context/appContextHelpers.ts`)**: Definisi tipe konteks, konstanta awal, serta fungsi utilitas serialisasi/validasi telah dipisahkan dari `src/context/AppContext.tsx`.

---

## 6. Kepatuhan PRD v3.2 dan Desain (Tahap 5)

> **Catatan Bukti Dokumen Referensi (`[DIJALANKAN]`)**: Berkas `docs/prd.md` dan `docs/design.md` tidak ditemukan di dalam direktori proyek maupun riwayat Git. Evaluasi di bawah ini membandingkan implementasi kode (`[DIBACA DARI KODE]`) terhadap seluruh ketentuan bisnis PRD v3.2 dan aturan sistem desain yang disyaratkan pada spesifikasi proyek.

### 6.1 Tabel Kepatuhan Fungsional Per Menu & Aturan Bisnis Inti

| Menu / Aturan Bisnis | Kebutuhan Spesifikasi (PRD v3.2) | Status | Bukti Lokasi (`file:baris`) & Keterangan |
| :--- | :--- | :---: | :--- |
| **1. Homepage (Executive Cockpit)** | Ringkasan KPI (Deliverables, Logbook, Weekly Reviews, Readiness), Banner Pengumuman PM, Status Proyek, Tugas Minggu Ini, Hitung Mundur Tender, Jadwal Asistensi Berikutnya, Ringkasan RACI, Progres Bobot Dokumen, & Pratinjau Logbook/Slide. | **Sebagian** | `src/components/views/HomepageView.tsx:1-1458`. Kartu lengkap tersedia, tetapi:<br>- Hitung mundur tender hardcoded `"65 hari 12 jam 30 menit"` (`baris 513-516`).<br>- Badge RACI hardcoded `"5/5 Valid"` (`baris 896-898`).<br>- KPI Weekly Reviews menghitung `{meetingLogs.length + 2}` (`baris 378`).<br>- Tombol `"Ekspor Paket FEED"` hanya memanggil `alert()` (`baris 992-994`). |
| **2. Schedule (Master Timeline & Weekly Plan)** | Rencana kerja mingguan (CRUD oleh PM) dan Gantt Chart 16 minggu (4 Fase FEED) dengan filter PIC. | **Menyimpang** | `src/components/views/ScheduleView.tsx:1-648`. CRUD rencana mingguan & tambah tugas Gantt ada, tetapi:<br>- Grid sub-header Gantt memakai `grid-cols-12` (`col-span-4` + 12 minggu) sehingga `W9-W12` patah ke baris baru (`baris 343-358`).<br>- Minggu `W13-W16` tidak dirender dan batang tugas dipotong `Math.min(12, ...)` (`baris 408-409`). |
| **3. Team & RACI** | Direktori 5 anggota tim dengan kartu 3D *flip* (profil depan, rincian jobdesk belakang) serta matriks RACI interaktif. | **Sebagian** | `src/components/views/TeamRaciView.tsx:1-552`. Fitur ada, namun:<br>- Kondisi klik sel `isPM \|\| isEditMode` (`baris 56, 93`) membuat tombol `"Mode Edit"` tidak berfungsi untuk PM.<br>- Semua 5 kartu dapat dibalik bersamaan (`baris 30`), melanggar batas 1 kartu gelap. |
| **4. Weekly MoM (Asistensi & Tracker)** | Visualisasi alokasi presentasi 15 menit, repositori Slide Deck, Tracker Action Items (`ACT-XX`), dan arsip MoM mingguan. | **Ada** | `src/components/views/WeeklyMoMView.tsx:1-682`. Penomoran `computeNextTrackerCode` tersedia (`appContextHelpers.ts:58-66`), namun URL slide belum divalidasi terhadap skema `javascript:` (`baris 250, 498`) dan bar 15 menit terpotong di layar `390px` (`baris 167`). |
| **5. Standards (Regulasi & Standar)** | Direktori regulasi pemerintah/pertamina dan tabel standar rekayasa (ISA, ISO, ASME, API, NFPA) dengan tambah/hapus untuk PM. | **Sebagian** | `src/components/views/StandardsView.tsx:1-290`. Tabel standar & modal tambah bekerja di memori/Firestore, tetapi ikon `ExternalLink` di pojok kartu regulasi (`baris 98-100`) tidak memiliki aksi klik dan tombol tambah menampilkan `+ + Add` (`baris 150-151`). |
| **6. Workspaces (Deliverables Repository)** | Daftar dokumen deliverable utama dengan bobot, bar progres, tautan berkas, modal edit progres, dan unggah berkas. | **Sebagian** | `src/components/views/WorkspacesView.tsx:1-314`. Modal edit progres (`baris 192-265`) memanggil `updateDeliverable`, tetapi modal `"Upload Berkas Baru"` (`baris 269-311`) memakai input tak terkontrol dan tombol simpannya hanya memunculkan `alert()`. |
| **7. Logbook (Catatan Aktivitas Individu)** | Kuota 12 entri terverifikasi, filter per anggota, tambah/hapus logbook, toggle verifikasi paraf dosen (khusus PM), & pengingat 24 jam pasca-MoM. | **Sebagian** | `src/components/views/LogbookView.tsx:1-398`. Kuota `{verifiedLogbooksCount} / 12` (`baris 72, 108`) dan toggle paraf PM (`baris 262`) terimplementasi, namun pengingat 24 jam pasca-MoM (`baris 127-137`) adalah teks statis hardcoded. |
| **8. Stage-Gate (Readiness & Defense)** | Speedometer kesiapan, 5 parameter rubrik + checklist & skor/mitigasi, matriks Q&A sidang (Koordinator vs Praktisi), checklist bundel fisik, & kunci status final. | **Sebagian** | `src/components/views/StageGateView.tsx:1-747`. Fitur tersedia, tetapi:<br>- Jarum SVG speedometer statis menunjuk ke `~78%` (`baris 191-196`).<br>- Tombol `"Kunci Status Final"` (`baris 54-57, 118-139`) tidak memblokir pengeditan apa pun.<br>- Ketikan input skor/mitigasi (`baris 408, 419`) memicu `updateDoc` tanpa debounce. |
| **9. Login Gateway & Manajemen Profil** | Gerbang login Firebase Auth untuk 5 anggota tim serta modal edit profil & manajemen jabatan/role oleh PM. | **Ada** | `src/components/login/LoginGateway.tsx:1-573`, `src/components/layout/ProfileModal.tsx:1-906`. Login menggunakan `signInWithEmailAndPassword` (`AppContext.tsx:607`); namun halaman login menampilkan pintasan email lengkap kelima anggota sebelum login (`LoginGateway.tsx:177-188`). |
| **Aturan Bisnis: RACI Tepat Satu "A" per Baris** | Setiap baris deliverable wajib memiliki tepat satu *Accountable* (`A`) dan minimal satu *Responsible* (`R`). | **Sebagian** | `src/context/AppContext.tsx:739-746`. Menghitung `aCount === 1 && rCount >= 1` dan menampilkan badge peringatan kuning di `TeamRaciView.tsx:360-375`, tetapi **tidak menolak penyimpanan** baris yang memiliki `0A` atau `>1A`. |
| **Aturan Bisnis: Kuota Logbook 12 Entri & Peringatan 24 Jam** | Target 12 entri terparaf dosen dan peringatan otomatis jika >24 jam setelah MoM belum ada logbook. | **Sebagian** | Kuota 12 entri dihitung dinamis (`AppContext.tsx:930-932`), tetapi peringatan 24 jam di `LogbookView.tsx:127-137` masih statis dan data awal `pb-3` (`initialData.ts:1031`) menulis `"6/12"` padahal hanya 5 entri yang `verifiedByLecturer: true`. |
| **Aturan Bisnis: Ambang Kesiapan Stage-Gate (`<70`, `70-84`, `>=85`)** | `<70%` Merah, `70-84%` Kuning, `>=85%` Hijau. | **Menyimpang** | `StageGateView.tsx:209-216` memakai warna `<70` merah, `70-84` kuning, `>=85` hijau pada badge utama, tetapi:<br>- Teks `<70%` masih tertulis `'CONDITIONAL READY'` (`baris 220`) dan ikon selalu `AlertTriangle` (`baris 218`).<br>- Kartu parameter rubrik (`baris 325-332`) memakai ambang berbeda (`<65` merah, `65-79` kuning, `>=80` hijau). |
| **Aturan Bisnis: Bobot Progres Dokumen** | Progres tertimbang dihitung dari bobot tiap dokumen deliverable utama (total bobot 100%). | **Ada** | `src/context/AppContext.tsx:936-945`. Menghitung rata-rata tertimbang `deliverables` yang memiliki `weight > 0` (`15% + 20% + 25% + 25% + 15% = 100%`, nilai awal `41%`). |
| **Aturan Bisnis: Hitung Mundur Tender `15 Des 2026 23:59 WIB`** | Penghitung mundur aktif menuju tenggat `15 Des 2026, 23:59 WIB`. | **Belum** | `src/data/initialData.ts:121` menyimpan string `'15 Des 2026, 23:59 WIB'`, namun `HomepageView.tsx:513-516` merender teks statis `"65 hari"` / `"12 jam 30 menit"` tanpa perhitungan waktu nyata. |
| **Aturan Bisnis: Hak Akses PM vs Anggota** | PM (`admin`) mengelola konfigurasi, jadwal, RACI, standar, MoM, verifikasi logbook, dan checklist fisik; anggota mengisi tugas, logbook pribadi, dan respon sidang. | **Menyimpang** | Di tampilan UI sudah dipisahkan dengan `isPM`, tetapi di `AppContext.tsx` (11 mutator tanpa guard `isPM`) dan di `firestore.rules:162-172` (9 seksi tanpa guard `isAdmin()`) anggota biasa masih dapat menimpa data PM. |

### 6.2 Tabel Kepatuhan Sistem Desain & Konsistensi Antarmuka

| Aspek Desain | Ketentuan Sistem Desain | Status | Bukti Lokasi (`file:baris`) & Penyimpangan |
| :--- | :--- | :---: | :--- |
| **Token Warna (`src/index.css`)** | Menggunakan variabel warna terpusat (`--ink: #0B1B33`, `--ink-muted: #4A5A72`, `--primary: #0062CC`, token semantik status). | **Sebagian** | `src/index.css:4-38` mendefinisikan 31 variabel CSS, namun komponen tampilan menulis ulang kode hex arbitrer Tailwind (`text-[#0B1B33]`, dll.). `UserChip.tsx:137-288` masih memakai `text-slate-* dark:text-slate-*`. |
| **Radius & Bayangan Kartu** | Kartu utama `border-radius: 28px`, bayangan `.shadow-cockpit-card` dan `.shadow-cockpit-pop`. | **Sebagian** | `rounded-[28px]` disalin manual **47 kali** di 12 berkas; `.glass-card` (`src/index.css:83-90`) hanya dipakai **13 kali** di `HomepageView.tsx`, sedangkan 7 halaman lain menyalin manual `bg-white/[0.88] ... rounded-[28px]` sebanyak **24 kali**. |
| **Tipografi & `tabular-nums`** | Judul memakai `Plus Jakarta Sans`, teks isi memakai `Inter`, dan angka metrik memakai `tabular-nums`. | **Sebagian** | Font dimuat di `index.html:15` dan diterapkan di `src/index.css:40-51`. Namun `tabular-nums` belum dipasang pada angka dinamis di `Header.tsx:205`, `HomepageView.tsx:1426`, `WorkspacesView.tsx:208`, `LogbookView.tsx:151`, dan `StageGateView.tsx:281`. |
| **Ikon (Hanya Outline, Tanpa Emoji)** | Seluruh ikon wajib memakai ikon garis (*outline*) tanpa karakter emoji di UI. | **Ada** | **0 emoji** ditemukan di seluruh `src/`. Seluruh ikon menggunakan `lucide-react`. |
| **Badge Status (Teks + Ikon, Bukan Warna Saja)** | Penanda status tidak boleh hanya mengandalkan warna; wajib menyertakan teks dan ikon. | **Sebagian** | Sebagian besar badge sudah memiliki ikon, namun terdapat **9 lokasi badge** yang hanya memakai warna + teks tanpa ikon (`HomepageView.tsx:311, 689, 896, 970`, `WeeklyMoMView.tsx:274, 424`, `StageGateView.tsx:324, 384, 590`). |
| **Maksimal Satu Kartu Gelap (`#0B1B33`) per Halaman** | Setiap halaman maksimal memiliki 1 kartu berlatar gelap `#0B1B33` sebagai jangkar visual. | **Menyimpang di 1 Halaman** | `HomepageView.tsx:527` patuh (1 kartu gelap). Halaman lain memiliki 0 kartu gelap, kecuali `TeamRaciView.tsx:476` yang dapat menampilkan hingga **5 kartu gelap sekaligus** saat semua `FlipCard` dibalik. |
| **Header & Footer Konsisten di Semua Halaman** | Header navigasi atas dan footer informasi proyek tampil konsisten di seluruh tab pasca-login. | **Ada** | `src/App.tsx:73-106` merender `<Header />` dan `<footer>` secara terpusat untuk ke-8 tab utama. |

---

## 7. Analisis Arsitektur dan Skalabilitas

### 7.1 Evaluasi Model Dokumen Tunggal (`projectData/area1`)
Saat ini seluruh 15 koleksi operasional (`config`, `tasks`, `deliverables`, `weeklyPlans`, `ganttTasks`, `raciRows`, `slideDecks`, `trackerActions`, `meetingLogs`, `regulations`, `standards`, `logbooks`, `rubricParameters`, `defenseQuestions`, `physicalChecklist`, dan `notifications`) disimpan sebagai array di dalam **satu dokumen Firestore tunggal `projectData/area1`**.

**Kesimpulan Arsitektur**: Model satu dokumen memudahkan prototipe awal karena cukup memasang 1 listener `onSnapshot`, tetapi memiliki **tiga kelemahan struktural serius** saat digunakan secara kolaboratif:
1. **Granularitas Penguncian & Konflik Tulis (*Write Contention*)**: Firestore mengunci dan menimpa field tingkat atas (`logbooks`, `tasks`). Dua anggota tidak dapat menambahkan item ke array yang sama secara konkuren tanpa risiko saling menimpa (*lost update*), dan Firestore membatasi laju tulis berkelanjutan maksimum ~1 tulis/detik pada satu dokumen yang sama.
2. **Keterbatasan Aturan Keamanan Per Baris (*Row-Level Security*)**: Di dalam array JSON, `firestore.rules` tidak dapat memeriksa kepemilikan per elemen array secara praktis (mis. mengizinkan anggota hanya mengedit/menghapus entri `logbooks` miliknya sendiri tanpa menyentuh entri anggota lain, atau menjaga field `verifiedByLecturer` agar hanya bisa diubah oleh PM).
3. **Pemborosan Bandwidth Snapshot**: Setiap kali 1 huruf atau 1 tugas berubah pada `projectData/area1`, Firestore mengirimkan ulang **seluruh dokumen (~28 KB–150 KB)** kepada ke-5 klien yang sedang membuka aplikasi.

### 7.2 Proyeksi Ukuran Dokumen (Batas 1 MiB) dan Biaya Firestore

| Komponen Data | Jumlah Awal (`initialData.ts`) | Ukuran Awal (Estimasi Byte) | Proyeksi Akhir Semester (16 Minggu, 5 Anggota) | Proyeksi Ukuran Akhir Semester |
| :--- | ---: | ---: | ---: | ---: |
| `config` + `deliverables` + `raciRows` + `physicalChecklist` | 1 + 6 + 6 + 4 item | ~4,8 KB | Statis (~17 item) | ~5,5 KB |
| `ganttTasks` + `weeklyPlans` | 14 + 4 item | ~4,2 KB | ~30 Gantt + ~20 Weekly Plan | ~10,0 KB |
| `standards` + `regulations` | 6 + 3 item | ~2,6 KB | ~25 standar + 5 regulasi | ~7,5 KB |
| `rubricParameters` + `defenseQuestions` | 5 (15 sub) + 4 item | ~6,5 KB | 5 (20 sub) + ~40 Q&A sidang | ~28,0 KB |
| `slideDecks` + `trackerActions` + `meetingLogs` | 3 + 4 + 2 item | ~4,1 KB | ~16 deck + ~80 action + 16 MoM | ~38,0 KB |
| `tasks` + `logbooks` + `notifications` | 5 + 6 + 3 item | ~5,2 KB | ~150 tugas + ~120 logbook + ~60 notif | ~95,0 KB |
| **TOTAL DOKUMEN `projectData/area1`** | **66 item** | **~27,4 KB (2,6% dari 1 MiB)** | **~560 item** | **~184,0 KB (~18% dari 1 MiB)** |

- **Evaluasi Batas 1 MiB (`1.048.576 byte`)**: Untuk 1 tim (5 anggota) selama 1 semester (16 minggu) yang hanya menyimpan tautan URL (tanpa menyimpan gambar Base64 di dalam dokumen), ukuran dokumen diproyeksikan mencapai **~184 KB** (masih di bawah batas 1 MiB). Namun, **jika ada anggota yang mengunggah foto profil Base64 (`data:image/...`) atau menempelkan teks panjang berulang kali**, batas 1 MiB dapat terlampaui dengan cepat dan melumpuhkan seluruh aplikasi.
- **Evaluasi Biaya Baca/Tulis Harian (Kuota Spark Gratis: 50.000 Read / 20.000 Write per hari)**:
  - **Kondisi Sekarang (Tanpa Debounce)**: Jika 1 anggota mengetik 500 karakter di kolom mitigasi Stage-Gate, terjadi **500 Write** + **1.500 Read** (dari `get()/exists()` pada `firestore.rules`) + **2.500 Read** (5 klien menerima snapshot) = **4.000 Read & 500 Write hanya dari mengetik beberapa kalimat**!
  - **Setelah Debounce (500 ms) + Optimasi Rules**: Aktivitas normal 5 anggota selama 1 hari kerja (~100 perubahan nyata) hanya memakan **~100 Write** dan **~700 Read/hari** (<2% dari kuota gratis Firestore).

### 7.3 Rancangan Koleksi yang Disarankan & Langkah Migrasi Bertahap
Untuk menghilangkan risiko *lost update* dan menegakkan keamanan per baris (*row-level security*), arsitektur Firestore disarankan dibagi menjadi:
1. **`/config/teamAccess`**: `{ allowedEmails: string[], adminEmails: string[] }` (1 dokumen untuk pemeriksaan `isAreaOneTeamMember()` dan `isAdmin()` secara konsisten).
2. **`/users/{canonicalUid}`**: Dokumen profil 5 anggota tim (1 dokumen per anggota).
3. **`/projectData/area1`**: Menyimpan data konfigurasi dan matriks yang jarang berubah serta dikelola terpusat oleh PM (`config`, `deliverables`, `weeklyPlans`, `ganttTasks`, `raciRows`, `regulations`, `standards`, `rubricParameters`, `physicalChecklist`).
4. **Subkoleksi Kolaboratif di bawah `/projectData/area1/`** (untuk entitas yang sering ditambah/diubah secara paralel oleh seluruh anggota):
   - `/projectData/area1/tasks/{taskId}`
   - `/projectData/area1/logbooks/{logbookId}` (aturan `firestore.rules`: anggota boleh `create` dengan `authorId == currentCanonicalId`, hanya pemilik/PM yang boleh `update/delete`, dan hanya `isAdmin()` yang boleh mengubah `verifiedByLecturer`)
   - `/projectData/area1/trackerActions/{actionId}`
   - `/projectData/area1/meetingLogs/{momId}` & `/projectData/area1/slideDecks/{deckId}`
   - `/projectData/area1/defenseQuestions/{questionId}`

**Langkah Migrasi Bertahap Tanpa Downtime**:
- **Tahap M1 (Segera - Tanpa Mengubah Struktur Koleksi)**: Pasang *debounce* 500 ms pada `useEffect` sinkronisasi di `AppContext.tsx` dan gunakan `arrayUnion` / `runTransaction` untuk penambahan `logbooks`, `tasks`, dan `trackerActions`.
- **Tahap M2 (Dual-Read / Migrasi Subkoleksi `logbooks` & `tasks`)**: Buat skrip migrasi satu klik di `ExportImportModal` (khusus PM) yang menyalin isi array `projectData/area1.logbooks` dan `tasks` ke subkoleksi `/projectData/area1/logbooks/{id}` dan `/projectData/area1/tasks/{id}`, lalu arahkan mutator `addLogbook`/`toggleTask` ke dokumen subkoleksi masing-masing.
- **Tahap M3 (Pembersihan Field Legacy)**: Hapus field array lama dari dokumen induk setelah subkoleksi terverifikasi stabil.

---

## 8. Rekomendasi Bertingkat (A, B, dan C)

### Kategori (A): Perbaikan Segera Sebelum Dipakai Tim (Wajib Diselesaikan Sebelum Produksi)

| Urutan | Kode & Rekomendasi | Manfaat | Risiko Bila Ditunda / Risiko Perubahan |
| :---: | :--- | :--- | :--- |
| **A-1** | **Perketat `firestore.rules` (Bootstrap `users`, `isAdmin()`, & Proteksi Seksi PM)** (`SEC-01`, `SEC-02`) | Menutup celah pengambilalihan akun Admin PM saat seed awal, memastikan admin hasil promosi diakui oleh server, dan mencegah anggota biasa menimpa `raciRows`, `deliverables`, `weeklyPlans`, `slideDecks`, serta `trackerActions`. | **Risiko ditunda**: Anggota biasa dapat mengambil alih `user-rahul` atau menghapus matriks RACI/Deliverable.<br>**Risiko perubahan**: Rendah; perlu memastikan akun anggota yang memang mengedit bagian bersama (seperti `tasks`, `logbooks`, `defenseQuestions`) tetap diizinkan. |
| **A-2** | **Pasang Debounce Sinkronisasi (`400 ms`) & State Input Lokal di `StageGateView` & `HomepageView`** (`DATA-01`) | Menghentikan banjir `updateDoc` per ketikan karakter, menghemat >90% kuota baca/tulis Firestore, dan mencegah lompatan kursor saat mengetik rencana mitigasi. | **Risiko ditunda**: Kuota harian Firestore cepat habis dan input teks tersendat.<br>**Risiko perubahan**: Sangat rendah jika dilengkapi *flush* saat pengguna menutup tab (`beforeunload`). |
| **A-3** | **Validasi Skema URL (`https?://`) & Perbaikan Fallback `isPM` / `sortAndNormalizeUsers`** (`SEC-03`, `SEC-04`, `DATA-03`) | Mencegah injeksi tautan `javascript:` (*Stored XSS*) pada Slide Deck, Deliverable, dan Standar; mencegah pengguna yang belum cocok UID-nya mendapat status `isPM = true`; serta membersihkan timer/state saat `logout()`. | **Risiko ditunda**: Celah XSS tersimpan dan kebocoran tampilan tombol PM.<br>**Risiko perubahan**: Sangat rendah. |
| **A-4** | **Perbaiki Grid Gantt 16 Minggu di `ScheduleView.tsx` & Simpan Nyata pada Modal Upload `WorkspacesView.tsx`** (`UI-01`, `FUNC-03`) | Memastikan kolom `W9–W16` tampil utuh satu baris tanpa patah dan memastikan tautan berkas yang diinput anggota benar-benar tersimpan ke Firestore (bukan sekadar `alert()`). | **Risiko ditunda**: Jadwal Fase 3–4 tidak terbaca dan anggota kehilangan tautan berkas yang mereka unggah.<br>**Risiko perubahan**: Sangat rendah. |
| **A-5** | **Rotasi Password Akun Firebase & Pembersihan Riwayat Git (`git filter-repo`)** (`SEC-03`) | Memastikan password awal yang pernah tercatat di commit `31ae96b` dan `0ffd670` tidak dapat dipakai lagi oleh pihak luar. | **Risiko ditunda**: Kebocoran akun jika repositori Git diakses pihak ketiga.<br>**Risiko perubahan**: `git filter-repo` menulis ulang SHA commit sehingga anggota tim perlu melakukan `git clone` ulang. |

---

### Kategori (B): Perbaikan Jangka Pendek (1–2 Minggu)

| Urutan | Kode & Rekomendasi | Manfaat | Risiko Bila Ditunda / Risiko Perubahan |
| :---: | :--- | :--- | :--- |
| **B-1** | **Transaksi Atomik (`runTransaction`) untuk Penambahan/Penghapusan Item Koleksi Bersama** (`DATA-02`) | Menghilangkan risiko *lost update* ketika dua anggota menambah `logbooks`, mencentang `tasks`, atau membuat `trackerActions` (`ACT-XX`) pada waktu bersamaan. | **Risiko ditunda**: Entri logbook anggota pertama dapat tertimpa oleh anggota kedua.<br>**Risiko perubahan**: Sedang; perlu menguji alur mutasi asinkron. |
| **B-2** | **Aktifkan Perhitungan Dinamis Indikator Operasional (`HomepageView`, `LogbookView`, `StageGateView`)** (`FUNC-01`, `FUNC-02`) | Menghidupkan hitung mundur tender `15 Des 2026 23:59 WIB`, pengingat 24 jam pasca-MoM, badge validasi RACI, rotasi jarum speedometer Stage-Gate, dan penguncian input saat `readinessLocked === true`. | **Risiko ditunda**: Tim salah mengambil keputusan karena melihat angka statis (`65 hari`, jarum `78%`, RACI `5/5 Valid`).<br>**Risiko perubahan**: Rendah. |
| **B-3** | **Perbaikan Konsistensi Desain (`TeamRaciView` 1 Kartu Gelap, Hapus `dark:*` di `UserChip`, & Ekstraksi Komponen Kartu/Modal Bersama)** (`UI-02`, `UI-03`) | Mematuhi aturan maksimal 1 kartu gelap per halaman, menjaga keterbacaan di OS Dark Mode, memperbaiki tampilan mobile `390px`, dan memangkas duplikasi kode di 8 halaman. | **Risiko ditunda**: Tampilan rusak pada OS Dark Mode dan layar ponsel kecil.<br>**Risiko perubahan**: Rendah. |
| **B-4** | **Perbaikan Aksesibilitas WCAG AA (Kontras `#9FB3C8`, Target Sentuh `44x44px`, `aria-label`, `role="dialog"`, & `prefers-reduced-motion`)** (`A11Y-01`) | Memastikan seluruh teks terbaca jelas (`>=4,5:1`), tombol kecil mudah diklik di layar sentuh, modal dapat ditutup dengan `Escape`, dan pengguna sensitif gerak terlindungi. | **Risiko ditunda**: Kesulitan interaksi pada perangkat layar sentuh dan pengguna keyboard.<br>**Risiko perubahan**: Sangat rendah. |
| **B-5** | **Code-Splitting (`React.lazy`), Pembersihan Dependensi (`package.json`), Header Keamanan (`firebase.json`), & `<ErrorBoundary>`** (`QUAL-01`, `SEC-05`) | Menurunkan ukuran bundel awal dari `1.042,50 kB` menjadi `<350 kB`, menghilangkan peringatan Vite 8 (`__dirname`), menambahkan CSP/Security Headers, dan mencegah *blank screen* saat terjadi error komponen. | **Risiko ditunda**: Waktu muat awal lambat di jaringan seluler.<br>**Risiko perubahan**: Sangat rendah. |

---

### Kategori (C): Upgrade Fitur dan Kualitas Jangka Menengah-Panjang

| Urutan | Inisiatif Upgrade | Manfaat bagi Tim | Risiko & Tantangan Implementasi |
| :---: | :--- | :--- | :--- |
| **C-1** | **Reset Password (`sendPasswordResetEmail`) & Verifikasi Email (`email_verified`)** | Anggota yang lupa password dapat melakukan pemulihan mandiri di `LoginGateway.tsx`, dan `firestore.rules` dapat mewajibkan `request.auth.token.email_verified == true`. | Perlu memastikan kelima akun anggota telah mengklik tautan verifikasi email sebelum aturan `email_verified` diaktifkan di `firestore.rules` agar tidak terkunci. |
| **C-2** | **Firebase Emulator Suite & Pengujian Otomatis Security Rules + Vitest** | Menguji seluruh skenario `firestore.rules` (termasuk eskalasi role, batas field `hasOnly`, dan proteksi seksi PM) serta fungsi kalkulasi (`overallWeightedProgress`, `migrateUserRefs`) secara lokal tanpa menyentuh data produksi. | Membutuhkan instalasi paket dev (`vitest`, `@firebase/rules-unit-testing`) dan Java Runtime untuk emulator Firestore lokal. |
| **C-3** | **Migrasi Array Frekuensi Tinggi ke Subkoleksi Firestore + Log Audit Perubahan (`auditLogs`)** | Menghilangkan sepenuhnya batas 1 MiB dan konflik tulis konkuren pada `logbooks`, `tasks`, serta `trackerActions`, ditambah rekam jejak siapa mengubah apa dan kapan. | Memerlukan skrip migrasi satu kali dari dokumen `projectData/area1` ke subkoleksi serta penyesuaian listener di `AppContext`. |
| **C-4** | **Firebase App Check (reCAPTCHA v3 / Enterprise)** | Melindungi kuota Firestore dari penyalahgunaan API key publik oleh bot atau skrip di luar domain resmi aplikasi. | Memerlukan pendaftaran situs reCAPTCHA v3 di Google Cloud & Firebase Console; jika token gagal dimuat pada jaringan terblokir, permintaan Firestore bisa ditolak. |
| **C-5** | **Mode Offline Terkelola (`persistentLocalCache`) & Indikator Status Jaringan** | Memungkinkan anggota tetap membaca jadwal, standar, dan draf logbook saat koneksi internet kampus terputus, lalu menyinkronkan otomatis saat kembali online. | Hanya aman diaktifkan setelah subkoleksi atau transaksi per-item (B-1 / C-3) diterapkan, agar cache offline lama tidak menimpa array dokumen tunggal saat kembali online. |
| **C-6** | **Ekspor Laporan PDF / Cetak Bundel Sidang Stage-Gate Nyata** | Menggantikan tombol simulasi `"Ekspor Paket FEED"` (`HomepageView.tsx:992`) dengan cetak PDF/dokumen ringkasan kesiapan Stage-Gate, matriks RACI, dan daftar logbook terparaf dosen. | Membutuhkan stylesheet khusus `@media print` atau pustaka pembuat PDF yang di-load secara *lazy* (`import()`) agar tidak membebani bundel utama. |
| **C-7** | **Pengujian End-to-End (Playwright) & Pipeline CI (GitHub Actions)** | Menjalankan `npm run lint`, `npm run build`, `vitest`, dan uji tata letak responsif (`390px–1920px`) secara otomatis pada setiap `git push` / *Pull Request*. | Memerlukan konfigurasi `.github/workflows/ci.yml` dan variabel lingkungan dummy untuk proses build di server CI. |

---

## 9. Pertanyaan Terbuka untuk Pemilik Proyek

Hal-hal berikut tidak dapat disimpulkan hanya dari kode sumber dan memerlukan konfirmasi dari pemilik proyek / Project Manager:

1. **Status Rules & Isi Koleksi di Firebase Console Saat Ini**:
   - Apakah berkas `firestore.rules` terbaru di repositori sudah di-*publish* ke Firebase Console produksi, dan apakah dokumen `/users/user-rahul` s.d. `/users/user-heidi` serta `/config/teamAccess` sudah terbentuk di database produksi?
2. **Kebijakan Rotasi Password Pasca-Commit Git**:
   - Mengingat commit Git terdahulu (`31ae96b`) pernah mencatat password awal di `README.md`, apakah kelima anggota tim sudah mengganti password mereka di Firebase Authentication, dan apakah repositori ini pernah di-*push* ke remote publik/privat (GitHub/GitLab)?
3. **Matriks Hak Akses Operasional (PM vs Anggota Biasa)**:
   - Untuk seksi `deliverables` (update progres/tautan berkas), `weeklyPlans`, `slideDecks`, dan `trackerActions`: apakah memang **hanya PM (`admin`)** yang boleh menambah/mengubah (sebagaimana tampilan tombol UI saat ini), ataukah anggota biasa yang menjadi PIC deliverable/presentasi seharusnya diizinkan memperbarui progres dan mengunggah tautan slide mereka sendiri?
4. **Aturan Bisnis RACI (Peringatan vs Blokir Keras)**:
   - Ketika PM mengubah matriks RACI sehingga suatu baris tidak memiliki tepat satu `"A"` (mis. `0A` atau `2A`), apakah sistem cukup menampilkan badge peringatan kuning seperti sekarang, atau harus memblokir penyimpanan perubahan tersebut?
5. **Penyimpanan Berkas pada Menu Workspaces**:
   - Untuk fitur `"Upload Berkas Baru"` di menu **Workspaces**, apakah tim hanya ingin menyimpan **tautan eksternal** (Google Drive / OneDrive / SharePoint) ke dalam item deliverable, atau berencana mengaktifkan **Firebase Cloud Storage** untuk mengunggah file PDF/DWG secara langsung?
6. **Penambahan Anggota atau Dosen Pembimbing (Viewer)**:
   - Apakah aplikasi ini hanya akan digunakan oleh tepat 5 anggota inti hingga akhir semester, ataukah diperlukan akun ke-6 dengan peran khusus **`viewer` (Read-Only)** bagi Dosen Pembimbing / Asisten untuk memeriksa dan memaraf Logbook secara langsung?

---

## 10. Backlog Siap-Kerja (Prompt Agen Berurutan untuk Rekomendasi A & B)

Di bawah ini adalah daftar tugas berurutan berukuran kecil yang mengubah seluruh rekomendasi **Kategori (A)** dan **Kategori (B)** menjadi prompt siap-pakai yang dapat langsung diberikan satu per satu kepada agen pengembang:

---

### Tugas 1 (A-1): Perkeras `firestore.rules` & Sinkronkan Guard RBAC di `AppContext.tsx`
> **Prompt ke Agen**:
> "Perbaiki celah eskalasi admin dan ketidaksinkronan RBAC pada `firestore.rules` serta `src/context/AppContext.tsx`:
> 1. **File yang disentuh**: `firestore.rules`, `src/context/AppContext.tsx`, `src/context/appContextTypes.ts`.
> 2. **Perubahan**:
>    - Di `firestore.rules`, perbarui `isCanonicalInitialUserSeed(uid)` agar mencocokkan `uid` terhadap `request.auth.token.email` (atau mewajibkan `role == 'member'` untuk selain `user-rahul`, dan untuk `user-rahul` mewajibkan email sesuai email PM), serta tambahkan validasi `.keys().hasOnly(...)` pada `isValidUserData`.
>    - Perbaiki `isAdmin()` dan `isNotDemotingSoleAdmin(uid)` di `firestore.rules` agar memeriksa dokumen `/config/teamAccess` (`adminEmails`) atau ke-5 dokumen kanonik `/users/user-*` berdasarkan kecocokan `email == request.auth.token.email && role == 'admin'`, tanpa bergantung pada dokumen `/config/adminMeta` yang tidak ada.
>    - Di `isAllowedProjectUpdate()` (`firestore.rules:162-172`), tambahkan `'raciRows'`, `'weeklyPlans'`, dan `'regulations'` ke daftar seksi yang wajib `isAdmin()`, serta tambahkan guard `if (!isPM) return;` yang konsisten pada mutator khusus PM di `src/context/AppContext.tsx` (`addWeeklyPlan`, `updateWeeklyPlan`, `deleteWeeklyPlan`, `updateRaciCell`, `addDefenseQuestion`) dan guard kepemilikan/PM pada `deleteLogbook` serta `toggleTask`.
> 3. **Batasan**: Jangan mengubah struktur komponen UI atau menambahkan dependensi baru. Jangan menuliskan email asli secara terbuka di luar daftar default yang sudah ada.
> 4. **Kriteria selesai**: `npm run lint` dan `npm run build` lulus (exit 0), pemilik non-admin tidak dapat membuat `/users/user-rahul` dengan email sendiri, dan seluruh mutator PM di `AppContext.tsx` sinkron dengan `firestore.rules`."

---

### Tugas 2 (A-2): Tambahkan Debounce Sinkronisasi `400 ms` & Perbaiki Input `StageGateView` / `HomepageView`
> **Prompt ke Agen**:
> "Tambahkan mekanisme debounce pada penulisan Firestore dan perbaiki pemicu tulis per ketikan:
> 1. **File yang disentuh**: `src/context/AppContext.tsx`, `src/components/views/StageGateView.tsx`, `src/components/views/HomepageView.tsx`.
> 2. **Perubahan**:
>    - Di `src/context/AppContext.tsx` (`useEffect` sinkronisasi baris 505-578), bungkus pemanggilan `serializeSections` dan `updateDoc(doc(db, 'projectData', 'area1'), patch)` dengan *debounce* `400 ms` (`window.setTimeout`), serta pastikan perubahan tertunda tetap dikirim saat `beforeunload` atau sebelum `logout()`.
>    - Di `src/components/views/StageGateView.tsx` (baris 404-423), gunakan state draft lokal atau *debounce* untuk input skor rubrik dan teks rencana mitigasi agar tidak memicu mutasi konteks pada setiap ketikan 1 huruf.
>    - Di `src/components/views/HomepageView.tsx` (baris 1157-1160), hapus pemanggilan `updateConfig({ projectStatus: statusKey })` pada saat klik opsi di dalam modal; simpan perubahan status hanya ketika tombol `'Simpan Perubahan'` (`handleSaveStatusModal`) ditekan.
> 3. **Batasan**: Pertahankan pengiriman per-seksi (`updateDoc`) dan penanganan `syncError`.
> 4. **Kriteria selesai**: Mengetik kalimat di kolom mitigasi `StageGateView` hanya memicu 1 kali `updateDoc` setelah berhenti mengetik 400 ms; `npm run lint` dan `npm run build` lulus."

---

### Tugas 3 (A-3): Sanitasi Skema URL (`https?://`), Perbaiki Fallback `isPM`, & Pembersihan `logout()`
> **Prompt ke Agen**:
> "Cegah potensi Stored XSS melalui URL, perbaiki fallback `isPM` serta `sortAndNormalizeUsers`, dan bersihkan sesi saat logout:
> 1. **File yang disentuh**: `src/context/appContextHelpers.ts`, `src/context/appContextTypes.ts`, `src/context/AppContext.tsx`, `src/components/login/LoginGateway.tsx`, `src/components/views/HomepageView.tsx`, `src/components/views/WeeklyMoMView.tsx`, `src/components/views/StandardsView.tsx`, `src/components/views/WorkspacesView.tsx`.
> 2. **Perubahan**:
>    - Tambahkan fungsi `sanitizeExternalUrl(url: string): string` di `src/context/appContextHelpers.ts` yang hanya mengizinkan protokol `http:` dan `https:` (selain itu kembalikan `''` atau `'#'`), lalu terapkan pada `addSlideDeck`, `updateDeliverable`, `addStandard`, `parseAndValidateImportJson`, dan seluruh atribut `<a href={...}>` eksternal.
>    - Di `src/context/AppContext.tsx:157-161`, pastikan `isPM` bernilai `false` jika `currentUserId` kosong atau tidak ditemukan di `users` (jangan fallback ke `users[0]` untuk penentuan `isPM`).
>    - Di `src/context/appContextHelpers.ts:156-162`, perbaiki `sortAndNormalizeUsers` agar tidak menyuntikkan ulang item `INITIAL_USERS` yang sudah ada di koleksi Firestore, dan hapus `users` dari `INITIAL_PROJECT_DATA` di `src/context/appContextTypes.ts:177`.
>    - Di `src/context/AppContext.tsx:345-358, 615-625`, bersihkan `loadTimeoutRef.current`, hentikan listener `onSnapshot`, dan reset state saat `logout()`.
>    - Di `src/components/login/LoginGateway.tsx:251-255`, tampilkan pesan teks yang jelas saat `!firebaseConfigured` bernilai `true`.
> 3. **Batasan**: Jangan merusak kompatibilitas `resolveUserFromRef`.
> 4. **Kriteria selesai**: Input URL `javascript:alert(1)` ditolak/disanitasi menjadi `'#'`, `isPM` bernilai `false` saat belum login, serta `npm run lint` dan `npm run build` lulus."

---

### Tugas 4 (A-4): Perbaiki Grid Gantt 16 Minggu (`ScheduleView.tsx`) & Fungsikan Modal Upload (`WorkspacesView.tsx`)
> **Prompt ke Agen**:
> "Perbaiki tata letak tabel Gantt 16 minggu dan fungsikan penyimpanan modal Upload Berkas Baru:
> 1. **File yang disentuh**: `src/components/views/ScheduleView.tsx`, `src/components/views/WorkspacesView.tsx`, `src/components/views/StandardsView.tsx`, `src/components/views/TeamRaciView.tsx`.
> 2. **Perubahan**:
>    - Di `src/components/views/ScheduleView.tsx:321-462`, ubah grid Gantt agar kolom label tugas dan 16 kolom minggu (`W1`–`W16`) berada dalam satu baris grid yang selaras (mis. `grid-cols-[minmax(220px,4fr)_repeat(16,minmax(36px,1fr))]`), render penuh `W1` s.d. `W16`, dan ubah batas `Math.min(12, ...)` di baris 408-409 menjadi `Math.min(16, ...)`.
>    - Di `src/components/views/WorkspacesView.tsx:269-311`, ubah input pada modal `'Upload Berkas Baru'` menjadi *controlled inputs* (pilih deliverable target, nama/versi, dan URL berkas) yang memanggil `updateDeliverable` saat disubmit, bukan `alert()`.
>    - Di `src/components/views/TeamRaciView.tsx:56, 93`, ubah `const isClickable = isPM || isEditMode` menjadi `const isClickable = isPM && isEditMode`.
>    - Di `src/components/views/StandardsView.tsx:98-100, 150-151`, bungkus ikon `ExternalLink` pada kartu regulasi dengan `<a href={reg.url} target="_blank" rel="noopener noreferrer">` dan hapus tanda `+` ganda pada tombol `+ Add`.
> 3. **Batasan**: Pertahankan gaya visual glassmorphism yang ada.
> 4. **Kriteria selesai**: Kolom `W1`–`W16` tampil sejajar tanpa patah baris, modal Upload Berkas memperbarui `fileUrl` deliverable di state/Firestore, dan `npm run lint` serta `npm run build` lulus."

---

### Tugas 5 (B-1): Gunakan Transaksi Firestore (`runTransaction`) untuk Operasi Koleksi Kolaboratif
> **Prompt ke Agen**:
> "Cegah risiko *lost update* saat dua anggota menambah atau mengubah item secara bersamaan pada `projectData/area1`:
> 1. **File yang disentuh**: `src/context/AppContext.tsx`, `src/context/appContextHelpers.ts`.
> 2. **Perubahan**:
>    - Buat helper transaksi `mutateProjectSectionWithTransaction<K extends ProjectSectionKey>(key: K, updater: (current: SharedProjectData[K]) => SharedProjectData[K])` menggunakan `runTransaction(db, ...)` dari `firebase/firestore`.
>    - Gunakan transaksi tersebut pada aksi kolaboratif frekuensi tinggi: `addLogbook`, `deleteLogbook`, `toggleLogbookVerification`, `addTask`, `toggleTask`, `addTrackerAction` (hitung `computeNextTrackerCode` di dalam transaksi dari data server terbaru), `toggleTrackerActionStatus`, dan `updateDefenseQuestionResponse`.
> 3. **Batasan**: Tetap perbarui state React secara optimis agar UI responsif dan sinkronkan `lastSyncedSections.current` agar tidak memicu penulisan ganda.
> 4. **Kriteria selesai**: Penambahan logbook dan action item menggunakan transaksi atomik tanpa menimpa entri pengguna lain; `npm run lint` dan `npm run build` lulus."

---

### Tugas 6 (B-2): Aktifkan Kalkulasi Dinamis Hitung Mundur Tender, Peringatan 24 Jam Logbook, & Jarum Stage-Gate
> **Prompt ke Agen**:
> "Ganti seluruh indikator statis/hardcoded dengan perhitungan dinamis dari state proyek:
> 1. **File yang disentuh**: `src/components/views/HomepageView.tsx`, `src/components/views/LogbookView.tsx`, `src/components/views/StageGateView.tsx`, `src/context/AppContext.tsx`, `src/data/initialData.ts`.
> 2. **Perubahan**:
>    - Di `src/components/views/HomepageView.tsx:507-518`, hitung sisa hari, jam, menit, dan persentase progres SVG menuju `2026-12-15T23:59:00+07:00` secara real-time (perbarui tiap 60 detik).
>    - Di `src/components/views/HomepageView.tsx:378, 896-898`, ganti `{meetingLogs.length + 2}` menjadi `{meetingLogs.length}` dan hitung rasio baris RACI yang valid secara dinamis (`validCount/raciRows.length`).
>    - Di `src/components/views/LogbookView.tsx:127-137`, hitung secara dinamis apakah terdapat `meetingLogs` yang belum memiliki entri `logbooks` terkait atau tampilkan status hijau jika seluruh MoM telah memiliki entri logbook. Sinkronkan juga teks awal `pb-3` di `src/data/initialData.ts:1031-1032`.
>    - Di `src/components/views/StageGateView.tsx:191-196, 209-223, 325-332`, rotasikan jarum SVG mengikuti `stageGateReadinessPercent` (`0%` s.d. `100%`), bedakan label/ikon untuk `<70%` (`'NOT READY / CRITICAL GAP'`), `70-84%` (`'CONDITIONAL READY / NEED REVISION'`), dan `>=85%` (`'READY FOR STAGE-GATE DEFENSE'` + `CheckCircle2`), seragamkan ambang warna skor parameter ke `85`/`70`, serta blokir pengeditan skor/checklist saat `config.readinessLocked === true` (di UI dan `AppContext.tsx`).
> 3. **Batasan**: Jangan mengubah rumus `overallWeightedProgress`.
> 4. **Kriteria selesai**: Seluruh indikator berubah secara reaktif mengikuti data nyata; saat `readinessLocked` aktif, input Stage-Gate terkunci; `npm run lint` dan `npm run build` lulus."

---

### Tugas 7 (B-3 & B-4): Perbaiki Konsistensi Desain, Responsivitas Mobile `390px`, & Aksesibilitas WCAG AA
> **Prompt ke Agen**:
> "Perbaiki kepatuhan desain, responsivitas layar kecil, dan aksesibilitas WCAG AA di seluruh komponen:
> 1. **File yang disentuh**: `src/index.css`, `index.html`, `src/App.tsx`, `src/components/common/UserChip.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/ExportImportModal.tsx`, dan berkas di `src/components/views/*.tsx`.
> 2. **Perubahan**:
>    - Di `src/components/views/TeamRaciView.tsx:30`, ubah state `flippedCards` menjadi `flippedUserId: string | null` agar maksimal hanya 1 kartu gelap (`#0B1B33`) yang tampil pada satu waktu.
>    - Di `src/components/common/UserChip.tsx:137-288`, hapus seluruh kelas `dark:*` dan ganti warna `slate-*` dengan token warna aplikasi (`#0B1B33`, `#4A5A72`, `#EAF6FD`).
>    - Di `src/components/layout/Header.tsx:212, 264` dan `src/components/views/ScheduleView.tsx:345`, ganti `text-[#9FB3C8]` di atas latar putih menjadi `text-[#4A5A72]` (kontras `6,89:1`) dan ubah lebar popover notifikasi menjadi `w-[calc(100vw-2rem)] sm:w-80`.
>    - Tambahkan ukuran sentuh minimum `min-h-[44px] min-w-[44px]` dan atribut `aria-label` pada seluruh tombol ikon, ubah `<div onClick>` interaktif menjadi `<button type="button">`, tambahkan `role="dialog" aria-modal="true"` serta penutupan tombol `Escape` pada modal, tambahkan tampilan *empty state* saat hasil filter kosong, dan tambahkan dukungan `@media (prefers-reduced-motion: reduce)` di `src/index.css`.
> 3. **Batasan**: Jangan menggunakan emoji apa pun; gunakan hanya ikon `lucide-react`.
> 4. **Kriteria selesai**: Kontras teks memenuhi `>=4,5:1`, maksimal 1 kartu gelap di `TeamRaciView`, seluruh tombol ikon memiliki `aria-label` dan area sentuh memadai, serta `npm run lint` dan `npm run build` lulus."

---

### Tugas 8 (B-5): Terapkan Code-Splitting (`React.lazy`), `<ErrorBoundary>`, Header Keamanan `firebase.json`, & Rapikan `package.json`
> **Prompt ke Agen**:
> "Optimalkan ukuran bundel produksi, tambahkan Error Boundary, dan rapikan konfigurasi proyek:
> 1. **File yang disentuh**: `src/App.tsx`, `vite.config.ts`, `firebase.json`, `package.json`, `src/components/views/StandardsView.tsx`, `README.md`.
> 2. **Perubahan**:
>    - Di `src/App.tsx`, ubah impor ke-8 komponen view menjadi `React.lazy(() => import(...))` yang dibungkus `<Suspense>` dan komponen `<ErrorBoundary>` dengan tombol muat ulang jika terjadi galat render.
>    - Di `vite.config.ts`, ganti `__dirname` dengan `import.meta.dirname` dan tambahkan pemisahan chunk vendor (`firebase`, `react`, `lucide-react`) agar tidak ada chunk `> 500 kB`.
>    - Di `firebase.json`, tambahkan header keamanan (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) pada `"source": "**"`.
>    - Di `package.json`, pindahkan `vite`, `@vitejs/plugin-react`, dan `@tailwindcss/vite` ke `devDependencies`, hapus `autoprefixer` yang tidak terpakai, serta hapus impor tak terpakai di `src/components/views/StandardsView.tsx:9-14`.
>    - Perbarui `README.md` agar mencantumkan langkah pembuatan akun di Firebase Auth Console dan dokumen `/config/teamAccess`.
> 3. **Batasan**: Jangan menginstal paket baru dari internet.
> 4. **Kriteria selesai**: `npm run lint` dan `npm run build` lulus dengan **0 peringatan ukuran chunk > 500 kB** dan **0 peringatan `__dirname`**."


---

## 11. Addendum: Hasil Uji Coba Nyata (13 Oktober 2026)

Sesi ini memverifikasi ulang temuan di atas dengan **menjalankan** kode, bukan hanya membacanya. Tidak ada kode, rules, atau data Firestore yang diubah. Skrip uji disimpan di luar repositori (folder scratch agen) dan memuat modul TypeScript asli lewat Vite SSR tanpa koneksi ke Firebase.

### 11.1 Lingkungan dan Batasan Uji

| Item | Hasil |
| :--- | :--- |
| Node.js | v24.21.0 |
| Java (dibutuhkan Firebase Emulator) | Tidak terpasang |
| firebase-tools | Tidak terpasang (`npx --no-install firebase` gagal) |
| Browser headless | Tidak tersedia |
| Akibatnya | Uji `firestore.rules` di emulator dan uji visual responsif 390-1920 px **[BELUM DIUJI]**. Cara aman mengujinya: pasang Java + `firebase-tools`, lalu `firebase emulators:start --only firestore,auth` dengan `@firebase/rules-unit-testing`. |

### 11.2 Uji Unit Logika Murni [DIJALANKAN] - 28 uji, 17 lulus, 11 gagal

| ID | Uji | Hasil | Output |
| :--- | :--- | :---: | :--- |
| T01-T03 | `computeNextTrackerCode` (kosong, celah, data awal) | LULUS | `ACT-01`, `ACT-10`, `ACT-01..04 -> ACT-05` |
| T04 | Dua klien menambah action dari state yang sama | **GAGAL** | Klien A = `ACT-05`, klien B = `ACT-05` (kode ganda) |
| T05 | `newId()` 20.000 kali | LULUS | 20.000 unik |
| T06 | `translateAuthError` | LULUS | `auth/user-disabled` jatuh ke pesan umum "Periksa koneksi" (menyesatkan, minor) |
| T07 | Login `uji-audit@contoh.invalid` | LULUS | Ditolak di klien sebelum memanggil Firebase |
| T08-T09 | `resolveUserFromRef` (alias, kode, prefix acak) | LULUS | `rahulxyz-bukan-anggota -> undefined` |
| T10, T12, T13 | `sortAndNormalizeUsers` (5 dokumen, dokumen UID + legacyId, kosong) | LULUS | Tidak ada pengguna ganda |
| T11 | Dokumen `user-heidi` dihapus di Firestore | **GAGAL** | Input 4 dokumen, output 5: pengguna yang dihapus **disuntik ulang** dari `INITIAL_USERS` (DATA-03 terkonfirmasi) |
| T14-T15 | Import: round-trip ekspor; teks rusak/`[]`/`{}` | LULUS | Diterima / ditolak dengan benar |
| T16 | Import `{"config":{}}` | **GAGAL** | Diterima. Akibat (dibaca dari kode): `setConfig({})` -> `config.noticeBanner.text` undefined -> layar putih (tanpa ErrorBoundary) dan config kosong ikut ditulis ke Firestore untuk seluruh tim |
| T17 | Import `{"tasks":[{"id":"x"}]}` | **GAGAL** | Diterima tanpa field wajib |
| T18 | Import URL `javascript:` di `slideDecks` | **GAGAL** | Tersimpan apa adanya (SEC-03 terkonfirmasi) |
| T19 | Import kunci asing | **GAGAL** | Kunci asing ikut dikembalikan |
| T20 | Migrasi referensi dijalankan 2x | LULUS | Run 1 = 1 perubahan, run 2 = 0 (idempoten) |
| T21 | Ukuran payload `projectData/area1` | LULUS | **22.648 byte = 2,16% dari 1 MiB** (koreksi estimasi ~27 KB sebelumnya) |
| T22 | Progres tertimbang | LULUS | Bobot 100, progres 41% |
| T23 | Kesiapan Stage-Gate | LULUS (rumus) | 9/19 = **47%**, sedangkan jarum SVG statis menunjuk ~78% |
| T24 | Logbook terverifikasi vs badge checklist fisik | **GAGAL** | 5 dari 6 terverifikasi, badge tertulis `6 / 12 Paraf` |
| T25 | RACI valid vs badge Homepage `5/5 Valid` | **GAGAL** | Aktual **6/6** valid; badge hardcoded di `HomepageView.tsx:897` |
| T26 | Minggu Gantt vs grid 12 kolom | **GAGAL** | endWeek maks = 16; 4 tugas melewati W12 dan dipotong `Math.min(12, ..)` (`ScheduleView.tsx:408-409`) |
| T27 | Email tim di bundel klien | **GAGAL** | 5 email tim tertanam di `initialData.ts` |
| T28 | `regulations` disinkronkan? | **GAGAL** | Tidak ada di `SECTION_KEYS`; state `regulations` read-only dari data awal (`AppContext.tsx:130`) |

### 11.3 Uji Runtime Server Dev dan Bundel [DIJALANKAN]

Server dev dijalankan di port 3100, diuji dengan permintaan HTTP, lalu dimatikan.

| Permintaan | Hasil | Arti |
| :--- | :--- | :--- |
| `GET /` | 200, HTML | Aplikasi tersaji |
| `GET /api/project-data`, `/api/project-data/stream` | 200, HTML (fallback SPA) | Endpoint lama benar-benar sudah dihapus |
| `GET /.env.local` | 403 | Vite memblokir file env |
| `GET /project-data.json` | **200, JSON 34.711 byte** | **Temuan baru (SEC-06)** |
| Bundel `dist/assets/*.js` | 6 kemunculan domain email tim, 1 API key Firebase (memang publik), 0 password literal | Email tim terbaca oleh siapa pun tanpa login |
| `git check-ignore` | `.env.local` dan `project-data.json` diabaikan Git | Benar |

### 11.4 Kontras Warna Dihitung [DIJALANKAN] (rumus WCAG 2.x)

| Pasangan | Rasio | AA (4,5:1) |
| :--- | ---: | :---: |
| `#9FB3C8` di atas putih (`Header.tsx:264`, `ScheduleView.tsx:345`) | 2,15:1 | Gagal |
| `#9FB3C8` di atas `#0B1B33` (kartu gelap Homepage) | 8,00:1 | Lulus |
| `#4A5A72` di atas putih | 7,01:1 | Lulus |
| `#4A5A72` di atas glass-card pada `#4CBAF5` | 5,02:1 | Lulus |
| `#4A5A72` di atas glass-card terburuk pada `#007BFF` | 3,44:1 | Gagal |
| `#4A5A72` di footer `bg-white/40` | 4,42:1 | Gagal tipis |
| Putih di atas tombol `#0062CC` | 5,80:1 | Lulus |

Catatan: pemakaian `#9FB3C8` di `HomepageView.tsx:553-597` berada di dalam kartu gelap dan aman.

### 11.5 Temuan Baru dari Sesi Ini

#### [SEC-06] `project-data.json` masih ada di disk dan dilayani server dev ke jaringan lokal
- **Tingkat**: Tinggi | **Bukti**: [DIJALANKAN]
- **Lokasi**: file `project-data.json` (34.711 byte, berisi 5 email tim dan data proyek lama); `package.json:7` skrip `dev` memakai `--host=0.0.0.0`.
- **Dampak**: File sudah dihapus dari indeks Git, tetapi fisiknya masih ada. Saat `npm run dev`, siapa pun di Wi-Fi yang sama dapat membuka `http://<ip-laptop>:3000/project-data.json` tanpa login.
- **Reproduksi**: `npm run dev`, lalu buka `/project-data.json` di browser -> HTTP 200.
- **Perbaikan**: hapus file fisiknya; ubah skrip `dev` menjadi `vite --port=3000` (tanpa `--host=0.0.0.0`) dan sediakan skrip terpisah `dev:lan` bila memang perlu. Usaha: S.

#### [DATA-04] Notifikasi disimpan bersama: satu anggota membaca, semua anggota ikut "sudah dibaca"
- **Tingkat**: Sedang | **Bukti**: [DIBACA DARI KODE]
- **Lokasi**: `AppContext.tsx:919-927` (`markNotificationAsRead`, `markAllNotificationsAsRead`), `appContextTypes.ts:228` (`notifications` termasuk `SECTION_KEYS`).
- **Dampak**: Flag `read` ditulis ke `projectData/area1`, jadi notifikasi hilang dari lonceng seluruh tim begitu satu orang mengekliknya.
- **Perbaikan**: simpan status baca per pengguna (mis. `users/{id}.readNotificationIds` atau subkoleksi), dan keluarkan `read` dari dokumen bersama. Usaha: M.

#### [DATA-05] Snapshot yang tiba saat ada tulisan lokal tertunda dibuang
- **Tingkat**: Sedang | **Bukti**: [DIBACA DARI KODE] (perlu uji emulator dua klien untuk memastikan dampaknya)
- **Lokasi**: `AppContext.tsx:473` `if (snapshot.metadata.hasPendingWrites) return;` tanpa `includeMetadataChanges`.
- **Dampak**: Perubahan anggota lain yang masuk bersamaan dengan tulisan lokal dapat tidak muncul di layar sampai ada perubahan berikutnya, sehingga tulisan berikutnya menimpa data yang tidak pernah terlihat (memperparah DATA-02).
- **Perbaikan**: terapkan snapshot untuk seksi yang tidak sedang ditulis, atau pakai `onSnapshot(ref, { includeMetadataChanges: true }, ...)` agar status setelah server mengonfirmasi tetap diterapkan. Usaha: S-M.

#### [FUNC-04] Validasi import terlalu longgar
- **Tingkat**: Tinggi (khusus PM, tetapi dampaknya menimpa data seluruh tim) | **Bukti**: [DIJALANKAN] T16-T19
- **Lokasi**: `appContextHelpers.ts:175-238`.
- **Perbaikan**: validasi bentuk per seksi (field wajib dan tipe), wajibkan `config` lengkap atau gabungkan dengan `INITIAL_CONFIG`, buang kunci asing, sanitasi URL, dan tampilkan pratinjau jumlah item sebelum menimpa. Usaha: M.

### 11.6 Koreksi terhadap Laporan Sebelumnya

| Bagian | Sebelumnya | Koreksi setelah uji/baca ulang |
| :--- | :--- | :--- |
| SEC-01 | Cuplikan `isCanonicalInitialUserSeed` tidak memuat syarat role | Fungsi aslinya (`firestore.rules:80-88`) membatasi `role == 'member'` kecuali `user-rahul` yang boleh `admin`, tetapi **tetap tidak memeriksa email**. Celah hanya terbuka bila dokumen `/users/user-rahul` belum ada. Karena aplikasi men-seed kelima dokumen pada login pertama, celah ini kemungkinan sudah tertutup di produksi. **Tingkat diturunkan ke Tinggi (bersyarat)**; perlu dicek di Firebase Console. |
| SEC-04 | Fallback `isPM` ke `users[0]` dinilai Tinggi | Saat belum login, layar yang tampil adalah LoginGateway; setelah login, `currentUserId` selalu cocok dengan ID kanonik atau `legacyId` (dibuktikan T12). **Risiko nyata Rendah**; tetap disarankan dirapikan. |
| Rekomendasi A-1 / Tugas 1 | Menyarankan menambah `regulations` ke daftar rules admin | `regulations` tidak pernah ditulis ke Firestore (T28), jadi langkah itu tidak relevan. |
| Tabel 3.4 | Durasi `depcheck` "1,80 dtk" dan `git log` "0,45 dtk" | Kedua durasi itu **tidak diukur**; seharusnya ditulis "tidak diukur". |
| Tabel 3.1 | Jumlah baris beberapa file | Hasil ukur: `HomepageView.tsx` 1.458-1.459, `AppContext.tsx` 1.241-1.242, `LoginGateway.tsx` 573, `TeamRaciView.tsx` 552, `Header.tsx` 403, `firestore.rules` 219-220 (selisih karena cara menghitung baris akhir). |
| A11Y-01 | Kontras `#9FB3C8` 2,13:1, footer ~2,9:1 | Hasil hitung: 2,15:1 dan 4,42:1. Glass-card terburuk 3,44:1. |
| Payload | ~25-28 KB | Hasil ukur 22.648 byte. |
| FUNC-01 | Hitung mundur "65 hari 12 jam 30 menit" | Terkonfirmasi hardcoded (`HomepageView.tsx:507, 513-516`). Pada 13 Okt 2026 pukul 09.55 WIB, sisa sebenarnya sekitar **63 hari 14 jam**. |

### 11.7 Daftar Perbaikan Prioritas (diperbarui)

1. **SEC-06**: hapus `project-data.json` dari disk, hilangkan `--host=0.0.0.0` dari skrip `dev`. (S)
2. **SEC-02**: perbaiki `isAdmin()` agar admin hasil promosi dikenali, dan lindungi `raciRows`, `deliverables`, `weeklyPlans`, `slideDecks`, `trackerActions`, `logbooks.verifiedByLecturer` di rules dan `AppContext.tsx`. (M)
3. **SEC-01**: tambahkan pemeriksaan email pada `isCanonicalInitialUserSeed`. (S)
4. **DATA-01**: debounce penulisan Firestore. (S)
5. **FUNC-04 + SEC-03**: perketat validasi import dan sanitasi URL `http/https`. (M)
6. **DATA-02 + T04 + DATA-05**: transaksi untuk tambah/hapus item dan nomor `ACT-xx`, tangani snapshot saat ada tulisan tertunda. (M)
7. **DATA-03 (T11)**: hentikan penyuntikan ulang `INITIAL_USERS` saat data berasal dari Firestore. (S)
8. **FUNC-01/02, UI-01 (T23-T26)**: hitung mundur, badge RACI, peringatan logbook, jarum Stage-Gate, dan grid Gantt 16 minggu dibuat dinamis. (M)
9. **DATA-04**: status baca notifikasi per pengguna. (M)
10. **A11Y**: perbaiki 2 lokasi `#9FB3C8` di latar putih dan footer. (S)
