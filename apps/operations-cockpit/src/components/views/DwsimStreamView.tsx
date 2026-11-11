import React, { useMemo, useState } from 'react';
import { Activity, Database, Scale, AlertTriangle } from 'lucide-react';
import { useStaticData, fmtNum, fmtDateTime, daysSince } from '../../utils/staticData';

interface Stream {
  dwsim_tag: string;
  plant_tag: string | null;
  area: string | null;
  scope: string | null;
  T: number;
  P: number;
  mass_flow: number;
  molar_flow: number;
  vapor_fraction: number;
  mole_fractions: Record<string, number | null>;
  props: { rho: number | null; mu: number | null; cp: number | null; mw: number | null };
}
interface UnitOp {
  dwsim_tag: string;
  plant_tag: string | null;
  area: string | null;
  type: string;
  duty_kW: number | null;
  inlets: string[];
  outlets: string[];
}
interface Hmb {
  meta: {
    extracted_at: string;
    source_sha256: string;
    solver_status: string;
    property_package: string;
    compounds: string[];
    dwsim_build: string;
    model_saved_on: string;
  };
  streams: Stream[];
  unit_operations: UnitOp[];
  validation: {
    mass_balance_limit_pct: number;
    mass_balance_max_error_pct: number;
    mass_balance: { unit: string; in_kg_h: number; out_kg_h: number; error_pct: number }[];
    warnings: string[];
  };
}

const AREA1_SCOPES = new Set(['AREA_1', 'INTERFACE_OUT', 'INTERFACE_IN']);

