import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Layers, Upload, ExternalLink, Pencil, FileText, AlertTriangle } from 'lucide-react';
import { DeliverableItem } from '../../types';
import {
  DOC_STATUSES,
  DocStatus,
  STATUS_NEEDS_EVIDENCE,
  STATUS_PILL,
  STATUS_PROGRESS,
  deliverableProgress,
  deliverableStatus,
  isLegacyStatus,
} from '../../utils/docStatus';

/**
 * Workspaces & Deliverables. Status memakai siklus baku Blueprint §1.4 dan progres dihitung dari
 * status (bobot di utils/docStatus.ts), bukan diisi manual (P1 audit Fase 4, LOG-030).
 */
export const WorkspacesView: React.FC = () => {
  const { deliverables, updateDeliverable, isPM, config } = useApp();

  const [selectedItem, setSelectedItem] = useState<DeliverableItem | null>(null);
  const [editStatus, setEditStatus] = useState<DocStatus>('Draft');
  const [editEvidence, setEditEvidence] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDeliverableId, setUploadDeliverableId] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');

  const needsEvidence = STATUS_NEEDS_EVIDENCE.includes(editStatus);
  const legacyCount = deliverables.filter((d) => isLegacyStatus(d.status)).length;

  const openEditModal = (item: DeliverableItem) => {
    setSelectedItem(item);
    setEditStatus(deliverableStatus(item));
    setEditEvidence(item.reviewEvidence ?? '');
    setEditUrl(item.fileUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (needsEvidence && !editEvidence.trim()) return;

    updateDeliverable(selectedItem.id, {
      status: editStatus,
      // progress tetap ditulis (dipakai validasi impor/ekspor JSON), nilainya mengikuti status
      progress: STATUS_PROGRESS[editStatus],
      reviewEvidence: editEvidence.trim(),
      fileUrl: editUrl,
    });
    setSelectedItem(null);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = uploadDeliverableId || deliverables[0]?.id;
    if (!targetId || !uploadUrl.trim()) return;

    updateDeliverable(targetId, {
      fileUrl: uploadUrl.trim(),
      ...(uploadTitle.trim() ? { badgeNote: uploadTitle.trim() } : {}),
    });
    setUploadTitle('');
    setUploadUrl('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Siklus status (Blueprint §1.4) dengan jumlah per status */}
      <div className="glass-card !rounded-full px-4 py-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3 mr-1">Siklus status</span>
        {(['Draft', 'WIP', 'Review Internal', 'Diajukan', 'ACC Pembimbing'] as DocStatus[]).map((st, i) => {
          const n = deliverables.filter((d) => deliverableStatus(d) === st).length;
          return (
            <React.Fragment key={st}>
              {i > 0 && <span className="text-fg-3" aria-hidden="true">→</span>}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  st === 'Diajukan' && n > 0
                    ? 'bg-primary text-on-primary'
                    : st === 'ACC Pembimbing'
                    ? 'bg-success-soft text-success'
                    : st === 'Review Internal'
                    ? 'border border-line-strong text-fg-2'
                    : 'bg-primary-soft text-fg-2'
                }`}
              >
                {st === 'Review Internal' ? 'Review internal' : st === 'ACC Pembimbing' ? 'ACC pembimbing' : st} · {n}
              </span>
            </React.Fragment>
          );
        })}
        {deliverables.some((d) => deliverableStatus(d) === 'Revisi') && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-danger-soft text-danger">
            Revisi · {deliverables.filter((d) => deliverableStatus(d) === 'Revisi').length}
          </span>
        )}
        <span className="ml-auto text-xs text-fg-3">Diajukan / ACC / Revisi wajib bukti (kode WO atau MoM) · tenggat {config.tenderDeadline}</span>
        {isPM && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="min-h-[36px] px-3.5 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Perbarui tautan
          </button>
        )}
      </div>

      {isPM && legacyCount > 0 && (
        <div className="max-w-4xl flex items-start gap-2 text-xs text-warm" role="status">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {legacyCount} deliverable masih tersimpan dengan status lama (mis. "ACC Final"/"In Review Pembimbing"). Tampilan sudah
            memetakan ke status baku; buka Edit lalu Simpan agar nilai baru tersimpan. "ACC Final" dipetakan ke Diajukan karena
            data lama tidak punya bukti ACC.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deliverables.map((item) => {
          const status = deliverableStatus(item);
          const progress = deliverableProgress(item);
          const critical = !!item.badgeNote && progress === 0;
          return (
            <div
              key={item.id}
              className={`glass-card !rounded-[28px] p-6 min-h-[260px] flex flex-col gap-2 hover:shadow-cockpit-pop transition-all ${
                critical ? '!border-warm-solid' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${critical ? 'bg-warm-soft text-warm' : STATUS_PILL[status]}`}>
                  {status}
                  {critical ? ' · jalur kritis' : ''}
                  {isLegacyStatus(item.status) && <span className="normal-case font-medium"> (dari "{item.status}")</span>}
                </span>
                <span className="font-heading text-4xl font-light text-fg tabular-nums leading-none">{progress}%</span>
              </div>
              <div className="flex items-start gap-1">
                <h3 className="text-base font-semibold text-fg leading-snug flex-1">{item.title}</h3>
                {isPM && (
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="w-9 h-9 -mt-1 shrink-0 flex items-center justify-center text-fg-3 hover:text-primary rounded-full hover:bg-muted"
                    title="Ubah status & tautan"
                    aria-label={`Ubah status dan tautan ${item.title}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-fg-2 line-clamp-4">{item.subtitle}</p>
              {item.badgeNote && <p className="text-xs text-warm">{item.badgeNote}</p>}
              <div className="mt-auto pt-3 space-y-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-[11px] font-medium text-fg-2 truncate">
                    {item.reviewEvidence ? `Bukti: ${item.reviewEvidence}` : 'Belum ada bukti'}
                  </span>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Buka <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Deliverable Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-deliverable-title"
          >
            <h3
              id="edit-deliverable-title"
              className="font-heading font-bold text-sm text-fg pb-3 border-b border-line"
            >
              Perbarui Deliverable: {selectedItem.title}
            </h3>
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="deliv-status" className="block text-xs font-semibold mb-1">
                  Status Dokumen (Blueprint §1.4)
                </label>
                <select
                  id="deliv-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DocStatus)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                >
                  {DOC_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s} — progres {STATUS_PROGRESS[s]}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="deliv-evidence" className="block text-xs font-semibold mb-1">
                  Bukti {needsEvidence ? '(wajib)' : '(opsional)'}
                </label>
                <input
                  id="deliv-evidence"
                  type="text"
                  value={editEvidence}
                  onChange={(e) => setEditEvidence(e.target.value)}
                  placeholder={
                    editStatus === 'ACC Pembimbing' || editStatus === 'Revisi'
                      ? 'Referensi MoM, mis. MoM Week 9 – 3 Nov 2026'
                      : 'Kode WO + tanggal pengajuan, mis. WO-012, 4 Nov 2026'
                  }
                  required={needsEvidence}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div>
                <label htmlFor="deliv-url" className="block text-xs font-semibold mb-1">
                  Tautan Berkas (Drive / Docs)
                </label>
                <input
                  id="deliv-url"
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button type="submit" className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Perbarui Tautan Berkas Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-link-title"
          >
            <h3
              id="upload-link-title"
              className="font-heading font-bold text-sm text-fg pb-3 border-b border-line"
            >
              Perbarui Tautan Berkas
            </h3>
            <p className="text-xs text-fg-3 mt-1 mb-4">
              Tempel tautan Google Docs/Drive dari modul G-Workspace. File biner (CAD, PDF) tetap disimpan di Drive.
            </p>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label htmlFor="upload-target" className="block text-xs font-semibold mb-1 text-fg">
                  Pilih Deliverable Target
                </label>
                <select
                  id="upload-target"
                  value={uploadDeliverableId || deliverables[0]?.id || ''}
                  onChange={(e) => setUploadDeliverableId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                >
                  {deliverables.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Catatan singkat (opsional)"
                aria-label="Catatan singkat"
                className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
              />
              <input
                type="url"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="URL Google Docs / Drive (https://...)"
                aria-label="URL berkas"
                className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button type="submit" className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full">
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
