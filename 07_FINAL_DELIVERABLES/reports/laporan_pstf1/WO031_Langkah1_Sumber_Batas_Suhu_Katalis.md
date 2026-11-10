# WO-031 Langkah 1 — Sumber Batas Suhu Katalis & Parameter Kinetika (TBD-04)

**Status:** DRAF PENELUSURAN, belum diverifikasi ke naskah asli. Semua angka di bawah berasal dari kutipan sekunder (abstrak, cuplikan mesin pencari, laporan desain yang mengutip sumber). **Jangan dikutip di laporan sebelum dicek ke sumber primer** (lihat kolom "Perlu dicek").
**PIC WO-031:** Ihsaan (IH), pendukung Jonathan (JN)
**Disusun:** 2026-11-10, Claude Code (AI) atas instruksi PM

## 1. Ringkasan temuan

| No | Temuan | Nilai | Sumber | Perlu dicek |
|---|---|---|---|---|
| 1 | Batas atas suhu katalis (deaktivasi signifikan) | **> 400 °C**; reaktor dirancang agar suhu ini tidak terlampaui di titik mana pun | Turton dkk., *Production of Dimethyl Ether — Background* (bahan studi kasus WVU) | Ya: katalis di Turton adalah **zeolit asam**, bukan γ-Al₂O₃ |
| 2 | Rentang operasi reaksi fase gas | di atas 250 °C dan di bawah 400 °C | Turton (dikutip laporan AIChE Student Design) | Ya |
| 3 | Rentang operasi umum katalis asam padat (termasuk γ-Al₂O₃) | 250–400 °C, tekanan s.d. 18 bar | Review katalis dehidrasi metanol | Ya |
| 4 | Kinetika sederhana (Turton, data Bondiera & Naccache) | −r = k₀ exp(−Eₐ/RT) · p_MeOH; k₀ = 1,21×10⁶ kmol/(m³ reaktor·h·kPa); Eₐ = 80,48 kJ/mol; p dalam kPa | Turton (dokumen WVU) & laporan AIChE | Ya: teks ekstraksi rusak; rentang validitas berbeda antar sumber (>250 °C vs 240–340 °C) |
| 5 | Kinetika Langmuir–Hinshelwood γ-Al₂O₃ (Berčič & Levec 1992) | Eₐ ≈ 143,7 kJ/mol; panas adsorpsi metanol ≈ 70,5 kJ/mol, air ≈ 42,1 kJ/mol | Berčič & Levec, Ind. Eng. Chem. Res. 31(4), 1035–1040 (cuplikan sekunder) | Ya: k₀, K_M, K_W belum didapat |
| 6 | **Rentang validitas model Berčič & Levec** | dikembangkan pada **320–360 °C**; disebut tidak valid di bawah ~310 °C | Studi lanjutan yang mengutip model tersebut | **Penting**, lihat §3 |
| 7 | Pembanding Eₐ γ-Al₂O₃ komersial/lab | 121 dan 128 kJ/mol (model L–H) | Zhokh dkk. 2022, Asia-Pac. J. Chem. Eng. | Opsional |
| 8 | Deaktivasi γ-Al₂O₃ oleh uap air | Pada 250 °C, γ-Al₂O₃ berubah jadi boehmit γ-AlO(OH) pada p_H₂O ≈ 13–14 bar; sifatnya reversibel | UvA (Catal. Commun.), *Reversible deactivation of γ-alumina by steam* | Ya |
| 9 | Penyebab deaktivasi di bawah 300 °C | Transisi reversibel ke boehmit (hidrasi), bukan sintering | Fuel (2021), *Deactivation kinetics of γ-Al₂O₃…* | Ya |

## 2. Implikasi awal untuk penanda L/H/HH (belum keputusan)

* **Batas atas (HH):** kandidat sementara 400 °C sebagai suhu maksimum katalis (Turton), dengan HH ditaruh di bawahnya + margin. Karena katalis Turton zeolit, perlu konfirmasi angka untuk γ-Al₂O₃ (datasheet vendor atau literatur khusus γ-Al₂O₃).
* **Suhu adiabatik ≈ 371 °C** (Bab 1, Pers. 1.2) masih di bawah 400 °C. Jadi pada kasus hilang pembuangan panas, katalis mendekati tetapi belum melewati batas Turton. Ini perlu dibahas di langkah 3.
* **Batas bawah (L):** literatur menempatkan batas operasi bawah sekitar 250 °C, sama dengan titik operasi DWSIM. Ini mendukung pentingnya langkah 2 (titik embun S-104 dan aktivitas minimum).
* **Uap air:** p_H₂O efluen R-101 ≈ 0,4086 × 14,7 bar ≈ **6,0 bar** (HMB S-105), di bawah ambang boehmit 13–14 bar pada 250 °C. Perlu dicatat sebagai pertimbangan, bukan batas suhu.

