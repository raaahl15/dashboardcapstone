---
id: "LAP-PSTF1-BAB1"
title: "Laporan PSTF 1 — Bab 1 Konseptualisasi Sistem (NAMUR Phase 1), Rev 1"
category: "Report Chapter"
standard: "Panduan Capstone DTNTF 2026 Lampiran 3A; KAK-IC-DME-2026-001; ANSI/ISA-5.06.01; IEC 61511"
target_files: []
generated_by: ""
source_data:
  - "BAB 1.pdf Rev 0 (Ihsaan Zauhair Tsaqif Prawira, diterima PM 2026-11-05)"
  - "01_PROCESS_SIMULATION_DWSIM/exported_data/hmb_streams.json (DME.dwxmz, ekstraksi 2026-11-03)"
  - "KAK-IC-DME-2026-001_RFP.pdf (PDF asli, 7 halaman)"
  - "04_INSTRUMENTATION_ISA20/Master_Instrument_Index_DME.csv; Draf P&ID DME-PID-002 Rev B"
author: "Ihsaan Zauhair Tsaqif Prawira (penulis Rev 0); revisi Rev 1 oleh Claude Code (AI) atas permintaan PM, WO-029"
reviewer: "Rahul Ghulam Hidayatulloh (PM); reviewer bagian: 1.1 Heidi Falina Brilian, 1.2 Altaf Ramadhan Parvez, 1.3 Jonathan Pangihutan Michael Siahaan"
status: "WIP"
review_evidence: "WO-029"
google_ref: "https://docs.google.com/document/d/1sR0IRYj7mvfL_qnL9qyKI035ig14XihuafEGQR_c62w/edit"
last_updated: "2026-11-05"
tags: ["Laporan PSTF 1", "Bab 1", "URS", "Model Dinamik", "NAMUR Phase 1", "Area-100"]
---

> 📝 **REV 1 (2026-11-05), MENUNGGU REVIEW TIM.** Ini revisi Bab 1 Rev 0 karya Ihsaan, dikerjakan Claude Code (AI) atas permintaan PM (WO-029). Struktur dan isi Rev 0 dipertahankan; yang diubah: data proses diselaraskan dengan HMB DWSIM, tag mengikuti `tag_map.csv`, rujukan pasal RFP dicocokkan dengan PDF asli, model dinamik dilengkapi masukan laju umpan, dan URS ditautkan ke instrumen P&ID. Daftar perubahan ada di **Catatan Revisi** di akhir dokumen (hapus sebelum laporan final). Penulis dan reviewer bagian wajib memeriksa dan memahami isinya sebelum diajukan ulang di Bimbingan 7.

# BAB 1 KONSEPTUALISASI SISTEM (NAMUR PHASE 1)

## 1.1 Latar Belakang dan Evaluasi Dokumen Lelang (RFP/TOR)

### 1.1.1 Profil Proyek Pembangunan Pabrik DME Dehidrasi Metanol DTNTF

Proyek perancangan ini berpijak pada dokumen lelang Kerangka Acuan Kerja (KAK) nomor **KAK-IC-DME-2026-001** yang diterbitkan Departemen Teknik Nuklir dan Teknik Fisika (DTNTF), Fakultas Teknik, Universitas Gadjah Mada, pada 25 Agustus 2026. Paket pekerjaan berupa layanan konsultansi *Front-End Engineering Design* (FEED) dan *Detail Engineering Design* (DED) khusus sistem Instrumentasi dan Kontrol (I&C), dengan batas penawaran FEED 15 Desember 2026 dan DED 30 Juni 2027.

Pabrik DME dibagi menjadi tiga area yang masing-masing dikerjakan satu firma konsultan: **Area 1 (seksi reaktor, firma ini)**, Area 2 (kolom distilasi 1, pemurnian DME), dan Area 3 (kolom distilasi 2, pemulihan metanol beserta loop daur ulang). Seksi reaktor merupakan inti konversi pabrik dalam memproduksi *Dimethyl Ether* (DME), yaitu bahan bakar bersih pengganti LPG sekaligus bahan baku kimia.

Dasar data proses adalah model DWSIM `DME.dwxmz`, yaitu model referensi yang datanya dikutip pada Tabel 1 RFP. Kesesuaiannya telah diperiksa: fraksi mol aliran S-08 sampai S-11 identik dengan RFP. Neraca massa seluruh unit Area 1 tertutup dengan galat maksimum 0,027 %. Peralatan dan aliran Area 1 diberi tag pabrik sesuai peta tag proyek (Tabel 1.1); tag objek DWSIM hanya dipakai di dalam simulasi.

**Tabel 1.1** Peralatan seksi reaktor (Area 1) dan kondisi operasi tunak (HMB DWSIM)

| Tag pabrik | Objek DWSIM | Fungsi | Kondisi operasi tunak |
| :--- | :--- | :--- | :--- |
| P-101 | PUMP-01 | Pompa umpan metanol segar | 1,0 → 15,5 bar(a); 8.321 kg/jam; daya 5,6 kW |
| M-101 / T-101 | MIX-01 | Titik pencampuran umpan segar S-102 dan daur ulang S-114. Pada Draf P&ID diwujudkan sebagai drum umpan T-101 (tag usulan) | 10.553 kg/jam campuran |
| E-101 | HEAT-01 | Pemanas dan penguap umpan reaktor | 25,3 → 250 °C; beban 4.726 kW |
| R-101 | RC-01 | Reaktor katalitik dehidrasi metanol (unggun tetap) | 250 °C; 14,7 bar(a); konversi metanol 80,0 %; panas dibuang 733 kW |
| E-102 | COOL-01 | Pendingin efluen (kondensasi parsial) | 250 → 89 °C; beban 3.246 kW |

**Tabel 1.2** Aliran batas seksi reaktor

