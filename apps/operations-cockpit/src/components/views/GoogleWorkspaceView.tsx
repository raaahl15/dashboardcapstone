import React from 'react';
import { FolderOpen, FileSpreadsheet, FileText, ExternalLink, Presentation } from 'lucide-react';
import { useStaticData, fmtDateTime, statusClass } from '../../utils/staticData';

interface Folder {
  key: string;
  title: string;
  id: string;
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
  tabs?: string[];
  repo_snapshot?: string;
  repo_companion?: string;
  section_owners?: Record<string, string>;
  section_reviewers?: Record<string, string>;
}
interface Registry {
  updated_at: string;
  drive: { root: Folder; folders: Folder[]; folders_pending: string[] };
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

export const GoogleWorkspaceView: React.FC = () => {
  const { data, error, loading } = useStaticData<Registry>('google_workspace_registry.json');

  if (loading) return <div className="py-20 text-center text-xs text-fg-3">Memuat registry...</div>;
  if (error || !data) return <div className="glass-card p-6 text-sm text-danger">{error ?? 'Registry tidak tersedia.'}</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-fg">
          Google Workspace
        </h1>
        <div className="glass-faint w-full px-4 py-2.5">
          <p className="text-xs sm:text-[13.5px] leading-snug text-fg">
            Tautan master dokumen kolaborasi (Sheets/Docs) dan folder Drive proyek, dari{' '}
            <span className="font-mono">google_workspace_registry.json</span> (diperbarui {fmtDateTime(data.updated_at)}). Akses
            mengikuti izin berbagi Google Drive masing-masing akun.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.documents.map((d) => (
          <a
            key={d.key}
            href={d.url}
            target="_blank"
            rel="noreferrer"
            className="glass-card p-5 flex flex-col gap-3 hover:shadow-cockpit-pop transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="w-10 h-10 rounded-2xl bg-surface/70 text-primary flex items-center justify-center shadow-xs">
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
              <h2 className="font-heading font-bold text-sm text-fg">{d.title}</h2>
              {d.doc_no && <p className="text-[11px] font-mono text-fg-3">{d.doc_no}</p>}
            </div>
            <dl className="text-[11px] text-fg-3 space-y-0.5">
              {d.pic && <div><dt className="inline">PIC: </dt><dd className="inline text-fg">{d.pic}</dd></div>}
              {d.target_folder && <div><dt className="inline">Folder: </dt><dd className="inline font-mono">{d.target_folder}</dd></div>}
              {d.tabs && <div><dt className="inline">Tab: </dt><dd className="inline">{d.tabs.join(', ')}</dd></div>}
              {d.repo_snapshot && <div><dt className="inline">Snapshot repo: </dt><dd className="inline font-mono">{d.repo_snapshot}</dd></div>}
              {d.section_owners && (
                <div><dt className="inline">Bagian: </dt><dd className="inline">{Object.keys(d.section_owners).length} bagian dengan pengerja &amp; reviewer</dd></div>
              )}
            </dl>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <ExternalLink className="w-3.5 h-3.5" /> Buka di Google {d.type === 'sheets' ? 'Sheets' : d.type === 'slides' ? 'Slides' : 'Docs'}
            </span>
          </a>
        ))}
      </div>

      <div className="glass-card p-4 sm:p-6">
        <h2 className="font-heading font-bold text-base sm:text-lg text-fg mb-3">Folder Google Drive</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          {[data.drive.root, ...data.drive.folders].map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-surface/80 border border-glass-stroke hover:bg-surface flex items-center gap-2 text-xs font-semibold text-fg"
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
