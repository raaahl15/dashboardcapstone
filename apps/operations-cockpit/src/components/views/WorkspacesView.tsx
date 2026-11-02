import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import {
  Calendar,
  Layers,
  Upload,
  ExternalLink,
  Pencil,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DeliverableItem } from '../../types';

export const WorkspacesView: React.FC = () => {
  const {
    deliverables,
    updateDeliverable,
    isPM,
  } = useApp();

  const [selectedItem, setSelectedItem] = useState<DeliverableItem | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<'Draft' | 'In Review Pembimbing' | 'ACC Final' | 'Aktif'>('Draft');
  const [editUrl, setEditUrl] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDeliverableId, setUploadDeliverableId] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');

  const openEditModal = (item: DeliverableItem) => {
    setSelectedItem(item);
    setEditProgress(item.progress);
    setEditStatus(item.status as 'Draft' | 'In Review Pembimbing' | 'ACC Final' | 'Aktif');
    setEditUrl(item.fileUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    updateDeliverable(selectedItem.id, {
      progress: Number(editProgress),
      status: editStatus,
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
      {/* ========================================================================= */}
      {/* TOP ZONE: Heading, description, and workspace summary */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          Work-In-Progress Deliverables
        </h1>

        <div className="space-y-2.5">
          <div className="glass-faint w-full px-4 py-2.5 flex items-center">
            <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33]">
              Repositori draf FEED/DED Area 1 • Status verifikasi disiplin proses &amp; instrumentasi
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-[#0B1B33] text-white text-[12px] font-medium tracking-normal inline-flex items-center">
                WORKSPACES • FEED/DED AREA 1
              </span>
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0B1B33] text-[12px] font-medium tracking-normal inline-flex items-center">
                STATUS VERIFIKASI
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold inline-flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> 6 Core Deliverables
              </span>
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold inline-flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Target Tender: 15 Des 2026
              </span>
              {isPM && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="min-h-[44px] px-4 py-2 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Berkas Baru
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN X 3-ROW GRID OF 6 DELIVERABLES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deliverables.map((item) => (
          <div
            key={item.id}
            className="glass-card p-6 flex flex-col justify-between hover:shadow-cockpit-pop transition-all space-y-4"
          >
            <div>
              {/* Card Header: Title & Progress */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-xl bg-white/70 text-[#0062CC] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#0B1B33]">
                    {item.title}
                  </h3>
                  {isPM && (
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#4A5A72] hover:text-[#0062CC] rounded-full hover:bg-black/5 transition-colors"
                      title="Edit Progres & Status"
                      aria-label={`Edit Progres & Status ${item.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-heading text-base font-extrabold text-[#0B1B33] tabular-nums">
                    Progres: {item.progress}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#DCEBF7] overflow-hidden my-3">
                <div
                  className="h-full bg-[#007BFF] rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#4A5A72] leading-relaxed">
                {item.subtitle}
              </p>

            </div>

            {/* Bottom Row: Status Badge & Open Button */}
            <div className="pt-3 border-t border-white/80 flex items-center justify-between">
              <div>
                {item.status === 'In Review Pembimbing' ? (
                  <span className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#B45309]" />
                    IN REVIEW PEMBIMBING
                  </span>
                ) : item.status === 'ACC Final' ? (
                  <span className="px-3 py-1 bg-[#D1FAE5] text-[#065F46] rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                    ACC FINAL
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#E2E8F0] text-[#334155] rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-[#4A5A72]" />
                    DRAFT
                  </span>
                )}
              </div>

              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                Lihat <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        ))}
      </div>

      {/* Edit Deliverable Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Perbarui Deliverable: {selectedItem.title}
            </h3>
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Progres Persentase</span>
                  <span className="font-bold text-[#0062CC]">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Status Dokumen</label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(
                      e.target.value as 'Draft' | 'In Review Pembimbing' | 'ACC Final' | 'Aktif'
                    )
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Review Pembimbing">In Review Pembimbing</option>
                  <option value="ACC Final">ACC Final</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tautan Berkas (Drive / Cloud)</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Berkas Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Unggah Tautan Berkas Baru
            </h3>
            <p className="text-xs text-[#4A5A72] mt-1 mb-4">
              Dukungan integrasi dokumen Google Drive, naskah .docx/.pdf, DWSIM .dwxmz, dan lembar CAD P&amp;ID A3.
            </p>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#0B1B33]">
                  Pilih Deliverable Target
                </label>
                <select
                  value={uploadDeliverableId || deliverables[0]?.id || ''}
                  onChange={(e) => setUploadDeliverableId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                placeholder="Catatan Revisi / Judul Berkas (opsional)"
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
              />
              <input
                type="url"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="URL Berkas Google Drive / Cloud (https://...)"
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
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
