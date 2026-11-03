"""Uji validate_tags.py: ekstraksi tag, lewati bagian riwayat, dan pemeriksaan P&ID DXF sintetis.

Jalankan: npm run test:py
"""
import csv

import ezdxf
import pytest

import validate_tags as vt


def codes(report, tag=None):
    return {(f["code"], f["tag"]) for f in report["findings"] if tag is None or f["tag"] == tag}


def test_ekstraksi_mengabaikan_nomor_jalur_dokumen_dan_standar():
    text = 'FIC-101 di 6"-PL-101, gambar DWG-PID-001, FDS-IC-DME-2026-001, SIL-3, LOG-016, ISA-5.1, R-101, S-114'
    assert sorted(vt.extract_tags(text)) == ["FIC-101", "R-101", "S-114"]


def test_ekstraksi_tag_dengan_sufiks_dan_tanpa_menempel():
    assert vt.extract_tags("TT-101A; PUMP-01-TRIP; xTIC-101") == ["TT-101A", "PUMP-01"]


def test_bagian_riwayat_dilewati():
    md = "---\nid: x\n---\n# Judul\nTIC-101\n## 8. Catatan Inkonsistensi\nREAC-01\n## 9. Log Revisi\nHEATER-01\n"
    body = vt.text_without_history(md)
    assert "TIC-101" in body and "REAC-01" not in body and "HEATER-01" not in body


@pytest.fixture
def pid(tmp_path):
    """P&ID sintetis: blok instrumen beratribut + teks peralatan."""
    doc = ezdxf.new()
    blk = doc.blocks.new("INSTR")
    blk.add_circle((0, 0), 5)
    blk.add_attdef("TAG", (0, 0))
    msp = doc.modelspace()
    for i, tag in enumerate(["FIC-101", "TIC-101", "XYZ-150"]):
        msp.add_blockref("INSTR", (i * 20, 0)).add_auto_attribs({"TAG": tag})
    msp.add_text("R-101")
    msp.add_text("PUMP-01")
    msp.add_mtext('Jalur 6"-PL-101\\PFCV-101 ke E-101')
    path = tmp_path / "pid.dxf"
    doc.saveas(path)
    return path


@pytest.fixture
def index(tmp_path):
    path = tmp_path / "index.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["TAG_NUMBER", "LOCATION"])
        w.writerows([["FIC-101", "Field Pipe"], ["TIC-101", "R-101"], ["FCV-101", "Field Pipe"], ["PIC-105", "R-101 Top"]])
    return path


def test_pid_dxf(pid, index, tmp_path):
    report = vt.run([pid], index_path=index, tables=[], mirrors_dir=tmp_path / "tidak_ada")
    found = codes(report)
    assert ("PHANTOM_IN_DRAWING", "XYZ-150") in found      # digambar, tidak ada di index
    assert ("DWSIM_TAG", "PUMP-01") in found               # tag DWSIM di gambar
    assert ("NOT_IN_DRAWING", "PIC-105") in found          # di index, tidak digambar
    for ok in ("FIC-101", "TIC-101", "FCV-101", "R-101", "E-101"):
        assert not codes(report, ok), ok                   # tag sah tanpa temuan
    assert all(f["tag"] != "PL-101" for f in report["findings"])  # nomor jalur bukan tag
    assert report["summary"]["ERROR"] == 2


def test_loop_function_dan_phantom_di_tabel(index, tmp_path):
    table = tmp_path / "ce.csv"
    table.write_text("CAUSE,EFFECT\nTSHH-101,ESDV-109\n", encoding="utf-8")
    report = vt.run([], index_path=index, tables=[table], mirrors_dir=tmp_path / "tidak_ada")
    found = codes(report)
    assert ("LOOP_FUNCTION_NOT_LISTED", "TSHH-101") in found  # loop T-101 ada (TIC-101)
    assert ("PHANTOM_INSTRUMENT", "ESDV-109") in found        # loop E-109 tidak ada


def test_dokumen_proyek_bisa_divalidasi():
    report = vt.run([])
    assert report["meta"]["index_instruments"] >= 1
    assert {"ERROR", "WARNING"} <= set(report["summary"])
