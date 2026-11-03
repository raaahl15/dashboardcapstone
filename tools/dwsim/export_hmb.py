"""
export_hmb.py — Ekstraksi Heat & Material Balance dari model DWSIM (.dwxmz) ke hmb_streams.json.

Blueprint §3.1 (skema v1). Menggantikan tools/export_dwsim_hmb.js (skema v0, hanya daftar tag).

Pemakaian (dari root repo):
    npm run sync:dwsim
    python tools/dwsim/export_hmb.py [--model <path.dwxmz>] [--tagmap <tag_map.csv>] [--out <json>] [--check]

Prinsip (Blueprint §1.3):
  * Semua nilai dibaca dari file model. Tidak ada nilai hasil yang ditulis tetap.
  * Bila data tidak lengkap atau neraca massa tidak tertutup, skrip GAGAL (exit 1) dengan daftar
    masalah dan TIDAK menulis file keluaran.
  * Hanya pustaka standar Python, supaya bisa dijalankan tanpa virtual env.

Satuan internal DWSIM: K, Pa, kg/s, mol/s, kg/m3, Pa.s, kJ/(kg.K), kW.
Satuan keluaran     : degC, bar(a), kg/h, kmol/h, kg/m3, cP, kJ/(kg.K), kW.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

EXTRACTOR_VERSION = "1.0.0"
MASS_BALANCE_LIMIT_PCT = 0.5
ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "simulation_files" / "DME.dwxmz"
DEFAULT_TAGMAP = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "tag_map.csv"
DEFAULT_OUT = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "exported_data" / "hmb_streams.json"
WIB = timezone(timedelta(hours=7))

UNITS = {
    "T": "degC", "P": "bar(a)", "mass_flow": "kg/h", "molar_flow": "kmol/h",
    "rho": "kg/m3", "mu": "cP", "cp": "kJ/(kg.K)", "mw": "kg/kmol", "duty": "kW",
}
# Fase DWSIM: 0 Mixture, 1 OverallLiquid, 2 Vapor, 3 Liquid1, 4 Liquid2, 5 Liquid3, 6 Aqueous, 7 Solid
PHASE_MIXTURE, PHASE_LIQUID, PHASE_VAPOR = "0", "1", "2"


class ExtractError(Exception):
    """Masalah data yang membuat ekstraksi tidak boleh dilanjutkan."""


def _num(elem: ET.Element | None, tag: str) -> float | None:
    if elem is None:
        return None
    txt = elem.findtext(tag)
    if txt is None or txt.strip() == "":
        return None
    val = float(txt)
    return val if math.isfinite(val) else None  # NaN/Infinity (mis. densitas stream tanpa aliran) -> None


def load_xml(model: Path) -> tuple[ET.Element, str]:
    """Buka arsip .dwxmz dan cari XML di dalamnya secara dinamis (nama tidak di-hardcode)."""
    with zipfile.ZipFile(model) as zf:
        xmls = [n for n in zf.namelist() if n.lower().endswith(".xml")]
        if len(xmls) != 1:
            raise ExtractError(f"Arsip harus berisi tepat 1 file XML, ditemukan {len(xmls)}: {xmls}")
        with zf.open(xmls[0]) as fh:
            return ET.parse(fh).getroot(), xmls[0]


def load_tagmap(path: Path) -> dict[str, dict]:
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return {row["dwsim_tag"]: row for row in csv.DictReader(fh)}


def _child_with_data(elem: ET.Element, tag: str) -> ET.Element | None:
    """DWSIM menulis dua elemen bernama sama (mis. <Properties> & <Compounds>) per fase:
    yang pertama hanya teks nama kelas .NET, yang kedua berisi data. Ambil yang punya anak."""
    for c in elem.findall(tag):
        if len(c):
            return c
    return None


def read_stream(obj: ET.Element, compounds: list[str]) -> dict:
    phases = {p.findtext("ID"): p for p in obj.find("Phases")}
    mix = _child_with_data(phases[PHASE_MIXTURE], "Properties")
    vap = _child_with_data(phases[PHASE_VAPOR], "Properties")
    liq = _child_with_data(phases[PHASE_LIQUID], "Properties")

    T, P = _num(mix, "temperature"), _num(mix, "pressure")
    w, n = _num(mix, "massflow"), _num(mix, "molarflow")
    vf = _num(vap, "molarfraction") or 0.0  # elemen tidak ada bila fase uap tidak terbentuk

    mole_fr = {}
    for c in _child_with_data(phases[PHASE_MIXTURE], "Compounds"):
        mole_fr[c.findtext("Name")] = _num(c, "MoleFraction")

    def phase_props(p: ET.Element | None) -> dict | None:
        if p is None or (_num(p, "massflow") or 0.0) <= 0.0:
            return None
        mu = _num(p, "viscosity")
        return {
            "rho": _num(p, "density"),
            "mu": None if mu is None else mu * 1000.0,  # Pa.s -> cP
            "cp": _num(p, "heatCapacityCp"),
            "mw": _num(p, "molecularWeight"),
        }

    by_phase = {"vapor": phase_props(vap), "liquid": phase_props(liq)}
    single = [v for v in by_phase.values() if v]
    return {
        "T": None if T is None else T - 273.15,
        "P": None if P is None else P / 1e5,
        "mass_flow": None if w is None else w * 3600.0,
        "molar_flow": None if n is None else n * 3.6,  # mol/s -> kmol/h
        "vapor_fraction": vf,
        "mole_fractions": {k: mole_fr.get(k) for k in compounds},
        "props": {
            "rho": _num(mix, "density"),
            # viskositas campuran dua fase tidak terdefinisi tunggal -> hanya diisi bila satu fase
            "mu": single[0]["mu"] if len(single) == 1 else None,
            "cp": _num(mix, "heatCapacityCp"),
            "mw": _num(mix, "molecularWeight"),
        },
        "props_by_phase": by_phase,
        "_mass_flow_kgs": w,
    }


def connections(go: ET.Element) -> tuple[list[str], list[str], list[str]]:
    """Konektor objek grafis: (masuk material, keluar material, semua objek energi terhubung)."""
    ins, outs, energy = [], [], []
    for c in go.iter("Connector"):
        if c.get("IsAttached") != "true":
            continue
        if c.get("ConnType") == "ConIn":
            ins.append(c.get("AttachedFromObjID"))
        elif c.get("ConnType") == "ConOut":
            outs.append(c.get("AttachedToObjID"))
        elif c.get("ConnType") == "ConEn":
            energy.append(c.get("AttachedFromObjID") or c.get("AttachedToObjID"))
    return ins, outs, energy


def extract(model: Path, tagmap_path: Path) -> dict:
    root, xml_name = load_xml(model)
    problems: list[str] = []
    warnings: list[str] = []

    compounds = [c.findtext("Name") for c in root.find("Compounds")]
    pp = root.find("PropertyPackages")[0]
    property_package = pp.findtext("ComponentName")

    sim = {o.findtext("Name"): o for o in root.find("SimulationObjects")}
    gos = [g for g in root.find("GraphicObjects") if g.findtext("ObjectType") != "GO_MasterTable"]
    tag_of = {g.findtext("Name"): g.findtext("Tag") for g in gos}
    tagmap = load_tagmap(tagmap_path)

    # --- validasi tag
    tags = [g.findtext("Tag") for g in gos]
    for name, tag in tag_of.items():
        if not tag:
            problems.append(f"Objek {name} tidak punya tag")
    dup = sorted({t for t in tags if tags.count(t) > 1})
    if dup:
        problems.append(f"Tag duplikat: {dup}")
    missing_map = sorted(t for t in tags if t and t not in tagmap)
    if missing_map:
        problems.append(f"Tag tidak ada di tag_map.csv: {missing_map}")

    # --- status solver: diturunkan dari Calculated/ErrorMessage setiap objek (tidak ada field global)
    not_calc = sorted(tag_of.get(n, n) for n, o in sim.items() if o.findtext("Calculated") != "true")
    errored = sorted(tag_of.get(n, n) for n, o in sim.items() if (o.findtext("ErrorMessage") or "").strip())
    solver_status = "AllObjectsCalculated" if not (not_calc or errored) else "NotConverged"
    if not_calc:
        problems.append(f"Objek belum terhitung (Calculated=false): {not_calc}")
    if errored:
        problems.append(f"Objek dengan ErrorMessage: {errored}")

    # --- stream material
    streams, mass_kgs = [], {}
    for g in gos:
        if g.findtext("ObjectType") != "MaterialStream":
            continue
        tag = g.findtext("Tag")
        s = read_stream(sim[g.findtext("Name")], compounds)
        mass_kgs[tag] = s.pop("_mass_flow_kgs")
        for key in ("T", "P", "mass_flow", "molar_flow"):
            if s[key] is None:
                problems.append(f"{tag}: nilai {key} kosong")
        mf = [v for v in s["mole_fractions"].values() if v is not None]
        no_flow = (s["mass_flow"] or 0.0) == 0.0
        if no_flow and sum(mf) == 0.0:
            pass  # stream tanpa aliran: komposisi tidak terdefinisi, dicatat sebagai peringatan di bawah
        elif len(mf) != len(compounds) or abs(sum(mf) - 1.0) > 1e-6:
            problems.append(f"{tag}: fraksi mol tidak lengkap atau jumlahnya {sum(mf):.6f} (harus 1)")
        m = tagmap.get(tag, {})
        streams.append({
            "dwsim_tag": tag, "plant_tag": m.get("plant_tag") or None,
            "area": m.get("area") or None, "scope": m.get("scope") or None, **s,
        })

    # --- unit operasi + neraca massa
    unit_ops, balance = [], []
    for g in gos:
        otype = g.findtext("ObjectType")
        if otype in ("MaterialStream", "EnergyStream"):
            continue
        tag = g.findtext("Tag")
        o = sim[g.findtext("Name")]
        ins, outs, _ = connections(g)
        mat_in = [tag_of[n] for n in ins if tag_of.get(n) in mass_kgs]
        mat_out = [tag_of[n] for n in outs if tag_of.get(n) in mass_kgs]
        duty = _num(o, "DeltaQ")
        m = tagmap.get(tag, {})
        unit_ops.append({
            "dwsim_tag": tag, "plant_tag": m.get("plant_tag") or None,
            "area": m.get("area") or None, "scope": m.get("scope") or None,
            "type": g.findtext("Description"), "duty_kW": duty,
            "inlets": mat_in, "outlets": mat_out,
        })
        if any(mass_kgs[t] is None for t in mat_in + mat_out):
            continue  # stream tanpa nilai sudah tercatat sebagai masalah di atas
        if mat_in and mat_out:
            w_in = sum(mass_kgs[t] for t in mat_in)
            w_out = sum(mass_kgs[t] for t in mat_out)
            err = abs(w_in - w_out) / w_in * 100.0 if w_in else float("inf")
            balance.append({"unit": tag, "in_kg_h": w_in * 3600, "out_kg_h": w_out * 3600, "error_pct": err})
            if err > MASS_BALANCE_LIMIT_PCT:
                problems.append(f"Neraca massa {tag}: selisih {err:.3f}% > {MASS_BALANCE_LIMIT_PCT}%")
        elif tag:
            warnings.append(f"{tag}: tidak punya inlet dan outlet material, neraca tidak diperiksa")

    for s in streams:
        if (s["mass_flow"] or 0.0) == 0.0:
            warnings.append(f"{s['dwsim_tag']}: laju alir massa nol")

    # --- asal-usul file model (dibaca, bukan dinilai)
    gi = root.find("GeneralInfo")
    if problems:
        raise ExtractError("\n  ".join(problems))

    return {
        "meta": {
            "schema_version": 1,
            "source_file": model.name,
            "source_xml": xml_name,
            "source_sha256": hashlib.sha256(model.read_bytes()).hexdigest(),
            "dwsim_build": gi.findtext("BuildVersion"),
            "model_saved_on": gi.findtext("SavedOn"),
            "extracted_at": datetime.now(WIB).isoformat(timespec="seconds"),
            "extractor_version": EXTRACTOR_VERSION,
            "solver_status": solver_status,
            "solver_status_basis": "Diturunkan dari Calculated=true dan ErrorMessage kosong pada setiap objek (file DWSIM tidak menyimpan status konvergensi global).",
            "property_package": property_package,
            "compounds": compounds,
            "units": UNITS,
            "tag_map": str(tagmap_path.relative_to(ROOT)).replace("\\", "/") if tagmap_path.is_relative_to(ROOT) else str(tagmap_path),
        },
        "streams": streams,
        "unit_operations": unit_ops,
        "validation": {
            "mass_balance_limit_pct": MASS_BALANCE_LIMIT_PCT,
            "mass_balance_max_error_pct": max((b["error_pct"] for b in balance), default=None),
            "mass_balance": balance,
            "warnings": warnings,
        },
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    ap.add_argument("--tagmap", type=Path, default=DEFAULT_TAGMAP)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--check", action="store_true", help="validasi saja, tidak menulis file")
    args = ap.parse_args(argv)

    try:
        data = extract(args.model, args.tagmap)
    except (ExtractError, FileNotFoundError, zipfile.BadZipFile) as exc:
        print(f"GAGAL: ekstraksi HMB dihentikan, file keluaran tidak ditulis.\n  {exc}", file=sys.stderr)
        return 1

    v = data["validation"]
    print(f"Model     : {data['meta']['source_file']} (sha256 {data['meta']['source_sha256'][:12]}..., DWSIM {data['meta']['dwsim_build']}, disimpan {data['meta']['model_saved_on']})")
    print(f"Solver    : {data['meta']['solver_status']} | PP: {data['meta']['property_package']} | komponen: {', '.join(data['meta']['compounds'])}")
    print(f"Isi       : {len(data['streams'])} stream, {len(data['unit_operations'])} unit operasi")
    print(f"Neraca    : galat maks {v['mass_balance_max_error_pct']:.4f}% (batas {MASS_BALANCE_LIMIT_PCT}%) di {len(v['mass_balance'])} unit")
    for w in v["warnings"]:
        print(f"Peringatan: {w}")
    if args.check:
        print("CHECK: valid, file tidak ditulis.")
        return 0
    args.out.parent.mkdir(parents=True, exist_ok=True)
    # allow_nan=False: gagal keras bila masih ada NaN/Infinity, supaya JSON selalu valid
    args.out.write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")
    print(f"Ditulis   : {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
