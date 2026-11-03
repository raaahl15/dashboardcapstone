"""
psv.py — Sizing pressure safety valve fase gas menurut API 520 Part I, pemilihan orifice API 526.

Tekanan relief P1 = P_set (1 + overpressure) + P_atm. Aliran kritis bila P2 < P1 (2/(k+1))^(k/(k-1)).
Luas efektif dibandingkan dengan luas orifice standar API 526 (huruf D s.d. T).
"""
from __future__ import annotations

from fluids.safety_valve import API520_A_g, API526_A, API526_letters

from common import Result, check, load_inputs, start_result

STD = "API 520 Part I / API 526"
REQUIRED = {
    "W": "Laju relief", "T": "Suhu relief", "MW": "Berat molekul", "Z": "Faktor kompresibilitas",
    "k": "Rasio kalor spesifik", "P_set": "Set pressure", "overpressure": "Overpressure",
    "P_atm": "Tekanan atmosfer", "P_back": "Tekanan balik", "Kd": "Koefisien discharge",
    "Kb": "Faktor koreksi backpressure", "Kc": "Faktor rupture disk",
}


def run(path, hmb) -> Result:
    doc, p = load_inputs(path, hmb, REQUIRED)
    res = start_result(doc, p)
    s = res.status

    m = p["W"].value / 3600.0
    T = p["T"].value + 273.15
    k = p["k"].value
    P1 = (p["P_set"].value * (1 + p["overpressure"].value / 100.0) + p["P_atm"].value) * 1e5
    P2 = p["P_back"].value * 1e5
    P_cf = P1 * (2 / (k + 1)) ** (k / (k - 1))
    critical = P2 < P_cf
    # fluids menentukan sendiri rezim kritis/subkritis dari P2; P_cf di atas dihitung untuk pelaporan
    A = API520_A_g(m=m, T=T, Z=p["Z"].value, MW=p["MW"].value, k=k, P1=P1, P2=P2,
                   Kd=p["Kd"].value, Kb=p["Kb"].value, Kc=p["Kc"].value)
    letter, A_sel = next(((L, a) for L, a in zip(API526_letters, API526_A) if a >= A), (None, None))

    res.add("HASIL", "Tekanan relief", "P1", P1 / 1e5, "bar(a)", "P_set (1 + overpressure) + P_atm", s)
    res.add("HASIL", "Tekanan aliran kritis", "P_cf", P_cf / 1e5, "bar(a)", "API 520 Part I pers. (1)", s)
    res.add("HASIL", "Rezim aliran", "", "kritis" if critical else "subkritis", "", "P_back vs P_cf", s)
    res.add("HASIL", "Luas efektif dibutuhkan", "A", A * 1e6, "mm2",
            "API 520 Part I pers. (3) kritis" if critical else "API 520 Part I pers. (9) subkritis", s)
    res.add("HASIL", "Huruf orifice API 526", "", letter or "> T (perlu beberapa katup)", "", "API 526 Tabel 1", s)
    if A_sel:
        res.add("HASIL", "Luas orifice terpilih", "A_sel", A_sel * 1e6, "mm2", "API 526 Tabel 1", s)
        res.add("HASIL", "Margin luas", "", (A_sel / A - 1) * 100, "%", "A_sel / A - 1", s)
    check(res, "Orifice API 526 tersedia (satu katup)", letter is not None, f"A = {A*1e6:.1f} mm2", "API 526")
    check(res, "k fisik (1 < k < 2)", 1.0 < k < 2.0, f"k = {k:.4f}", "konsistensi data")
    res.add("KESIMPULAN", "Hasil", "", "PASS" if res.passed else "FAIL", "", "Skenario relief wajib dikaji ulang (API 521)", s)
    return res
