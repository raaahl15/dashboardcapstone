"""
orifice.py — Sizing orifice plate menurut ISO 5167-2:2022 (pengambilan tekanan flange).

Diketahui q_m (HMB), rho, mu, D, dP desain -> dicari diameter bore d, lalu C (Reader-Harris/Gallagher),
epsilon (1 untuk cairan), Re_D, dan rugi tekanan permanen. Batas keberlakuan ISO 5167-2 §5.3.1 diperiksa.
Perhitungan manual tetap ditulis di laporan PSTF 2; skrip ini verifikasi silang (Blueprint §3.2).
"""
from __future__ import annotations

import math

from fluids.flow_meter import (
    C_Reader_Harris_Gallagher,
    differential_pressure_meter_C_epsilon,
    differential_pressure_meter_solver,
    dP_orifice,
)

from common import Result, check, load_inputs, start_result

STD = "ISO 5167-2:2022"
REQUIRED = {
    "q_m": "Laju alir massa", "P1": "Tekanan hulu", "T1": "Suhu hulu", "rho": "Densitas",
    "mu": "Viskositas", "D": "Diameter dalam pipa", "dP": "Beda tekanan desain", "taps": "Jenis pengambilan tekanan",
    "phase": "Fase fluida",
}


def run(path, hmb) -> Result:
    doc, p = load_inputs(path, hmb, REQUIRED)
    res = start_result(doc, p)
    if p["phase"].value not in ("liquid", "gas"):
        raise ValueError("phase harus liquid atau gas")
    liquid = p["phase"].value == "liquid"
    if not liquid and "k" not in p:
        raise ValueError("fluida gas memerlukan input k (Cp/Cv)")

    m = p["q_m"].value / 3600.0                    # kg/h -> kg/s
    D = p["D"].value / 1000.0                      # mm -> m
    mu = p["mu"].value / 1000.0                    # cP -> Pa.s
    P1 = p["P1"].value * 1e5                       # bar(a) -> Pa
    P2 = P1 - p["dP"].value * 1e3                  # kPa -> Pa
    rho, taps = p["rho"].value, p["taps"].value
    k = p["k"].value if "k" in p else None
    eps_spec = 1.0 if liquid else None

    d = differential_pressure_meter_solver(D=D, rho=rho, mu=mu, k=k, P1=P1, P2=P2, m=m,
                                           meter_type="ISO 5167 orifice", taps=taps,
                                           epsilon_specified=eps_spec)
    if liquid:
        # cairan: epsilon = 1 (ISO 5167-2 §5.3.2.2); C langsung dari persamaan RHG
        C, eps = C_Reader_Harris_Gallagher(D=D, Do=d, rho=rho, mu=mu, m=m, taps=taps), 1.0
    else:
        C, eps = differential_pressure_meter_C_epsilon(D=D, D2=d, rho=rho, mu=mu, k=k, P1=P1, P2=P2, m=m,
                                                       meter_type="ISO 5167 orifice", taps=taps)
    beta = d / D
    ReD = 4.0 * m / (math.pi * D * mu)
    v = m / (rho * math.pi / 4.0 * D**2)
    loss = dP_orifice(D=D, Do=d, P1=P1, P2=P2, C=C)
    # cek balik: persamaan dasar ISO 5167-1 (pers. 1) dengan d, C, eps hasil
    m_back = C / math.sqrt(1 - beta**4) * eps * math.pi / 4 * d**2 * math.sqrt(2 * (P1 - P2) * rho)

    s = res.status
    res.add("HASIL", "Diameter bore orifice", "d", d * 1000, "mm", f"{STD} pers. (1), diselesaikan iteratif", s)
    res.add("HASIL", "Rasio diameter", "beta", beta, "-", "d/D", s)
    res.add("HASIL", "Koefisien discharge", "C", C, "-", f"Reader-Harris/Gallagher, {STD} pers. (4)", s)
    res.add("HASIL", "Faktor ekspansibilitas", "epsilon", eps, "-", "1 untuk cairan" if liquid else f"{STD} pers. (5)", s)
    res.add("HASIL", "Bilangan Reynolds pipa", "Re_D", ReD, "-", "4 q_m / (pi D mu)", s)
    res.add("HASIL", "Kecepatan di pipa", "v", v, "m/s", "q_m / (rho A)", s)
    res.add("HASIL", "Rugi tekanan permanen", "dw", loss / 1e3, "kPa", f"{STD} pers. (7)", s)
    res.add("HASIL", "Cek balik laju alir", "q_m", m_back * 3600, "kg/h", "ISO 5167-1 pers. (1) dengan d, C, epsilon hasil", s)

    D_mm = D * 1000
    check(res, "d >= 12,5 mm", d * 1000 >= 12.5, f"d = {d*1000:.2f} mm", f"{STD} §5.3.1")
    check(res, "50 <= D <= 1000 mm", 50 <= D_mm <= 1000, f"D = {D_mm:.2f} mm", f"{STD} §5.3.1")
    check(res, "0,10 <= beta <= 0,75", 0.10 <= beta <= 0.75, f"beta = {beta:.4f}", f"{STD} §5.3.1")
    re_min = max(5000.0, 170.0 * beta**2 * D_mm)
    check(res, "Re_D minimum", ReD >= re_min, f"Re_D = {ReD:.0f} >= {re_min:.0f}", f"{STD} §5.3.1 (flange taps)")
    check(res, "Cek balik laju alir", abs(m_back - m) / m < 1e-6, f"selisih {abs(m_back-m)/m*100:.2e} %", "konsistensi")
    res.add("KESIMPULAN", "Hasil", "", "PASS" if res.passed else "FAIL", "", "Semua cek batas standar", s)
    return res
