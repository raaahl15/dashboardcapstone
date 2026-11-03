"""
npv.py — Kelayakan tekno-ekonomi sederhana: NPV, IRR, payback sederhana & terdiskonto.

Model arus kas: tahun 0 = -CAPEX; tahun 1..n = (pendapatan - OPEX). Tanpa pajak, depresiasi, dan
eskalasi; tambahkan bila PIC (Cost Engineer) menetapkannya.
"""
from __future__ import annotations

import numpy_financial as npf

from common import Result, check, load_inputs, start_result

REQUIRED = {
    "capex": "CAPEX", "opex": "OPEX per tahun", "revenue": "Pendapatan/penghematan per tahun",
    "rate": "Suku bunga diskonto", "life": "Umur ekonomi", "hurdle": "Batas IRR minimum",
    "payback_target": "Target payback",
}


def cash_flows(capex: float, opex: float, revenue: float, life: int) -> list[float]:
    return [-capex] + [revenue - opex] * life


def discounted_payback(cf: list[float], rate: float) -> float | None:
    cum = 0.0
    for t, c in enumerate(cf):
        pv = c / (1 + rate) ** t
        if cum + pv >= 0 and t > 0:
            return t - 1 + (-cum / pv)
        cum += pv
    return None


def run(path, hmb) -> Result:
    doc, p = load_inputs(path, hmb, REQUIRED)
    res = start_result(doc, p)
    s = res.status
    rate = p["rate"].value / 100.0
    life = int(p["life"].value)
    cf = cash_flows(p["capex"].value, p["opex"].value, p["revenue"].value, life)
    net = cf[1]
    npv = npf.npv(rate, cf)
    irr = npf.irr(cf)
    pb = p["capex"].value / net if net > 0 else None
    dpb = discounted_payback(cf, rate)

    res.add("HASIL", "Arus kas bersih tahunan", "CF", net, p["capex"].unit + "/tahun", "pendapatan - OPEX", s)
    res.add("HASIL", "Net Present Value", "NPV", npv, p["capex"].unit, f"sum CF_t/(1+i)^t, t=0..{life}", s)
    res.add("HASIL", "Internal Rate of Return", "IRR", irr * 100, "%", "NPV(IRR) = 0", s)
    res.add("HASIL", "Payback sederhana", "PBP", pb if pb is not None else "tidak tercapai", "tahun", "CAPEX / CF", s)
    res.add("HASIL", "Payback terdiskonto", "DPBP", dpb if dpb is not None else "tidak tercapai", "tahun", "kumulatif PV = 0", s)
    check(res, "NPV > 0", npv > 0, f"NPV = {npv:,.0f}", "kriteria kelayakan")
    check(res, "IRR > batas minimum", irr * 100 > p["hurdle"].value, f"IRR = {irr*100:.2f} % vs {p['hurdle'].value} %", "kriteria kelayakan")
    check(res, "Payback < target", pb is not None and pb < p["payback_target"].value,
          f"PBP = {pb if pb is None else round(pb, 2)} vs {p['payback_target'].value} tahun", "kriteria kelayakan")
    res.add("KESIMPULAN", "Hasil", "", "PASS" if res.passed else "FAIL", "", "Kelayakan bergantung pada status input", s)
    return res
