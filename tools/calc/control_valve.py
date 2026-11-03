"""
control_valve.py — Sizing control valve cairan menurut IEC 60534-2-1 / ISA-75.01.01.

Dihitung Kv (dan Cv = 1,156 Kv) pada laju normal (HMB) dan laju desain maksimum, beserta cek aliran
tercekik (choked), laminar, dan flashing. Tekanan uap dihitung dari persamaan Antoine (input LITERATUR).
"""
from __future__ import annotations

from fluids.control_valve import size_control_valve_l

from common import Result, check, load_inputs, start_result

STD = "IEC 60534-2-1 / ISA-75.01.01"
KV_TO_CV = 1.156  # Cv (US gal/min, psi) = 1,156 Kv (m3/h, bar)
REQUIRED = {
    "q_m": "Laju alir massa normal", "rho": "Densitas", "mu": "Viskositas", "T1": "Suhu", "P1": "Tekanan hulu",
    "dP": "Beda tekanan desain katup", "flow_factor_max": "Faktor laju desain maksimum",
    "antoine_A": "Antoine A", "antoine_B": "Antoine B", "antoine_C": "Antoine C",
    "Pc": "Tekanan kritis", "FL": "Faktor pemulihan tekanan cairan", "Fd": "Valve style modifier",
    "D": "Diameter dalam pipa", "d_valve": "Ukuran katup",
}


def antoine_bar(T_K: float, A: float, B: float, C: float) -> float:
    """log10(P/bar) = A - B/(T + C), T dalam K (format NIST WebBook)."""
    return 10 ** (A - B / (T_K + C))


def run(path, hmb) -> Result:
    doc, p = load_inputs(path, hmb, REQUIRED)
    res = start_result(doc, p)
    s = res.status

    T_K = p["T1"].value + 273.15
    Psat = antoine_bar(T_K, p["antoine_A"].value, p["antoine_B"].value, p["antoine_C"].value) * 1e5
    P1 = p["P1"].value * 1e5
    P2 = P1 - p["dP"].value * 1e5
    rho, mu = p["rho"].value, p["mu"].value / 1000.0
    D, d = p["D"].value / 1000.0, p["d_valve"].value / 1000.0
    Pc = p["Pc"].value * 1e5
    res.add("HASIL", "Tekanan uap pada T1", "Pv", Psat / 1e3, "kPa", "Persamaan Antoine (input LITERATUR)", s)

    for label, factor in (("normal", 1.0), ("maksimum", p["flow_factor_max"].value)):
        Q = p["q_m"].value * factor / 3600.0 / rho  # m3/s
        out = size_control_valve_l(rho=rho, Psat=Psat, Pc=Pc, mu=mu, P1=P1, P2=P2, Q=Q,
                                   D1=D, D2=D, d=d, FL=p["FL"].value, Fd=p["Fd"].value, full_output=True)
        kv = out["Kv"]
        res.add("HASIL", f"Laju volumetrik ({label})", "Q", Q * 3600, "m3/h", "q_m / rho", s)
        res.add("HASIL", f"Koefisien aliran Kv ({label})", "Kv", kv, "m3/h", f"{STD} pers. (1)", s)
        res.add("HASIL", f"Koefisien aliran Cv ({label})", "Cv", kv * KV_TO_CV, "US gpm/psi^0.5", "Cv = 1,156 Kv", s)
        res.add("HASIL", f"Faktor rasio tekanan kritis ({label})", "FF", out["FF"], "-", f"{STD} pers. (8)", s)
        res.add("HASIL", f"Reynolds katup ({label})", "Re_v", out["Rev"], "-", f"{STD} pers. (23)", s)
        check(res, f"Tidak choked ({label})", not out["choked"],
              f"dP = {p['dP'].value} bar vs FL^2 (P1 - FF Pv) = {p['FL'].value**2 * (P1 - out['FF']*Psat)/1e5:.3f} bar", STD)
        check(res, f"Aliran turbulen ({label})", not out["laminar"], f"Re_v = {out['Rev']:.3g}", STD)
    check(res, "Tidak flashing (P2 > Pv)", P2 > Psat, f"P2 = {P2/1e5:.3f} bar(a), Pv = {Psat/1e5:.4f} bar(a)", STD)
    res.add("KESIMPULAN", "Hasil", "", "PASS" if res.passed else "FAIL", "",
            "Kv dipakai memilih ukuran katup dari katalog vendor (bukan bagian skrip)", s)
    return res
