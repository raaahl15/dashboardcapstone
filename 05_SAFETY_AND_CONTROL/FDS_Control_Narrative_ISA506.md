---
id: "FDS-IC-DME-2026-001"
title: "Functional Design Specification (FDS) & Control Narrative"
category: "Control Philosophy"
standard: "ISA-5.06.01 / NAMUR NA 35"
target_files: []
generated_by: ""
source_data:
  - "PLACEHOLDER — master akan dipindah ke Google Docs (Fase 2)"
author: "Altaf Ramadhan Parvez (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["FDS", "Control Narrative", "ISA-5.06"]
---

# Functional Design Specification (FDS) & Control Narrative
**Standar Acuan:** ISA-5.06.01 / NAMUR NA 35  
**Proyek:** Pabrik Dimethyl Ether (DME) Berbasis Dehidrasi Metanol  
**No. Dokumen:** FDS-IC-DME-2026-001

> ⚠️ **DRAF KERANGKA (PLACEHOLDER).** Isi di bawah adalah contoh awal, belum diturunkan dari URS dan Draf P&ID. Mulai **Fase 2**, master FDS ditulis di **Google Docs**. Panduan Capstone (BAB III §3.1, Lampiran 3A Bab 2) mewajibkan FDS menjelaskan urutan **start-up, operasi normal, dan shutdown otomatis** secara sekuensial; bagian start-up/shutdown belum ada.

---

## 1. Loop Kontrol Kaskade Reaktor Dehidrasi (REAC-01)
* **Master Controller (Primary):** Temperature Controller `TIC-101` memantau temperatur keluaran `HEATER-01` dan titik panas bed katalis `REAC-01`.
* **Slave Controller (Secondary):** Flow Controller `FIC-101` mengatur katup `FCV-101` pada pipa discharge `PUMP-01`.
* **Prinsip Operasi:** Jika suhu reaksi melampaui setpoint ($250^\circ\text{C}$), output `TIC-101` akan memodulasi pasokan panas pada `HEATER-01` dan membatasi laju umpan metanol melalui `FIC-101` untuk mencegah pelepasan panas eksotermik berlebih.

## 2. Sistem Keselamatan Interlock Darurat (SIS / ESD)
* **Trip High-High Suhu Reaktor (`TSHH-101`):** Jika temperatur bed katalis mencapai $\ge 320^\circ\text{C}$, sinyal dikirim ke Logic Solver Safety (SIL-3).
* **Aksi Interlock 1:** Menutup Emergency Shut-off Valve `ESDV-101` pada jalur inlet umpan dalam waktu $< 2$ detik.
* **Aksi Interlock 2:** Menghentikan motor pompa umpan `PUMP-01` dalam waktu $< 1$ detik untuk memutus suplai reaktan.

## 3. Loop Kontrol Tekanan & Refluks Kolom Distilasi DME (C-01)
* **Pressure Control (`PIC-201`):** Mengatur bukaan katup `PCV-201` pada saluran gas atas menuju condenser untuk menjaga tekanan stabil pada $11.2\text{ bar(a)}$.
* **Purity Control (`AIC-201`):** Gas Chromatograph online memantau fraksi mol DME. Jika kemurnian turun di bawah $99.99\%$, sistem secara otomatis menaikkan rasio refluks pompa puncak.

---

## Catatan Inkonsistensi (Re-audit 2026-11-03)
1. Batas kemurnian 99,99% (§3) berbeda dengan alarm `AAL-201` = 99,90% dan `DME.md` (> 99,9%).
2. Satu kontroler `TIC-101` disebut memantau dua titik (keluaran heater dan bed reaktor); kaskade perlu didefinisikan dengan tag terpisah.
3. Tag peralatan belum mengikuti `tag_map.csv`.

## Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Antigravity (AI) | Draf awal. |
| 0.2 | 2026-11-03 | Claude Code (AI) | Tambah frontmatter (status Draft) & catatan inkonsistensi (LOG-004). |
