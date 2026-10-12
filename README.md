# Area 1-DME Engineering Operations Cockpit

Dashboard FEED Area 1 dengan login Firebase Authentication dan satu sumber data proyek bersama di Cloud Firestore. Perubahan data disinkronkan antarsesi/perangkat; browser tidak lagi menjadi penyimpanan utama.

## Daftar Akun Tim (`Nama_Posisi` / `Posisi_Nama`)

| Anggota Tim | Posisi | Username (`Nama_Posisi`) | Password (`Posisi_Nama`) | Email Firebase |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Ghulam Hidayatulloh** | Project Manager | `Rahul_PM` | `PM_Rahul` | `lead.engineer@dme-area1.epc` |
| **Ihsan Halim** | Lead Process Engineer | `Ihsan_Process` | `Process_Ihsan` | `process.engineer@dme-area1.epc` |
| **M. Althaf** | Lead Instrument Engineer 1 | `Althaf_Inst1` | `Inst1_Althaf` | `inst1.engineer@dme-area1.epc` |
| **Jonathan** | Lead Instrument Engineer 2 | `Jonathan_Inst2` | `Inst2_Jonathan` | `inst2.engineer@dme-area1.epc` |
| **Heidi** | Cost Engineer | `Heidi_Cost` | `Cost_Heidi` | `cost.engineer@dme-area1.epc` |

## Menyiapkan Firebase

1. File `.env.local` sudah disiapkan dengan konfigurasi `VITE_FIREBASE_*` sehingga aplikasi dapat langsung dijalankan.
2. Jika ingin menghubungkan ke project [Firebase Console](https://console.firebase.google.com/) milik Anda:
   - Aktifkan **Authentication → Sign-in method → Email/Password** (akun tim akan otomatis dibuat di Firebase saat pertama kali login).
   - Buat database **Cloud Firestore** dan terapkan aturan akses dari `firestore.rules`.
   - Ganti nilai `VITE_FIREBASE_*` di `.env.local` dengan konfigurasi Web App dari Firebase Project Settings Anda.
3. Deploy rules dan website (opsional):

```sh
npm install
npx firebase-tools login
npx firebase-tools use --add
npm run build
npx firebase-tools deploy --only firestore:rules,hosting
```

Pilih project Firebase yang sama pada langkah `use --add`. Jika menggunakan layanan hosting lain, jalankan `npm run build` dan deploy folder `dist`; tambahkan rewrite URL agar rute aplikasi diarahkan ke `index.html`.

## Menjalankan lokal

```sh
npm install
npm run dev
```

Jangan commit `.env.local`. File `.env.example` berisi placeholder untuk konfigurasi yang perlu diisi sendiri.

## Perilaku data dan akses

- Login benar-benar diverifikasi oleh Firebase Authentication; tidak ada login demo atau fallback password.
- Data dashboard dan perubahan yang diimpor/reset disimpan bersama di dokumen Firestore `projectData/area1`. Dokumen dibuat otomatis dari data awal saat anggota tim pertama kali masuk.
- Semua akun pada daftar yang diizinkan dapat membaca dan mengubah data bersama. Label peran di dashboard adalah informasi profil, bukan batas otorisasi; kelola akun yang diizinkan melalui Firebase Authentication dan `firestore.rules`.
- Jika Firebase belum dikonfigurasi atau koneksi/sinkronisasi gagal, aplikasi menampilkan pesan dan tidak menganggap login atau penyimpanan berhasil.