export const DwsimStreamView: React.FC = () => {
  const { data, error, loading } = useStaticData<Hmb>('hmb_streams.json');
  const [onlyArea1, setOnlyArea1] = useState(true);

  const streams = useMemo(
    () => (data ? data.streams.filter((s) => !onlyArea1 || AREA1_SCOPES.has(s.scope ?? '')) : []),
    [data, onlyArea1]
  );
  const units = useMemo(
    () => (data ? data.unit_operations.filter((u) => !onlyArea1 || (u.area ?? '').startsWith('1')) : []),
    [data, onlyArea1]
  );
  const tagOf = (dwsim: string) => data?.streams.find((s) => s.dwsim_tag === dwsim)?.plant_tag || dwsim;

  /** Strip alur: aliran umpan → unit operasi Area 1 (urutan data) → aliran keluar ke Area 2. */
  const flow = useMemo(() => {
    if (!data) return null;
    const UNIT_LABEL: Record<string, string> = {
      'Adiabatic Pump': 'Pompa adiabatik',
      'Material Stream Mixer': 'Mixer',
      'Material Stream Heater': 'Heater',
      'Conversion Reactor': 'Reaktor konversi',
      'Material Stream Cooler': 'Cooler',
    };
    const byTag = (t: string) => data.streams.find((x) => x.dwsim_tag === t);
    const area1Units = data.unit_operations.filter((u) => (u.area ?? '').startsWith('1'));
    const feed = data.streams.find((x) => x.scope === 'AREA_1');
    const out = data.streams.find((x) => x.scope === 'INTERFACE_OUT');
    type Node = { key: string; tag: string; label: string; value: string; kind: 'in' | 'unit' | 'reactor' | 'out'; tone?: 'heat' };
    const nodes: Node[] = [];
    if (feed) nodes.push({ key: 'feed', tag: feed.plant_tag ?? feed.dwsim_tag, label: 'Umpan metanol', value: `${fmtNum(feed.T, 0)} °C · ${fmtNum(feed.P, 0)} bar`, kind: 'in' });
    for (const u of area1Units) {
      const recycle = u.inlets.map(byTag).find((x) => x?.scope === 'INTERFACE_IN');
      const outT = u.outlets.map(byTag).find((x) => x && x.mass_flow > 0)?.T;
      const reactor = /reactor/i.test(u.type);
      nodes.push({
        key: u.dwsim_tag,
        tag: u.plant_tag ?? u.dwsim_tag,
        label: UNIT_LABEL[u.type] ?? u.type,
        value: recycle
          ? `+ ${recycle.plant_tag ?? recycle.dwsim_tag} recycle`
          : u.duty_kW === null
          ? '–'
          : reactor && outT !== undefined
          ? `${fmtNum(u.duty_kW, 0)} kW · ${fmtNum(outT, 0)} °C`
          : `${fmtNum(u.duty_kW, u.duty_kW < 100 ? 1 : 0)} kW`,
        kind: reactor ? 'reactor' : 'unit',
        tone: /heater/i.test(u.type) ? 'heat' : undefined,
      });
    }
    if (out) nodes.push({ key: 'out', tag: `${out.plant_tag ?? out.dwsim_tag} → Area 2`, label: 'Battery limit', value: `${fmtNum(out.T, 0)} °C · ${fmtNum(out.P, 1)} bar`, kind: 'out' });
    return nodes.length > 1 ? nodes : null;
  }, [data]);

  if (loading) return <div className="py-20 text-center text-xs text-fg-3">Memuat data HMB...</div>;
  if (error || !data) return <div className="glass-card p-6 text-sm text-danger">{error ?? 'Data HMB tidak tersedia.'}</div>;

  const age = daysSince(data.meta.extracted_at);
  const compounds = data.meta.compounds;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        <div className="max-w-4xl">
          <p className="text-[13px] leading-relaxed text-fg-3">
            Neraca massa &amp; panas (HMB) hasil ekstraksi model <span className="font-mono">{'DME.dwxmz'}</span> oleh{' '}
            <span className="font-mono">tools/dwsim/export_hmb.py</span>. Tag pabrik mengikuti <span className="font-mono">tag_map.csv</span>.
            Data statis: hanya sesegar deploy terakhir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-8 px-3.5 rounded-full bg-surface border border-line text-[12px] font-medium text-fg-2 inline-flex items-center gap-2">
            <Database className="w-3.5 h-3.5" /> Ekstraksi {fmtDateTime(data.meta.extracted_at)}
            {age !== null && <span className="opacity-75">({age} hari lalu)</span>}
          </span>
          <span className="h-8 px-3.5 rounded-full bg-surface/70 border border-glass-stroke text-[12px] font-semibold text-primary inline-flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> {data.meta.solver_status} · {data.meta.property_package}
          </span>
          <span className="h-8 px-3.5 rounded-full bg-success-soft border border-glass-stroke text-success text-[12px] font-semibold inline-flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" /> Galat neraca maks {fmtNum(data.validation.mass_balance_max_error_pct, 3)} %
            (batas {data.validation.mass_balance_limit_pct} %)
          </span>
          <span className="h-8 px-3.5 rounded-full bg-surface/70 border border-glass-stroke text-[12px] text-fg-3 inline-flex items-center font-mono">
            sha256 {data.meta.source_sha256.slice(0, 12)}
          </span>
          <button
            type="button"
            onClick={() => setOnlyArea1((v) => !v)}
            className="ml-auto min-h-[44px] px-4 rounded-full bg-surface/90 border border-glass-stroke text-xs font-bold text-fg hover:bg-surface"
            aria-pressed={onlyArea1}
          >
            {onlyArea1 ? 'Tampilkan semua area' : 'Hanya lingkup Area 1'}
          </button>
        </div>
        <div className="max-w-4xl flex items-start gap-2 text-xs text-warm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Model referensi klien dari RFP KAK-IC-DME-2026-001 (fraksi mol Tabel 1 RFP identik; disimpan{' '}
            {data.meta.model_saved_on}, DWSIM {data.meta.dwsim_build}). Saat mengutip angka di laporan, sitasi RFP sebagai
            sumber model dan cantumkan tanggal ekstraksi.
          </span>
        </div>
      </div>

      {flow && (
        <section className="glass-card p-5 sm:p-6" aria-label="Alur proses Area 1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-2xl font-normal text-fg">Alur proses Area 1 · dehidrasi metanol</h2>
            <span className="text-xs text-fg-3">Duty dalam kW · model referensi RFP KAK-IC-DME-2026-001</span>
          </div>
          <ol className="mt-4 flex items-stretch gap-2 overflow-x-auto pb-1">
            {flow.map((n, i) => (
              <React.Fragment key={n.key}>
                {i > 0 && (
                  <li aria-hidden="true" className="self-center text-fg-3 shrink-0">
                    →
                  </li>
                )}
                <li
                  className={`shrink-0 min-w-[150px] flex-1 rounded-[20px] px-4 py-3 ${
                    n.kind === 'reactor'
                      ? 'bg-hero'
                      : n.kind === 'in'
                      ? 'bg-primary-soft'
                      : n.kind === 'out'
                      ? 'bg-warm-soft'
                      : 'bg-surface'
                  }`}
                >
                  <p className={`text-base font-semibold ${n.kind === 'reactor' ? '' : n.kind === 'out' ? 'text-warm' : n.kind === 'in' ? 'text-primary' : 'text-fg'}`}>
                    {n.tag}
                  </p>
                  <p className={`text-xs ${n.kind === 'reactor' ? 'text-on-ink-2' : 'text-fg-3'}`}>{n.label}</p>
                  <p
                    className={`mt-1 text-sm font-semibold tabular-nums ${
                      n.kind === 'reactor' ? '' : n.tone === 'heat' ? 'text-warm' : n.kind === 'out' || n.kind === 'in' ? 'text-fg' : 'text-primary'
                    }`}
                  >
                    {n.value}
                  </p>
                </li>
              </React.Fragment>
            ))}
          </ol>
        </section>
      )}

      <div className="glass-card p-4 sm:p-6 overflow-x-auto">
        <h2 className="font-heading text-2xl font-normal text-fg mb-3">Tabel aliran</h2>
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="text-left text-fg-3 border-b border-line">
              <th className="py-2 pr-3">Tag pabrik</th>
              <th className="py-2 pr-3">DWSIM</th>
              <th className="py-2 pr-3">Lingkup</th>
              <th className="py-2 pr-3 text-right">T (°C)</th>
              <th className="py-2 pr-3 text-right">P (bar a)</th>
              <th className="py-2 pr-3 text-right">Laju (kg/h)</th>
              <th className="py-2 pr-3 text-right">kmol/h</th>
              <th className="py-2 pr-3 text-right">Fraksi uap</th>
              {compounds.map((c) => (
                <th key={c} className="py-2 pr-3 text-right">x {c}</th>
              ))}
              <th className="py-2 pr-3 text-right">ρ (kg/m³)</th>
              <th className="py-2 text-right">μ (cP)</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((s) => (
              <tr key={s.dwsim_tag} className={`border-b border-line/70 ${s.scope === 'INTERFACE_OUT' ? 'bg-warm-soft' : s.scope === 'INTERFACE_IN' ? 'bg-primary-soft/60' : ''}`}>
                <td className="py-2 pr-3 font-bold text-fg">{s.plant_tag ?? '–'}</td>
                <td className="py-2 pr-3 font-mono text-fg-3">{s.dwsim_tag}</td>
                <td className={`py-2 pr-3 ${s.scope === 'INTERFACE_OUT' ? 'text-warm font-semibold' : 'text-fg-3'}`}>{s.scope === 'AREA_1' ? 'Area 1' : s.scope === 'INTERFACE_OUT' ? 'Keluar → Area 2' : s.scope === 'INTERFACE_IN' ? 'Masuk · recycle' : s.scope}</td>
                <td className="py-2 pr-3 text-right">{fmtNum(s.T, 1)}</td>
                <td className="py-2 pr-3 text-right">{fmtNum(s.P, 2)}</td>
                <td className="py-2 pr-3 text-right">{fmtNum(s.mass_flow, 1)}</td>
                <td className="py-2 pr-3 text-right">{fmtNum(s.molar_flow, 2)}</td>
                <td className="py-2 pr-3 text-right">{fmtNum(s.vapor_fraction, 2)}</td>
                {compounds.map((c) => (
                  <td key={c} className="py-2 pr-3 text-right">
                    {s.mass_flow > 0 ? fmtNum(s.mole_fractions[c], 3) : '–'}
                  </td>
                ))}
                <td className="py-2 pr-3 text-right">{fmtNum(s.props.rho, 2)}</td>
                <td className="py-2 text-right">{fmtNum(s.props.mu, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-4 sm:p-6 overflow-x-auto">
          <h2 className="font-heading text-2xl font-normal text-fg mb-3">Unit Operasi</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-fg-3 border-b border-line">
                <th className="py-2 pr-3">Tag</th>
                <th className="py-2 pr-3">Tipe</th>
                <th className="py-2 pr-3 text-right">Duty (kW)</th>
                <th className="py-2">Masuk → Keluar</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.dwsim_tag} className="border-b border-line/70">
                  <td className="py-2 pr-3 font-bold text-fg">
                    {u.plant_tag ?? u.dwsim_tag}
                    {u.plant_tag && <span className="ml-1 font-mono font-normal text-fg-3">({u.dwsim_tag})</span>}
                  </td>
                  <td className="py-2 pr-3 text-fg-3">{u.type}</td>
                  <td className="py-2 pr-3 text-right">{fmtNum(u.duty_kW, 1)}</td>
                  <td className="py-2 font-mono text-[11px]">
                    {u.inlets.map(tagOf).join(' + ')} → {u.outlets.map(tagOf).join(' + ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="glass-card p-4 sm:p-6 overflow-x-auto">
          <h2 className="font-heading text-2xl font-normal text-fg mb-3">Neraca Massa per Unit</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-fg-3 border-b border-line">
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3 text-right">Masuk (kg/h)</th>
                <th className="py-2 pr-3 text-right">Keluar (kg/h)</th>
                <th className="py-2 text-right">Galat (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.validation.mass_balance.map((b) => (
                <tr key={b.unit} className="border-b border-line/70">
                  <td className="py-2 pr-3 font-mono">{b.unit}</td>
                  <td className="py-2 pr-3 text-right">{fmtNum(b.in_kg_h, 1)}</td>
                  <td className="py-2 pr-3 text-right">{fmtNum(b.out_kg_h, 1)}</td>
                  <td className={`py-2 text-right font-bold ${b.error_pct > data.validation.mass_balance_limit_pct ? 'text-danger' : 'text-success'}`}>
                    {fmtNum(b.error_pct, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.validation.warnings.length > 0 && (
            <ul className="mt-3 text-[11px] text-warm list-disc pl-5">
              {data.validation.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
