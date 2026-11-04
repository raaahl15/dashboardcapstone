"""
thermowell.py — Verifikasi kekuatan thermowell menurut ASME PTC 19.3 TW-2016 (Section 6, alur Section 7).

Cakupan: thermowell lurus (straight), tirus (tapered), dan step-shank berbor 0,66 cm dengan diameter
tip 2,22 cm atau 1,27 cm (Tabel 6-5.3-1; interpolasi tidak diizinkan). Pemasangan berulir (threaded),
dilas (weld-in), atau flens/lap-joint. Tanpa corrosion allowance (§6-2), tanpa elbow (§6-10.7), tanpa
operasi superkritis (§6-12.5): kasus-kasus itu ditolak dengan pesan, bukan dihitung diam-diam.

Langkah (nomor persamaan = nomor di standar):
  Re, N_S           (6-4-3), (6-4-2) atau (6-4-4)
  f_a, H_f, H_a,f, H_a,s, f_n      (6-5-1) s.d. (6-5-6); step-shank (6-5-3) + Tabel 6-5.3-1
  H_c, f_n^c        (6-7-1) berulir; (6-6-5) dilas/flens (basis semi-tak-hingga)
  N_Sc, f_s         (6-8-1), (6-4-1)
  Batas frekuensi   §6-8.2 (gas densitas rendah) atau §6-8.3 langkah 1–4 (kasus umum, F'_M = 1/(2ζ))
  G_SP, G_RD        (6-10-7)/(6-10-8) lurus-tirus; (6-10-9)/(6-10-11) & G_RD step-shank
  Tegangan tunak    (6-11-1)–(6-11-3), (6-10-4), (6-12-1), von Mises (6-12-2) ≤ 1,5 S
  Tegangan dinamis  (6-9-1), (6-9-2), (6-10-5), (6-10-6), (6-12-3), K_t (6-12-4), F_T (6-12-6), (6-12-5)
  Tekanan           (6-13-1) P_c (alternatif sederhana UG-28), (6-13-2) P_t; rating = min(P_c, P_t)

Catatan verifikasi: G_RD dihitung dengan L_S² seperti pada contoh 8-2 (hasil 137,3); persamaan
(6-10-10) tercetak dengan L², yang tidak mereproduksi contoh. Lihat test_verification.py.
Skrip ini verifikasi silang; perhitungan manual tetap ditulis di laporan PSTF 2 Bab 2 (Blueprint §3.2).
"""
from __future__ import annotations

import math

from common import CalcError, Param, Result, check, load_inputs, start_result

STD = "ASME PTC 19.3 TW-2016"
C_D, C_d, C_L = 1.4, 0.1, 1.0  # (6-4-5)
P_ATM_BAR = 1.01325

# Tabel 6-5.3-1: c1..c10 untuk step-shank, bor nominal 0,66 cm
STEP_TABLE = {
    0.0222: (1.410, -0.949, -0.091, 1.132, -1.714, 0.865, 0.861, 1.000, 9.275, -7.466),
    0.0127: (1.407, -0.839, -0.022, 1.022, -2.228, 1.594, 1.313, 0.362, 8.299, -5.376),
}


# ------------------------------------------------------------------ korelasi
def strouhal(Re: float, method: str) -> float:
    """(6-4-2) korelasi atau (6-4-4) N_S = 0,22."""
    if method == "simple":
        return 0.22
    if 22 <= Re < 1300:
        return 0.22 * (1 - 22 / Re)
    if 1300 <= Re < 5e5:
        x = math.log10(Re / 1300)
        return 0.213 - 0.0248 * x**2 + 0.0095 * x**3
    if 5e5 <= Re < 5e7:
        return 0.22
    raise CalcError(f"Re = {Re:.3g} di luar rentang korelasi Strouhal (22 ≤ Re < 5e7)")


def v_inline_resonance(B, fnc, Ns, V, rho, mu, Re, method) -> float:
    """(6-8-3)/(6-8-4) atau (6-8-5): kecepatan saat 2 f_s = f_n^c."""
    base = B * fnc / (2 * Ns)
    if method == "simple" or Re >= 5e5:
        return base
    if Re < 1300:
        return base * (1 - 22 * mu / (B * rho * V)) + 22 * mu / (B * rho)
    R = math.log10(Re / 1300)
    a = 0.0285 * R**2 - 0.0496 * R
    return base * (1 - a / Ns * math.log10(base / V))


