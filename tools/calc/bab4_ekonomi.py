"""
bab4_ekonomi.py - Model Bab 4 Kajian Tekno-Ekonomi Area 1 (WO-027, LOG-083).

Dua lapis (keputusan PM 2026-11-12):
  Lapis 1 (RFP §3.3.1): CAPEX & OPEX I&C, bottom-up dari Master Instrument Index Rev C.
  Lapis 2 (arahan Bimbingan 6): kelayakan Area 1 = porsi margin penjualan DME pabrik
          dikurangi OPEX Area 1, terhadap CAPEX Area 1 (faktorial peralatan + I&C bottom-up).

Jalankan:  .venv/Scripts/python -I tools/calc/bab4_ekonomi.py  -> 02_ENGINEERING_CALCULATORS/CALC_Bab4_Ekonomi_Area1.csv
Semua nilai input ada di blok INPUT di bawah, masing-masing dengan sumber dan status (SUMBER/ASUMSI).
Model arus kas: tahun 0 = -CAPEX; tahun 1..n = arus kas bersih konstan; sebelum pajak (sama dengan npv.py).
"""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path

import numpy_financial as npf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "02_ENGINEERING_CALCULATORS" / "CALC_Bab4_Ekonomi_Area1.csv"
HMB = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "exported_data" / "hmb_streams.json"
INDEX = ROOT / "04_INSTRUMENTATION_ISA20" / "Master_Instrument_Index_DME.csv"

# --------------------------------------------------------------------------- INPUT
# (nilai, satuan, sumber, status)
IN = {
    "hours": (8000, "jam/tahun", "Jam operasi pabrik kimia kontinu (Turton dkk.; Towler & Sinnott: 8.000 jam)", "ASUMSI"),
    "life": (20, "tahun", "Umur ekonomi pabrik kimia tipikal (Towler & Sinnott §9)", "ASUMSI"),
    "rate": (10.0, "%", "BI-Rate 5,75 % (RDG BI 20-21 Okt 2026) + premi risiko proyek 4,25 %", "ASUMSI"),
    "bi_rate": (5.75, "%", "Bank Indonesia, RDG 20-21 Okt 2026 (BI-Rate tetap 5,75 %)", "SUMBER"),
    "kurs": (18058, "Rp/USD", "JISDOR Bank Indonesia 31 Jul 2026", "SUMBER"),
    "p_meoh": (320, "USD/t", "Metanol CFR Asia Tenggara Agu 2025-Feb 2026: 315-325 USD/t (S&P Global Platts, 20 Mar 2026)", "SUMBER"),
    "p_dme": (560, "USD/t", "DME Tiongkok Q1 2026: 560 USD/t (IMARC, DME Price Index)", "SUMBER"),
    "p_meoh_q3": (480, "USD/t", "Metanol CFR Asia Tenggara Agu-Sep 2026: 460-500 USD/t (Nexizo 13 Agu 2026; IMARC Sep 2026)", "SUMBER"),
    "p_dme_q3": (570, "USD/t", "DME Tiongkok Sep 2026: 570 USD/t (IMARC Q3 2026)", "SUMBER"),
    "alpha": (1 / 3, "-", "Porsi Area 1 atas margin pabrik; sementara 1/3 (tiga area setara) sampai CAPEX Area 2/3 tersedia", "ASUMSI"),
    "cepci_2010": (532.9, "-", "Basis korelasi Towler & Sinnott ed. 2 (Jan 2010, USGC)", "SUMBER"),
    "cepci_now": (797.9, "-", "CEPCI rata-rata 2023 (Chemical Engineering); 2024-2025 berubah < ±2 %", "SUMBER"),
    "lang": (4.74, "-", "Faktor Lang pabrik fluida (Peters, Timmerhaus & West; Towler & Sinnott)", "SUMBER"),
    "f_ic_in_lang": (0.36, "-", "Porsi instrumentasi & kontrol dalam faktor Lang pabrik fluida (Peters dkk., 36 % PCE) - diganti I&C bottom-up", "SUMBER"),
    "fuel": (8.0, "USD/MMBtu", "Gas alam industri non-HGBT (asumsi; HGBT ±6,5 USD/MMBtu)", "ASUMSI"),
    "eta_heater": (0.85, "-", "Efisiensi pemanas minyak panas berbahan bakar gas", "ASUMSI"),
    "p_steam": (15.0, "USD/t", "Nilai kredit kukus MP (asumsi, setara biaya bahan bakar ketel)", "ASUMSI"),
    "p_cw": (0.03, "USD/t", "Air pendingin sirkulasi (Towler & Sinnott: 0,02-0,05 USD/t)", "ASUMSI"),
    "p_elec": (0.07, "USD/kWh", "Tarif listrik industri (asumsi, setara ±Rp 1.250/kWh)", "ASUMSI"),
    "operators": (5, "orang", "1 operator lapangan Area 1 per regu × 5 regu (4 shift + cadangan)", "ASUMSI"),
    "salary": (9000, "USD/orang/tahun", "Operator pabrik kimia Indonesia ±Rp 12 jt/bulan × 13,5 + tunjangan", "ASUMSI"),
    "f_maint": (0.03, "-", "Pemeliharaan 3 % FCI per tahun (Towler & Sinnott: 3-5 %)", "ASUMSI"),
}
V = {k: v[0] for k, v in IN.items()}