| Aliran | Keterangan | T (°C) | P (bar(a)) | Laju massa (kg/jam) | Laju molar (kmol/jam) | Fasa |
| :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| S-101 | Umpan metanol segar (masuk batas) | 25,0 | 1,0 | 8.321,3 | 261,65 | Cair |
| S-102 | Keluaran P-101 | 25,3 | 15,5 | 8.321,3 | 261,65 | Cair |
| S-114 | Daur ulang metanol dari Area 3 (masuk batas) | 25,3 | 15,5 | 2.234,7 | 69,30 | Cair |
| S-103 | Umpan gabungan ke E-101 | 25,3 | 15,5 | 10.553,2 | 330,87 | Cair |
| S-104 | Umpan reaktor (keluaran E-101) | 250,0 | 14,7 | 10.553,2 | 330,87 | Uap |
| S-105 | Efluen reaktor | 250,0 | 14,7 | 10.553,2 | 330,87 | Uap |
| S-107 | Efluen setelah E-102 (keluar batas ke Area 2) | 89,0 | 10,4 | 10.553,2 | 330,87 | Dua fase (fraksi uap 0,069) |

### 1.1.2 Urgensi dan Peran Spesialisasi Sistem Instrumentasi & Kontrol (I&C)

Sistem I&C berfungsi sebagai sistem saraf kendali sekaligus lapisan keselamatan utama seksi reaktor. Reaksi dehidrasi metanol bersifat eksotermik dan reversibel:

$$
2\,\mathrm{CH_3OH} \;\rightleftharpoons\; \mathrm{CH_3OCH_3} + \mathrm{H_2O}, \qquad \Delta H_R < 0
\tag{1.1}
$$

Karakteristik ini menyimpan risiko pelepasan panas berlebih (*thermal runaway*) bila suhu umpan dari E-101 atau laju pembuangan panas reaktor menyimpang dari kondisi aman. Besarnya risiko dapat dikuantifikasi dari HMB: bila pembuangan panas R-101 sebesar 733 kW hilang (kondisi adiabatik), seluruh panas reaksi diserap aliran gas sehingga

$$
\Delta T_{ad} = \frac{\dot Q_R}{\dot m\,\bar c_p} = \frac{733\ \text{kW}}{2{,}931\ \text{kg/s}\times 2{,}063\ \text{kJ/(kg K)}} \approx 121\ \text{K},
\tag{1.2}
$$

sehingga suhu keluar reaktor dapat mencapai sekitar **371 °C**. Nilai ini sejalan dengan catatan pada Draf P&ID (250 → 364 °C). Lonjakan suhu sebesar ini berisiko merusak katalis secara permanen (*sintering*), menaikkan tekanan, dan mengancam integritas bejana.

RFP Pasal 2.1 dan 2.3 menetapkan persyaratan I&C yang mengikat seksi reaktor:
1. pemantauan suhu multi-titik pada reaktor;
2. kontrol kaskade antara *Temperature Controller* (TC) dan *Flow Controller* (FC) pada pompa umpan;
3. interlock SIS/ESD trip suhu tinggi-tinggi yang menutup ESDV pada saluran masuk umpan dalam hitungan detik;
4. transmitter pintar HART atau Foundation Fieldbus yang terhubung ke *Asset Management System* (AMS).

Karena itu perancangan I&C tahap FEED mencakup arsitektur *Distributed Control System* (DCS) untuk kendali regulatori, *Safety Instrumented System* (SIS) independen untuk fungsi trip darurat, dan *Fire and Gas System* (FGS) untuk deteksi gas mudah terbakar di sekitar peralatan reaktor.

### 1.1.3 Batasan Ruang Lingkup yang Dilingkupi (*Inclusion Scope*)

Mengacu pada Pasal 1.2, 3.1, dan 3.3.1 serta Tabel 3 RFP, ruang lingkup FEED I&C seksi reaktor meliputi:

a. **Fondasi desain FEED:** *I&C Design Basis*, filosofi pengoperasian, arsitektur DCS/SIS/FGS terintegrasi, serta antarmuka PLC paket peralatan (Pasal 1.2, 3.1.1).

b. **Perancangan konseptual keselamatan:** identifikasi Fungsi Keselamatan Berinstrumen (SIF), logika matriks sebab-akibat (*Cause & Effect Matrix*) awal untuk proteksi R-101, dan dukungan HAZOP. Target SIL ditetapkan melalui HAZOP dan LOPA (Pasal 3.1.2); penetapan definitif dilakukan pada PSTF 2.

c. **Spesifikasi kebutuhan instrumen:** kebutuhan katup kontrol, katup pengaman (PSV), dan transmitter suhu multi-titik, tekanan, aliran, serta level sebagai dasar sizing dan lembar data pada tahap DED (Pasal 1.2, 3.2.1).

d. **Diagram FEED:** PFD khusus I&C dengan pemetaan simpul kontrol utama dan Draf P&ID seksi reaktor sesuai ANSI/ISA-5.1 (Pasal 3.1.2; Tabel 3 No. 2).

e. **Estimasi biaya I&C:** CAPEX **Class 2** (Tabel 3 RFP; Pasal 3.3.1 menyebut Class 2/3) dan OPEX khusus disiplin I&C. CAPEX mencakup *hardware/software* sistem kontrol, katup, kabel, dan panel. OPEX mencakup kalibrasi berkala, pemeliharaan AMS, dan lisensi perangkat lunak.

Serahan FEED menurut Tabel 3 RFP adalah URS I&C, PFD/P&ID I&C *overlay*, *I&C Design Basis* dan *Control Narrative*, serta estimasi CAPEX/OPEX I&C. Gambar loop, *hook-up*, *cable schedule*, *Material Requisition*, dan TBE merupakan serahan DED (PSTF 2).

### 1.1.4 Batasan Ruang Lingkup yang Tidak Dilingkupi (*Exclusion Scope*)

Berdasarkan Pasal 1.3 RFP, pekerjaan konsultan **tidak** mencakup:

a. disiplin non-I&C, yaitu sipil umum, struktur, kalkulasi mekanikal bejana tekan (termasuk R-101 dan T-101), serta perpipaan proses non-instrumen;

