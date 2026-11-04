---
id: "CALC-ASME-TW-001"
title: "Verifikasi Thermowell (Frekuensi, Tegangan, Tekanan) menurut ASME PTC 19.3 TW-2016"
category: "Engineering Calculator"
standard: "ASME PTC 19.3 TW-2016"
target_files:
  - "CALC_ASME_Thermowell.csv"
  - "inputs/TW-103.yaml"
generated_by: "tools/calc/thermowell.py (npm run calc)"
source_data:
  - "hmb_streams.json → S-105 (ρ, μ fase uap, P, laju massa); input lain di inputs/TW-103.yaml"
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

> 🔄 **FILE HASIL GENERATE (LOG-035).** CSV ditulis ulang oleh `npm run calc` dari `inputs/TW-*.yaml` + `hmb_streams.json`. Jangan edit CSV; ubah input YAML.
>
> ⚠️ **Status data: PLACEHOLDER** karena diameter dalam pipa S-105 belum ditetapkan (line sizing). Dimensi thermowell, material, dan tegangan izin masih ASUMSI. Hasil belum boleh dikutip ke laporan.

## 1. Cakupan
Memverifikasi thermowell terhadap: (1) **batas frekuensi** akibat *vortex shedding* (resonansi in-line dan transversal), (2) **tegangan tunak** von Mises di titik tumpu, (3) **tegangan dinamis** terhadap batas fatik, dan (4) **rating tekanan eksternal**, sesuai ASME PTC 19.3 TW-2016 Section 6–7.

Yang dihitung saat ini: **TW-103**, thermowell outlet uap R-101 pada aliran S-105. **TW-101/TW-102** (di dalam bed katalis R-101) **tidak dihitung**, karena standar memodelkan thermowell dalam aliran bebas tegak lurus (vortex shedding di pipa), bukan di dalam unggun katalis. Rancangan thermowell bed mengikuti data vendor reaktor; bila tetap dipasang di aliran bebas, tambahkan YAML-nya.

Batasan kalkulator (ditolak dengan pesan, bukan dihitung diam-diam): step-shank di luar Tabel 6-5.3-1, operasi superkritis (§6-12.5), Re di luar 22–5×10⁷. Tidak dicakup: corrosion allowance (§6-2), pemasangan di elbow (§6-10.7), dan pengecekan otomatis batas dimensi Tabel 4-1-1/4-2-1.

## 2. Standar Acuan
ASME PTC 19.3 TW-2016: (6-4-1)–(6-4-5) Strouhal & koefisien gaya; (6-5-1)–(6-5-6) frekuensi natural; (6-6-5)/(6-7-1) compliance tumpuan; §6-8 batas frekuensi; (6-9-1)–(6-9-3) faktor magnifikasi; (6-10-4)–(6-10-11) tegangan lentur; (6-11-1)–(6-11-3) tegangan tekanan; (6-12-1)–(6-12-6) batas tegangan; (6-13-1)–(6-13-2) batas tekanan. Panduan Capstone BAB IV §4.1: sizing thermowell **wajib dihitung manual** (skrip = verifikasi silang).

## 3. Persamaan Utama
$$f_a = \frac{1.875^2}{2\pi}\sqrt{\frac{EI}{m}}\,\frac{1}{L^2},\qquad f_n^c = H_c\,H_f\,H_{a,f}\,H_{a,s}\,f_a,\qquad f_s = \frac{N_S V}{B}$$

