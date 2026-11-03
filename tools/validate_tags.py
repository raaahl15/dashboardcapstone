"""
validate_tags.py — Validasi konsistensi tag lintas dokumen Area 1 (Blueprint §2.3, §3.4).

Sumber yang diperiksa:
  * Master Instrument Index (CSV snapshot dari Google Sheets)  -> daftar instrumen resmi
  * tag_map.csv (FINAL)                                        -> daftar peralatan & stream resmi
  * Cause & Effect Matrix, Master Alarm Database (CSV)
  * Mirror Google Docs di 06_COLLABORATIVE_WORKSPACE/mirrors/*.md (mis. FDS)
  * P&ID DXF (opsional, --dxf): atribut blok (INSERT/ATTRIB) dan teks (TEXT/MTEXT)

Pemakaian:
    npm run validate:tags
    python tools/validate_tags.py [--dxf <pid.dxf> ...] [--out <json>] [--strict]

Tingkat temuan:
  ERROR   : tag DWSIM / tag liar dipakai di dokumen; instrumen tanpa loop di index (phantom);
            instrumen di gambar P&ID yang tidak ada di index.
  WARNING : fungsi loop (alarm/switch) tidak terdaftar sebagai tag sendiri; tag Area 2/3 di
            dokumen Area 1; instrumen index tidak ada di gambar; format tag tidak baku.
Bagian dokumen teks berjudul "Catatan Inkonsistensi" atau "Log Revisi" dilewati, karena memang
menyebut tag lama sebagai riwayat.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "04_INSTRUMENTATION_ISA20" / "Master_Instrument_Index_DME.csv"
TAGMAP = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "tag_map.csv"
TABLES = [
    ROOT / "05_SAFETY_AND_CONTROL" / "Cause_and_Effect_Matrix_ESD.csv",
    ROOT / "05_SAFETY_AND_CONTROL" / "Master_Alarm_Database_ISA182.csv",
]
MIRRORS = ROOT / "06_COLLABORATIVE_WORKSPACE" / "mirrors"
DEFAULT_OUT = ROOT / "01_PROCESS_SIMULATION_DWSIM" / "exported_data" / "tag_validation_report.json"
WIB = timezone(timedelta(hours=7))
FIRM_AREA = "1"  # firma ini = Area 1 (tag 1xx)

# Teks yang mirip tag tetapi bukan tag: nomor jalur, nomor dokumen/gambar, rujukan standar/log.
LINE_NO = re.compile(r'\d+(?:\.\d+)?"\s*-\s*[A-Z]+-\d+')
DOC_NO = re.compile(r"\b[A-Z]+(?:-[A-Z]+)+-\d+(?:-\d+)*\b")
TOKEN = re.compile(r"(?<![A-Za-z0-9_-])([A-Z]{1,6})-(\d{2,3})([A-Z]?)(?![A-Za-z0-9])")
NOT_TAGS = {"LOG", "SIL", "WO", "ISA", "IEC", "ISO", "API", "ASME", "NA", "REV", "G", "PSTF", "CPMK", "R-"}
SKIP_SECTION = re.compile(r"^#+\s*.*(catatan inkonsistensi|log revisi)", re.IGNORECASE)
ISA_FIRST = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def extract_tags(text: str) -> list[str]:
    text = LINE_NO.sub(" ", text)
    text = DOC_NO.sub(" ", text)
    out = []
    for m in TOKEN.finditer(text):
        prefix, num, suf = m.groups()
        if prefix in NOT_TAGS:
            continue
        out.append(f"{prefix}-{num}{suf}")
    return out


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def text_without_history(md: str) -> str:
    keep, skipping = [], False
    for line in md.splitlines():
        if line.startswith("#"):
            skipping = bool(SKIP_SECTION.match(line))
        if line.startswith("---") and not keep:
            continue
        if not skipping:
            keep.append(line)
    # buang frontmatter YAML
    body = "\n".join(keep)
    return re.sub(r"\A.*?\n---\n", "", body, count=1, flags=re.S) if md.startswith("---") else body


def read_dxf_text(path: Path) -> str:
    import ezdxf  # hanya dibutuhkan bila --dxf dipakai

    doc = ezdxf.readfile(path)
    chunks = []
    for layout in doc.layouts:
        for e in layout:
            t = e.dxftype()
            if t == "INSERT":
                chunks += [a.dxf.text for a in e.attribs]
            elif t == "TEXT":
                chunks.append(e.dxf.text)
            elif t == "MTEXT":
                chunks.append(e.plain_text())
    return "\n".join(chunks)


class Validator:
    def __init__(self, index_rows: list[dict], tagmap_rows: list[dict]):
        self.index = {r["TAG_NUMBER"].strip(): r for r in index_rows}
        self.loops = {self.loop_key(t) for t in self.index}
        self.plant = {r["plant_tag"]: r for r in tagmap_rows if r["plant_tag"]}
        self.dwsim = {r["dwsim_tag"]: r for r in tagmap_rows}
        self.findings: list[dict] = []

    @staticmethod
    def loop_key(tag: str) -> str:
        prefix, rest = tag.split("-", 1)
        return f"{prefix[0]}-{re.match(r'\d+', rest).group(0)}"

    def add(self, level, code, tag, source, message):
        self.findings.append({"level": level, "code": code, "tag": tag, "source": source, "message": message})

    def classify(self, tag: str, source: str, drawing: bool = False):
        prefix, rest = tag.split("-", 1)
        number = re.match(r"\d+", rest).group(0)
        if tag in self.plant:
            area = (self.plant[tag].get("area") or "")[:1]
            if area and area != FIRM_AREA:
                self.add("WARNING", "AREA_SCOPE", tag, source, f"Tag milik Area {area}, di luar lingkup firma Area 1")
            return "plant"
        if tag in self.dwsim:
            row = self.dwsim[tag]
            if row["plant_tag"]:
                hint = f"gunakan tag pabrik {row['plant_tag']}"
            elif row["object_type"] == "EnergyStream":
                hint = "di DWSIM ini aliran energi, bukan peralatan; bila yang dimaksud heat exchanger, pakai tag pabriknya (E-1xx)"
            else:
                hint = f"objek {row['scope']} (tanpa tag pabrik Area 1)"
            self.add("ERROR", "DWSIM_TAG", tag, source, f"Tag DWSIM dipakai di dokumen; {hint}")
            return "dwsim"
        if len(number) == 2:
            self.add("ERROR", "WILD_TAG", tag, source, "Tag liar (format 2 digit, tidak ada di tag_map.csv)")
            return "wild"
        if len(prefix) == 1:
            self.add("ERROR", "UNKNOWN_EQUIPMENT", tag, source, "Tag peralatan/stream tidak ada di tag_map.csv")
            return "unknown"
        # instrumen (>= 2 huruf fungsi ISA-5.1, 3 digit)
        if number[0] != FIRM_AREA:
            self.add("WARNING", "AREA_SCOPE", tag, source, f"Instrumen area {number[0]}xx, di luar lingkup firma Area 1")
        if tag in self.index:
            return "instrument"
        if drawing:
            # setiap instrumen yang digambar wajib terdaftar persis di index
            self.add("ERROR", "PHANTOM_IN_DRAWING", tag, source, "Instrumen di gambar P&ID tidak ada di Master Instrument Index")
        elif self.loop_key(tag) in self.loops:
            owner = sorted(t for t in self.index if self.loop_key(t) == self.loop_key(tag))
            self.add("WARNING", "LOOP_FUNCTION_NOT_LISTED", tag, source,
                     f"Loop ada di index ({', '.join(owner)}), tetapi {tag} tidak terdaftar sebagai tag sendiri")
        else:
            self.add("ERROR", "PHANTOM_INSTRUMENT", tag, source, "Instrumen tanpa loop di Master Instrument Index")
        return "instrument"

    def check_index_format(self):
        for tag in self.index:
            if not re.fullmatch(r"[A-Z]{2,6}-\d{3}[A-Z]?", tag):
                self.add("WARNING", "FORMAT", tag, "Master Instrument Index", "Format tag tidak sesuai <huruf ISA>-<area><loop>")


def run(dxf_paths: list[Path], index_path=INDEX, tagmap_path=TAGMAP, tables=TABLES, mirrors_dir=MIRRORS) -> dict:
    v = Validator(read_csv(index_path), read_csv(tagmap_path))
    v.check_index_format()
    sources = []

    def scan(name: str, text: str, path: Path, drawing: bool = False):
        tags = set(extract_tags(text))
        sources.append({"source": name, "path": str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
                        "sha256": hashlib.sha256(path.read_bytes()).hexdigest()[:12], "tags_found": len(tags)})
        for t in sorted(tags):
            v.classify(t, name, drawing=drawing)
        return tags

    # index: tag instrumen sendiri + rujukan peralatan/stream di kolom lain
    idx_rows = read_csv(index_path)
    other_cols = "\n".join(" ".join(val for k, val in r.items() if k != "TAG_NUMBER") for r in idx_rows)
    scan("Master Instrument Index (kolom lokasi/layanan)", other_cols, index_path)
    for t in v.index:
        if t[-3:].isdigit() and t.split("-")[1][0] != FIRM_AREA:
            v.add("WARNING", "AREA_SCOPE", t, "Master Instrument Index", "Instrumen di luar lingkup firma Area 1")

    for path in tables:
        rows = read_csv(path)
        scan(path.stem, "\n".join(" ".join(r.values()) for r in rows), path)

    for path in sorted(mirrors_dir.glob("*.md")) if mirrors_dir.exists() else []:
        scan(f"Mirror {path.stem}", text_without_history(path.read_text(encoding="utf-8")), path)

    drawing_tags: set[str] = set()
    for path in dxf_paths:
        drawing_tags |= scan(f"P&ID {path.name}", read_dxf_text(path), path, drawing=True)
    if dxf_paths:
        for t in sorted(v.index):
            if t not in drawing_tags:
                v.add("WARNING", "NOT_IN_DRAWING", t, "P&ID", "Ada di index tetapi tidak ditemukan di gambar P&ID")

    # ringkasan
    by_level = defaultdict(int)
    for f in v.findings:
        by_level[f["level"]] += 1
    v.findings.sort(key=lambda f: (f["level"] != "ERROR", f["code"], f["tag"], f["source"]))
    return {
        "meta": {
            "generated_at": datetime.now(WIB).isoformat(timespec="seconds"),
            "validator": "tools/validate_tags.py",
            "firm_area": FIRM_AREA,
            "index_instruments": len(v.index),
            "tag_map_plant_tags": len(v.plant),
            "pid_dxf_checked": [str(p) for p in dxf_paths],
            "sources": sources,
        },
        "summary": {"ERROR": by_level["ERROR"], "WARNING": by_level["WARNING"]},
        "findings": v.findings,
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Validasi konsistensi tag lintas dokumen Area 1")
    ap.add_argument("--dxf", type=Path, nargs="*", default=[], help="file P&ID DXF")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--strict", action="store_true", help="exit 1 bila ada ERROR")
    args = ap.parse_args(argv)
    for p in args.dxf:
        if not p.exists():
            print(f"GAGAL: file DXF tidak ditemukan: {p}", file=sys.stderr)
            return 1
    report = run(args.dxf)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    s = report["summary"]
    print(f"Sumber    : {', '.join(x['source'] for x in report['meta']['sources'])}")
    print(f"P&ID DXF  : {', '.join(report['meta']['pid_dxf_checked']) or '(belum ada, lewati cek gambar)'}")
    print(f"Hasil     : {s['ERROR']} ERROR, {s['WARNING']} WARNING -> {args.out.relative_to(ROOT) if args.out.is_relative_to(ROOT) else args.out}")
    for f in report["findings"]:
        print(f"  {f['level']:7} {f['code']:26} {f['tag']:10} [{f['source']}] {f['message']}")
    return 1 if args.strict and s["ERROR"] else 0


if __name__ == "__main__":
    sys.exit(main())
