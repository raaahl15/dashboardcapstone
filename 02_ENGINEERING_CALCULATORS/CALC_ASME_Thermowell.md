---
id: "CALC-ASME-TW-001"
title: "Verifikasi Thermowell (Frekuensi, Tegangan, Tekanan) menurut ASME PTC 19.3 TW-2016"
category: "Engineering Calculator"
standard: "ASME PTC 19.3 TW-2016"
target_files:
  - "CALC_ASME_Thermowell.csv"
  - "inputs/TW-104.yaml"
generated_by: "tools/calc/thermowell.py (npm run calc)"
source_data:
  - "hmb_streams.json → S-104 (ρ, μ fase uap, P, laju massa); diameter pipa dari CALC_LineSizing.csv; input lain di inputs/TW-104.yaml"
  - "ASME PTC 19.3 TW-2016 (salinan dari PM, 2026-11-04; tidak disimpan di Git)"
author: "Jonathan Pangihutan Michael Siahaan (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-04"
tags: ["Temperature", "Thermowell", "Vibration", "Area-100"]
---

# Panduan Penggunaan: CALC_ASME_Thermowell.csv

> 🔄 **FILE HASIL GENERATE (LOG-035/036).** CSV ditulis ulang oleh `npm run calc` dari `inputs/TW-*.yaml` + `hmb_streams.json`. Jangan edit CSV; ubah input YAML.
>
> ⚠️ **Status data: ASUMSI.** Diameter pipa dari line sizing (6" Sch 40), geometri thermowell = desain agent dari sweep, E dan S F316 = nilai tabel kode menurut agent (belum dicocokkan dengan salinan ASME B31.3). Konfirmasi JN sebelum dikutip.

## 1. Cakupan
Memverifikasi thermowell terhadap: (1) **batas frekuensi** akibat *vortex shedding* (§6-8.2/§6-8.3) dan **pita operasi** §6-8.4, (2) **tegangan tunak** von Mises di titik tumpu, (3) **tegangan dinamis** terhadap batas fatik, (4) **rating tekanan eksternal**, dan (5) **batas dimensi** Tabel 4-1-1/4-2-1, sesuai ASME PTC 19.3 TW-2016 Section 4 dan 6–7.

Yang dihitung: **TW-104**, thermowell untuk **TT-104** (suhu keluaran E-101, aliran S-104, line 6"-P-104 di Draf P&ID DME-PID-002). TW-103 (S-105) dihapus pada LOG-036 karena P&ID tidak punya elemen suhu di S-105.

Tidak dihitung, dengan alasan:
- **TE-101, TE-102A/B/C** (di dalam bed katalis R-101): standar memodelkan thermowell dalam aliran bebas tegak lurus di pipa, bukan di dalam unggun katalis. Rancangan mengikuti data vendor reaktor.
- **TT-109** (S-107, keluaran E-102): aliran **dua fase** (fraksi uap 0,069), di luar model fluida satu fase standar. Bila tetap memakai thermowell, lakukan analisis khusus atau pasang di titik satu fase.

Batasan kalkulator (ditolak dengan pesan, bukan dihitung diam-diam): step-shank di luar Tabel 6-5.3-1, operasi superkritis (§6-12.5), Re di luar 22–5×10⁷. Tidak dicakup: corrosion allowance (§6-2), pemasangan di elbow (§6-10.7), dan rating flens P_f (§6-13 langkah 3, dicek manual di §4).

## 2. Standar Acuan
ASME PTC 19.3 TW-2016: Tabel 4-1-1 batas dimensi; (6-4-1)–(6-4-5) Strouhal & koefisien gaya; (6-5-1)–(6-5-6) frekuensi natural; (6-6-5)/(6-7-1) compliance tumpuan; §6-8 batas frekuensi; (6-9-1)–(6-9-3) faktor magnifikasi; (6-10-3)–(6-10-11) tegangan lentur dengan panjang terlindung L₀; (6-11-1)–(6-11-3); (6-12-1)–(6-12-6) dan Tabel 6-12.3-1; (6-13-1)–(6-13-2). Panduan Capstone BAB IV §4.1: sizing thermowell **wajib dihitung manual** (skrip = verifikasi silang).

## 3. Persamaan Utama
$$f_a = \frac{1.875^2}{2\pi}\sqrt{\frac{EI}{m}}\,\frac{1}{L^2},\qquad f_n^c = H_c\,H_f\,H_{a,f}\,H_{a,s}\,f_a,\qquad f_s = \frac{N_S V}{B}$$

Batas frekuensi (kasus umum §6-8.3): bila tegangan siklik di resonansi in-line ($F'_M = 1/2\zeta = 1000$) melebihi batas fatik, wajib $f_s < 0{,}4\,f_n^c$. Bila tidak, $f_s < 0{,}8\,f_n^c$ **dan** (§6-8.4) operasi tunak tidak berada di pita lock-in: $f_s < 0{,}4\,f_n^c$ atau $0{,}6\,f_n^c < f_s < 0{,}8\,f_n^c$.

$$S_{o,\max} = K_t\sqrt{S_d^2 + S_L^2} \le F_T F_E S_f,\qquad \sqrt{\tfrac{(S_{\max}-S_r)^2+(S_{\max}-S_t)^2+(S_t-S_r)^2}{2}} \le 1{,}5\,S$$

## 4. Input & Hasil TW-104 (LOG-036)

| Input | Nilai | Status |
| :--- | :--- | :---: |
| ρ, μ, P, ṁ uap S-104 | 10,78 kg/m³; 0,0178 cP; 14,7 bar(a); 10 553 kg/h | HMB |
| Diameter dalam pipa | 154,06 mm (6" Sch 40, CALC_LineSizing S-104) | ASUMSI |
| Bentuk, pemasangan | tapered, flens 1-1/2" ASME B16.5 Class 300 | ASUMSI |
| A / B / d / t / b | 31,8 (1-1/4") / 22,2 (7/8") / 6,6 / 6,4 / 0 mm | ASUMSI (b: STANDAR) |
| L / L₀ (terlindung di nozzle) | 232,1 mm / 157,1 mm (nozzle 150 mm + dinding 7,11 mm; imersi 75 mm ≈ ½ ID) | ASUMSI |
| Material | ASTM A182 F316 (kelas B), satu-bagian dari bar/forging tanpa las | ASUMSI |
| E pada 250 °C | 178,8 GPa (B31.3 Tabel C-6 austenitik, interpolasi 482 °F) | ASUMSI* |
| S pada 250 °C | 92,9 MPa (B31.3 Tabel A-1 F316, baris konservatif tanpa catatan deformasi, interpolasi) | ASUMSI* |
| S_f | 93,8 MPa (Tabel 6-12.3-1 kelas B *No welds*) | STANDAR |

\* Nilai tabel kode menurut agent; status naik ke LITERATUR setelah dicocokkan dengan salinan ASME B31.3 edisi yang dipakai.

| Hasil | Nilai |
| :--- | ---: |
| V, Re, N_S | 14,6 m/s; 1,96×10⁵; 0,194 |
| f_n^c, f_s, f_s/f_n^c | 423,7 Hz; 127,2 Hz; **0,300** |
| N_Sc; V_IR | 3,34; 23,5 m/s |
| S_o di resonansi in-line vs batas fatik | 72,0 MPa ≤ 86,0 MPa → lolos (batas 0,8 f_n^c; §6-8.4: r < 0,4 ✅) |
| Von Mises tunak / tegangan dinamis | 0,21 MPa ≤ 139 MPa / 0,31 MPa ≤ 86,0 MPa |
| Rating tekanan eksternal P_r | 41,6 MPa > 1,37 MPa |
| Batas dimensi Tabel 4-1-1 | B/A 0,70; d/B 0,30; (B−d)/2 7,8 mm; t 6,4 mm ✅ |
| **Kesimpulan** | **PASS** |

**Margin:** r = 0,300, jadi kecepatan bisa naik sekitar 33 % sebelum mencapai 0,4 f_n^c.

**Alasan geometri (sweep LOG-036, pipa 6"):** dengan A/B 25,4/19,1 mm dan imersi 75 mm, r = 0,435. Desain ini lolos tegangan siklik, tetapi berada di pita terlarang §6-8.4 (0,4–0,6), sehingga GAGAL. A/B 31,8/22,2 mm memberi r = 0,30. Dengan pipa 3" (seperti Rev A gambar, V ≈ 57 m/s) semua geometri yang dicoba gagal.

**Rating flens (§6-13 langkah 3, manual):** flens ASME B16.5 Class 300 bahan grup 2.2 (316) pada 250 °C sekitar 33 bar(g) > 13,7 bar(g). Class 150 (sekitar 12 bar(g) pada 250 °C) **tidak cukup**. Angka rating menurut agent; cocokkan dengan tabel B16.5 2-2.2.

## 5. Verifikasi (tools/calc/test_verification.py)
| Uji | Hasil |
| :--- | :--- |
| Contoh 8-2 standar (step-shank berulir, air panas, SI) | Re, N_S, f_a, H_f, H_a,f, H_a,s, f_n, H_c, f_n^c, N_Sc, f_s, V_IR, G_SP, G_RD, K_t, S_d, S_o, von Mises, P_c, P_t **terreproduksi** (toleransi 0,3 %) |
| Contoh 8-1 standar (tapered dilas, uap, US → SI) | Seluruh nilai antara s.d. P_c, P_t terreproduksi (toleransi 0,5 %) |
| Kecepatan dinaikkan (V = 30 m/s, contoh 8-2) | Batas frekuensi FAIL (sesuai harapan) |
| Pita operasi §6-8.4 (uap 6", lolos in-line) | L 217 mm (r 0,38) PASS; L 232 mm (r 0,44) FAIL |
| Batas dimensi Tabel 4-1-1 | Contoh 8-1 & 8-2 dalam cakupan; B/A 0,51 ditolak |
| Step-shank di luar Tabel 6-5.3-1 | Ditolak dengan pesan |

Catatan saat verifikasi: (a) G_RD dihitung dengan L_S² seperti contoh 8-2 (persamaan 6-10-10 tercetak dengan L²); (b) contoh 8-1 menulis H_a,f = 0,9922 tetapi memakai 0,9995 (salah ketik standar); (c) contoh 8-2 memakai E = 1,91×10¹¹ Pa dalam perhitungan walau teks menyebut 1,93×10¹¹.

## 6. SOP
1. Pastikan `hmb_streams.json` terbaru (`npm run sync:dwsim`) dan ukuran line di `CALC_LineSizing.csv`.
2. Isi/ubah `inputs/TW-*.yaml`: dimensi dari datasheet vendor, tinggi nozzle dari piping (L₀), E & S dari ASME B31.3, S_f dari Tabel 6-12.3-1 sesuai konstruksi (bila flens dilas: 62,8 MPa).
3. Hitung manual di laporan PSTF 2 Bab 2, lalu `npm run calc` sebagai verifikasi silang (selisih < 0,5 %). `npm run test:py` harus lulus.

## 7. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Angka bootstrap tanpa sumber dihapus; TW-201/202 (Area 2) dikeluarkan; REAC-01 → R-101; format CSV disamakan (LOG-021). |
| 1.0 | 2026-11-04 | Claude Code (AI) | Kalkulator `tools/calc/thermowell.py` dari ASME PTC 19.3 TW-2016 (salinan dari PM); verifikasi contoh 8-1 & 8-2; input TW-103 (S-105); TW-101/102 bed katalis di luar cakupan standar (LOG-035). |
| 1.1 | 2026-11-04 | Claude Code (AI) | Tambah cek §6-8.4 (pita lock-in) dan Tabel 4-1-1; TW-103 → **TW-104** (TT-104, S-104) sesuai P&ID; pipa 6" dari line sizing; geometri 31,8/22,2 mm, L 232,1/L₀ 157,1 mm; S_f *No welds* 93,8 MPa; E/S F316 dari tabel B31.3 (agent); status data PLACEHOLDER → ASUMSI (LOG-036). |