# Harga satuan I&C (USD, harga distributor 2026; status ASUMSI bila bukan harga katalog)
UP = {
    "TX_P": (3000, "Transmitter tekanan/DP HART (Rosemount 3051T: 3.013,80 USD, Transcat 2026)", "SUMBER"),
    "TX_T": (2150, "Transmitter suhu HART (Rosemount 644: 1.345,57 USD, Transcat) + termokopel & thermowell 800 USD", "ASUMSI"),
    "TX_T_MULTI": (6000, "TT-101 multi-titik (6 titik) + transmitter multi-input", "ASUMSI"),
    "TX_SIS": (3200, "Transmitter suhu bersertifikat SIL (1,5 × transmitter biasa)", "ASUMSI"),
    "FE": (1500, "Orifice plate + flange tap", "ASUMSI"),
    "CV_S": (5000, "Katup kendali globe ≤2\" + aktuator + positioner (Fisher 2\": 4.730,95 USD, dealer)", "SUMBER"),
    "CV_M": (9000, "Katup kendali 3-4\" + aktuator + positioner (skala dari 2\")", "ASUMSI"),
    "CV_L": (20000, "Katup kendali 8\" (CW E-102) + aktuator + positioner", "ASUMSI"),
    "ESDV": (18000, "ESDV 6\" + solenoid + limit switch (XV/XY-102)", "ASUMSI"),
    "PSV": (3000, "Katup pengaman pegas", "ASUMSI"),
    "PI": (300, "Pressure gauge lokal", "ASUMSI"),
    "LG": (1500, "Gelas penduga level", "ASUMSI"),
    "DCS_BASE": (150000, "DCS kecil: kontroler redundan, 2 operator station, 1 engineering station, lisensi", "ASUMSI"),
    "DCS_IO": (930, "Per titik I/O terpasang di luar instrumen lapangan (500 USD/titik 2001 → 714 USD 2017, Chemical Processing 2018; eskalasi ±30 % ke 2026)", "SUMBER"),
    "SIS_LS": (60000, "Logic solver SIS kecil bersertifikat SIL (lingkup PSTF 2, tetap dianggarkan)", "ASUMSI"),
    "CABLE": (2000, "Kabel, junction box, marshalling per loop/instrumen tersambung", "ASUMSI"),
}
F_INSTALL = 0.40   # pemasangan & komisioning instrumen: 40 % harga perangkat (Peters dkk.: 25-60 %)
F_ENG = 0.15       # jasa rekayasa FEED/DED I&C
F_CONT = 0.15      # kontingensi
SPARE_IO = 0.20

# Peta tag -> kategori harga (Index Rev C)
CAT = {
    "FT-101": "TX_P", "PT-103": "TX_P", "PT-106": "TX_P", "PT-111": "TX_P", "PDT-112": "TX_P", "LT-105": "TX_P", "LT-113": "TX_P",
    "TT-101": "TX_T_MULTI", "TT-104": "TX_T", "TT-109": "TX_T",
    "TE-102A": "TX_SIS", "TE-102B": "TX_SIS", "TE-102C": "TX_SIS",
    "FE-101": "FE",
    "FV-101": "CV_S", "PV-111": "CV_S", "LV-113": "CV_S",
    "LV-105": "CV_M", "PV-103": "CV_M", "TV-104": "CV_M",
    "TV-109": "CV_L",
    "XV-102": "ESDV",
    "PSV-101": "PSV", "PSV-102": "PSV",
    "PI-107": "PI", "PI-108": "PI", "LG-105": "LG",
}
# elemen yang harganya sudah termasuk di item lain: TE-101 (dalam TT-101), XY-102 (dalam ESDV); fungsi Soft = 0


def towler(a, b, n, s):
    return a + b * s ** n