Batas frekuensi (kasus umum §6-8.3): bila tegangan siklik di resonansi in-line ($F'_M = 1/2\zeta = 1000$) melebihi batas fatik, maka wajib $f_s < 0{,}4\,f_n^c$; bila tidak, $f_s < 0{,}8\,f_n^c$.

$$S_{o,\max} = K_t\sqrt{S_d^2 + S_L^2} \le F_T F_E S_f,\qquad \sqrt{\tfrac{(S_{\max}-S_r)^2+(S_{\max}-S_t)^2+(S_t-S_r)^2}{2}} \le 1{,}5\,S$$

## 4. Input & Hasil TW-103 (LOG-035)

| Input | Nilai | Status |
| :--- | ---: | :---: |
| ρ, μ, P, ṁ uap S-105 | 10,78 kg/m³; 0,0179 cP; 14,7 bar(a); 10 553 kg/h | HMB |
| Diameter dalam pipa | 154,08 mm (6 in Sch 40) | **PLACEHOLDER** |
| Bentuk, pemasangan | tapered, flens | ASUMSI |
| A / B / d / t / b | 25,4 / 19,1 / 6,6 / 6,4 / 0 mm | ASUMSI (b: STANDAR) |
| L (tak tertumpu) | 200 mm (usulan agent) | ASUMSI |
| Material | ASTM A182 F316 (kelas B): E 178,6 GPa, S 115 MPa, S_f 62,8 MPa | ASUMSI |

| Hasil | Nilai |
| :--- | ---: |
| V, Re, N_S | 14,6 m/s; 1,68×10⁵; 0,192 |
| f_n^c, f_s, f_s/f_n^c | 448 Hz; 146,5 Hz; 0,327 |
| Batas frekuensi | **PASS** (resonansi in-line gagal tegangan siklik → wajib f_s < 0,4 f_n^c) |
| Tegangan tunak / dinamis / tekanan | PASS / PASS / PASS |

**Temuan desain (sensitivitas L, geometri sama):** L ≤ 220 mm lolos; **L = 230 mm gagal** (f_s/f_n^c = 0,43 > 0,4 dan tegangan dinamis 88 MPa > 57,5 MPa). Untuk nozzle yang panjang, perkecil L, perbesar A/B, atau pertimbangkan thermowell step-shank. Nilai akhir bergantung pada ukuran pipa S-105 (kecepatan) dan dimensi nozzle dari JN.

## 5. Verifikasi (tools/calc/test_verification.py)
| Uji | Hasil |
| :--- | :--- |
| Contoh 8-2 standar (step-shank berulir, air panas, SI) | Re, N_S, f_a, H_f, H_a,f, H_a,s, f_n, H_c, f_n^c, N_Sc, f_s, V_IR, G_SP, G_RD, K_t, S_d, S_o, von Mises, P_c, P_t **terreproduksi** (toleransi 0,3 %) |
| Contoh 8-1 standar (tapered dilas, uap, US → SI) | Seluruh nilai antara s.d. P_c, P_t terreproduksi (toleransi 0,5 %) |
| Kecepatan dinaikkan (V = 30 m/s, contoh 8-2) | Batas frekuensi FAIL (sesuai harapan) |
| Step-shank di luar Tabel 6-5.3-1 | Ditolak dengan pesan |

Catatan saat verifikasi: (a) G_RD dihitung dengan L_S² seperti contoh 8-2 (persamaan 6-10-10 tercetak dengan L²); (b) contoh 8-1 menulis H_a,f = 0,9922 tetapi memakai 0,9995 (salah ketik standar); (c) contoh 8-2 memakai E = 1,91×10¹¹ Pa dalam perhitungan walau teks menyebut 1,93×10¹¹.

## 6. SOP
1. Pastikan `hmb_streams.json` terbaru (`npm run sync:dwsim`).
2. Isi/ubah `inputs/TW-*.yaml`: diameter pipa dari line sizing, dimensi dari datasheet vendor, E & S dari kode pipa yang berlaku (ASME B31.3 untuk pabrik proses), S_f dari Tabel 6-12.3-1 sesuai konstruksi.
3. Hitung manual di laporan PSTF 2 Bab 2, lalu `npm run calc` sebagai verifikasi silang (selisih < 0,5 %). `npm run test:py` harus lulus.

## 7. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → Draft; penandaan PLACEHOLDER; catatan inkonsistensi (LOG-004). |
| 0.3 | 2026-11-03 | Claude Code (AI) | Angka bootstrap tanpa sumber dihapus; TW-201/202 (Area 2) dikeluarkan; REAC-01 → R-101; format CSV disamakan (LOG-021). |
| 1.0 | 2026-11-04 | Claude Code (AI) | Kalkulator `tools/calc/thermowell.py` dari ASME PTC 19.3 TW-2016 (salinan dari PM); verifikasi contoh 8-1 & 8-2; input TW-103 (S-105); TW-101/102 bed katalis di luar cakupan standar (LOG-035). |
