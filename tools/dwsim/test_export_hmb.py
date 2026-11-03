"""Uji export_hmb.py terhadap model DWSIM proyek + uji negatif (skrip wajib gagal bila data rusak).

Jalankan dari root repo:  .venv\\Scripts\\python -m pytest tools/dwsim -q
"""
import csv
import json
import shutil
import zipfile

import pytest

import export_hmb as eh

AREA1_PLANT = {"S-101", "S-102", "S-103", "S-104", "S-105", "S-106", "S-107", "S-114"}


@pytest.fixture(scope="module")
def data():
    return eh.extract(eh.DEFAULT_MODEL, eh.DEFAULT_TAGMAP)


def test_meta_dibaca_dari_file(data):
    m = data["meta"]
    assert m["compounds"] == ["Methanol", "Water", "Dimethyl ether"]
    assert m["property_package"] == "NRTL"
    assert m["solver_status"] == "AllObjectsCalculated"
    assert len(m["source_sha256"]) == 64
    assert m["units"]["T"] == "degC" and m["units"]["P"] == "bar(a)"


def test_jumlah_objek(data):
    assert len(data["streams"]) == 14
    assert len(data["unit_operations"]) == 10  # GO_MasterTable bukan unit operasi


def test_tag_pabrik_area1(data):
    plant = {s["plant_tag"] for s in data["streams"] if s["plant_tag"]}
    assert plant == AREA1_PLANT


def test_nilai_lengkap_dan_fraksi_mol(data):
    for s in data["streams"]:
        for k in ("T", "P", "mass_flow", "molar_flow"):
            assert s[k] is not None, (s["dwsim_tag"], k)
        if s["mass_flow"] > 0:
            assert sum(s["mole_fractions"].values()) == pytest.approx(1.0, abs=1e-6)


def test_konversi_satuan_umpan(data):
    s101 = next(s for s in data["streams"] if s["plant_tag"] == "S-101")
    assert s101["T"] == pytest.approx(25.0, abs=0.5)        # K -> degC
    assert s101["P"] == pytest.approx(1.0, abs=0.05)        # Pa -> bar(a)
    assert s101["mass_flow"] / s101["molar_flow"] == pytest.approx(s101["props"]["mw"], rel=1e-3)  # kg/h ÷ kmol/h = MW


def test_neraca_massa(data):
    v = data["validation"]
    assert len(v["mass_balance"]) == 10
    assert v["mass_balance_max_error_pct"] <= eh.MASS_BALANCE_LIMIT_PCT


def test_json_valid_tanpa_nan(data):
    json.dumps(data, allow_nan=False)


def test_gagal_bila_tag_tidak_ada_di_tagmap(tmp_path):
    rows = list(csv.DictReader(eh.DEFAULT_TAGMAP.open(encoding="utf-8")))
    bad = tmp_path / "tag_map.csv"
    with bad.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(r for r in rows if r["dwsim_tag"] != "RC-01")
    with pytest.raises(eh.ExtractError, match="RC-01"):
        eh.extract(eh.DEFAULT_MODEL, bad)


def test_gagal_bila_arsip_berisi_dua_xml(tmp_path):
    bad = tmp_path / "bad.dwxmz"
    shutil.copy(eh.DEFAULT_MODEL, bad)
    with zipfile.ZipFile(bad, "a") as zf:
        zf.writestr("extra.xml", "<x/>")
    with pytest.raises(eh.ExtractError, match="tepat 1 file XML"):
        eh.extract(bad, eh.DEFAULT_TAGMAP)


def test_check_tidak_menulis_file(tmp_path):
    out = tmp_path / "hmb.json"
    assert eh.main(["--check", "--out", str(out)]) == 0
    assert not out.exists()