def magnification(r: float, zeta: float) -> float:
    """(6-9-1)/(6-9-2) di luar pita lock-in; (6-9-3) 1/(2ζ) di dalam pita 0,8 < r < 1,2."""
    if 0.8 < r < 1.2:
        return 1 / (2 * zeta)
    return 1 / abs(1 - r**2)


def stress_concentration(diam: float, fillet: float, threaded: bool, override: float | None) -> float:
    """§6-12.3: K_t input > berulir 2,3 > (6-12-4) bila radius fillet diketahui > 2,2."""
    if override is not None:
        return override
    if threaded:
        return 2.3
    if fillet and fillet > 0:
        ratio = diam / fillet
        return 1.1 + 0.033 * ratio if ratio < 33 else 2.2
    return 2.2


# ------------------------------------------------------------------ inti (SI murni, dipakai uji)
def evaluate(g: dict) -> dict:
    """Hitung seluruh kriteria. Semua satuan SI: m, Pa, kg/m3, Pa·s, m/s. Kembalikan dict hasil."""
    shape, support = g["shape"], g["support"]
    A, B, d, L, t = g["A"], g["B"], g["d"], g["L"], g["t"]
    b, L0 = g.get("b", 0.0), g.get("L0", 0.0)
    V, rho, mu, P = g["V"], g["rho"], g["mu"], g["P"]
    E, E_ref, rho_m, rho_s = g["E"], g["E_ref"], g["rho_m"], g["rho_s"]
    S, Sf, FE, zeta = g["S"], g["Sf"], g.get("FE", 1.0), g.get("zeta", 0.0005)
    method = g.get("strouhal", "correlation")
    if shape not in ("straight", "tapered", "step"):
        raise CalcError(f"shape '{shape}' tidak dikenal (straight|tapered|step)")
    if support not in ("threaded", "welded", "flanged"):
        raise CalcError(f"support '{support}' tidak dikenal (threaded|welded|flanged)")
    if not (0 < d < B <= A and L > 0 and t > 0):
        raise CalcError("dimensi tidak konsisten: wajib 0 < d < B ≤ A, L > 0, t > 0")
    out: dict = {}

    # Re dan Strouhal (diameter tip)
    Re = V * B * rho / mu
    Ns = strouhal(Re, method)
    out.update(Re=Re, Ns=Ns)

    # Frekuensi natural
    if shape == "step":
        Ls, bs = g["Ls"], g.get("bs", 0.0)
        key = next((k for k in STEP_TABLE if abs(B - k) <= 2e-4), None)
        if key is None or abs(d - 0.0066) > 3e-4:
            raise CalcError("step-shank di luar Tabel 6-5.3-1 (B 2,22/1,27 cm, bor 0,66 cm); gunakan FEM (§6-5.2)")
        c1, c2, c3, c4, c5, c6, c7, c8, c9, c10 = STEP_TABLE[key]
        Da = A
        y1 = (c1 * (A / B) + c2) * (Ls / L) + (c3 * (A / B) + c4)
        y2 = (c5 * (A / B) + c6) * (Ls / L) + (c7 * (A / B) + c8)
        beta = c9 * (A / B) + c10
        Hf = (y1 ** -beta + y2 ** -beta) ** (-1 / beta)
    else:
        Da = (A + B) / 2
        Hf = 0.99 * (1 + (1 - B / A) + (1 - B / A) ** 2) / (1 + 1.1 * (Da / L) ** (3 * (1 - 0.8 * (d / Da))))
    I = math.pi * (Da**4 - d**4) / 64
    m = rho_m * math.pi * (Da**2 - d**2) / 4
    fa = 1.875**2 / (2 * math.pi) * math.sqrt(E * I / m) / L**2
    Haf = 1 - rho / (2 * rho_m)
    Has = 1 - rho_s / (2 * rho_m) / ((Da / d) ** 2 - 1)
    fn = Hf * Haf * Has * fa
    Hc = 1 - 0.9 * (A / L) if support == "threaded" else 1 - 0.61 * (A / L) / (1 + 1.5 * (b / A)) ** 2
    fnc = Hc * fn
    out.update(Da=Da, I=I, m=m, fa=fa, Hf=Hf, Haf=Haf, Has=Has, fn=fn, Hc=Hc, fnc=fnc)

    # Eksitasi
    fs = Ns * V / B
    Nsc = math.pi**2 * zeta * (rho_m / rho) * (1 - (d / B) ** 2)
    out.update(fs=fs, Nsc=Nsc)

    # Faktor G per lokasi (titik tumpu, dan dasar step untuk step-shank)
    if shape == "step":
        if L0 <= 0:
            Gsp = 16 * L**2 / (math.pi * A**2 * (1 - (d / A) ** 4)) * ((B / A) + (1 - B / A) * (1 - Ls / L) ** 2)
            Grd = 16 * Ls**2 / (math.pi * B**2 * (1 - (d / B) ** 4))
        elif L0 < L - Ls:
            Gsp = 16 * L**2 / (math.pi * A**2 * (1 - (d / A) ** 4)) * (
                (B / A) + (1 - B / A) * (1 - Ls / L) ** 2 - (L0 / L) ** 2)
            Grd = 16 * Ls**2 / (math.pi * B**2 * (1 - (d / B) ** 4))
        else:
            Gsp = 16 * B * L**2 / (math.pi * A**3 * (1 - (d / A) ** 4)) * (1 - (L0 / L) ** 2)
            Grd = 16 * L**2 / (math.pi * B**2 * (1 - (d / B) ** 4)) * (1 - L0 / L) * (2 * Ls / L - 1 + L0 / L)
        locations = [
            ("titik tumpu", Gsp, d / A, stress_concentration(A, b, support == "threaded", g.get("Kt"))),
            ("dasar step", Grd, d / B, stress_concentration(B, bs, False, g.get("Kt_step"))),
        ]
    else:
        k = 16 * L**2 / (3 * math.pi * A**2 * (1 - (d / A) ** 4))
        Gsp = k * (1 + 2 * B / A) if L0 <= 0 else k * (
            3 * (1 - (L0 / L) ** 2) + 2 * (B / A - 1) * (1 - (L0 / L) ** 3))
        locations = [("titik tumpu", Gsp, d / A, stress_concentration(A, b, support == "threaded", g.get("Kt")))]
    out["locations"] = []

    FT = E / E_ref
    fatigue_limit = FT * FE * Sf
    out.update(FT=FT, fatigue_limit=fatigue_limit)

    # Batas frekuensi (§6-8)
    VIR = v_inline_resonance(B, fnc, Ns, V, rho, mu, Re, method)
    Pd_IR = 0.5 * rho * C_d * VIR**2
    FMp_res = 1 / (2 * zeta)
    low_density = Nsc > 2.5 and Re < 1e5
    inline_ok = True
    for name, G, ratio, Kt in locations:
        Sd_IR = G * FMp_res * Pd_IR
        So_IR = Kt * Sd_IR
        inline_ok &= So_IR <= fatigue_limit
        out["locations"].append({"name": name, "G": G, "Kt": Kt, "Sd_IR": Sd_IR, "So_IR": So_IR})
    if low_density:
        limit_ratio, basis = 0.8, "§6-8.2 (N_Sc > 2,5 dan Re < 1e5): resonansi in-line teredam, f_s < 0,8 f_n^c"
    elif inline_ok:
        limit_ratio, basis = 0.8, "§6-8.3 langkah 3: lolos tegangan siklik di resonansi in-line, f_s < 0,8 f_n^c"
    else:
        limit_ratio, basis = 0.4, "§6-8.3 langkah 4: gagal tegangan siklik di resonansi in-line, f_s < 0,4 f_n^c"
    out.update(VIR=VIR, Pd_IR=Pd_IR, low_density=low_density, inline_ok=inline_ok,
               limit_ratio=limit_ratio, freq_basis=basis, freq_ok=fs < limit_ratio * fnc)
    if fs > fnc:
        raise CalcError("f_s > f_n^c: operasi superkritis (§6-12.5) di luar cakupan kalkulator ini")

    # Tegangan tunak dan dinamis pada kecepatan desain
    r, rp = fs / fnc, 2 * fs / fnc
    FM, FMp = magnification(r, zeta), magnification(rp, zeta)
    PD = 0.5 * rho * C_D * V**2
    Pd = 0.5 * rho * C_d * V**2
    PL = 0.5 * rho * C_L * V**2
    out.update(r=r, rp=rp, FM=FM, FMp=FMp, PD=PD, Pd=Pd, PL=PL)
    for loc in out["locations"]:
        ratio = d / A if loc["name"] == "titik tumpu" else d / B
        Sr = P
        St = P * (1 + ratio**2) / (1 - ratio**2)
        Sa = P / (1 - ratio**2)
        SD = loc["G"] * PD
        Smax = SD + Sa
        vm = math.sqrt(((Smax - Sr) ** 2 + (Smax - St) ** 2 + (St - Sr) ** 2) / 2)
        Sd = loc["G"] * FMp * Pd
        SL = loc["G"] * FM * PL
        So = loc["Kt"] * math.sqrt(Sd**2 + SL**2)
        loc.update(Sr=Sr, St=St, Sa=Sa, SD=SD, Smax=Smax, von_mises=vm, steady_ok=vm <= 1.5 * S,
                   Sd=Sd, SL=SL, So=So, dynamic_ok=So <= fatigue_limit)

    # Tekanan (§6-13)
    Pc = 0.66 * S * (2.167 / (2 * B / (B - d)) - 0.0833)
    Pt = S / 0.13 * (t / d) ** 2
    Pr = min(Pc, Pt)
    out.update(Pc=Pc, Pt=Pt, Pr=Pr, pressure_ok=Pr > P)

    # Kecepatan rendah §6-3.6 (informasi; rating tekanan tetap wajib)
    out["low_velocity_exempt"] = (V < 0.64 and A - d >= 9.55e-3 and L <= 0.61 and A >= B >= 12.7e-3
                                  and S >= 69e6 and Sf >= 21e6)
    out["passed"] = (out["freq_ok"] and out["pressure_ok"]
                     and all(l["steady_ok"] and l["dynamic_ok"] for l in out["locations"]))
    return out


