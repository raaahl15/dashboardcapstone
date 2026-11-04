import React, { useMemo, useState } from 'react';
import { Library, Search, Calculator, Tags, ExternalLink, FileText } from 'lucide-react';
import { useStaticData, fmtDateTime, statusClass, consumeLibraryTab, LibraryTab } from '../../utils/staticData';

interface Doc {
  path: string;
  folder: string;
  id: string;
  title: string;
  category: string;
  standard: string;
  status: string;
  author: string;
  reviewer: string;
  last_updated: string;
  google_ref: string;
  target_files: string[];
  tags: string[];
  body: string;
}
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

type Tab = LibraryTab;

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${statusClass(label)}`}>{label}</span>
);

export const MasterLibraryView: React.FC = () => {
  const lib = useStaticData<{ generated_at: string; documents: Doc[] }>('library_manifest.json');
  const calc = useStaticData<{ calculators: { file: string; items: CalcItem[] }[] }>('calc_results.json');
  const tags = useStaticData<{ meta: { generated_at: string; pid_dxf_checked: string[] }; summary: Record<string, number>; findings: Finding[] }>(
    'tag_validation_report.json'
  );
  // Tab awal bisa diminta dari luar (mis. kartu Kesehatan Data) lewat requestLibraryTab()
  const [tab, setTab] = useState<Tab>(() => consumeLibraryTab() ?? 'docs');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Semua');
  const [selected, setSelected] = useState<string | null>(null);
  const [openCalc, setOpenCalc] = useState<string | null>(null);
  const [level, setLevel] = useState<'Semua' | 'ERROR' | 'WARNING'>('ERROR');

  const docs = lib.data?.documents ?? [];
  const statuses = useMemo(() => ['Semua', ...Array.from(new Set(docs.map((d) => d.status))).sort()], [docs]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter(
      (d) =>
        (status === 'Semua' || d.status === status) &&
        (!q || [d.title, d.path, d.id, d.category, ...d.tags].join(' ').toLowerCase().includes(q))
    );
  }, [docs, query, status]);
  const current = docs.find((d) => d.path === selected) ?? filtered[0];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'docs', label: `Dokumen (${docs.length})`, icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'calc', label: 'Hasil Kalkulator', icon: <Calculator className="w-3.5 h-3.5" /> },
    { key: 'tags', label: `Validasi Tag (${tags.data?.summary.ERROR ?? '–'} error)`, icon: <Tags className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          Master Library
        </h1>
        <div className="glass-faint w-full px-4 py-2.5">
          <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33]">
            Penjelajah artefak monorepo: companion <span className="font-mono">.md</span> beserta status siklus dokumen, hasil
            mesin kalkulator, dan laporan validasi tag. Dibundel {fmtDateTime(lib.data?.generated_at)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-[44px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all ${
                tab === t.key ? 'bg-[#0B1B33] text-white' : 'bg-white/80 text-[#4A5A72] border border-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {(lib.error || calc.error || tags.error) && (
        <div className="glass-card p-4 text-xs text-[#991B1B]">{lib.error || calc.error || tags.error}</div>
      )}

      {tab === 'docs' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-4 glass-card p-4 space-y-3">
            <label className="flex items-center gap-2 bg-white/90 rounded-full px-3 min-h-[44px] border border-white">
              <Search className="w-4 h-4 text-[#4A5A72]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari judul, tag, folder..."
                className="flex-1 bg-transparent text-xs outline-none"
                aria-label="Cari dokumen"
              />
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full min-h-[44px] rounded-full px-3 text-xs bg-white/90 border border-white"
              aria-label="Filter status"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map((d) => (
                <li key={d.path}>
                  <button
                    type="button"
                    onClick={() => setSelected(d.path)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-colors ${
                      current?.path === d.path ? 'bg-[#EAF6FD]' : 'hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0B1B33] line-clamp-1">{d.title}</span>
                      <Pill label={d.status} />
                    </div>
                    <span className="text-[10px] font-mono text-[#4A5A72] line-clamp-1">{d.path}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="text-xs text-[#4A5A72] p-3">Tidak ada dokumen yang cocok.</li>}
            </ul>
          </div>
          <div className="xl:col-span-8 glass-card p-4 sm:p-6 min-w-0">
            {current ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-heading font-bold text-lg text-[#0B1B33]">{current.title}</h2>
                    <p className="text-[11px] font-mono text-[#4A5A72]">
                      {current.id} · {current.path}
                    </p>
                  </div>
                  <Pill label={current.status} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <div><dt className="inline text-[#4A5A72]">Standar: </dt><dd className="inline">{current.standard || '–'}</dd></div>
                  <div><dt className="inline text-[#4A5A72]">Diperbarui: </dt><dd className="inline">{current.last_updated || '–'}</dd></div>
                  <div><dt className="inline text-[#4A5A72]">Author: </dt><dd className="inline">{current.author || '–'}</dd></div>
                  <div><dt className="inline text-[#4A5A72]">Reviewer: </dt><dd className="inline">{current.reviewer || '–'}</dd></div>
                  <div className="sm:col-span-2">
                    <dt className="inline text-[#4A5A72]">Artefak: </dt>
                    <dd className="inline font-mono">{current.target_files.join(', ') || '–'}</dd>
                  </div>
                </dl>
                {current.google_ref && (
                  <a
                    href={current.google_ref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0062CC] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka master di Google Workspace
                  </a>
                )}
                <pre className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#0B1B33] bg-white/70 rounded-2xl p-4 max-h-[65vh] overflow-y-auto font-sans">
                  {current.body}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-[#4A5A72]">{lib.loading ? 'Memuat...' : 'Pilih dokumen.'}</p>
            )}
          </div>
        </div>
      )}

      {tab === 'calc' && (
        <div className="space-y-4">
          {(calc.data?.calculators ?? []).map((c) => (
            <div key={c.file} className="glass-card p-4 sm:p-6 space-y-2">
              <h2 className="font-heading font-bold text-base text-[#0B1B33] font-mono">{c.file}</h2>
              {c.items.map((it) => (
                <div key={it.tag} className="bg-white/70 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenCalc(openCalc === `${c.file}:${it.tag}` ? null : `${c.file}:${it.tag}`)}
                    className="w-full min-h-[44px] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-left"
                    aria-expanded={openCalc === `${c.file}:${it.tag}`}
                  >
                    <span className="text-xs font-bold text-[#0B1B33]">
                      {it.tag} <span className="font-normal text-[#4A5A72]">{it.description}</span>
                    </span>
                    <span className="flex gap-1.5">
                      <Pill label={it.result} />
                      <Pill label={it.data_status} />
                    </span>
                  </button>
                  {openCalc === `${c.file}:${it.tag}` && (
                    <div className="overflow-x-auto px-4 pb-3">
                      <table className="w-full text-[11px] min-w-[720px]">
                        <thead>
                          <tr className="text-left text-[#4A5A72] border-b border-[#EAF6FD]">
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
                              <tr key={i} className="border-b border-[#EAF6FD]/70 align-top">
                                <td className="py-1.5 pr-2 text-[#4A5A72]">{r.section}</td>
                                <td className="py-1.5 pr-2">{r.parameter}</td>
                                <td className="py-1.5 pr-2 text-right font-mono">{r.value}</td>
                                <td className="py-1.5 pr-2">{r.unit}</td>
                                <td className="py-1.5 pr-2 text-[#4A5A72] max-w-[360px]">{r.source}</td>
                                <td className="py-1.5"><Pill label={r.status} /></td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <p className="text-[11px] text-[#4A5A72]">
            Status data = status input terlemah. PLACEHOLDER/ASUMSI belum boleh dikutip ke laporan; ubah input di{' '}
            <span className="font-mono">02_ENGINEERING_CALCULATORS/inputs/*.yaml</span> lalu jalankan{' '}
            <span className="font-mono">npm run calc</span>.
          </p>
        </div>
      )}

      {tab === 'tags' && tags.data && (
        <div className="glass-card p-4 sm:p-6 space-y-3 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#4A5A72]">
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
                  className={`min-h-[44px] px-3.5 rounded-full text-xs font-bold ${level === l ? 'bg-[#0B1B33] text-white' : 'bg-white/80 text-[#4A5A72]'}`}
                >
                  {l} {l !== 'Semua' ? `(${tags.data!.summary[l] ?? 0})` : ''}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-[11px] min-w-[760px]">
            <thead>
              <tr className="text-left text-[#4A5A72] border-b border-[#EAF6FD]">
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
                  <tr key={i} className="border-b border-[#EAF6FD]/70 align-top">
                    <td className="py-1.5 pr-2"><Pill label={f.level} /></td>
                    <td className="py-1.5 pr-2 font-mono">{f.code}</td>
                    <td className="py-1.5 pr-2 font-bold">{f.tag}</td>
                    <td className="py-1.5 pr-2 text-[#4A5A72]">{f.source}</td>
                    <td className="py-1.5">{f.message}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-[#4A5A72] inline-flex items-center gap-1.5">
        <Library className="w-3.5 h-3.5" /> Sumber: <span className="font-mono">tools/build_manifest.js</span> → public/data/
      </p>
    </div>
  );
};
