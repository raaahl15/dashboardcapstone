"""
Uji verifikasi mesin kalkulator (Blueprint §3.2 butir 5: minimal satu uji per kalkulator).

* Control valve : IEC 60534-2-1 contoh 1 & 2 (cairan).
* PSV           : API 520 Part I contoh 1 (kritis) & 2 (subkritis), lewat modul psv end-to-end.
* Orifice       : implementasi INDEPENDEN persamaan Reader-Harris/Gallagher (ISO 5167-2 pers. 4)
                  dibandingkan dengan modul orifice; cek balik persamaan dasar ISO 5167-1.
* NPV           : contoh buku teks yang dapat dihitung tangan.
* Thermowell    : ASME PTC 19.3 TW-2016 contoh 8-1 & 8-2; pita operasi §6-8.4; batas dimensi Tabel 4-1-1.
* Line sizing   : ID ASME B36.10M, nilai Colebrook diagram Moody, hitung tangan Darcy, konversi API RP 14E.
* Mesin         : propagasi status, dan gagal-atomik bila satu input rusak.

Jalankan: npm run test:py
"""
import math

import pytest
import yaml
from fluids.control_valve import size_control_valve_l

import common
import control_valve
import line_sizing
import npv
import orifice
import psv
import run_all
import thermowell


@pytest.fixture(scope="module")
def hmb():
    return common.load_hmb()


def write_yaml(tmp_path, name, doc):
    p = tmp_path / name
    p.write_text(yaml.safe_dump(doc, allow_unicode=True), encoding="utf-8")
    return p


def val(res, parameter):
    row = next(r for r in res.rows if r[2] == parameter)
    return float(row[4])


def v(value, unit="-", status="STANDAR"):
    return {"value": value, "unit": unit, "source": "uji verifikasi", "status": status}


# ---------------------------------------------------------------- control valve (IEC 60534-2-1)
@pytest.mark.parametrize("D,FL,Fd,expected_kv", [
    (0.15, 0.90, 0.46, 165.0),   # contoh 1: globe, plug parabolik, flow-to-open
    (0.10, 0.60, 0.98, 238.1),   # contoh 2: ball/segmented ball
])
def test_iec_60534_contoh_cairan(D, FL, Fd, expected_kv):
    kv = size_control_valve_l(rho=965.4, Psat=70.1E3, Pc=22120E3, mu=3.1472E-4, P1=680E3, P2=220E3,
                              Q=0.1, D1=D, D2=D, d=D, FL=FL, Fd=Fd)
    assert kv == pytest.approx(expected_kv, rel=2e-3)


def test_antoine_metanol_titik_didih_normal():
    # titik didih normal metanol 337,8 K (NIST) -> P ~ 1,01325 bar
    p = control_valve.antoine_bar(337.8, 5.20409, 1581.341, -33.50)
    assert p == pytest.approx(1.01325, rel=0.01)


# ---------------------------------------------------------------- PSV (API 520 Part I)
def psv_doc(P_back):
    # API 520 Part I contoh: W = 24 270 kg/h, T = 348 K, Z = 0,90, M = 51, k = 1,11, P1 = 670 kPa(a)
    P_set = (6.70 - 1.01325) / 1.10
    return {"tag": "API520-EX", "calculator": "psv_gas", "inputs": {
        "W": v(24270, "kg/h"), "T": v(348 - 273.15, "degC"), "MW": v(51.0), "Z": v(0.90), "k": v(1.11),
        "P_set": v(P_set, "bar(g)"), "overpressure": v(10.0, "%"), "P_atm": v(1.01325, "bar(a)"),
        "P_back": v(P_back, "bar(a)"), "Kd": v(0.975), "Kb": v(1.0), "Kc": v(1.0)}}


def test_api520_contoh1_kritis(tmp_path, hmb):
    res = psv.run(write_yaml(tmp_path, "psv1.yaml", psv_doc(1.01325)), hmb)
    assert val(res, "Luas efektif dibutuhkan") == pytest.approx(3698, rel=1e-3)  # API 520: 3698 mm2
    assert next(r for r in res.rows if r[2] == "Rezim aliran")[4] == "kritis"