# ------------------------------------------------------------------ dari YAML
REQUIRED = {
    "rho": "Densitas fluida", "mu": "Viskositas dinamis", "P": "Tekanan operasi",
    "shape": "Bentuk shank", "support": "Jenis pemasangan",
    "A": "Diameter akar (support plane)", "B": "Diameter tip", "d": "Diameter bor",
    "L": "Panjang tak tertumpu", "t": "Tebal tip minimum", "b": "Radius fillet akar",
    "E": "Modulus elastisitas pada suhu operasi", "E_ref": "Modulus referensi kelas material",
    "rho_m": "Densitas material", "rho_s": "Densitas sensor", "S": "Tegangan izin maksimum",
    "Sf": "Batas amplitudo fatik", "FE": "Faktor lingkungan", "zeta": "Faktor redaman",
    "strouhal": "Metode bilangan Strouhal",
}
UNITS = {  # satuan yang diterima → faktor ke SI
    "kg/m3": 1.0, "cP": 1e-3, "Pa.s": 1.0, "m/s": 1.0, "kg/h": 1 / 3600, "mm": 1e-3, "m": 1.0,
    "GPa": 1e9, "MPa": 1e6, "Pa": 1.0, "-": 1.0,
}


def _si(p: Param) -> float:
    if p.unit not in UNITS:
        raise CalcError(f"{p.name}: satuan '{p.unit}' tidak didukung ({', '.join(UNITS)})")
    return float(p.value) * UNITS[p.unit]


