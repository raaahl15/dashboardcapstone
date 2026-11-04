"""
line_sizing.py — Pemilihan ukuran pipa proses (line sizing) per stream HMB.

Metode:
  * Dimensi pipa: ASME B36.10M (OD dan tebal dinding Sch 40/80), hanya NPS yang lazim dipakai
    (1-1/4", 2-1/2", 3-1/2", dan 5" dilewati karena ukuran tidak disukai/non-preferred di praktik pabrik).
  * Kecepatan: V = ṁ / (ρ · π D² / 4).
  * Penurunan tekanan: Darcy–Weisbach ΔP/L = f · ρ V² / (2 D), f dari persamaan Colebrook
    (solusi eksplisit Clamond di fluids.friction_factor), 64/Re untuk laminar.
  * Dua fase (service two_phase): model homogen. ρ_m dari HMB (sudah homogen), kualitas massa
    x = y_v · M_v / M, viskositas campuran McAdams 1/μ_m = x/μ_v + (1 − x)/μ_l,
    kecepatan erosi API RP 14E: V_e = C / √ρ_m  [ft/s, lb/ft³]  →  V_e = 1,2199 · C / √ρ_m  [m/s, kg/m³].
  * Ukuran terpilih = NPS terkecil yang memenuhi semua kriteria (V maks, ΔP/100 m maks, dan V ≤ V_e).

Kriteria V maks dan ΔP maks adalah input (aturan praktis, status ASUMSI/LITERATUR), bukan konstanta kode.
Skrip ini verifikasi silang; perhitungan manual tetap ditulis di laporan (Blueprint §3.2).
"""
from __future__ import annotations

import math

from fluids import friction_factor

from common import CalcError, Result, check, load_inputs, start_result

STD = "ASME B36.10M; Darcy–Weisbach + Colebrook"
# NPS: (OD mm, tebal Sch 40 mm, tebal Sch 80 mm) — ASME B36.10M. Hanya ukuran lazim.
PIPES = {
    "1/2": (21.34, 2.77, 3.73), "3/4": (26.67, 2.87, 3.91), "1": (33.40, 3.38, 4.55),
    "1-1/2": (48.26, 3.68, 5.08), "2": (60.33, 3.91, 5.54), "3": (88.90, 5.49, 7.62),
    "4": (114.30, 6.02, 8.56), "6": (168.28, 7.11, 10.97), "8": (219.08, 8.18, 12.70),
    "10": (273.05, 9.27, 15.09), "12": (323.85, 10.31, 17.48),
}
SERVICES = ("liquid_suction", "liquid_discharge", "vapor", "two_phase")
API14E_SI = 0.3048 / math.sqrt(1 / 16.01846337)  # 1,2199: konversi C (ft/s · √(lb/ft³)) ke SI


def pipe_id(nps: str, schedule: str) -> float:
    od, s40, s80 = PIPES[nps]
    return (od - 2 * (s40 if schedule == "40" else s80)) / 1000


def erosional_velocity(C: float, rho_m: float) -> float:
    """API RP 14E (2.14): V_e = C/√ρ_m dalam satuan US; dikembalikan dalam m/s untuk ρ_m dalam kg/m³."""
    return API14E_SI * C / math.sqrt(rho_m)


def hydraulics(m_kg_s: float, rho: float, mu: float, D: float, eps: float) -> dict:
    A = math.pi * D**2 / 4
    V = m_kg_s / (rho * A)
    Re = rho * V * D / mu
    f = friction_factor(Re=Re, eD=eps / D)
    dp_100m = f * rho * V**2 / (2 * D) * 100  # Pa per 100 m
    return {"V": V, "Re": Re, "f": f, "dp_bar_100m": dp_100m / 1e5, "rhoV2": rho * V**2}


def evaluate(g: dict) -> dict:
    """g dalam SI: m_flow kg/s, rho kg/m3, mu Pa·s, eps m; v_max m/s; dp_max bar/100 m."""
    service, sched = g["service"], g["schedule"]
    if service not in SERVICES:
        raise CalcError(f"service '{service}' tidak dikenal ({', '.join(SERVICES)})")
    if sched not in ("40", "80"):
        raise CalcError("schedule harus '40' atau '80'")
    Ve = erosional_velocity(g["C"], g["rho"]) if service == "two_phase" else None
    rows, chosen = [], None
    for nps in PIPES:
        D = pipe_id(nps, sched)
        h = hydraulics(g["m_flow"], g["rho"], g["mu"], D, g["eps"])
        ok_v = h["V"] <= g["v_max"]
        ok_dp = h["dp_bar_100m"] <= g["dp_max"]
        ok_e = Ve is None or h["V"] <= Ve
        h.update(nps=nps, D=D, ok=ok_v and ok_dp and ok_e, ok_v=ok_v, ok_dp=ok_dp, ok_e=ok_e)
        rows.append(h)
        if h["ok"]:
            chosen = h
            break
    if chosen is None:
        raise CalcError("tidak ada NPS s.d. 12\" yang memenuhi kriteria; periksa input")
    return {"candidates": rows, "chosen": chosen, "Ve": Ve}


