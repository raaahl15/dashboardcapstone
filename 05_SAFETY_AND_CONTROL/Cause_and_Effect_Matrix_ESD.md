---
id: "SAFE-ESD-DME-001"
title: "Matriks Sebab-Akibat Sistem Keselamatan Interlock Darurat (ESD)"
category: "Functional Safety"
standard: "IEC 61508 / IEC 61511 / ISA-84"
author: "Altaf Ramadhan Parvez"
reviewer: "Rahul Ghulam Hidayatulloh (PM)"
status: "ACC Final"
last_updated: "2026-11-02"
target_file: "Cause_and_Effect_Matrix_ESD.csv"
---

# Panduan Penggunaan: Cause_and_Effect_Matrix_ESD.csv

Dokumen ini mendefinisikan logika interlock darurat SIL-2 dan SIL-3:
1. Suhu Tinggi-Tinggi Reaktor (`TSHH-101` $\ge 320^\circ\text{C}$):
   - Menutup Emergency Shut-off Valve `ESDV-101` dalam waktu $< 2\text{ detik}$.
   - Menghentikan motor pompa umpan `PUMP-01` dalam waktu $< 1\text{ detik}$.
2. Tekanan Tinggi-Tinggi Kolom Distilasi (`PSHH-201` $\ge 14.5\text{ bar}$):
   - Trip katup steam reboiler `ESDV-201` dalam $< 3\text{ detik}$.
