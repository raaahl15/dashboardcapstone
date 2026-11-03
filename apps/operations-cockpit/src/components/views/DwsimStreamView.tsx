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

  if (loading) return <div className="py-20 text-center text-xs text-[#4A5A72]">Memuat data HMB...</div>;
  if (error || !data) return <div className="glass-card p-6 text-sm text-[#991B1B]">{error ?? 'Data HMB tidak tersedia.'}</div>;

  const age = daysSince(data.meta.extracted_at);
  const compounds = data.meta.compounds;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          DWSIM Stream Hub
        </h1>
        <div className="glass-faint w-full px-4 py-2.5">
          <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33]">
            Neraca massa &amp; panas (HMB) hasil ekstraksi model <span className="font-mono">{'DME.dwxmz'}</span> oleh{' '}
            <span className="font-mono">tools/dwsim/export_hmb.py</span>. Tag pabrik mengikuti <span className="font-mono">tag_map.csv</span>.
            Data statis: hanya sesegar deploy terakhir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-8 px-3.5 rounded-full bg-[#0B1B33] text-white text-[12px] font-medium inline-flex items-center gap-2">
            <Database className="w-3.5 h-3.5" /> Ekstraksi {fmtDateTime(data.meta.extracted_at)}
            {age !== null && <span className="opacity-75">({age} hari lalu)</span>}
          </span>
          <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[12px] font-semibold text-[#0062CC] inline-flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> {data.meta.solver_status} · {data.meta.property_package}
          </span>
          <span className="h-8 px-3.5 rounded-full bg-[#D1FAE5] border border-white/70 text-[#065F46] text-[12px] font-semibold inline-flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" /> Galat neraca maks {fmtNum(data.validation.mass_balance_max_error_pct, 3)} %
            (batas {data.validation.mass_balance_limit_pct} %)
          </span>
          <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[12px] text-[#4A5A72] inline-flex items-center font-mono">
            sha256 {data.meta.source_sha256.slice(0, 12)}
          </span>
          <button
            type="button"
            onClick={() => setOnlyArea1((v) => !v)}
            className="ml-auto min-h-[44px] px-4 rounded-full bg-white/90 border border-white text-xs font-bold text-[#0B1B33] hover:bg-white"
            aria-pressed={onlyArea1}
          >
            {onlyArea1 ? 'Tampilkan semua area' : 'Hanya lingkup Area 1'}
          </button>
        </div>
        <div className="glass-faint px-4 py-2.5 flex items-start gap-2 text-xs text-[#92400E]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Model terakhir disimpan {data.meta.model_saved_on} (DWSIM {data.meta.dwsim_build}). Asal-usul model belum
            dikonfirmasi PIC; angka belum boleh dikutip ke laporan sebelum dikonfirmasi (LOG-019).
          </span>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6 overflow-x-auto">
        <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33] mb-3">Tabel Aliran</h2>
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="text-left text-[#4A5A72] border-b border-[#EAF6FD]">
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
              <tr key={s.dwsim_tag} className="border-b border-[#EAF6FD]/70">
                <td className="py-2 pr-3 font-bold text-[#0B1B33]">{s.plant_tag ?? '–'}</td>
                <td className="py-2 pr-3 font-mono text-[#4A5A72]">{s.dwsim_tag}</td>
                <td className="py-2 pr-3 text-[#4A5A72]">{s.scope}</td>
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
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33] mb-3">Unit Operasi</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[#4A5A72] border-b border-[#EAF6FD]">
                <th className="py-2 pr-3">Tag</th>
                <th className="py-2 pr-3">Tipe</th>
                <th className="py-2 pr-3 text-right">Duty (kW)</th>
                <th className="py-2">Masuk → Keluar</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.dwsim_tag} className="border-b border-[#EAF6FD]/70">
                  <td className="py-2 pr-3 font-bold text-[#0B1B33]">
                    {u.plant_tag ?? u.dwsim_tag}
                    {u.plant_tag && <span className="ml-1 font-mono font-normal text-[#4A5A72]">({u.dwsim_tag})</span>}
                  </td>
                  <td className="py-2 pr-3 text-[#4A5A72]">{u.type}</td>
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
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33] mb-3">Neraca Massa per Unit</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[#4A5A72] border-b border-[#EAF6FD]">
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3 text-right">Masuk (kg/h)</th>
                <th className="py-2 pr-3 text-right">Keluar (kg/h)</th>
                <th className="py-2 text-right">Galat (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.validation.mass_balance.map((b) => (
                <tr key={b.unit} className="border-b border-[#EAF6FD]/70">
                  <td className="py-2 pr-3 font-mono">{b.unit}</td>
                  <td className="py-2 pr-3 text-right">{fmtNum(b.in_kg_h, 1)}</td>
                  <td className="py-2 pr-3 text-right">{fmtNum(b.out_kg_h, 1)}</td>
                  <td className={`py-2 text-right font-bold ${b.error_pct > data.validation.mass_balance_limit_pct ? 'text-[#991B1B]' : 'text-[#047857]'}`}>
                    {fmtNum(b.error_pct, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.validation.warnings.length > 0 && (
            <ul className="mt-3 text-[11px] text-[#92400E] list-disc pl-5">
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