def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    rows = []
    add = lambda sec, item, val, unit, basis, st="": rows.append([sec, item, round(val, 4) if isinstance(val, float) else val, unit, basis, st])
    for k, (v, u, src, st) in IN.items():
        add("INPUT", k, v, u, src, st)
    # ------------------------------------------------ Lapis 1: CAPEX I&C
    idx = list(csv.DictReader(open(INDEX, encoding="utf-8-sig")))
    io = [r for r in idx if r["IO_TYPE"] in ("AI", "AO", "DI", "DO")]
    n_io = len(io)
    hw = 0.0
    boq = {}
    for r in idx:
        c = CAT.get(r["TAG_NUMBER"])
        if not c:
            continue
        boq.setdefault(c, []).append(r["TAG_NUMBER"])
    for c, tags in boq.items():
        price, src, st = UP[c]
        cost = price * len(tags)
        hw += cost
        add("CAPEX_IC", f"{c}: {', '.join(tags)}", cost, "USD", f"{len(tags)} × {price:,} USD; {src}", st)
    io_spare = math.ceil(n_io * (1 + SPARE_IO))
    dcs = UP["DCS_BASE"][0] + UP["DCS_IO"][0] * io_spare
    add("CAPEX_IC", "DCS (dasar + I/O)", dcs, "USD", f"{UP['DCS_BASE'][0]:,} + {io_spare} I/O (22 + 20 % cadangan) × {UP['DCS_IO'][0]} USD; {UP['DCS_IO'][1]}", "ASUMSI")
    sis = UP["SIS_LS"][0]
    add("CAPEX_IC", "Logic solver SIS", sis, "USD", UP["SIS_LS"][1], "ASUMSI")
    n_conn = sum(len(t) for c, t in boq.items() if c not in ("PSV", "PI", "LG", "FE"))
    cable = UP["CABLE"][0] * n_conn
    add("CAPEX_IC", "Kabel, JB, marshalling", cable, "USD", f"{n_conn} perangkat tersambung × {UP['CABLE'][0]:,} USD", "ASUMSI")
    inst = F_INSTALL * hw
    add("CAPEX_IC", "Pemasangan & komisioning instrumen", inst, "USD", f"{F_INSTALL:.0%} × perangkat lapangan {hw:,.0f} USD (Peters dkk.: 25-60 %)", "ASUMSI")
    direct = hw + dcs + sis + cable + inst
    eng = F_ENG * direct
    cont = F_CONT * (direct + eng)
    capex_ic = direct + eng + cont
    add("CAPEX_IC", "Subtotal langsung", direct, "USD", "perangkat + DCS + SIS + kabel + pemasangan", "")
    add("CAPEX_IC", "Jasa rekayasa I&C (FEED/DED)", eng, "USD", f"{F_ENG:.0%} × langsung", "ASUMSI")
    add("CAPEX_IC", "Kontingensi", cont, "USD", f"{F_CONT:.0%} × (langsung + rekayasa)", "ASUMSI")
    add("CAPEX_IC", "TOTAL CAPEX I&C", capex_ic, "USD", f"= Rp {capex_ic * V['kurs'] / 1e9:,.2f} miliar", "")
    # ------------------------------------------------ OPEX I&C
    n_cal = sum(len(t) for c, t in boq.items() if c not in ("PI", "LG")) + 2  # +PI/LG kalibrasi ringan
    opex_ic = {
        "Kalibrasi berkala": (n_cal * 250, f"{n_cal} instrumen × 250 USD/tahun (1×/tahun, jasa + sertifikat)"),
        "Lisensi & dukungan AMS (HART)": (10000, "Asset Management System, lisensi tahunan"),
        "Dukungan perangkat lunak DCS/SIS": (0.10 * (dcs + sis), "10 %/tahun × (DCS + SIS)"),
        "Suku cadang instrumen": (0.03 * hw, "3 %/tahun × perangkat lapangan"),
        "Listrik DCS & instrumen": (5 * V["hours"] * V["p_elec"], "5 kW × jam operasi × tarif listrik"),
    }
    for k, (v, b) in opex_ic.items():
        add("OPEX_IC", k, v, "USD/tahun", b, "ASUMSI")
    opex_ic_total = sum(v for v, _ in opex_ic.values())
    add("OPEX_IC", "TOTAL OPEX I&C", opex_ic_total, "USD/tahun", f"= Rp {opex_ic_total * V['kurs'] / 1e6:,.0f} juta/tahun", "")
    # ------------------------------------------------ Lapis 2: CAPEX Area 1 (faktorial)
    hmb = json.load(open(HMB, encoding="utf-8"))
    S = {s["dwsim_tag"]: s for s in hmb["streams"]}
    U = {u["dwsim_tag"]: u for u in hmb["unit_operations"]}
    q_e101 = U["HEAT-01"]["duty_kW"]
    q_e102 = U["COOL-01"]["duty_kW"]
    q_r101 = abs(U["RC-01"]["duty_kW"])
    flow_ls = S["S-01"]["mass_flow"] / S["S-01"]["props"]["rho"] / 3.6
    lmtd = lambda a, b: (a - b) / math.log(a / b)
    a_e101 = q_e101 * 1e3 / (300 * lmtd(300 - 250, 200 - 25.33))
    a_e102 = q_e102 * 1e3 / (500 * lmtd(250 - 40, 89 - 30))
    a_r101 = q_r101 * 1e3 / (100 * (250 - 214.9))
    eq = [
        ("P-101 pompa sentrifugal", towler(8000, 240, 0.9, flow_ls), f"S = {flow_ls:.2f} L/s; a=8.000 b=240 n=0,9"),
        ("P-101 motor", towler(-1100, 2100, 0.6, 5.65), "S = 5,65 kW; a=-1.100 b=2.100 n=0,6"),
        ("M-101 / T-101 pencampur-drum", towler(11600, 34, 0.85, 1500), "bejana vertikal CS, massa shell ±1.500 kg; a=11.600 b=34 n=0,85"),
        ("E-101 U-tube", towler(24000, 46, 1.2, a_e101), f"A = {a_e101:.0f} m² (U 300 W/m²K, LMTD minyak panas 300/200 °C); a=24.000 b=46 n=1,2"),
        ("E-102 U-tube", towler(24000, 46, 1.2, a_e102), f"A = {a_e102:.0f} m² (U 500 W/m²K, CW 30/40 °C)"),
        ("R-101 multitubular", 1.5 * towler(24000, 46, 1.2, a_r101), f"A = {a_r101:.0f} m² (U 100 W/m²K, ΔT 35,1 K) × 1,5 konstruksi reaktor"),
    ]
    pce2010 = 0.0
    for name, c, basis in eq:
        pce2010 += c
        add("CAPEX_A1", name, c, "USD (2010)", "Towler & Sinnott ed. 2 Tab. 6.6; " + basis, "ASUMSI")
    pce = pce2010 * V["cepci_now"] / V["cepci_2010"]
    add("CAPEX_A1", "PCE peralatan utama (eskalasi)", pce, "USD", f"× CEPCI {V['cepci_now']}/{V['cepci_2010']}", "")
    fci_proc = pce * (V["lang"] - V["f_ic_in_lang"])
    add("CAPEX_A1", "FCI proses tanpa I&C", fci_proc, "USD", f"PCE × (Lang {V['lang']} - {V['f_ic_in_lang']})", "")
    capex_a1 = fci_proc + capex_ic
    add("CAPEX_A1", "TOTAL CAPEX Area 1", capex_a1, "USD", f"FCI proses + CAPEX I&C; = Rp {capex_a1 * V['kurs'] / 1e9:,.2f} miliar", "")
    # ------------------------------------------------ Pendapatan & OPEX Area 1
    t_dme = S["S-08"]["mass_flow"] * V["hours"] / 1000
    t_meoh = S["S-01"]["mass_flow"] * V["hours"] / 1000

    def econ(p_dme, p_meoh, alpha, rate, tag):
        rev = t_dme * p_dme
        raw = t_meoh * p_meoh
        gm = rev - raw
        fuel = q_e101 / V["eta_heater"] * V["hours"] * 3600 / 1.055056e6 * V["fuel"]
        steam = -(q_r101 / (2798.3 - 440.3) * 3.6) * V["hours"] * V["p_steam"]
        cw = q_e102 / (4.18 * 10) * 3.6 * V["hours"] * V["p_cw"]
        elec = 5.65 * V["hours"] * V["p_elec"]
        labor = V["operators"] * V["salary"]
        maint = V["f_maint"] * capex_a1
        opex = fuel + steam + cw + elec + labor + maint + opex_ic_total
        cf = alpha * gm - opex
        flows = [-capex_a1] + [cf] * int(V["life"])
        npv = npf.npv(rate / 100, flows)
        irr = npf.irr(flows) if cf > 0 else float("nan")
        pb = capex_a1 / cf if cf > 0 else float("nan")
        return dict(tag=tag, rev=rev, raw=raw, gm=gm, fuel=fuel, steam=steam, cw=cw, elec=elec, labor=labor, maint=maint, opex=opex, cf=cf, npv=npv, irr=irr * 100, pb=pb)

    base = econ(V["p_dme"], V["p_meoh"], V["alpha"], V["rate"], "BASE")
    add("PRODUKSI", "DME produk S-08", t_dme, "t/tahun", f"{S['S-08']['mass_flow']:.1f} kg/jam × {V['hours']} jam", "HMB")
    add("PRODUKSI", "Metanol segar S-101", t_meoh, "t/tahun", f"{S['S-01']['mass_flow']:.1f} kg/jam × {V['hours']} jam", "HMB")
    for k, lab in [("rev", "Penjualan DME pabrik"), ("raw", "Biaya metanol pabrik"), ("gm", "Margin kotor pabrik"),
                   ("fuel", "Bahan bakar minyak panas E-101"), ("steam", "Kredit kukus MP R-101"), ("cw", "Air pendingin E-102"),
                   ("elec", "Listrik P-101"), ("labor", "Gaji operator Area 1"), ("maint", "Pemeliharaan Area 1"),
                   ("opex", "TOTAL OPEX Area 1 (termasuk OPEX I&C)"), ("cf", "Arus kas bersih Area 1 (α × margin - OPEX)")]:
        add("EKONOMI_BASE", lab, base[k], "USD/tahun", "", "")
    add("EKONOMI_BASE", "NPV", base["npv"], "USD", f"i = {V['rate']} %, n = {V['life']} tahun", "")
    add("EKONOMI_BASE", "IRR", base["irr"], "%", f"bandingkan BI-Rate {V['bi_rate']} % dan i = {V['rate']} %", "")
    add("EKONOMI_BASE", "Payback sederhana", base["pb"], "tahun", "CAPEX / CF", "")
    # sensitivitas
    for r in (V["bi_rate"], 8.0, 10.0, 12.0, 15.0):
        e = econ(V["p_dme"], V["p_meoh"], V["alpha"], r, f"rate {r}")
        add("SENS_RATE", f"i = {r} %", e["npv"], "USD", "NPV", "")
    for pd in (500, 560, 650, 750, 841):
        e = econ(pd, V["p_meoh"], V["alpha"], V["rate"], "")
        add("SENS_DME", f"DME {pd} USD/t", e["npv"], "USD", f"NPV; IRR {e['irr']:.1f} %; CF {e['cf']:,.0f}", "")
    for pm in (280, 320, 400, 480, 560):
        e = econ(V["p_dme"], pm, V["alpha"], V["rate"], "")
        add("SENS_MEOH", f"Metanol {pm} USD/t", e["npv"], "USD", f"NPV; IRR {e['irr']:.1f} %; CF {e['cf']:,.0f}", "")
    for al in (0.25, 1 / 3, 0.40, 0.50):
        e = econ(V["p_dme"], V["p_meoh"], al, V["rate"], "")
        add("SENS_ALPHA", f"α = {al:.2f}", e["npv"], "USD", f"NPV; IRR {e['irr']:.1f} %", "")
    q3 = econ(V["p_dme_q3"], V["p_meoh_q3"], V["alpha"], V["rate"], "Q3-2026")
    add("SKENARIO", "Harga Q3 2026 (DME 570, metanol 480)", q3["npv"], "USD", f"margin kotor pabrik {q3['gm']:,.0f} USD/tahun; CF {q3['cf']:,.0f}", "")
    # titik impas
    be_cf0 = (base["opex"] / V["alpha"] + t_meoh * V["p_meoh"]) / t_dme
    add("IMPAS", "Harga DME impas (CF = 0) pada metanol basis", be_cf0, "USD/t", "α × margin = OPEX Area 1", "")
    ratio_raw = t_meoh / t_dme
    add("IMPAS", "Rasio massa metanol/DME", ratio_raw, "t/t", "harga DME impas bahan baku = rasio × harga metanol", "")
    # npv = 0 harga DME
    lo, hi = 300.0, 2000.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if econ(mid, V["p_meoh"], V["alpha"], V["rate"], "")["npv"] > 0:
            hi = mid
        else:
            lo = mid
    add("IMPAS", "Harga DME untuk NPV = 0 (i = 10 %)", hi, "USD/t", "bisection", "")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["SECTION", "ITEM", "VALUE", "UNIT", "BASIS", "STATUS"])
        w.writerows(rows)
    for r in rows:
        if r[0] != "INPUT":
            v = r[2]
            print(f"{r[0]:13s} {r[1][:60]:60s} {v:>16,.2f} {r[3]}" if isinstance(v, (int, float)) else r)
    print("ditulis", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
