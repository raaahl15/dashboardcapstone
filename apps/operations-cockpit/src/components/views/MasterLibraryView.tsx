import React, { useMemo, useState } from 'react';
import { Library, Search, ExternalLink } from 'lucide-react';
import { useStaticData, fmtDateTime, statusClass } from '../../utils/staticData';
import { MarkdownView } from '../common/MarkdownView';

/**
 * Sub-tab "Companion .md" di menu Dokumen (Blueprint v2.4, LOG-032): penjelajah companion `.md`
 * dengan status siklus dokumen §1.4 dan pembaca Markdown + rumus KaTeX. Hasil kalkulator dan
 * validasi tag pindah ke menu Data Rekayasa (EngineeringDataViews.tsx).
 */
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

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${statusClass(label)}`}>{label}</span>
);

export const MasterLibraryView: React.FC = () => {
  const lib = useStaticData<{ generated_at: string; documents: Doc[] }>('library_manifest.json');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Semua');
  const [selected, setSelected] = useState<string | null>(null);

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

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          Companion Dokumen
        </h1>
        <div className="glass-faint w-full px-4 py-2.5">
          <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33]">
            {docs.length} companion <span className="font-mono">.md</span> dari repo beserta status siklus dokumen (Blueprint
            §1.4), rumus, dan SOP. Dibundel {fmtDateTime(lib.data?.generated_at)}; untuk mengubah isi, edit file di repo atau
            master Google Workspace-nya.
          </p>
        </div>
      </div>

      {lib.error && <div className="glass-card p-4 text-xs text-[#991B1B]">{lib.error}</div>}

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
                  aria-current={current?.path === d.path ? 'true' : undefined}
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
                <div className="min-w-0">
                  <h2 className="font-heading font-bold text-lg text-[#0B1B33]">{current.title}</h2>
                  <p className="text-[11px] font-mono text-[#4A5A72] break-all">
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
                  <dd className="inline font-mono break-all">{current.target_files.join(', ') || '–'}</dd>
                </div>
              </dl>
              {current.google_ref && (
                <a
                  href={current.google_ref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0062CC] hover:underline min-h-[44px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka master di Google Workspace
                </a>
              )}
              <div className="bg-white/70 rounded-2xl p-4 max-h-[65vh] overflow-y-auto">
                <MarkdownView source={current.body} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#4A5A72]">{lib.loading ? 'Memuat...' : 'Pilih dokumen.'}</p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#4A5A72] inline-flex items-center gap-1.5">
        <Library className="w-3.5 h-3.5" /> Sumber: <span className="font-mono">tools/build_manifest.js</span> → public/data/
      </p>
    </div>
  );
};
