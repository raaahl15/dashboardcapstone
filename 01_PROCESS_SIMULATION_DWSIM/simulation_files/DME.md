---
id: "SIM-DWSIM-DME-001"
title: "Model Simulasi Proses Dehidrasi Metanol Menjadi Dimethyl Ether (DME)"
category: "Process Simulation"
standard: "ISO 10628 / CAPE-OPEN Standards"
simulation_software: "DWSIM v10.2 (Open-Source Core Edition)"
property_package: "NRTL (Non-Random Two-Liquid) with Ideal/RK Vapor Phase"
compounds: ["Methanol", "Water", "Dimethyl ether"]
author: "Ihsaan Zauhair Tsaqif Prawira (Lead Process)"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "DME.dwxmz"
---

# Panduan Model Simulasi: DME.dwxmz

## 1. Tujuan & Basis Desain
File simulasi ini memodelkan proses konversi metanol kemurnian tinggi menjadi Dimethyl Ether (DME) bahan bakar ramah lingkungan melalui reaksi dehidrasi katalitik fase gas:
$$2 \text{CH}_3\text{OH} \xrightarrow{\text{Katalis } \gamma-\text{Al}_2\text{O}_3} \text{CH}_3\text{OCH}_3 + \text{H}_2\text{O} \quad (\Delta H_r = -23.4\text{ kJ/mol})$$

Reaksi berlangsung secara eksotermik pada suhu $250 - 320^\circ\text{C}$ dan tekanan $12 - 15\text{ bar(a)}$.

## 2. Struktur Aliran Proses & Peralatan
- **Inlet & Preheating**: Umpan metanol cair (S-01) dipompa oleh `PUMP-01` menuju `MIX-01` (bertemu aliran recycle S-13). Campuran dipanaskan dan diuapkan di `HEAT-01` hingga mencapai $250^\circ\text{C}$ (S-04).
- **Reaction Stage**: Reaktor konversi `RC-01` menghasilkan efluen DME, air, dan sisa metanol unreacted (S-05 & S-06).
- **Separation & Purification**: Efluen didinginkan oleh `COOL-01` menuju kolom distilasi pertama `CSCOL-01` untuk memisahkan produk puncak DME murni (> 99.9% mol). Bagian bawah dialirkan ke `CSCOL-02` untuk memisahkan air buangan dan mendaur ulang metanol via `REC-01`.

## 3. SOP Pembaharuan & Ekstraksi Data
1. Buka DWSIM desktop dan load file `DME.dwxmz`.
2. Lakukan pengecekan konvergensi flowsheet (seluruh stream berwarna biru/kalkulasi sukses).
3. Jalankan script otomasi `tools/export_dwsim_hmb.py` untuk mengekstrak stream table ke `exported_data/hmb_streams.json`.
4. Pastikan laju alir dan sifat fluida pada kalkulator rekayasa sinkron dengan hasil run terbaru.
