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
        <div className="max-w-4xl">
          <p className="text-[13px] leading-relaxed text-fg-3">
            {docs.length} companion <span className="font-mono">.md</span> dari repo beserta status siklus dokumen (Blueprint
            §1.4), rumus, dan SOP. Dibundel {fmtDateTime(lib.data?.generated_at)}; untuk mengubah isi, edit file di repo atau
            master Google Workspace-nya.
          </p>
        </div>
      </div>

      {lib.error && <div className="glass-card p-4 text-xs text-danger">{lib.error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 glass-card p-4 space-y-3">
          <label className="flex items-center gap-2 bg-surface/90 rounded-full px-3 min-h-[44px] border border-glass-stroke">
            <Search className="w-4 h-4 text-fg-3" />
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
            className="w-full min-h-[44px] rounded-full px-3 text-xs bg-surface/90 border border-glass-stroke"
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
                    current?.path === d.path ? 'bg-muted' : 'hover:bg-surface/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-fg line-clamp-1">{d.title}</span>
                    <Pill label={d.status} />
                  </div>
                  <span className="text-[10px] font-mono text-fg-3 line-clamp-1">{d.path}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-xs text-fg-3 p-3">Tidak ada dokumen yang cocok.</li>}
          </ul>
        </div>
        <div className="xl:col-span-8 glass-card p-4 sm:p-6 min-w-0">
          {current ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-heading font-bold text-lg text-fg">{current.title}</h2>
                  <p className="text-[11px] font-mono text-fg-3 break-all">
                    {current.id} · {current.path}
                  </p>
                </div>
                <Pill label={current.status} />
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div><dt className="inline text-fg-3">Standar: </dt><dd className="inline">{current.standard || '–'}</dd></div>
                <div><dt className="inline text-fg-3">Diperbarui: </dt><dd className="inline">{current.last_updated || '–'}</dd></div>
                <div><dt className="inline text-fg-3">Author: </dt><dd className="inline">{current.author || '–'}</dd></div>
                <div><dt className="inline text-fg-3">Reviewer: </dt><dd className="inline">{current.reviewer || '–'}</dd></div>
                <div className="sm:col-span-2">
                  <dt className="inline text-fg-3">Artefak: </dt>
                  <dd className="inline font-mono break-all">{current.target_files.join(', ') || '–'}</dd>
                </div>
              </dl>
              {current.google_ref && (
                <a
                  href={current.google_ref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline min-h-[44px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka master di Google Workspace
                </a>
              )}
              <div className="bg-surface/70 rounded-2xl p-4 max-h-[65vh] overflow-y-auto">
                <MarkdownView source={current.body} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-fg-3">{lib.loading ? 'Memuat...' : 'Pilih dokumen.'}</p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-fg-3 inline-flex items-center gap-1.5">
        <Library className="w-3.5 h-3.5" /> Sumber: <span className="font-mono">tools/build_manifest.js</span> → public/data/
      </p>
    </div>
  );
};