def test_api520_contoh2_subkritis(tmp_path, hmb):
    res = psv.run(write_yaml(tmp_path, "psv2.yaml", psv_doc(5.32)), hmb)
    assert val(res, "Luas efektif dibutuhkan") == pytest.approx(4248, rel=1e-3)  # API 520: 4248 mm2
    assert next(r for r in res.rows if r[2] == "Rezim aliran")[4] == "subkritis"


# ---------------------------------------------------------------- orifice (ISO 5167-2)
def rhg_independen(beta, ReD, D_mm, taps="flange"):
    """ISO 5167-2:2022 pers. (4), ditulis ulang langsung dari standar (tanpa pustaka)."""
    if taps == "flange":
        L1 = L2 = 25.4 / D_mm
    elif taps == "corner":
        L1 = L2 = 0.0
    else:
        raise ValueError(taps)
    A = (19000.0 * beta / ReD) ** 0.8
    M2 = 2.0 * L2 / (1.0 - beta)
    C = (0.5961 + 0.0261 * beta**2 - 0.216 * beta**8
         + 0.000521 * (1e6 * beta / ReD) ** 0.7
         + (0.0188 + 0.0063 * A) * beta**3.5 * (1e6 / ReD) ** 0.3
         + (0.043 + 0.080 * math.exp(-10 * L1) - 0.123 * math.exp(-7 * L1)) * (1 - 0.11 * A) * beta**4 / (1 - beta**4)
         - 0.031 * (M2 - 0.8 * M2**1.1) * beta**1.3)
    if D_mm < 71.12:
        C += 0.011 * (0.75 - beta) * (2.8 - D_mm / 25.4)
    return C


def orifice_doc(q_kg_h, D_mm, dP_kPa, rho=998.0, mu_cP=1.0):
    return {"tag": "ORI-EX", "calculator": "orifice", "inputs": {
        "q_m": v(q_kg_h, "kg/h"), "P1": v(5.0, "bar(a)"), "T1": v(20.0, "degC"), "rho": v(rho, "kg/m3"),
        "mu": v(mu_cP, "cP"), "D": v(D_mm, "mm"), "dP": v(dP_kPa, "kPa"), "taps": v("flange"), "phase": v("liquid")}}


@pytest.mark.parametrize("q,D,dP", [(20000, 102.26, 25.0), (60000, 154.08, 50.0), (8321.27, 154.08, 25.0)])
def test_orifice_rhg_independen(tmp_path, hmb, q, D, dP):
    res = orifice.run(write_yaml(tmp_path, "ori.yaml", orifice_doc(q, D, dP)), hmb)
    beta, ReD, C = val(res, "Rasio diameter"), val(res, "Bilangan Reynolds pipa"), val(res, "Koefisien discharge")
    assert C == pytest.approx(rhg_independen(beta, ReD, D), rel=1e-5)
    # persamaan dasar ISO 5167-1 dengan C independen harus mengembalikan laju yang sama
    d = beta * D / 1000
    m = (rhg_independen(beta, ReD, D) / math.sqrt(1 - beta**4) * math.pi / 4 * d**2
         * math.sqrt(2 * dP * 1e3 * 998.0)) * 3600
    assert m == pytest.approx(q, rel=1e-4)


def test_orifice_gagal_bila_beta_di_luar_batas(tmp_path, hmb):
    # aliran sangat kecil di pipa besar -> beta < 0,10 -> harus FAIL
    res = orifice.run(write_yaml(tmp_path, "ori_bad.yaml", orifice_doc(500, 154.08, 25.0)), hmb)
    assert res.passed is False


# ---------------------------------------------------------------- NPV
def test_npv_contoh_buku_teks(tmp_path, hmb):
    doc = {"tag": "NPV-EX", "calculator": "npv", "inputs": {
        "capex": v(1000, "USD"), "opex": v(0, "USD"), "revenue": v(500, "USD"), "rate": v(10.0, "%"),
        "life": v(3, "tahun"), "hurdle": v(10.0, "%"), "payback_target": v(5.0, "tahun")}}
    res = npv.run(write_yaml(tmp_path, "npv.yaml", doc), hmb)
    assert val(res, "Net Present Value") == pytest.approx(500 * (1 / 1.1 + 1 / 1.1**2 + 1 / 1.1**3) - 1000, abs=0.01)  # 243,43
    irr = val(res, "Internal Rate of Return") / 100
    assert sum(c / (1 + irr) ** t for t, c in enumerate([-1000, 500, 500, 500])) == pytest.approx(0, abs=1e-3)
    assert val(res, "Payback sederhana") == pytest.approx(2.0)
    assert val(res, "Payback terdiskonto") == pytest.approx(2.352, abs=1e-3)


