---
id: "SIM-DWSIM-DME-001"
title: "Model Simulasi Proses Dehidrasi Metanol Menjadi Dimethyl Ether (DME)"
category: "Process Simulation"
standard: "ISO 10628 (PFD) / CAPE-OPEN"
target_files:
  - "DME.dwxmz"
generated_by: ""
source_data: []
simulation_software: "DWSIM (versi dicatat oleh PIC)"
property_package: "NRTL (perlu dikonfirmasi PIC dari file simulasi)"
compounds: ["Methanol", "Water", "Dimethyl ether"]
author: "Ihsaan Zauhair Tsaqif Prawira (PIC)"
reviewer: ""
status: "WIP"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["DWSIM", "HMB", "Area-100", "Area-200"]
---

# Panduan Model Simulasi: DME.dwxmz

> ℹ️ **Status WIP.** File simulasi adalah hasil kerja riil, tetapi konvergensi, nilai kondisi operasi, dan basis desain di bawah **belum diverifikasi** terhadap isi file maupun literatur. PIC wajib melengkapi bagian bertanda *[PERLU DIKONFIRMASI]*.

## 1. Tujuan & Basis Desain
Memodelkan konversi metanol menjadi DME melalui dehidrasi katalitik fase gas:
$$2\,\text{CH}_3\text{OH} \rightarrow \text{CH}_3\text{OCH}_3 + \text{H}_2\text{O} \qquad (\Delta H_r \approx -23{,}4\ \text{kJ/mol})$$

- Kondisi reaktor yang tercantum di draf awal: 250–320 °C, 12–15 bar(a). **Dari file simulasi (LOG-019):** R-101 isotermal 250 °C, 14,7 bar(a), konversi metanol ≈ 80 %, duty −733 kW. *[Rujukan literatur masih PERLU DIKONFIRMASI]*
- **Asal-usul model (LOG-019):** metadata file menunjukkan model terakhir disimpan **2021-05-25, DWSIM 6.5.0.0, zona waktu +05:30**. **Terjawab (LOG-024):** fraksi mol S-08…S-11 di Tabel 1 RFP KAK-IC-DME-2026-001 identik dengan model ini (selisih ≤ 7×10⁻⁵), jadi `DME.dwxmz` adalah **model referensi klien dari dokumen lelang**. Di laporan, sitasi sebagai bagian RFP; pengembangan/validasi oleh firma ditulis terpisah.
- Kapasitas produksi, kemurnian produk, dan konversi: *[PERLU DIKONFIRMASI — menjadi basis URS]*

## 2. Struktur Flowsheet (tag DWSIM)
Daftar objek berikut diambil dari ekstraksi otomatis `hmb_streams.json` (2026-11-02):

| Kelompok | Objek DWSIM |
| :--- | :--- |
| Material stream | `S-01` s.d. `S-14` (14 stream) |
| Pompa | `PUMP-01`, `PUMP-02` |
| Mixer | `MIX-01` |
| Heater / Cooler | `HEAT-01`, `COOL-01`, `COOL-02` |
| Reaktor | `RC-01` (Conversion Reactor) |
| Kolom distilasi | `CSCOL-01`, `CSCOL-02` (CAPE-OPEN Unit Operation) |
| Recycle | `REC-01` |
| Objek tanpa tag | 1 objek: `GO_MasterTable` (tabel tampilan DWSIM, bukan unit operasi; diperiksa 2026-11-03, LOG-014) |

Alur (diverifikasi dari konektor objek di XML model, LOG-014): umpan metanol `S-01` → `PUMP-01` → `S-02` → `MIX-01` (bertemu recycle `S-14`) → `S-03` → `HEAT-01` → `S-04` → `RC-01` → `S-05` (+ outlet cair `S-06`) → `COOL-01` → `S-07` → `CSCOL-01` (puncak `S-08` produk DME; bawah `S-09`) → `CSCOL-02` (`S-10` metanol → `PUMP-02` → `COOL-02` → `REC-01` → `S-14`; `S-11` air).

**Lingkup Area 1** (keputusan PM 2026-11-03): `S-01`…`S-07` + `S-14`. Pabrik dibagi 3 area: Area 1 reaktor (firma ini), Area 2 distilasi 1 (`CSCOL-01`), Area 3 distilasi 2 (`CSCOL-02` + loop recycle, sementara). `S-07` keluar ke Area 2; `S-14` masuk dari Area 3. Pemetaan ke tag pabrik ada di [`../tag_map.csv`](../tag_map.csv) (status FINAL; companion `tag_map.md`).

## 3. SOP Pembaruan & Ekstraksi Data
1. Buka `DME.dwxmz` di DWSIM, jalankan solver, pastikan seluruh objek konvergen.
2. Simpan file.
3. Jalankan `npm run sync:dwsim` (`tools/dwsim/export_hmb.py`, LOG-019): mengekstrak T, P, laju alir, komposisi, properti, dan duty, lalu memvalidasi neraca massa (≤ 0,5 %). Skrip gagal dan tidak menulis file bila data tidak lengkap. Kamus data: `exported_data/hmb_streams.md`.
4. Commit `DME.dwxmz` bersama `hmb_streams.json` dalam satu commit.

## 4. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal companion. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Status → WIP; perbaiki rujukan skrip; daftar objek dari hasil ekstraksi; tandai bagian yang perlu dikonfirmasi PIC (LOG-004). |