def _pressure_gauge_pa(p: Param) -> float:
    if p.unit == "bar(a)":
        return (float(p.value) - P_ATM_BAR) * 1e5
    if p.unit == "bar(g)":
        return float(p.value) * 1e5
    if p.unit == "MPa(g)":
        return float(p.value) * 1e6
    raise CalcError(f"P: satuan '{p.unit}' tidak didukung (bar(a), bar(g), MPa(g))")


def run(path, hmb) -> Result:
    doc, p = load_inputs(path, hmb, REQUIRED)
    res = start_result(doc, p)
    s = res.status

    g = {k: _si(p[k]) for k in ("rho", "mu", "A", "B", "d", "L", "t", "b", "E", "E_ref", "rho_m", "rho_s",
                                "S", "Sf", "FE", "zeta")}
    g.update(shape=str(p["shape"].value), support=str(p["support"].value), strouhal=str(p["strouhal"].value),
             P=_pressure_gauge_pa(p["P"]))
    for opt in ("Ls", "bs", "L0", "Kt", "Kt_step"):
        if opt in p:
            g[opt] = _si(p[opt])
    if g["shape"] == "step" and "Ls" not in g:
        raise CalcError("step-shank wajib input Ls (panjang bagian diameter kecil)")
    if "V" in p:
        g["V"] = _si(p["V"])
        v_src = "input V"
    elif "m_flow" in p and "pipe_id" in p:
        area = math.pi * _si(p["pipe_id"]) ** 2 / 4
        g["V"] = _si(p["m_flow"]) / (g["rho"] * area)
        v_src = "V = ṁ / (ρ · π D_pipa² / 4)"
    else:
        raise CalcError("kecepatan: isi V, atau m_flow + pipe_id")

    o = evaluate(g)
    MPa = 1e6
    res.add("HASIL", "Kecepatan fluida desain", "V", g["V"], "m/s", v_src, s)
    res.add("HASIL", "Bilangan Reynolds (diameter tip)", "Re", o["Re"], "-", "(6-4-3)", s)
    res.add("HASIL", "Bilangan Strouhal", "N_S", o["Ns"], "-", "(6-4-2)" if g["strouhal"] != "simple" else "(6-4-4)", s)
    res.add("HASIL", "Frekuensi natural pendekatan", "f_a", o["fa"], "Hz", "(6-5-1)", s)
    res.add("HASIL", "Faktor koreksi bentuk", "H_f", o["Hf"], "-", "(6-5-3) Tabel 6-5.3-1" if g["shape"] == "step" else "(6-5-2)", s)
    res.add("HASIL", "Koreksi massa fluida", "H_a,f", o["Haf"], "-", "(6-5-4)", s)
    res.add("HASIL", "Koreksi massa sensor", "H_a,s", o["Has"], "-", "(6-5-5)", s)
    res.add("HASIL", "Faktor compliance tumpuan", "H_c", o["Hc"], "-", "(6-7-1)" if g["support"] == "threaded" else "(6-6-5)", s)
    res.add("HASIL", "Frekuensi natural terpasang", "f_n^c", o["fnc"], "Hz", "(6-5-6), (6-6-1)", s)
    res.add("HASIL", "Frekuensi Strouhal", "f_s", o["fs"], "Hz", "(6-4-1)", s)
    res.add("HASIL", "Rasio frekuensi", "f_s/f_n^c", o["r"], "-", f"batas {o['limit_ratio']}", s)
    res.add("HASIL", "Bilangan Scruton", "N_Sc", o["Nsc"], "-", "(6-8-1), ζ = %g" % g["zeta"], s)
    res.add("HASIL", "Kecepatan resonansi in-line", "V_IR", o["VIR"], "m/s", "(6-8-3)/(6-8-5)", s)
    for loc in o["locations"]:
        n = loc["name"]
        res.add("HASIL", f"Faktor geometri G ({n})", "G", loc["G"], "-", "§6-10", s)
        res.add("HASIL", f"Faktor konsentrasi tegangan ({n})", "K_t", loc["Kt"], "-", "§6-12.3", s)
        res.add("HASIL", f"Tegangan siklik di resonansi in-line ({n})", "S_o,max", loc["So_IR"] / MPa, "MPa",
                "(6-12-3) dengan F'_M = 1/(2ζ)", s)
        res.add("HASIL", f"Von Mises tunak ({n})", "LHS", loc["von_mises"] / MPa, "MPa", "(6-12-2)", s)
        res.add("HASIL", f"Tegangan dinamis pada V desain ({n})", "S_o,max", loc["So"] / MPa, "MPa", "(6-12-3)", s)
    res.add("HASIL", "Batas fatik terkoreksi", "F_T·F_E·S_f", o["fatigue_limit"] / MPa, "MPa", "(6-12-5), (6-12-6)", s)
    res.add("HASIL", "Rating tekanan eksternal", "P_r", o["Pr"] / MPa, "MPa", "min(P_c (6-13-1), P_t (6-13-2))", s)
    res.add("HASIL", "Tekanan operasi (gauge)", "P", g["P"] / MPa, "MPa", "input", s)

    check(res, "Batas frekuensi", o["freq_ok"],
          f"f_s = {o['fs']:.1f} Hz vs {o['limit_ratio']} f_n^c = {o['limit_ratio'] * o['fnc']:.1f} Hz; {o['freq_basis']}", STD)
    for loc in o["locations"]:
        check(res, f"Tegangan tunak von Mises ({loc['name']})", loc["steady_ok"],
              f"{loc['von_mises'] / MPa:.3g} MPa ≤ 1,5 S = {1.5 * g['S'] / MPa:.3g} MPa", "(6-12-2)")
        check(res, f"Tegangan dinamis ({loc['name']})", loc["dynamic_ok"],
              f"{loc['So'] / MPa:.3g} MPa ≤ {o['fatigue_limit'] / MPa:.3g} MPa", "(6-12-5)")
    check(res, "Rating tekanan eksternal", o["pressure_ok"],
          f"P_r = {o['Pr'] / MPa:.3g} MPa > P = {g['P'] / MPa:.3g} MPa", "§6-13")
    res.add("KESIMPULAN", "Hasil", "", "PASS" if res.passed else "FAIL", "",
            "Tanpa corrosion allowance (§6-2); dimensi Tabel 4-1-1 belum dicek otomatis", s)
    return res