# ---------------------------------------------------------------- thermowell (ASME PTC 19.3 TW-2016 Section 8)
# Nilai acuan = angka antara yang dicetak di contoh standar (dibulatkan 4 angka penting) → toleransi 0,3–0,5 %.
EX_8_2 = dict(  # 8-2: step-shank berulir, air panas, satuan SI
    shape="step", support="threaded", A=0.0222, B=0.0127, d=0.0066, L=0.19, Ls=0.0635, b=0.0, bs=0.0032,
    t=0.0048, V=10.0, rho=968.8, mu=3.334e-4, P=0.400e6,
    E=1.91e11,  # nilai yang dipakai dalam perhitungan contoh (f_a, F_T); teks 8-2.1.3 menyebut 1,93e11
    E_ref=1.95e11, rho_m=8000.0, rho_s=2700.0, S=122e6, Sf=37.2e6, FE=1.0, zeta=0.0005, strouhal="correlation")

IN, FT_, LB, PSI = 0.0254, 0.3048, 0.45359237, 6894.757293
EX_8_1 = dict(  # 8-1: tirus dilas, uap, satuan US → SI
    shape="tapered", support="welded", A=1.5 * IN, B=1.0 * IN, d=0.26 * IN, L=4.06 * IN, b=0.0,
    t=0.188 * IN, V=295 * FT_, rho=0.499 * LB / FT_**3, mu=1.149e-5 * LB / FT_, P=235 * PSI,
    E=27.5e6 * PSI, E_ref=29.3e6 * PSI, rho_m=0.284 * LB / IN**3, rho_s=169 * LB / FT_**3,
    S=19800 * PSI, Sf=3000 * PSI, FE=1.0, zeta=0.0005, strouhal="correlation")


def test_ptc193_contoh_8_2_step_shank_si():
    o = thermowell.evaluate(EX_8_2)
    ap = lambda x, ref, rel=3e-3: x == pytest.approx(ref, rel=rel)  # noqa: E731
    assert ap(o["Re"], 3.690e5) and ap(o["Ns"], 0.2040)
    assert ap(o["fa"], 438.5) and ap(o["Hf"], 1.503) and ap(o["Haf"], 0.9395) and ap(o["Has"], 0.9836)
    assert ap(o["fn"], 609.1) and ap(o["Hc"], 0.8948) and ap(o["fnc"], 545.0)
    assert ap(o["Nsc"], 0.02974) and ap(o["fs"], 160.6) and ap(o["VIR"], 16.01) and ap(o["Pd_IR"], 12420)
    sp, rd = o["locations"]
    assert ap(sp["G"], 286.4) and sp["Kt"] == 2.3 and ap(sp["Sd_IR"], 3558e6) and ap(sp["So_IR"], 8183e6)
    assert ap(rd["G"], 137.3) and ap(rd["Kt"], 1.231) and ap(rd["So_IR"], 2100e6)
    assert ap(o["FT"], 0.9795) and ap(o["fatigue_limit"], 36.44e6)
    assert o["inline_ok"] is False and o["limit_ratio"] == 0.4 and o["freq_ok"] is True  # 160,6 < 218,0 Hz
    assert ap(sp["St"], 0.4776e6) and ap(sp["Sa"], 0.4388e6) and ap(o["PD"], 0.06782e6)
    assert ap(sp["SD"], 19.42e6) and ap(sp["von_mises"], 19.42e6) and ap(rd["von_mises"], 9.317e6)
    assert ap(o["FM"], 1.095) and ap(o["FMp"], 1.532)
    assert ap(sp["Sd"], 2.126e6) and ap(sp["SL"], 15.19e6) and ap(sp["So"], 35.29e6)
    assert ap(rd["Sd"], 1.020e6) and ap(rd["SL"], 7.286e6) and ap(rd["So"], 9.056e6)
    assert ap(o["Pc"], 35.20e6) and ap(o["Pt"], 496.4e6) and o["passed"] is True


