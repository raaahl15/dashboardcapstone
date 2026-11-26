import React, { useMemo, useState } from 'react';
import { FolderOpen, FileSpreadsheet, FileText, ExternalLink, Presentation, File as FileIcon, Archive } from 'lucide-react';
import { useStaticData, fmtDateTime, statusClass } from '../../utils/staticData';

interface Folder {
  key: string;
  title: string;
  id: string;
  url: string;
}
interface DriveFile {
  key: string;
  title: string;
  id: string;
  url: string;
  folder?: string;
  group?: string;
  note?: string;
  archived?: boolean;
}
interface TabLink {
  title: string;
  url: string;
}
interface WsDoc {
  key: string;
  type: 'sheets' | 'docs' | 'slides';
  title: string;
  doc_no?: string;
  url: string;
  target_folder?: string;
  pic?: string;
  status?: string;
  data_status?: string;
  note?: string;
  tabs?: string[];
  tab_links?: TabLink[];
  repo_snapshot?: string;
  repo_companion?: string;
  section_owners?: Record<string, string>;
  section_reviewers?: Record<string, string>;
}
interface Registry {
  updated_at: string;
  drive: { root: Folder; folders: Folder[]; folders_pending: string[]; files?: DriveFile[]; file_groups?: string[] };
  documents: WsDoc[];
}

const DocIcon: React.FC<{ type: WsDoc['type'] }> = ({ type }) =>
  type === 'sheets' ? (
    <FileSpreadsheet className="w-5 h-5" />
  ) : type === 'slides' ? (
    <Presentation className="w-5 h-5" />
  ) : (
    <FileText className="w-5 h-5" />
  );

const extOf = (title: string) => {
  const m = /\.([a-z0-9]+)$/i.exec(title);
  return m ? m[1].toUpperCase() : 'DOC';
};

export const GoogleWorkspaceView: React.FC = () => {
  const { data, error, loading } = useStaticData<Registry>('google_workspace_registry.json');
  const [showArchived, setShowArchived] = useState(false);

  const groups = useMemo(() => {
    const files = data?.drive.files ?? [];
    const order = data?.drive.file_groups ?? [];
    const byGroup = new Map<string, DriveFile[]>();
    for (const f of files) {
      if (f.archived && !showArchived) continue;
      const g = f.group || 'Lainnya';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(f);
    }
    const names = [...order.filter((g) => byGroup.has(g)), ...[...byGroup.keys()].filter((g) => !order.includes(g))];
    return names.map((g) => ({ name: g, files: byGroup.get(g)! }));
  }, [data, showArchived]);

  if (loading) return <div className="py-20 text-center text-xs text-fg-3">Memuat registry...</div>;
  if (error || !data) return <div className="glass-card p-6 text-sm text-danger">{error ?? 'Registry tidak tersedia.'}</div>;

  const archivedCount = (data.drive.files ?? []).filter((f) => f.archived).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        <div className="max-w-4xl">
          <p className="text-[13px] leading-relaxed text-fg-3">
            Tautan master dokumen kolaborasi (Sheets/Docs), berkas penting, dan folder Drive proyek, dari{' '}
            <span className="font-mono">google_workspace_registry.json</span> (diperbarui {fmtDateTime(data.updated_at)}). Akses
            mengikuti izin berbagi Google Drive masing-masing akun.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.documents.map((d) => (
          <div key={d.key} className="glass-card !rounded-[28px] p-6 flex flex-col gap-3 min-h-[250px]">
            <div className="flex items-start justify-between gap-2">
              <span className={`w-11 h-11 rounded-2xl text-on-ink flex items-center justify-center ${d.type === 'sheets' ? 'bg-success-solid' : 'bg-primary'}`}>
                <DocIcon type={d.type} />
              </span>
              <span className="flex flex-wrap gap-1 justify-end">
                {d.status && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass(d.status)}`}>{d.status}</span>}
                {d.data_status && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass(d.data_status)}`}>{d.data_status}</span>
                )}
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-fg leading-snug">{d.title}</h2>
              {d.doc_no && <p className="text-[11px] font-mono text-fg-3">{d.doc_no}</p>}
            </div>
            <dl className="text-xs text-fg-2 space-y-0.5">
              {d.pic && <div><dt className="inline">PIC: </dt><dd className="inline text-fg">{d.pic}</dd></div>}
              {d.target_folder && <div><dt className="inline">Folder: </dt><dd className="inline font-mono">{d.target_folder}</dd></div>}
              {d.tabs && <div><dt className="inline">Tab: </dt><dd className="inline">{d.tabs.join(', ')}</dd></div>}
              {d.repo_snapshot && <div><dt className="inline">Snapshot repo: </dt><dd className="inline font-mono">{d.repo_snapshot}</dd></div>}
              {d.section_owners && (
                <div><dt className="inline">Bagian: </dt><dd className="inline">{Object.keys(d.section_owners).length} bagian dengan pengerja &amp; reviewer</dd></div>
              )}
              {d.note && <div className="text-fg-3">{d.note}</div>}
            </dl>
            {d.tab_links && d.tab_links.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {d.tab_links.map((t) => (
                  <a
                    key={t.url}
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-full bg-surface border border-line text-[11px] font-semibold text-fg-2 hover:text-primary hover:border-primary transition-colors"
                  >
                    {t.title}
                  </a>
                ))}
              </div>
            )}
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="mt-auto w-full min-h-[44px] rounded-full border border-line-strong bg-surface text-sm font-semibold text-primary inline-flex items-center justify-center gap-1.5 hover:shadow-cockpit-card transition-all"
            >
              Buka di Google {d.type === 'sheets' ? 'Sheets' : d.type === 'slides' ? 'Slides' : 'Docs'} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      {groups.length > 0 && (
        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
            <h2 className="font-heading text-2xl font-normal text-fg">Berkas Drive</h2>
            {archivedCount > 0 && (
              <label className="inline-flex items-center gap-2 text-xs text-fg-3 cursor-pointer select-none">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Tampilkan arsip ({archivedCount})
              </label>
            )}
          </div>
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.name}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3 mb-2">{g.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {g.files.map((f) => (
                    <a
                      key={f.key}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      title={f.note}
                      className={`min-h-[56px] px-4 py-2.5 rounded-[18px] bg-surface hover:shadow-cockpit-card flex items-start gap-3 transition-all ${f.archived ? 'opacity-60' : ''}`}
                    >
                      <span className="mt-0.5 shrink-0 text-primary">{f.archived ? <Archive className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-fg">{f.title}</span>
                          <span className="shrink-0 px-1.5 rounded text-[9px] font-bold border border-line text-fg-3">{extOf(f.title)}</span>
                        </span>
                        {f.note && <span className="block text-[11px] leading-snug text-fg-3 line-clamp-2">{f.note}</span>}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 text-fg-3" />
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-4 sm:p-6">
        <h2 className="font-heading text-2xl font-normal text-fg mb-4 flex flex-wrap items-baseline gap-3">
          Folder Google Drive
          <a href={data.drive.root.url} target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-3 hover:text-primary">
            {data.drive.root.title}
          </a>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          {data.drive.folders.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="min-h-[48px] px-4 py-2 rounded-[18px] bg-surface hover:shadow-cockpit-card flex items-center gap-2.5 text-xs font-semibold text-fg transition-all"
            >
              <FolderOpen className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{f.title}</span>
            </a>
          ))}
        </div>
        {data.drive.folders_pending.length > 0 && (
          <p className="mt-3 text-[11px] text-warm">Folder belum dibuat: {data.drive.folders_pending.join(', ')}</p>
        )}
      </div>
    </div>
  );
};
