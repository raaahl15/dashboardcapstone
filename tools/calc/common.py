"""
common.py — Bagian bersama mesin kalkulator (Blueprint §3.2).

Setiap kalkulator membaca satu file input YAML (02_ENGINEERING_CALCULATORS/inputs/<tag>.yaml).
Tiap input berbentuk salah satu dari:

    nama: {stream: S-102, field: props_by_phase.liquid.rho}          # diambil dari hmb_streams.json
    nama: {value: 25.0, unit: kPa, source: "...", status: ASUMSI}   # nilai dengan sumber

Status input (Blueprint §1.3):
    HMB, STANDAR, LITERATUR  -> dapat ditelusuri ke sumber
    ASUMSI                   -> pilihan desain beralasan, wajib dikonfirmasi PIC
    PLACEHOLDER              -> belum ada sumber; hasil tidak boleh dikutip
Status hasil = status input terlemah (PLACEHOLDER > ASUMSI > lainnya).
"""
from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
CALC_DIR = ROOT / "02_ENGINEERING_CALCULATORS"
INPUT_DIR = CALC_DIR / "inputs"
HMB_PATH = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "exported_data" / "hmb_streams.json"

TRACEABLE = {"HMB", "STANDAR", "LITERATUR"}
STATUS_RANK = {**{s: 0 for s in TRACEABLE}, "ASUMSI": 1, "PLACEHOLDER": 2}
CSV_HEADER = ["TAG", "SECTION", "PARAMETER", "SYMBOL", "VALUE", "UNIT", "SOURCE", "DATA_STATUS"]


class CalcError(Exception):
    """Input tidak lengkap/tidak valid; kalkulator tidak boleh menghasilkan angka."""


@dataclass
class Param:
    name: str
    value: object
    unit: str
    source: str
    status: str
    symbol: str = ""
    label: str = ""


@dataclass
class Result:
    tag: str
    rows: list[list] = field(default_factory=list)
    status: str = "HMB"
    passed: bool = True

    def add(self, section: str, parameter: str, symbol: str, value, unit: str, source: str, status: str):
        self.rows.append([self.tag, section, parameter, symbol, fmt(value), unit, source, status])


def fmt(v) -> str:
    if isinstance(v, bool):
        return "YA" if v else "TIDAK"
    if isinstance(v, float):
        return f"{v:.6g}" if abs(v) < 1e6 else f"{v:.0f}"
    return str(v)


def worst(statuses) -> str:
    return max(statuses, key=lambda s: STATUS_RANK[s])


def load_hmb(path: Path = HMB_PATH) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    by_tag = {}
    for s in data["streams"]:
        for key in (s.get("plant_tag"), s.get("dwsim_tag")):
            if key:
                by_tag[key] = s
    data["_by_tag"] = by_tag
    return data


def _dig(obj: dict, dotted: str):
    for part in dotted.split("."):
        if not isinstance(obj, dict) or part not in obj:
            return None
        obj = obj[part]
    return obj


def load_inputs(path: Path, hmb: dict, required: dict[str, str]) -> tuple[dict, dict[str, Param]]:
    """Baca YAML dan selesaikan setiap input. `required` = {nama: label} yang wajib ada."""
    doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    raw = doc.get("inputs", {})
    problems, params = [], {}
    meta = hmb["meta"]
    hmb_src = f"hmb_streams.json (extracted_at {meta['extracted_at']}, model sha256 {meta['source_sha256'][:12]})"

    for name, spec in raw.items():
        label = spec.get("label", required.get(name, name))
        symbol = spec.get("symbol", "")
        if "stream" in spec:
            s = hmb["_by_tag"].get(spec["stream"])
            if s is None:
                problems.append(f"{name}: stream {spec['stream']} tidak ada di HMB")
                continue
            val = _dig(s, spec["field"])
            if val is None:
                problems.append(f"{name}: {spec['stream']}.{spec['field']} kosong di HMB")
                continue
            unit = spec.get("unit") or meta["units"].get(spec["field"].split(".")[-1], "")
            params[name] = Param(name, val, unit, f"{hmb_src} → {spec['stream']}.{spec['field']}", "HMB", symbol, label)
        else:
            missing = [k for k in ("value", "unit", "source", "status") if k not in spec]
            if missing:
                problems.append(f"{name}: field {missing} wajib diisi")
                continue
            if spec["status"] not in STATUS_RANK:
                problems.append(f"{name}: status '{spec['status']}' tidak dikenal ({', '.join(STATUS_RANK)})")
                continue
            params[name] = Param(name, spec["value"], spec["unit"], spec["source"], spec["status"], symbol, label)

    for name in required:
        if name not in params and not any(name in p for p in problems):
            problems.append(f"input wajib '{name}' tidak ada")
    if problems:
        raise CalcError(f"{path.name}: " + "; ".join(problems))
    return doc, params


def start_result(doc: dict, params: dict[str, Param]) -> Result:
    res = Result(tag=doc["tag"])
    res.status = worst(p.status for p in params.values())
    res.add("INFO", "Deskripsi", "", doc.get("description", ""), "", doc.get("standard", ""), res.status)
    for p in params.values():
        res.add("INPUT", p.label, p.symbol, p.value, p.unit, p.source, p.status)
    return res


def check(res: Result, parameter: str, ok: bool, detail: str, standard: str):
    res.passed &= ok
    res.add("CEK", parameter, "", "PASS" if ok else "FAIL", "", f"{detail} [{standard}]", res.status)


def write_csv(path: Path, results: list[Result]):
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(CSV_HEADER)
        for r in results:
            w.writerows(r.rows)
