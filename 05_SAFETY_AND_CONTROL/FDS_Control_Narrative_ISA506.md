# Functional Design Specification (FDS) & Control Narrative
**Standar Acuan:** ISA 5.06.01 / NAMUR NA 35  
**Proyek:** Pabrik Dimethyl Ether (DME) Berbasis Dehidrasi Metanol  
**No. Dokumen:** FDS-IC-DME-2026-001  

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
