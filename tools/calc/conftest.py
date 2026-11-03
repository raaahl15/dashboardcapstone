"""Agar pytest bisa mengimpor modul kalkulator dari folder ini tanpa memasang paket."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
