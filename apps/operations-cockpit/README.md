# Area 1-DME Engineering Operations Cockpit

Dashboard FEED Area 1 dengan login Firebase Authentication dan satu sumber data proyek bersama di Cloud Firestore. Perubahan data disinkronkan antarsesi/perangkat secara real-time; browser tidak menyimpan data proyek.

## Akun Tim

Akun dibuat **secara manual** di Firebase Console (Authentication → Users). Aplikasi tidak membuat akun otomatis. Password ditetapkan dan dibagikan secara pribadi oleh admin, **jangan ditulis di repositori**.

| Anggota Tim | Posisi | Email Firebase |
| :--- | :--- | :--- |
| **Rahul Ghulam Hidayatulloh** | Project Manager | `rahulghulamhidayatulloh2004@mail.ugm.ac.id` |
| **Ihsaan Zauhair Tsaqif Prawira** | Lead Process Engineer | `ihsaanzauhairtsaqifprawira@mail.ugm.ac.id` |
| **Altaf Ramadhan Parvez** | Lead Instrument Engineer 1 | `altaframadhanparvez@mail.ugm.ac.id` |
| **Jonathan Pangihutan Michael Siahaan** | Lead Instrument Engineer 2 | `jonathanpangihutanms@mail.ugm.ac.id` |
| **Heidi Falina Brilian** | Cost Engineer | `heidifalinabrilian@mail.ugm.ac.id` |

Login dapat memakai email lengkap di atas, atau nama panggilan/kode anggota (mis. `Rahul`).

## Menyiapkan Firebase

1. Salin `.env.example` menjadi `.env.local`, lalu isi nilai `VITE_FIREBASE_*` dari Firebase Console → Project Settings → Your apps → Web app.
2. Di [Firebase Console](https://console.firebase.google.com/):
   - Aktifkan **Authentication → Sign-in method → Email/Password**.
   - Buat pengguna untuk kelima email tim di atas.
   - Buat database **Cloud Firestore** (mode Native) dan publish aturan dari `firestore.rules`.
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

- Login diverifikasi sepenuhnya oleh Firebase Authentication; tidak ada login demo, fallback password, maupun mode lokal/offline.
- Data dashboard disimpan bersama di dokumen Firestore `projectData/area1`. Dokumen dibuat otomatis dari data awal saat anggota tim pertama kali masuk.
- Semua akun pada daftar yang diizinkan dapat membaca dan mengubah data bersama (`firestore.rules`). Impor/reset data dan migrasi hanya ditampilkan untuk admin di UI; ini adalah pembatasan antarmuka, bukan batas otorisasi di server.
- Jika Firebase belum dikonfigurasi atau koneksi/sinkronisasi gagal, aplikasi menampilkan pesan dan tidak menganggap login atau penyimpanan berhasil.
