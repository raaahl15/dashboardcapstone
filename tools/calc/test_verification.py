"""
Uji verifikasi mesin kalkulator (Blueprint §3.2 butir 5: minimal satu uji per kalkulator).

* Control valve : IEC 60534-2-1 contoh 1 & 2 (cairan).
* PSV           : API 520 Part I contoh 1 (kritis) & 2 (subkritis), lewat modul psv end-to-end.
* Orifice       : implementasi INDEPENDEN persamaan Reader-Harris/Gallagher (ISO 5167-2 pers. 4)
                  dibandingkan dengan modul orifice; cek balik persamaan dasar ISO 5167-1.
* NPV           : contoh buku teks yang dapat dihitung tangan.
* Mesin         : propagasi status, dan gagal-atomik bila satu input rusak.

Jalankan: npm run test:py
"""
import math

import pytest
import yaml
from fluids.control_valve import size_control_valve_l

import common
import control_valve
import npv
import orifice
import psv
import run_all


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
