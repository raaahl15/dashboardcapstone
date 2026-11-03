"""Agar pytest bisa mengimpor export_hmb dari folder ini tanpa memasang paket."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