## 3. Catatan penting untuk Bab 1

Bab 1 subbab 1.2.1 memakai model Berčič & Levec (Pers. 1.4) untuk reaktor yang beroperasi pada **250 °C**. Jika benar model itu hanya valid pada 320–360 °C, ada dua pilihan:
1. tetap memakai bentuk L–H tetapi menyebut keterbatasan rentang validitasnya; atau
2. memakai kinetika orde satu Turton/Bondiera & Naccache (Eₐ 80,48 kJ/mol) yang rentangnya mencakup 250 °C, atau model lain yang valid di sekitar 250 °C.

Keputusan diserahkan ke IH setelah membaca naskah asli.

## 4. Yang perlu dilakukan IH (sisa langkah 1)

- [ ] Unduh dan baca naskah asli Berčič & Levec 1992 (doi 10.1021/ie00004a010) dan 1993 (Ind. Eng. Chem. Res. 32, 2478–2484). Ambil k₀, Eₐ, K_M, K_W, ekspresi K_eq(T), dan rentang suhu/tekanan eksperimen. Akses lewat jaringan/perpustakaan UGM.
- [ ] Buka dokumen Turton DME (WVU) atau buku Turton edisi terbaru (Appendix B, studi kasus DME). Pastikan angka 400 °C, k₀, Eₐ, dan satuan.
- [ ] Cari batas suhu khusus γ-Al₂O₃ (datasheet vendor katalis dehidrasi metanol, atau paper deaktivasi termal/sintering).
- [ ] Isi kolom "Perlu dicek" di tabel §1 menjadi "Terverifikasi (hlm. …)".

## 5. Daftar sumber (tautan)

1. Turton, R. dkk. *Production of Dimethyl Ether — Background*. WVU. https://richardturton.faculty.wvu.edu/files/d/7cd9840b-ef1f-4995-9ebe-7d654abf91ea/dimethyl_ether.pdf
2. AIChE Student Design Competition. *Production and Cost Analysis of Dimethyl Ether for Transportation*. https://www.aiche.org/sites/default/files/node/aiche-student-design-competition/production_and_cost_analysis_of_dimethyl_ether_for_transportation.pdf
3. Berčič, G., & Levec, J. (1992). Intrinsic and global reaction rate of methanol dehydration over γ-Al₂O₃ pellets. *Ind. Eng. Chem. Res.*, 31(4), 1035–1040. https://www.osti.gov/biblio/6936611
4. Berčič, G., & Levec, J. (1993). Catalytic dehydration of methanol to dimethyl ether: kinetic investigation and reactor simulation. *Ind. Eng. Chem. Res.*, 32, 2478–2484. https://osti.gov/biblio/5533120-catalytic-dehydration-methanol-dimethyl-ether-kinetic-investigation-reactor-simulation
5. Zhokh, A. dkk. (2022). Intrinsic kinetics of the methanol dehydration to dimethyl ether over laboratory and commercial γ-alumina. *Asia-Pac. J. Chem. Eng.* https://onlinelibrary.wiley.com/doi/abs/10.1002/apj.2722
6. *Reversible deactivation of γ-alumina by steam in the gas-phase dehydration of methanol to dimethyl ether*. https://www.sciencedirect.com/science/article/pii/S1566736718305417 (salinan terbuka: https://pure.uva.nl/ws/files/38625975/1_s2.0_S1566736718305417_main.pdf)
7. *Deactivation kinetics of γ-Al₂O₃ catalyst in methanol dehydration to dimethyl ether*. Fuel (2021). https://www.sciencedirect.com/science/article/abs/pii/S0016236121023152
8. *A Review on Deactivation and Regeneration of Catalysts for Dimethyl Ether Synthesis*. Energies 15(15), 5420 (2022). https://doi.org/10.3390/en15155420
9. *Kinetic Modelling for the Dehydration of Methanol to Dimethyl Ether over γ-Al₂O₃*. Chem. Eng. Trans. 32 (2013). https://www.aidic.it/cet/13/32/103.pdf