def test_ptc193_contoh_8_1_tirus_dilas_us_ke_si():
    o = thermowell.evaluate(EX_8_1)
    ap = lambda x, ref, rel=5e-3: x == pytest.approx(ref, rel=rel)  # noqa: E731
    assert ap(o["Re"], 1.068e6) and o["Ns"] == 0.22
    assert ap(o["fa"], 2095) and ap(o["Hf"], 1.352) and ap(o["Haf"], 0.9995) and ap(o["Has"], 0.9922)
    assert ap(o["fn"], 2809) and ap(o["Hc"], 0.7746) and ap(o["fnc"], 2176)
    assert ap(o["Nsc"], 4.525) and ap(o["fs"], 778.8) and ap(o["VIR"], 412.0 * FT_)
    (sp,) = o["locations"]
    assert ap(sp["G"], 29.05) and sp["Kt"] == 2.2
    assert ap(sp["Sd_IR"], 26560 * PSI) and ap(sp["So_IR"], 58430 * PSI) and ap(o["fatigue_limit"], 2816 * PSI)
    assert o["inline_ok"] is False and o["freq_ok"] is True  # 778,8 Hz < 870,2 Hz = 0,4 f_n^c
    assert ap(sp["SD"], 190.6 * PSI) and ap(sp["von_mises"], 191.0 * PSI)
    assert ap(o["FM"], 1.147) and ap(o["FMp"], 2.052) and ap(sp["So"], 348.9 * PSI)
    assert ap(o["Pc"], 9389 * PSI) and ap(o["Pt"], 79630 * PSI) and o["passed"] is True


def test_ptc193_gagal_bila_frekuensi_terlalu_dekat():
    # kecepatan dinaikkan sehingga f_s melewati 0,4 f_n^c pada contoh 8-2 → FAIL batas frekuensi
    o = thermowell.evaluate({**EX_8_2, "V": 30.0})
    assert o["freq_ok"] is False and o["passed"] is False


TW_GAS = dict(  # tirus flens di uap 6" (bukan contoh standar): lolos tegangan siklik di resonansi in-line
    shape="tapered", support="flanged", A=0.0254, B=0.0191, d=0.0066, t=0.0064, b=0.0, L0=0.157,
    V=14.59, rho=10.78, mu=1.778e-5, P=1.369e6, E=178.8e9, E_ref=195e9, rho_m=8000.0, rho_s=2700.0,
    S=92.9e6, Sf=93.8e6, FE=1.0, zeta=0.0005, strouhal="correlation")


@pytest.mark.parametrize("L,ok", [(0.217, True), (0.232, False)])
def test_ptc193_pita_operasi_6_8_4(L, ok):
    # lolos resonansi in-line → batas 0,8, tetapi §6-8.4 melarang 0,4 ≤ f_s/f_n^c ≤ 0,6 saat tunak
    o = thermowell.evaluate({**TW_GAS, "L": L})
    assert o["inline_ok"] is True and o["limit_ratio"] == 0.8
    r = o["fs"] / o["fnc"]
    assert (r < 0.4) is ok and o["freq_ok"] is ok


def test_ptc193_batas_dimensi_tabel_4_1_1():
    assert thermowell.evaluate(EX_8_1)["dim_issues"] == [] and thermowell.evaluate(EX_8_2)["dim_issues"] == []
    o = thermowell.evaluate({**TW_GAS, "L": 0.217, "B": 0.0130})  # B/A 0,51 < 0,58 dan (B-d)/2 3,2 mm
    assert o["dim_issues"] == ["0,58 ≤ B/A ≤ 1"] and o["passed"] is False


def test_ptc193_step_shank_di_luar_tabel_ditolak():
    with pytest.raises(common.CalcError, match="Tabel 6-5.3-1"):
        thermowell.evaluate({**EX_8_2, "B": 0.016})


# ---------------------------------------------------------------- line sizing
def test_line_sizing_dimensi_b36_10m():
    # ID Sch 40 = OD − 2t (ASME B36.10M): 2" 52,50 mm; 6" 154,06 mm; 3" Sch 80 73,66 mm
    assert line_sizing.pipe_id("2", "40") * 1000 == pytest.approx(52.51, abs=0.02)
    assert line_sizing.pipe_id("6", "40") * 1000 == pytest.approx(154.06, abs=0.02)
    assert line_sizing.pipe_id("3", "80") * 1000 == pytest.approx(73.66, abs=0.02)