REQUIRED = {
    "m_flow": "Laju alir massa", "rho": "Densitas", "service": "Jenis layanan",
    "schedule": "Schedule pipa", "roughness": "Kekasaran absolut dinding", "v_max": "Kecepatan maksimum",
    "dp_max": "Penurunan tekanan maksimum",
}


def run(path, hmb) -> Result:
    doc, p = load_inputs(path, hmb, REQUIRED)
    res = start_result(doc, p)
    s = res.status
    service = str(p["service"].value)
    g = {
        "service": service, "schedule": str(p["schedule"].value),
        "m_flow": float(p["m_flow"].value) / 3600, "rho": float(p["rho"].value),
        "eps": float(p["roughness"].value) / 1000, "v_max": float(p["v_max"].value),
        "dp_max": float(p["dp_max"].value), "C": float(p["C"].value) if "C" in p else 100.0,
    }
    if service == "two_phase":
        for k in ("y_v", "mw_v", "mw", "mu_v", "mu_l", "C"):
            if k not in p:
                raise CalcError(f"two_phase wajib input '{k}'")
        x = float(p["y_v"].value) * float(p["mw_v"].value) / float(p["mw"].value)
        mu = 1 / (x / (float(p["mu_v"].value) / 1000) + (1 - x) / (float(p["mu_l"].value) / 1000))
        res.add("HASIL", "Kualitas massa uap", "x", x, "-", "x = y_v · M_v / M", s)
        res.add("HASIL", "Viskositas campuran homogen", "μ_m", mu * 1000, "cP", "McAdams 1/μ_m = x/μ_v + (1−x)/μ_l", s)
    else:
        if "mu" not in p:
            raise CalcError("satu fase wajib input 'mu' (cP)")
        mu = float(p["mu"].value) / 1000
    g["mu"] = mu

    o = evaluate(g)
    if o["Ve"] is not None:
        res.add("HASIL", "Kecepatan erosi", "V_e", o["Ve"], "m/s", f"API RP 14E, C = {g['C']:g}", s)
    for h in o["candidates"]:
        tag = "TERPILIH" if h is o["chosen"] else "ditolak"
        res.add("KANDIDAT", f"NPS {h['nps']}\" Sch {g['schedule']} (ID {h['D'] * 1000:.2f} mm)", "V; ΔP",
                f"{h['V']:.3g} m/s; {h['dp_bar_100m']:.3g} bar/100 m", "", tag, s)
    c = o["chosen"]
    res.add("HASIL", "Ukuran pipa terpilih", "NPS", f"{c['nps']}\" Sch {g['schedule']}", "", "ASME B36.10M", s)
    res.add("HASIL", "Diameter dalam", "D", c["D"] * 1000, "mm", "OD − 2 t (B36.10M)", s)
    res.add("HASIL", "Kecepatan", "V", c["V"], "m/s", "ṁ / (ρ π D²/4)", s)
    res.add("HASIL", "Bilangan Reynolds", "Re", c["Re"], "-", "ρ V D / μ", s)
    res.add("HASIL", "Faktor gesek Darcy", "f", c["f"], "-", "Colebrook (Clamond)", s)
    res.add("HASIL", "Penurunan tekanan per 100 m", "ΔP/L", c["dp_bar_100m"], "bar/100 m", "Darcy–Weisbach", s)
    res.add("HASIL", "Momentum fluida", "ρV²", c["rhoV2"], "kg/(m·s²)", "informasi", s)

    check(res, "Kecepatan ≤ batas", c["ok_v"], f"{c['V']:.3g} ≤ {g['v_max']:g} m/s", "kriteria input")
    check(res, "ΔP ≤ batas", c["ok_dp"], f"{c['dp_bar_100m']:.3g} ≤ {g['dp_max']:g} bar/100 m", "kriteria input")
    if o["Ve"] is not None:
        check(res, "Kecepatan ≤ kecepatan erosi", c["ok_e"], f"{c['V']:.3g} ≤ {o['Ve']:.3g} m/s", "API RP 14E")
    res.add("KESIMPULAN", "Hasil", "", "PASS" if res.passed else "FAIL", "",
            "Ukuran final dicek ulang terhadap NPSH pompa, rating kelas pipa, dan panjang ekuivalen nyata", s)
    return res
