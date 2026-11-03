---
id: "DATA-HMB-DME-001"
title: "Kamus Data: hmb_streams.json (Ekspor Heat & Material Balance DWSIM)"
category: "Process Data Export"
standard: "Skema internal proyek (Blueprint v2.0 §3.1)"
target_files:
  - "hmb_streams.json"
generated_by: "tools/export_dwsim_hmb.js"
source_data:
  - "../simulation_files/DME.dwxmz"
author: "Ihsaan Zauhair Tsaqif Prawira (PIC)"
reviewer: ""
status: "Draft"
review_evidence: ""
google_ref: ""
last_updated: "2026-11-03"
tags: ["DWSIM", "HMB", "JSON", "Generated"]
---

# Kamus Data: hmb_streams.json

> ⚠️ **FILE HASIL GENERATE — jangan edit manual.** Buat ulang dengan `npm run sync:dwsim`.
>
> **Keterbatasan versi saat ini (skema v0):** file hanya berisi **daftar tag & tipe objek**. Belum ada nilai T, P, laju alir, komposisi, atau properti fisik. Field `meta.status` dan `meta.property_package` ditulis tetap oleh skrip, **bukan** dibaca dari file simulasi. Jangan dijadikan sumber data kalkulator sampai skema v1 (Fase 3) tersedia.

## 1. Skema v0 (saat ini)

| Field | Tipe | Isi | Catatan |
| :--- | :--- | :--- | :--- |
| `meta.source_file` | string | `"DME.dwxmz"` | |
| `meta.extracted_at` | string (ISO 8601, UTC) | Waktu ekstraksi | |
| `meta.status` | string | `"Converged"` | ⚠️ Hardcoded |
| `meta.property_package` | string | `"NRTL"` | ⚠️ Hardcoded |
| `meta.compounds` | string[] | Daftar komponen | Dibaca dari file |
| `material_streams[]` | `{tag, type}` | 14 stream (`S-01`…`S-14`) | Tanpa nilai proses |
| `unit_operations[]` | `{tag, type}` | 11 entri, 1 di antaranya kosong | ⚠️ Objek tanpa tag |
| `summary` | `{total_streams, total_units}` | Jumlah entri | |

## 2. Skema v1 (target Fase 3)
Skema lengkap ada di Blueprint v2.0 §3.1. Ringkasnya: setiap stream memuat `dwsim_tag`, `plant_tag`, `T`, `P`, `mass_flow`, `molar_flow`, `vapor_fraction`, `mole_fractions`, dan `props` (ρ, μ, Cp, MW). `meta` memuat `source_sha256`, `solver_status` (dibaca dari file), dan `units`. Ada blok `validation` berisi galat neraca massa per unit operasi (batas ≤ 0,5%).

## 3. Log Revisi
| Rev | Tanggal | Penulis | Deskripsi |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-03 | Claude Code (AI) | Companion dibuat; keterbatasan skema v0 didokumentasikan (LOG-004). |
