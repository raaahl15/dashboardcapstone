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
      <div className="space-y-3">

        <div className="space-y-2.5">
          <div className="max-w-4xl">
            <p className="text-[13px] leading-relaxed text-fg-3">
              Status mengikuti siklus baku: Draft → WIP → Review Internal → Diajukan → ACC Pembimbing (atau Revisi).
              Progres dihitung otomatis dari status. Diajukan, ACC Pembimbing, dan Revisi wajib disertai bukti (kode WO /
              referensi MoM).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-surface/70 border border-glass-stroke text-primary text-[12px] font-semibold inline-flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> {deliverables.length} Deliverable
              </span>
              <span className="h-8 px-3.5 rounded-full bg-surface/70 border border-glass-stroke text-primary text-[12px] font-semibold inline-flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Tenggat FEED: {config.tenderDeadline}
              </span>
            </div>

            {isPM && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-full font-heading text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Perbarui Tautan Berkas
              </button>
            )}
          </div>

          {isPM && legacyCount > 0 && (
            <div className="max-w-4xl flex items-start gap-2 text-xs text-warm" role="status">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {legacyCount} deliverable masih tersimpan dengan status lama (mis. "ACC Final"/"In Review Pembimbing").
                Tampilan sudah memetakan ke status baku; buka Edit lalu Simpan agar nilai baru tersimpan. "ACC Final"
                dipetakan ke Diajukan karena data lama tidak punya bukti ACC.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deliverables.map((item) => {
          const status = deliverableStatus(item);
          const progress = deliverableProgress(item);
          return (
            <div
              key={item.id}
              className="glass-card p-6 flex flex-col justify-between hover:shadow-cockpit-pop transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-xl bg-surface/70 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-fg">{item.title}</h3>
                    {isPM && (
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-fg-3 hover:text-primary rounded-full hover:bg-black/5 transition-colors"
                        title="Ubah status & tautan"
                        aria-label={`Ubah status dan tautan ${item.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-heading text-base font-extrabold text-fg tabular-nums">
                      Progres: {progress}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-muted overflow-hidden my-3">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <p className="text-xs text-fg-3 leading-relaxed">{item.subtitle}</p>
                {item.reviewEvidence && (
                  <p className="mt-2 text-[11px] text-fg-2">
                    <span className="font-semibold">Bukti:</span> {item.reviewEvidence}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-glass-stroke flex items-center justify-between gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${STATUS_PILL[status]}`}>
                  {status.toUpperCase()}
                  {isLegacyStatus(item.status) && (
                    <span className="font-medium normal-case"> (dari "{item.status}")</span>
                  )}
                </span>

                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-full font-heading text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  Lihat <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
