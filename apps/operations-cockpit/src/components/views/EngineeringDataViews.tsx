import React, { useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useStaticData, fmtDateTime, statusClass } from '../../utils/staticData';

/**
 * Sub-tab "Kalkulator" dan "Validasi Tag" di menu Data Rekayasa (Blueprint v2.4, LOG-032; tata letak UI v2.0, LOG-074).
 * Sumber: public/data/calc_results.json & tag_validation_report.json (tools/build_manifest.js).
 */
interface CalcRow {
  section: string;
  parameter: string;
  symbol: string;
  value: string;
  unit: string;
  source: string;
  status: string;
}
interface CalcItem {
  tag: string;
  description: string;
  result: string;
  data_status: string;
  rows: CalcRow[];
}
interface Finding {
  level: string;
  code: string;
  tag: string;
  source: string;
  message: string;
}

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusClass(label)}`}>{label}</span>
);

/** Label standar per berkas kalkulator (nama berkas tetap ditampilkan sebagai sumber). */
const CALC_STANDARD: Record<string, string> = {
  CALC_API520_PSV: 'API 520 · Sizing PSV',
  CALC_ASME_Thermowell: 'ASME PTC 19.3 · Thermowell',
  CALC_ISA75_ControlValve: 'ISA-75 / IEC 60534 · Control valve',
  CALC_ISO5167_Orifice: 'ISO 5167 · Orifice plate',
  CALC_LineSizing: 'Kecepatan · ΔP · erosi',
  CALC_TeknoEkonomi_NPV: 'Tekno-ekonomi · NPV, IRR, payback',
};

/** Urutan status data dari terlemah: kartu memakai status terlemah dari item di dalamnya. */
const WEAKNESS = ['PLACEHOLDER', 'ASUMSI', 'LITERATUR', 'STANDAR', 'HMB', 'FINAL'];
const weakest = (list: string[]) =>
  [...list].sort((a, b) => {
    const ia = WEAKNESS.indexOf(a);
    const ib = WEAKNESS.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  })[0] ?? '–';

const stripTag = (desc: string, tag: string) => (desc.startsWith(tag) ? desc.slice(tag.length).trim() : desc);

export const CalcResultsView: React.FC = () => {
  const calc = useStaticData<{ generated_at?: string; calculators: { file: string; items: CalcItem[] }[] }>('calc_results.json');
  const [openFile, setOpenFile] = useState<string | null>(null);

  const cards = useMemo(
    () =>
      (calc.data?.calculators ?? []).map((c) => {
        const key = c.file.replace(/\.csv$/i, '');
        const pass = c.items.filter((it) => it.result === 'PASS').length;
        const single = c.items.length === 1;
        return {
          file: c.file,
          items: c.items,
          title: single ? c.items[0].tag : `Line sizing · ${c.items.length}`,
          standard: CALC_STANDARD[key] ?? key,
          desc: single
            ? stripTag(c.items[0].description, c.items[0].tag)
            : `${c.items.map((it) => it.tag).join(', ')}. ${pass}/${c.items.length} PASS.`,
          result: pass === c.items.length ? 'PASS' : 'FAIL',
          dataStatus: weakest(c.items.map((it) => it.data_status)),
        };
      }),
    [calc.data]
  );
  const total = cards.reduce((n, c) => n + c.items.length, 0);
  const passed = cards.reduce((n, c) => n + c.items.filter((it) => it.result === 'PASS').length, 0);
  const placeholder = cards.reduce((n, c) => n + c.items.filter((it) => it.data_status === 'PLACEHOLDER').length, 0);
  const open = cards.find((c) => c.file === openFile);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {calc.error && <div className="glass-card p-4 text-xs text-danger">{calc.error}</div>}
      {calc.loading && <div className="py-10 text-center text-xs text-fg-3">Memuat hasil kalkulator...</div>}

      {calc.data && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-success-soft text-success text-xs font-semibold">
            {passed}/{total} PASS · {placeholder} PLACEHOLDER
          </span>
          <span className="text-xs text-fg-3">
            tools/calc · ISO 5167 · IEC 60534 · API 520 · NPV · dibundel {fmtDateTime(calc.data.generated_at)}
          </span>
        </div>
      )}

      <div className="rounded-[22px] bg-warm-soft px-4 py-3 flex items-start gap-3">
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-warm-solid text-on-ink text-[11px] font-semibold uppercase tracking-wide">
          Aturan kutip
        </span>
        <p className="text-xs leading-relaxed text-fg">
          Status data = status input terlemah. PLACEHOLDER/ASUMSI belum boleh dikutip ke laporan; ubah input di{' '}
          <span className="font-mono">02_ENGINEERING_CALCULATORS/inputs/*.yaml</span> lalu jalankan{' '}
          <span className="font-mono">npm run calc</span>. Sizing manual tetap ditulis di laporan (Panduan Lampiran 1 Tahap 4).
        </p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <li key={c.file}>
            <button
              type="button"
              onClick={() => setOpenFile(openFile === c.file ? null : c.file)}
              aria-expanded={openFile === c.file}
              className={`w-full h-full min-h-[230px] glass-card !rounded-[28px] p-6 text-left flex flex-col gap-2 transition-all hover:shadow-cockpit-pop ${
                openFile === c.file ? '!border-primary ring-2 ring-focus/30' : ''
              }`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-heading text-3xl font-normal text-fg">{c.title}</span>
                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-success-soft text-success text-[11px] font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {c.result}
                </span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-3">{c.standard}</span>
              <span className="text-sm leading-relaxed text-fg-2 line-clamp-3">{c.desc}</span>
              <span className="mt-auto pt-3 flex items-center justify-between gap-2">
                <Pill label={c.dataStatus} />
                <span className="text-[11px] text-fg-3 truncate">{c.file}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <section className="glass-card p-5 sm:p-6 space-y-4" aria-label={`Rincian ${open.file}`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-2xl font-normal text-fg">
              {open.title} <span className="text-sm text-fg-3">· {open.file}</span>
            </h2>
            <button
              type="button"
              onClick={() => setOpenFile(null)}
              className="w-10 h-10 rounded-full bg-muted text-fg flex items-center justify-center"
              aria-label="Tutup rincian"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {open.items.map((it) => (
            <div key={it.tag} className="space-y-2">
              <p className="text-sm text-fg">
                <span className="font-semibold">{it.tag}</span> <span className="text-fg-3">{stripTag(it.description, it.tag)}</span>{' '}
                <Pill label={it.result} /> <Pill label={it.data_status} />
              </p>
              <div className="overflow-x-auto rounded-2xl bg-surface">
                <table className="w-full text-xs min-w-[720px]">
                  <thead>
                    <tr className="text-left text-fg-3 bg-muted/60">
                      <th className="py-2 px-3">Bagian</th>
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3 text-right">Nilai</th>
                      <th className="py-2 px-3">Satuan</th>
                      <th className="py-2 px-3">Sumber</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {it.rows
                      .filter((r) => r.section !== 'INFO')
                      .map((r, i) => (
                        <tr key={i} className="border-t border-line align-top">
                          <td className="py-1.5 px-3 text-fg-3">{r.section}</td>
                          <td className="py-1.5 px-3">{r.parameter}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{r.value}</td>
                          <td className="py-1.5 px-3">{r.unit}</td>
                          <td className="py-1.5 px-3 text-fg-3 max-w-[360px]">{r.source}</td>
                          <td className="py-1.5 px-3">
                            <Pill label={r.status} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

interface TagReport {
  meta: {
    generated_at: string;
    pid_dxf_checked: string[];
    sources?: { source: string; tags_found: number }[];
  };
  summary: Record<string, number>;
  findings: Finding[];
}

export const TagValidationView: React.FC = () => {
  const tags = useStaticData<TagReport>('tag_validation_report.json');
  const [level, setLevel] = useState<'Semua' | 'ERROR' | 'WARNING'>('Semua');
  const d = tags.data;
  const errors = d?.summary.ERROR ?? 0;
  const warnings = d?.summary.WARNING ?? 0;
  const shortSource = (name: string) =>
    name.startsWith('Master Instrument') ? 'Instrument Index' : name.startsWith('Cause') ? 'C&E' : name.startsWith('Master_Alarm') ? 'Alarm database' : name.startsWith('Mirror FDS') ? 'FDS' : name.startsWith('P&ID') ? 'P&ID DXF' : name;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {tags.error && <div className="glass-card p-4 text-xs text-danger">{tags.error}</div>}
      {tags.loading && <div className="py-10 text-center text-xs text-fg-3">Memuat laporan validasi...</div>}

      {d && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-3 glass-card !rounded-[28px] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Error</p>
              <p className={`mt-2 font-heading text-6xl font-extralight leading-none ${errors ? 'text-danger' : 'text-success'}`}>{errors}</p>
              <p className="mt-3 text-xs text-fg-2">tag tidak konsisten antar-dokumen</p>
            </div>
            <div className={`xl:col-span-3 rounded-[28px] p-6 ${warnings ? 'bg-warm-soft' : 'glass-card'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${warnings ? 'text-warm' : 'text-fg-3'}`}>Warning</p>
              <p className={`mt-2 font-heading text-6xl font-extralight leading-none ${warnings ? 'text-warm' : 'text-fg'}`}>{warnings}</p>
              <p className="mt-3 text-xs text-fg-2">perlu ditindaklanjuti di P&amp;ID berikutnya</p>
            </div>
            <div className="md:col-span-2 xl:col-span-6 glass-card !rounded-[28px] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Sumber diperiksa → tag_map.csv (FINAL)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(d.meta.sources ?? []).map((src) => (
                  <span key={src.source} className="px-3 py-1 rounded-full bg-surface text-xs font-medium text-fg" title={src.source}>
                    {shortSource(src.source)} · {src.tags_found} tag
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-fg-3 break-all">
                {d.meta.pid_dxf_checked.length ? d.meta.pid_dxf_checked.join(', ') : 'P&ID belum diperiksa'} · dibuat {fmtDateTime(d.meta.generated_at)} ·
                tools/validate_tags.py
              </p>
            </div>
          </div>

          <section className="glass-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-normal text-fg">Temuan validasi</h2>
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-line" role="tablist" aria-label="Filter tingkat temuan">
                {(['Semua', 'ERROR', 'WARNING'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="tab"
                    aria-selected={level === l}
                    onClick={() => setLevel(l)}
                    className={`min-h-[36px] px-3.5 rounded-full text-xs transition-all ${
                      level === l ? 'bg-surface text-fg font-semibold shadow-xs' : 'text-fg-2 font-medium'
                    }`}
                  >
                    {l === 'Semua' ? `Semua (${d.findings.length})` : `${l === 'ERROR' ? 'Error' : 'Warning'} (${d.summary[l] ?? 0})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-fg-3 bg-primary-soft/60">
                    <th className="py-2.5 px-4 font-semibold">Tingkat</th>
                    <th className="py-2.5 px-4 font-semibold">Kode</th>
                    <th className="py-2.5 px-4 font-semibold">Tag</th>
                    <th className="py-2.5 px-4 font-semibold">Sumber</th>
                    <th className="py-2.5 px-4 font-semibold">Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  {d.findings
                    .filter((f) => level === 'Semua' || f.level === level)
                    .map((f, i) => (
                      <tr key={i} className="border-b border-line align-top">
                        <td className="py-3 px-4">
                          <Pill label={f.level} />
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-fg-2">{f.code}</td>
                        <td className="py-3 px-4 font-semibold text-fg">{f.tag}</td>
                        <td className="py-3 px-4 text-fg-2">{f.source}</td>
                        <td className="py-3 px-4 text-fg">{f.message}</td>
                      </tr>
                    ))}
                  {d.findings.filter((f) => level === 'Semua' || f.level === level).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-fg-3">
                        Tidak ada temuan pada tingkat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
