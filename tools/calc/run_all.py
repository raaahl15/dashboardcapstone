"""
run_all.py — Jalankan semua kalkulator dari 02_ENGINEERING_CALCULATORS/inputs/*.yaml dan tulis ulang CALC_*.csv.

    npm run calc            (= .venv/Scripts/python tools/calc/run_all.py)

Bila satu input gagal divalidasi, TIDAK ada CSV yang ditulis (semua atau tidak sama sekali), supaya
CSV di repo selalu berasal dari satu versi HMB yang sama (Blueprint §3.1 SOP).
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

import control_valve  # noqa: E402
import npv  # noqa: E402
import orifice  # noqa: E402
import psv  # noqa: E402
from common import CALC_DIR, INPUT_DIR, CalcError, load_hmb, write_csv  # noqa: E402

CALCULATORS = {
    "orifice": (orifice, "CALC_ISO5167_Orifice.csv"),
    "control_valve_liquid": (control_valve, "CALC_ISA75_ControlValve.csv"),
    "psv_gas": (psv, "CALC_API520_PSV.csv"),
    "npv": (npv, "CALC_TeknoEkonomi_NPV.csv"),
}


def main() -> int:
    hmb = load_hmb()
    grouped: dict[str, list] = {k: [] for k in CALCULATORS}
    errors = []
    for path in sorted(INPUT_DIR.glob("*.yaml")):
        kind = yaml.safe_load(path.read_text(encoding="utf-8")).get("calculator")
        if kind not in CALCULATORS:
            errors.append(f"{path.name}: calculator '{kind}' tidak dikenal")
            continue
        try:
            grouped[kind].append(CALCULATORS[kind][0].run(path, hmb))
        except (CalcError, ValueError, KeyError) as exc:
            errors.append(f"{path.name}: {exc}")
    if errors:
        print("GAGAL: tidak ada CSV yang ditulis.\n  " + "\n  ".join(errors), file=sys.stderr)
        return 1

    print(f"HMB: extracted_at {hmb['meta']['extracted_at']}, model sha256 {hmb['meta']['source_sha256'][:12]}")
    for kind, (_, csv_name) in CALCULATORS.items():
        results = grouped[kind]
        if not results:
            print(f"  {csv_name}: tidak ada input, file tidak diubah")
            continue
        write_csv(CALC_DIR / csv_name, results)
        for r in results:
            print(f"  {csv_name}: {r.tag:9} {'PASS' if r.passed else 'FAIL'}  status data {r.status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
