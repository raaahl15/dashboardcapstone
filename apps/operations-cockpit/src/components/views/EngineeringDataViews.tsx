import React, { useState } from 'react';
import { Calculator, Tags } from 'lucide-react';
import { useStaticData, fmtDateTime, statusClass } from '../../utils/staticData';

/**
 * Sub-tab "Kalkulator" dan "Validasi Tag" di menu Data Rekayasa (Blueprint v2.4, LOG-032).
 * Sebelumnya tab di Master Library; dipindah agar data rekayasa (HMB, kalkulator, tag) berada di satu menu.
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
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${statusClass(label)}`}>{label}</span>
);

const PageHead: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-3">
    <div className="max-w-4xl">
      <p className="text-[13px] leading-relaxed text-fg-3">{children}</p>
    </div>
  </div>
);

export const CalcResultsView: React.FC = () => {
  const calc = useStaticData<{ generated_at?: string; calculators: { file: string; items: CalcItem[] }[] }>('calc_results.json');
  const [openCalc, setOpenCalc] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <PageHead icon={<Calculator className="w-9 h-9 text-primary" />} title="Hasil Kalkulator">
        Hasil mesin kalkulator <span className="font-mono">tools/calc/</span> (ISO 5167, IEC 60534, API 520, NPV) dari input{' '}
        <span className="font-mono">02_ENGINEERING_CALCULATORS/inputs/*.yaml</span> + HMB. Ini verifikasi silang; sizing
        manual tetap ditulis di laporan (Panduan Lampiran 1 Tahap 4).
      </PageHead>

      {calc.error && <div className="glass-card p-4 text-xs text-danger">{calc.error}</div>}
      {calc.loading && <div className="py-10 text-center text-xs text-fg-3">Memuat hasil kalkulator...</div>}

      {(calc.data?.calculators ?? []).map((c) => (
        <div key={c.file} className="glass-card p-4 sm:p-6 space-y-2">
          <h2 className="font-heading font-bold text-base text-fg font-mono break-all">{c.file}</h2>
          {c.items.map((it) => {
            const id = `${c.file}:${it.tag}`;
            return (
              <div key={it.tag} className="bg-surface/70 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOpenCalc(openCalc === id ? null : id)}
                  className="w-full min-h-[44px] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-left"
                  aria-expanded={openCalc === id}
                >
                  <span className="text-xs font-bold text-fg">
                    {it.tag} <span className="font-normal text-fg-3">{it.description}</span>
                  </span>
                  <span className="flex gap-1.5">
                    <Pill label={it.result} />
                    <Pill label={it.data_status} />
                  </span>
                </button>
                {openCalc === id && (
                  <div className="overflow-x-auto px-4 pb-3">
                    <table className="w-full text-[11px] min-w-[720px]">
                      <thead>
                        <tr className="text-left text-fg-3 border-b border-line">
                          <th className="py-1.5 pr-2">Bagian</th>
                          <th className="py-1.5 pr-2">Parameter</th>
                          <th className="py-1.5 pr-2 text-right">Nilai</th>
                          <th className="py-1.5 pr-2">Satuan</th>
                          <th className="py-1.5 pr-2">Sumber</th>
                          <th className="py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {it.rows
                          .filter((r) => r.section !== 'INFO')
                          .map((r, i) => (
                            <tr key={i} className="border-b border-line/70 align-top">
                              <td className="py-1.5 pr-2 text-fg-3">{r.section}</td>
                              <td className="py-1.5 pr-2">{r.parameter}</td>
                              <td className="py-1.5 pr-2 text-right font-mono">{r.value}</td>
                              <td className="py-1.5 pr-2">{r.unit}</td>
                              <td className="py-1.5 pr-2 text-fg-3 max-w-[360px]">{r.source}</td>
                              <td className="py-1.5">
                                <Pill label={r.status} />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <p className="text-[11px] text-fg-3">
        Status data = status input terlemah. PLACEHOLDER/ASUMSI belum boleh dikutip ke laporan; ubah input di{' '}
        <span className="font-mono">02_ENGINEERING_CALCULATORS/inputs/*.yaml</span> lalu jalankan{' '}
        <span className="font-mono">npm run calc</span>.
      </p>
    </div>
  );
};

export const TagValidationView: React.FC = () => {
  const tags = useStaticData<{
    meta: { generated_at: string; pid_dxf_checked: string[] };
    summary: Record<string, number>;
    findings: Finding[];
  }>('tag_validation_report.json');
  const [level, setLevel] = useState<'Semua' | 'ERROR' | 'WARNING'>('ERROR');

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <PageHead icon={<Tags className="w-9 h-9 text-primary" />} title="Validasi Tag">
        Hasil <span className="font-mono">tools/validate_tags.py</span>: tag di Instrument Index, C&amp;E, alarm database, FDS,
        dan P&amp;ID DXF dibandingkan dengan <span className="font-mono">tag_map.csv</span> (tag pabrik FINAL).
      </PageHead>

      {tags.error && <div className="glass-card p-4 text-xs text-danger">{tags.error}</div>}
      {tags.loading && <div className="py-10 text-center text-xs text-fg-3">Memuat laporan validasi...</div>}

      {tags.data && (
        <div className="glass-card p-4 sm:p-6 space-y-3 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-fg-3">
              Dibuat {fmtDateTime(tags.data.meta.generated_at)} · P&amp;ID diperiksa:{' '}
              {tags.data.meta.pid_dxf_checked.length ? tags.data.meta.pid_dxf_checked.join(', ') : 'belum ada'}
            </span>
            <div className="ml-auto flex gap-1.5">
              {(['ERROR', 'WARNING', 'Semua'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  aria-pressed={level === l}
                  className={`min-h-[44px] px-3.5 rounded-full text-xs font-bold ${
                    level === l ? 'bg-ink text-on-ink' : 'bg-surface/80 text-fg-3'
                  }`}
                >
                  {l} {l !== 'Semua' ? `(${tags.data!.summary[l] ?? 0})` : ''}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-[11px] min-w-[760px]">
            <thead>
              <tr className="text-left text-fg-3 border-b border-line">
                <th className="py-1.5 pr-2">Tingkat</th>
                <th className="py-1.5 pr-2">Kode</th>
                <th className="py-1.5 pr-2">Tag</th>
                <th className="py-1.5 pr-2">Sumber</th>
                <th className="py-1.5">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {tags.data.findings
                .filter((f) => level === 'Semua' || f.level === level)
                .map((f, i) => (
                  <tr key={i} className="border-b border-line/70 align-top">
                    <td className="py-1.5 pr-2">
                      <Pill label={f.level} />
                    </td>
                    <td className="py-1.5 pr-2 font-mono">{f.code}</td>
                    <td className="py-1.5 pr-2 font-bold">{f.tag}</td>
                    <td className="py-1.5 pr-2 text-fg-3">{f.source}</td>
                    <td className="py-1.5">{f.message}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