b. pengadaan fisik instrumen, pabrikasi panel, instalasi kabel/*tubing*, konstruksi, dan komisioning lapangan.

Selain itu, berdasarkan **pembagian area pabrik** (bukan ketentuan RFP), kolom distilasi 1 (Area 2) serta kolom distilasi 2 dan loop daur ulang (Area 3) dikerjakan firma lain. Antarmuka Area 1 dengan area lain adalah aliran keluar **S-107** ke Area 2 dan aliran daur ulang masuk **S-114** dari Area 3.

### 1.1.5 Matriks Kepatuhan Kode dan Standar Internasional

**Tabel 1.3** Matriks kepatuhan kode dan standar

| No. | Kode / Standar | Cakupan penerapan |
| :---: | :--- | :--- |
| 1 | NAMUR NA 35 | Tata kelola fase konseptual dan rekayasa dasar (FEED) sistem kontrol proses |
| 2 | ANSI/ISA-5.1-2009 | Simbol instrumen, identifikasi loop, penamaan tag, dan garis sinyal pada Draf P&ID |
| 3 | ISO 10628 | Diagram alir proses (PFD) dan simbol peralatan |
| 4 | ANSI/ISA-5.06.01-2007 | URS, narasi kendali (*Control Narrative*), interlock, dan sekuens operasi |
| 5 | IEC 61508 / IEC 61511 (ANSI/ISA-84.00.01) | Keselamatan fungsional SIS, SIF, target dan verifikasi SIL (RFP Pasal 5.2) |
| 6 | API 520 / 521 / 526 | Sizing dan spesifikasi katup pengaman tekanan (RFP Pasal 3.2.1) |
| 7 | ANSI/ISA-75.01 / IEC 60534-2-1 | Sizing katup kontrol (RFP Pasal 3.2.1) |
| 8 | ANSI/ISA-101.01 | Antarmuka operator (*High-Performance HMI*) |
| 9 | ANSI/ISA-18.2 / EEMUA 191 | Manajemen alarm dan pencegahan *alarm flood* |
| 10 | IEC 60079 / NFPA 70 (NEC) | Instrumen di area atmosfer mudah meledak (uap metanol, gas DME) |
| 11 | AACE International RP 18R-97 | Klasifikasi estimasi biaya (CAPEX Class 2) untuk Bab 4 |

## 1.2 Penurunan Teori Model Sains Sistem (*First-Principle Modeling*)

### 1.2.1 Kinetika, Termodinamika, dan Potensi *Thermal Runaway*

Dehidrasi metanol berlangsung dalam fasa uap di atas katalis asam padat (umumnya γ-Al₂O₃). Entalpi reaksi standar bernilai sekitar $\Delta H^\circ_{298} \approx -23{,}5$ kJ/mol DME. Dari HMB DWSIM dapat diturunkan entalpi reaksi efektif pada kondisi operasi: pada R-101 terbentuk 127,9 kmol/jam DME dengan panas yang dibuang 733 kW, sehingga

$$
\Delta H_{R,\,523\,K} \approx -\frac{733\ \text{kW}\times 3600}{127{,}9\ \text{kmol/jam}} \approx -20{,}6\ \text{kJ/mol DME},
\tag{1.3}
$$

yang konsisten dengan nilai literatur setelah koreksi suhu. Konversi metanol pada model adalah **80,0 %** (319,7 → 64,0 kmol/jam metanol).

Perlu dicatat bahwa R-101 pada DWSIM dimodelkan sebagai *Conversion Reactor* (konversi tetap), bukan model kinetika. Model DWSIM dipakai sebagai dasar kondisi tunak, sedangkan analisis dinamika dan kendali memerlukan persamaan laju. Untuk γ-Al₂O₃, laju intrinsik yang banyak dipakai mengikuti mekanisme Langmuir–Hinshelwood (Berčič & Levec, 1992):

$$
r = \frac{k_s K_M^2\left(C_M^2 - \dfrac{C_W C_D}{K_{eq}}\right)}{\left(1 + 2\sqrt{K_M C_M} + K_W C_W\right)^4},
\tag{1.4}
$$

dengan $C_M$, $C_W$, $C_D$ konsentrasi metanol, air, dan DME; $K_M$, $K_W$ konstanta adsorpsi; dan $K_{eq}$ konstanta kesetimbangan. Konstanta laju mengikuti persamaan Arrhenius:

$$
k_s(T) = k_0 \exp\!\left(-\frac{E_a}{RT}\right).
\tag{1.5}
$$

Nilai $k_0$, $E_a$, $K_M$, $K_W$, dan $K_{eq}(T)$ diambil langsung dari sumber tersebut atau dari data vendor katalis (butir terbuka TBD-04). Untuk keperluan linearisasi, Persamaan (1.4) dapat didekati dengan bentuk aksi massa $r \approx k(T)\left(C_M^2 - C_W C_D/K_{eq}\right)$.

Ketergantungan eksponensial laju reaksi terhadap suhu memicu ketidakstabilan termal. Kenaikan suhu mempercepat reaksi dan melepaskan panas lebih banyak. Bila laju pembangkitan panas melampaui kemampuan pembuangan panas oleh aliran gas dan sistem pendingin reaktor, kalor terakumulasi di unggun katalis. Persamaan (1.2) menunjukkan batas atas kenaikan suhu tersebut.

### 1.2.2 Model Dinamik Reaktor R-101

Model diturunkan dari hukum kekekalan massa dan energi pada volume atur reaktor, dengan asumsi:

a. **Parameter tergumpal (*lumped*):** unggun dianggap tercampur merata (*pseudo-homogeneous*). Ini penyederhanaan untuk analisis kendali; distribusi suhu aksial unggun tetap dipantau dengan elemen multi-titik TE-101.

b. Densitas gas $\rho$ dan kapasitas panas $c_p$ konstan di sekitar titik operasi. Jumlah mol gas tidak berubah oleh reaksi (2 mol → 2 mol), sehingga laju volumetrik $Q_v = F/\rho$ konstan.

c. Kapasitas panas efektif $(Mc_p)_{\text{eff}} = M_g c_p + M_{cat} c_{cat}$ mencakup gas dan katalis. Massa katalis mendominasi inersia termal unggun.

d. **Basis kondisi tunak mengikuti DWSIM:** reaktor beroperasi isotermal 250 °C dengan pembuangan panas $\dot Q_{rem}$ = 733 kW. Pembuangan panas dimodelkan sebagai $UA\,(T - T_c)$. Mekanisme fisiknya (media pendingin, pendingin antar-unggun, atau pengaturan suhu umpan) belum ditetapkan pada PFD/P&ID (butir terbuka TBD-05). Skenario hilangnya pembuangan panas (adiabatik) dipakai sebagai kasus bahaya pada subbab 1.2.1.

Umpan S-104 masuk dengan laju massa $F$ dan suhu $T_{in}$; efluen S-105 keluar pada suhu $T$. Neraca massa total dan neraca komponen metanol:

$$
\frac{dM_R}{dt} = F_{in} - F_{out} \;\;\Rightarrow\;\; F_{in} = F_{out} = F \ \ \text{(tunak)},
\tag{1.6}
$$

$$
V_R\,\frac{dC_M}{dt} = \frac{F}{\rho}\left(C_{M,in} - C_M\right) - 2\,r(C_M, T)\,V_R .
\tag{1.7}
$$

Neraca energi:

$$
(Mc_p)_{\text{eff}}\,\frac{dT}{dt} = F c_p\,(T_{in} - T) + (-\Delta H_R)\,r(C_M, T)\,V_R - UA\,(T - T_c).
\tag{1.8}
$$

Persamaan (1.7)–(1.8) nonlinear karena laju reaksi bergantung secara eksponensial pada suhu dan kuadratik pada konsentrasi metanol.

### 1.2.3 Linearisasi di Sekitar Titik Operasi Tunak

Variabel deviasi didefinisikan terhadap titik tunak $(C_{M,s}, T_s, F_s, T_{in,s})$:

$$
C_M' = C_M - C_{M,s},\quad T' = T - T_s,\quad F' = F - F_s,\quad T_{in}' = T_{in} - T_{in,s}.
\tag{1.9}
$$

Ekspansi Taylor orde pertama terhadap $C_M$, $T$, dan $F$ menghasilkan sistem keadaan $\dot{\mathbf{x}} = A\mathbf{x} + B\mathbf{u}$ dengan $\mathbf{x} = [C_M',\ T']^{\mathsf T}$ dan $\mathbf{u} = [F',\ T_{in}']^{\mathsf T}$:

$$
A=\begin{bmatrix}
-\dfrac{F_s}{\rho V_R}-2r_C & -2r_T\\[2mm]
\dfrac{(-\Delta H_R)V_R\,r_C}{(Mc_p)_{\text{eff}}} & \dfrac{-F_s c_p-UA+(-\Delta H_R)V_R\,r_T}{(Mc_p)_{\text{eff}}}
\end{bmatrix},
\qquad
B=\begin{bmatrix}
\dfrac{C_{M,in}-C_{M,s}}{\rho V_R} & 0\\[2mm]
\dfrac{c_p\,(T_{in,s}-T_s)}{(Mc_p)_{\text{eff}}} & \dfrac{F_s c_p}{(Mc_p)_{\text{eff}}}
\end{bmatrix},
\tag{1.10}
$$

dengan $r_C = \partial r/\partial C_M$ dan $r_T = \partial r/\partial T$ dievaluasi pada titik tunak. Elemen matriks ditulis $a_{ij}$ dan $b_{ij}$.

### 1.2.4 Fungsi Alih (*Transfer Function*) Kawasan Laplace

Transformasi Laplace dengan kondisi awal nol memberikan $T'(s) = [0\ \ 1]\,(sI - A)^{-1} B\,\mathbf{u}(s)$. Dengan polinom karakteristik

$$
D(s) = s^2 - (a_{11}+a_{22})\,s + (a_{11}a_{22} - a_{12}a_{21}),
\tag{1.11}
$$

fungsi alih suhu reaktor terhadap **suhu umpan** dan terhadap **laju umpan** adalah

$$
G_{T,T_{in}}(s) = \frac{T'(s)}{T_{in}'(s)} = \frac{b_{22}\,(s - a_{11})}{D(s)},
\qquad
G_{T,F}(s) = \frac{T'(s)}{F'(s)} = \frac{b_{21}\,(s - a_{11}) + a_{21}\,b_{11}}{D(s)}.
\tag{1.12}
$$

Dua hal penting untuk strategi kendali:

1. **Kestabilan lingkar terbuka** menuntut $a_{11}+a_{22} < 0$ dan $a_{11}a_{22} - a_{12}a_{21} > 0$. Secara fisik, pembuangan panas oleh aliran gas dan pendingin ($F_s c_p + UA$) harus melampaui sensitivitas pembangkitan panas terhadap suhu, $(-\Delta H_R)V_R\,r_T$. Bila syarat ini dilanggar, kutub berpindah ke bidang-s kanan, dan reaktor hanya dapat dioperasikan dengan kendali aktif dan lapisan SIS.

2. **Laju umpan sebagai variabel manipulasi.** Pada basis DWSIM, $T_{in,s} = T_s = 250$ °C sehingga $b_{21} \approx 0$, dan $G_{T,F}(s) \approx a_{21}b_{11}/D(s)$. Artinya laju umpan memengaruhi suhu reaktor terutama melalui ketersediaan metanol: lebih banyak umpan berarti lebih banyak panas reaksi. Karena itu RFP Pasal 2.1 mensyaratkan kaskade: pengendali suhu reaktor **TIC-101** (*master*, elemen multi-titik TE-101/TT-101) memberikan setpoint ke pengendali laju umpan **FIC-101** (*slave*, FT-101 pada orifice FE-101) yang menggerakkan katup **FV-101** pada *discharge* P-101.

Untuk penalaan (*tuning*) PID, model orde dua di atas dapat didekati dengan model *First-Order Plus Dead-Time* (FOPDT):

$$
G(s) \approx \frac{K_p}{\tau s + 1}\,e^{-\theta s},
\tag{1.13}
$$

dengan $K_p$, $\tau$, dan $\theta$ diidentifikasi dari respons tangga model nonlinear (1.7)–(1.8) atau simulasi dinamik.

### 1.2.5 Waktu Mati ($\theta$) dan Konstanta Waktu ($\tau$)

**Waktu mati transportasi** antara E-101 dan R-101 dihitung dari kecepatan gas pada line 6"-P-104. Ukuran pipa ini hasil *line sizing*: NPS 6 Sch 40, diameter dalam 154,1 mm.

$$
v = \frac{F}{\rho A_p} = \frac{2{,}931\ \text{kg/s}}{10{,}78\ \text{kg/m}^3 \times 0{,}01864\ \text{m}^2} = 14{,}6\ \text{m/s},
\qquad
\theta_{pipa} = \frac{L_p}{v} \approx 0{,}069\ \text{s per meter pipa}.
\tag{1.14}
$$

Untuk panjang pipa transfer 10–30 m (tata letak belum ditetapkan), $\theta_{pipa}$ hanya 0,7–2 detik. Waktu mati efektif loop suhu karena itu didominasi oleh **kelambatan sensor** (termokopel di dalam thermowell, orde puluhan detik menurut data vendor) dan **inersia termal unggun katalis**, bukan oleh transportasi gas.

**Konstanta waktu termal** reaktor dari Persamaan (1.8) adalah

$$
\tau_{th} \approx \frac{(Mc_p)_{\text{eff}}}{F_s c_p + UA - (-\Delta H_R)V_R\,r_T},
\qquad F_s c_p = 2{,}931 \times 2{,}063 \approx 6{,}05\ \text{kW/K}.
\tag{1.15}
$$

Pembilangnya didominasi massa katalis, sehingga $\tau_{th}$ diperkirakan dalam orde menit. Nilai numeriknya memerlukan volume reaktor dan massa katalis (TBD-05). Waktu tinggal gas di unggun adalah $\tau_{res} = \varepsilon V_R / Q_v$ dengan $Q_v$ = 0,272 m³/s.

Implikasi bagi perancangan instrumen:

a. Rasio $\theta/\tau$ yang kecil (waktu mati detik terhadap konstanta waktu menit) memungkinkan kendali PID kaskade yang responsif, asalkan sensor suhu cepat dan ditempatkan di titik panas unggun.

b. Kelambatan sensor adalah komponen waktu mati terbesar. Pemilihan elemen suhu (diameter thermowell, kontak termal) pada tahap DED harus memperhitungkannya. Thermowell yang lebih ramping mempercepat respons, tetapi wajib lolos verifikasi getaran ASME PTC 19.3 TW.

c. Parameter $K_p$, $\tau$, dan $\theta$ akhir diidentifikasi pada simulasi dinamik dan diverifikasi pada *Virtual FAT* (PSTF 2).

## 1.3 Spesifikasi Kebutuhan Pengguna (*User Requirement Specification*, URS)

URS ini disusun mengacu pada ANSI/ISA-5.06.01-2007 dan memenuhi RFP Pasal 3.1.1. Pasal tersebut mewajibkan URS memuat kualifikasi fungsional, standar industri, kriteria keandalan, redundansi *hardware*, dan persyaratan performa HMI. Setiap persyaratan dapat diukur, diverifikasi, dan ditelusuri ke tag instrumen pada Master Instrument Index dan Draf P&ID DME-PID-002.

**Tabel 1.4** Identifikasi dokumen URS

| Parameter | Data |
| :--- | :--- |
| Nomor dokumen URS | URS-IC-DME-REA-001 |
| Nama paket pekerjaan | Sistem Instrumentasi dan Kontrol Seksi Reaktor Dehidrasi Metanol (Area 1) |
| Peralatan terkait | P-101, M-101/T-101, E-101, R-101, E-102 |
| Batas aliran proses | S-101 sampai S-107, termasuk daur ulang masuk S-114 |
| Dokumen acuan | KAK-IC-DME-2026-001; HMB DWSIM `DME.dwxmz`; Draf P&ID DME-PID-002 |
| Kategori perangkat lunak | GAMP Category 4 (DCS/SIS berbasis modul fungsi terkonfigurasi) |
| Tahap siklus desain | FEED (NAMUR Phase 1–2) |

Setiap butir diberi nomor (*Req ID*) dan tingkat kekritisan:
- **CRITICAL (C):** berdampak langsung pada integritas bejana, pencegahan *thermal runaway*, keselamatan personel, dan trip darurat (SIS/ESD).
- **HIGH (H):** berdampak pada konversi, kestabilan umpan, dan ketersediaan sistem kendali.
- **MEDIUM (M):** ergonomi ruang kendali (CCR), navigasi HMI, dan pemeliharaan.

Pada tahap FEED, seluruh butir diverifikasi melalui *Design Qualification* (DQ): tinjauan desain terhadap P&ID, FDS, dan C&E. Butir C dan H juga diuji pada simulasi dinamik dan *Virtual FAT* di tahap DED (PSTF 2).

### 1.3.1 Titik Nominal Operasi dan Toleransi Proses (Berbasis HMB DWSIM)

**Tabel 1.5** Persyaratan titik nominal operasi dan toleransi proses

| Req ID | Persyaratan | Batas kuantitatif / kriteria penerimaan | Instrumen (P&ID) | Dasar | Crit. |
| :--- | :--- | :--- | :--- | :--- | :---: |
| URS-011 | Regulasi laju umpan metanol segar S-102 (*discharge* P-101) sebagai *slave* kaskade | Nominal 8.321,3 kg/jam (261,65 kmol/jam); deviasi ≤ ±2,0 % dari setpoint. Umpan total reaktor S-103 = 10.553,2 kg/jam (segar + daur ulang S-114 2.234,7 kg/jam) | FE-101, FT-101, FIC-101, FV-101 (FC) | HMB DWSIM; RFP 2.1 | H |
| URS-012 | Pengendalian suhu unggun R-101 (*master* kaskade) dan pemantauan suhu umpan S-104 | Suhu umpan nominal 250 °C (beban E-101 4.726 kW), alarm suhu tinggi TAH-104. Suhu unggun dikendalikan dengan akurasi ≤ ±1,5 °C. Batas atas operasi dari spesifikasi katalis (TBD-04) | TE-101, TT-101, TIC-101; TT-104, TAH-104 | HMB DWSIM; RFP 2.1 | C |
| URS-013 | Pemantauan tekanan R-101 dan ΔP unggun katalis | Tekanan nominal 14,7 bar(a) (1.470 kPa) ±0,5 bar, alarm tekanan tinggi. Kenaikan ΔP unggun ≤ 25 kPa di atas kondisi unggun bersih (indikasi *fouling*) | PT-103; transmitter ΔP unggun (TBD-06) | HMB DWSIM; integritas reaktor | H |
| URS-014 | Pengendalian suhu efluen S-107 keluaran E-102 | Nominal 89 °C ±2,0 °C (beban E-102 3.246 kW); katup air pendingin *fail-open* | TT-109, TIC-109, TV-109 (FO) | HMB DWSIM; antarmuka Area 2 | H |
| URS-015 | Pengendalian level drum umpan T-101 | Setpoint 50 %, alarm level rendah untuk mencegah kehilangan umpan ke E-101; gelas penduga lokal | LT-105, LIC-105, LV-105 (FC), LAL-105, LG-105 | Draf P&ID; kontinuitas umpan | H |

### 1.3.2 Ambang Batas Pengaman Kritis dan Persyaratan *Interlock* ESD

Seksi reaktor dilengkapi lapisan SIS yang independen dari DCS. Fungsi trip tidak dapat dibatalkan (*non-overridable*) oleh operator selama operasi normal. *Bypass* hanya diizinkan melalui prosedur *maintenance override* yang terotorisasi.

**Tabel 1.6** Persyaratan pengaman kritis dan interlock ESD

| Req ID | Persyaratan | Batas kuantitatif / kriteria penerimaan | Instrumen (P&ID) | Dasar | Crit. |
| :--- | :--- | :--- | :--- | :--- | :---: |
| URS-021 | Trip suhu tinggi-tinggi R-101 dengan sensor terpisah dari loop kendali | Tiga elemen suhu dengan voting 2oo3 pada *logic solver* SIS. Setpoint di bawah batas suhu katalis dan jauh di bawah suhu adiabatik ≈ 371 °C; nilai dan target SIL dari HAZOP/LOPA (TBD-03) | TE-102A/B/C, TSHH-102 | RFP 2.1; IEC 61511 | C |
| URS-022 | Penutupan katup darurat saluran masuk umpan reaktor | Waktu tutup penuh < 2 detik; *fail-close*, *de-energize-to-trip*; alarm trip di HMI | XV-102, XY-102, XA-102 | RFP 2.1 ("dalam hitungan detik") | C |
| URS-023 | Penghentian pompa umpan saat trip suhu | P-101 berhenti < 1 detik setelah TSHH-102 aktif (C&E). Isolasi media pemanas E-101 dievaluasi di HAZOP (TBD-06) | P-101 (C&E) | Matriks C&E | C |
| URS-024 | Proteksi tekanan lebih R-101 | PSV-101 berpegas, set ≤ tekanan desain R-101 (TBD-01), buangan tertutup ke flare. Alarm tekanan tinggi dari PT-103 di DCS. Trip tekanan tinggi-tinggi berinstrumen hanya ditambahkan bila HAZOP/LOPA mensyaratkan (dengan transmitter 2oo3 terpisah) | PSV-101, PT-103 | API 520/521/526 | C |
| URS-025 | Proteksi tekanan lebih drum T-101 | PSV-102 berpegas, set ≤ tekanan desain T-101 (TBD-07) | PSV-102, PT-106 | API 520/521 | H |

### 1.3.3 Arsitektur Keandalan Sistem (*Hardware Redundancy* & *Availability*)

Seksi reaktor beroperasi kontinu tanpa bejana cadangan, sehingga keandalan sistem kendali dan keselamatan menjadi persyaratan pemilik (RFP Pasal 3.1.1). Nilai kuantitatif berikut adalah **target desain firma**; RFP tidak menetapkan angkanya.

**Tabel 1.7** Persyaratan keandalan dan redundansi

| Req ID | Persyaratan | Batas kuantitatif / kriteria penerimaan | Dasar | Crit. |
| :--- | :--- | :--- | :--- | :---: |
| URS-031 | Ketersediaan sistem DCS dan *logic solver* SIS | ≥ 99,99 % per tahun operasi (target desain) | RFP 3.1.1 (kriteria keandalan) | C |
| URS-032 | Redundansi CPU, catu daya, dan bus komunikasi kontroler | Redundansi ganda (1oo2, *hot standby*); catu daya ganda dengan UPS | RFP 3.1.1 (redundansi *hardware*) | C |
| URS-033 | Arsitektur voting sensor SIF | 2oo3 untuk TSHH-102 (TE-102A/B/C), agar trip palsu (*spurious trip*) berkurang tanpa mengurangi keselamatan. Arsitektur SIF lain mengikuti hasil LOPA | IEC 61511 | C |
| URS-034 | Pemisahan I/O DCS dan SIS | Modul I/O SIS terpisah dan terisolasi galvanis dari kartu kendali regulatori DCS | IEC 61511 | C |
| URS-035 | Transmitter pintar dan manajemen aset | Seluruh transmitter berprotokol HART (atau Foundation Fieldbus) dan terhubung ke AMS untuk pemeliharaan prediktif | RFP 2.3 | H |

### 1.3.4 Proteksi Lingkungan Fisik, Area Berbahaya, dan Deteksi Gas

**Tabel 1.8** Persyaratan proteksi lingkungan, area berbahaya, dan FGS

| Req ID | Persyaratan | Batas kuantitatif / kriteria penerimaan | Dasar | Crit. |
| :--- | :--- | :--- | :--- | :---: |
| URS-041 | Proteksi selungkup transmitter, *junction box*, dan aktuator | Minimum IP-65 / NEMA 4X | IEC 60529 | M |
| URS-042 | Sertifikasi instrumen di atmosfer gas mudah terbakar | Klasifikasi Zone 1 / Zone 2; Gas Group **IIB** (DME; metanol IIA tercakup); Temperature Class T3 (≤ 200 °C) atau lebih ketat | IEC 60079; RFP 3.3.1 (instrumen area berbahaya) | C |
| URS-043 | Metode proteksi rangkaian di zona eksplosif | *Explosion-proof* (Ex d) atau *intrinsically safe* (Ex i) sesuai klasifikasi zona | IEC 60079; API RP 551 | C |
| URS-044 | Deteksi gas mudah terbakar di sekitar peralatan reaktor | Detektor gas (metanol/DME) di sekitar P-101, E-101, R-101, dan sambungan flens utama, terhubung ke FGS. Jumlah, lokasi, dan ambang alarm ditetapkan dalam FGS *philosophy* (PSTF 2) | RFP 1.2 (FGS) | H |

### 1.3.5 Antarmuka Operator (ISA-101) dan Manajemen Alarm (ISA-18.2)

**Tabel 1.9** Persyaratan antarmuka operator dan manajemen alarm

| Req ID | Persyaratan | Batas kuantitatif / kriteria penerimaan | Dasar | Crit. |
| :--- | :--- | :--- | :--- | :---: |
| URS-051 | Desain tampilan stasiun kerja operator CCR | Latar abu-abu netral; warna kontras hanya untuk kondisi abnormal/alarm | ANSI/ISA-101.01 | M |
| URS-052 | Laju pembaruan data HMI | Variabel proses ≤ 500 ms; status biner katup/pompa ≤ 250 ms | Kriteria respons HMI | M |
| URS-053 | Hierarki prioritas alarm | Empat tingkat: Trip/Emergency (merah), High (kuning), Medium/Low (jingga/biru), Diagnostic (abu-abu). Alarm saat ini: XA-102 (trip), TAH-104, LAL-105 | ANSI/ISA-18.2 | H |
| URS-054 | Pencegahan *alarm flood* | Target operasi normal ≤ 1–2 alarm per 10 menit per operator; > 10 alarm per 10 menit dianggap *flood* dan diredam dengan *dynamic suppression* saat start-up, shutdown, atau trip | ANSI/ISA-18.2; EEMUA 191 | H |

### 1.3.6 Kriteria Penerimaan Desain dan Butir Terbuka

Paket desain kendali dan keselamatan seksi reaktor dinyatakan memenuhi tahap FEED dan layak dilanjutkan ke DED (PSTF 2) bila:

a. seluruh butir CRITICAL dan HIGH lolos *Design Qualification*, yaitu tertuang konsisten pada FDS (Bab 2), Draf P&ID, Master Instrument Index, dan matriks C&E;

b. seluruh nilai proses pada URS konsisten dengan HMB DWSIM (neraca massa tertutup ≤ 0,5 %);

c. matriks ketertelusuran RFP → model → URS → instrumen (subbab 1.3.7) lengkap tanpa celah;

d. butir terbuka berikut tercatat dan memiliki rencana penutupan.

**Tabel 1.10** Butir terbuka (*open items*)

| Kode | Butir terbuka | Penutupan |
| :--- | :--- | :--- |
| TBD-01 | Tekanan desain R-101 dan sizing PSV-101 (API 520/521: *fire case* dan *blocked outlet*) | Bab 2 PSTF 2; perhitungan awal tersedia sebagai verifikasi silang |
| TBD-02 | Sizing katup kontrol FV-101, LV-105, dan TV-109 (ISA-75.01 / IEC 60534). Perkiraan awal FV-101: Kv 9,4 (normal) / 11,7 (maks.) pada line 2" | Bab 2 PSTF 2 (perhitungan manual) |
| TBD-03 | Setpoint TSHH-102 dan target SIL seluruh SIF | HAZOP + LOPA, PSTF 2 |
| TBD-04 | Parameter kinetika ($k_0$, $E_a$, $K_M$, $K_W$, $K_{eq}$) dan suhu maksimum katalis | Literatur / data vendor katalis, W13–W14 |
| TBD-05 | Mekanisme pembuangan panas R-101, volume reaktor, dan massa katalis (untuk $\tau_{th}$) | Disiplin proses (IH), W13–W14 |
| TBD-06 | Transmitter ΔP unggun katalis dan kendali/isolasi media pemanas E-101 pada P&ID | Draf P&ID Rev C (JN), W13 |
| TBD-07 | Status T-101 (drum umpan) terhadap M-101 DWSIM dan tekanan desain T-101 | Konfirmasi IH + JN, W13 |

### 1.3.7 Matriks Ketertelusuran (*Traceability Matrix*)

**Tabel 1.11** Ketertelusuran persyaratan RFP → model → URS → instrumen

| Persyaratan RFP | Model / analisis (1.2) | Butir URS | Instrumen / dokumen |
| :--- | :--- | :--- | :--- |
| 2.1 Pemantauan suhu multi-titik reaktor | Persamaan (1.8), distribusi suhu unggun | URS-012 | TE-101, TT-101 |
| 2.1 Kaskade TC ↔ FC pompa umpan | $G_{T,F}(s)$ Persamaan (1.12) | URS-011, URS-012 | TIC-101 → FIC-101 → FV-101; FDS Bab 2 |
| 2.1 Trip suhu HH menutup ESDV dalam hitungan detik | $\Delta T_{ad}$ Persamaan (1.2) | URS-021, 022, 023 | TE-102A/B/C, TSHH-102, XV-102, XY-102, XA-102; C&E |
| 2.1 Pengawasan tekanan umpan/reaktor | Kondisi tunak 14,7 bar(a) | URS-013, URS-024 | PT-103, PSV-101 |
| 2.3 Transmitter HART/FF + AMS | – | URS-035 | Kolom SIGNAL_TYPE Instrument Index |
| 3.1.1 Keandalan & redundansi hardware | – | URS-031 s.d. 034 | Arsitektur DCS/SIS (PSTF 2) |
| 3.1.1 Performa HMI & manajemen alarm | – | URS-051 s.d. 054 | Alarm database |
| 1.2 FGS | – | URS-044 | FGS *philosophy* (PSTF 2) |
| 3.3.1 Instrumen area berbahaya | – | URS-041 s.d. 043 | Lembar data instrumen (PSTF 2) |
| Tabel 3 No. 4 CAPEX/OPEX I&C Class 2 | – | – | Bab 4 |

## Daftar Pustaka Bab 1

1. DTNTF FT UGM. (2026). *Request for Proposal (RFP) Layanan Jasa Konsultansi Perekayasaan FEED & DED Sistem I&C Pabrik DME*, KAK-IC-DME-2026-001.
2. DTNTF FT UGM. (2026). *Panduan Capstone Design DTNTF 2026*.
3. Berčič, G., & Levec, J. (1992). Intrinsic and global reaction rate of methanol dehydration over γ-Al₂O₃ pellets. *Industrial & Engineering Chemistry Research*, 31(4), 1035–1040.
4. Seborg, D. E., Edgar, T. F., Mellichamp, D. A., & Doyle, F. J. (2016). *Process Dynamics and Control* (4th ed.). Wiley.
5. ANSI/ISA-5.1-2009; ANSI/ISA-5.06.01-2007; ANSI/ISA-18.2-2016; ANSI/ISA-101.01-2015; IEC 61511; IEC 60079; API 520/521/526; AACE International RP 18R-97.

> Catatan untuk penulis: periksa kembali halaman/volume pustaka no. 3 dan nilai $\Delta H^\circ_{298}$ terhadap sumber aslinya sebelum laporan final.

---

## Catatan Revisi Rev 0 → Rev 1 (untuk tim; hapus sebelum laporan final)

| No | Bagian | Rev 0 | Rev 1 | Alasan |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Seluruh bab | Tag DWSIM (PUMP-01, MIX-01, HEAT-01, RC-01, COOL-01, S-01…S-07, S-14, PSV-01) | Tag pabrik (P-101, M-101/T-101, E-101, R-101, E-102, S-101…S-107, S-114, PSV-101) | `tag_map.csv` FINAL; arahan dosen "PFD dan P&ID harus sesuai" |
| 2 | URS-011 | 4.661,67 kg/jam (202,98 kmol/jam) untuk S-03 | S-102 8.321,3 kg/jam (FIC-101); S-103 10.553,2 kg/jam | Angka Rev 0 adalah aliran **S-09** (bawah kolom Area 2) |
| 3 | URS-013, URS-023 | Tekanan reaktor 101,325 kPa; PAHH 121,6 kPa | 14,7 bar(a) = 1.470 kPa; proteksi tekanan via PSV-101 + alarm PT-103; PAHH berinstrumen hanya bila LOPA mensyaratkan | Angka Rev 0 adalah tekanan S-09; P&ID tidak memiliki transmitter tekanan SIS |
| 4 | URS-014 | Beban E-102 3.037,23 kW | 3.245,6 kW; S-107 89 °C (TIC-109) | HMB DWSIM terbaru |
| 5 | URS-012 | Rentang setpoint 250–280 °C "KAK Pasal 2.1" | 250 °C (HMB); batas atas dari spesifikasi katalis | RFP tidak menyebut rentang 250–280 °C |
| 6 | URS-031/032 | Dasar "KAK Pasal 1.2 / 3.1.1" untuk 99,99 % dan 1oo2 | Dinyatakan sebagai target desain firma; RFP 3.1.1 hanya mewajibkan kriteria keandalan/redundansi | Angka tersebut tidak ada di RFP |
| 7 | 1.1.4 | Pengecualian distilasi "berdasarkan Pasal 1.3" | Pengecualian berdasarkan pembagian area; RFP justru mencakup C&E kolom distilasi | Kesesuaian dengan PDF RFP |
| 8 | 1.2.2 | Reaktor adiabatik ($Q_{loss} \approx 0$) | Basis isotermal DWSIM dengan pembuangan 733 kW; adiabatik sebagai kasus bahaya (ΔT_ad ≈ 121 K) | DWSIM: S-104 = S-105 = 250 °C, duty R-101 −733 kW |
| 9 | 1.2.3–1.2.4 | Fungsi alih hanya $T/T_{in}$; suku $F'$ dibuang | Model 2 keadaan ($C_M$, $T$); ditambah $G_{T,F}(s)$ | Variabel manipulasi kaskade RFP adalah laju umpan |
| 10 | 1.2.1 | "Model kinetika DWSIM tervalidasi"; laju aksi massa tanpa sumber | DWSIM = *Conversion Reactor* (konversi 80 %); laju LH Berčič & Levec; ΔH efektif −20,6 kJ/mol dari HMB | Kejujuran basis model |
| 11 | 1.2.5 | Hanya rumus θ dan τ | Nilai numerik θ (0,069 s/m pipa 6"), $F_s c_p$, $Q_v$; dominasi lag sensor dan katalis | Model harus terkuantifikasi |
| 12 | 1.3 | URS tanpa tautan instrumen | Kolom instrumen P&ID; tambahan URS-015, 025, 035, 044; matriks ketertelusuran 1.3.7 | Ketertelusuran yang dijanjikan 1.3.6c |
| 13 | 1.3.6 | Kelulusan FEED mensyaratkan Virtual FAT | FEED: DQ; Virtual FAT di PSTF 2 | Virtual FAT adalah tahap DED |
| 14 | Lain-lain | Persamaan reaksi ganda; CAPEX "Class 2/3"; Gas Group IIA/IIB; tanpa pustaka | Satu persamaan; Class 2 (Tabel 3 RFP); Gas Group IIB; daftar pustaka | Konsistensi |