def test_line_sizing_colebrook_nilai_moody():
    # Diagram Moody / Colebrook: Re = 1e5, ε/D = 1e-4 → f = 0,0185; Re = 1e6, halus → f = 0,0116
    from fluids import friction_factor
    assert friction_factor(Re=1e5, eD=1e-4) == pytest.approx(0.0185, rel=5e-3)
    assert friction_factor(Re=1e6, eD=0.0) == pytest.approx(0.0116, rel=5e-3)


def test_line_sizing_hitung_tangan_darcy():
    # air 1000 kg/m3, 1 cP, ṁ = 10 kg/s dalam 3" Sch 40: V = 2,097 m/s; Re = 1,634e5
    h = line_sizing.hydraulics(10.0, 1000.0, 1e-3, 0.07792, 4.5e-5)
    assert h["V"] == pytest.approx(10.0 / (1000 * math.pi * 0.07792**2 / 4))
    assert h["Re"] == pytest.approx(1000 * h["V"] * 0.07792 / 1e-3)
    assert h["dp_bar_100m"] == pytest.approx(h["f"] * 1000 * h["V"] ** 2 / (2 * 0.07792) * 100 / 1e5)


def test_line_sizing_api14e_satuan():
    # ρ_m = 1 lb/ft³ (16,018 kg/m³), C = 100 → V_e = 100 ft/s = 30,48 m/s
    assert line_sizing.erosional_velocity(100, 16.01846337) == pytest.approx(30.48, rel=1e-6)


def test_line_sizing_pilih_nps_terkecil_yang_lolos():
    g = dict(service="vapor", schedule="40", m_flow=10553.2 / 3600, rho=10.78, mu=1.778e-5, eps=4.5e-5,
             v_max=30.0, dp_max=0.5, C=100.0)
    o = line_sizing.evaluate(g)
    assert o["chosen"]["nps"] == "6" and not o["candidates"][-2]["ok"]  # 4" ditolak (V 33 m/s > 30)
    with pytest.raises(common.CalcError, match="service"):
        line_sizing.evaluate({**g, "service": "slurry"})


# ---------------------------------------------------------------- mesin
def test_status_hasil_mengikuti_input_terlemah(tmp_path, hmb):
    doc = orifice_doc(20000, 102.26, 25.0)
    doc["inputs"]["dP"]["status"] = "ASUMSI"
    res = orifice.run(write_yaml(tmp_path, "s1.yaml", doc), hmb)
    assert res.status == "ASUMSI"
    doc["inputs"]["D"]["status"] = "PLACEHOLDER"
    res = orifice.run(write_yaml(tmp_path, "s2.yaml", doc), hmb)
    assert res.status == "PLACEHOLDER"


def test_input_tanpa_sumber_ditolak(tmp_path, hmb):
    doc = orifice_doc(20000, 102.26, 25.0)
    del doc["inputs"]["dP"]["source"]
    with pytest.raises(common.CalcError, match="source"):
        orifice.run(write_yaml(tmp_path, "nosrc.yaml", doc), hmb)


def test_run_all_atomik(tmp_path, monkeypatch):
    # satu input rusak -> tidak ada CSV yang ditulis
    inputs, out = tmp_path / "inputs", tmp_path / "out"
    inputs.mkdir(), out.mkdir()
    (inputs / "ok.yaml").write_text(yaml.safe_dump(orifice_doc(20000, 102.26, 25.0)), encoding="utf-8")
    bad = orifice_doc(20000, 102.26, 25.0)
    del bad["inputs"]["D"]
    (inputs / "bad.yaml").write_text(yaml.safe_dump(bad), encoding="utf-8")
    monkeypatch.setattr(run_all, "INPUT_DIR", inputs)
    monkeypatch.setattr(run_all, "CALC_DIR", out)
    assert run_all.main() == 1
    assert list(out.iterdir()) == []


def test_input_proyek_valid(hmb):
    # semua input proyek harus dapat dihitung
    for path in sorted(common.INPUT_DIR.glob("*.yaml")):
        kind = yaml.safe_load(path.read_text(encoding="utf-8"))["calculator"]
        run_all.CALCULATORS[kind][0].run(path, hmb)
