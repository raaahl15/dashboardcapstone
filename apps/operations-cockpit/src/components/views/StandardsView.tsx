import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  FileText,
  ShieldCheck,
  ExternalLink,
  Plus,
  Trash2,
  Pencil, X } from 'lucide-react';

export const StandardsView: React.FC = () => {
  const {
    regulations,
    updateRegulation,
    standards,
    addStandard,
    updateStandard,
    deleteStandard,
    isPM,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRegulationId, setEditingRegulationId] = useState<string | null>(null);
  const [regulationTitle, setRegulationTitle] = useState('');
  const [regulationSubtitle, setRegulationSubtitle] = useState('');
  const [regulationBadge, setRegulationBadge] = useState('');
  const [regulationUrl, setRegulationUrl] = useState('');
  const [editingStandardId, setEditingStandardId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newSubCode, setNewSubCode] = useState('ISA');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const openEditRegulationModal = (regulation: (typeof regulations)[number]) => {
    setEditingRegulationId(regulation.id);
    setRegulationTitle(regulation.title);
    setRegulationSubtitle(regulation.subtitle);
    setRegulationBadge(regulation.badge);
    setRegulationUrl(regulation.url === '#' ? '' : regulation.url);
  };

  const handleSaveRegulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegulationId || !regulationTitle.trim()) return;

    const original = regulations.find((reg) => reg.id === editingRegulationId);
    if (!original) return;

    updateRegulation(editingRegulationId, {
      title: regulationTitle.trim(),
      subtitle: regulationSubtitle.trim(),
      badge: regulationBadge.trim(),
      url: regulationUrl.trim() || original.url,
    });
    setEditingRegulationId(null);
  };

  const openAddModal = () => {
    setEditingStandardId(null);
    setNewCode('');
    setNewSubCode('ISA');
    setNewTitle('');
    setNewSubtitle('');
    setNewUrl('');
    setShowAddModal(true);
  };

  const openEditModal = (standard: (typeof standards)[number]) => {
    setEditingStandardId(standard.id);
    setNewCode(standard.code);
    setNewSubCode(standard.subCode);
    setNewTitle(standard.title);
    setNewSubtitle(standard.subtitle);
    setNewUrl(standard.url === '#' ? '' : standard.url);
    setShowAddModal(true);
  };

  const handleSaveStandard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;

    const standardData = {
      code: newCode.trim(),
      subCode: newSubCode.trim(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      url:
        newUrl.trim() ||
        (editingStandardId
          ? standards.find((standard) => standard.id === editingStandardId)?.url || '#'
          : 'https://www.iso.org'),
    };

    if (editingStandardId) {
      updateStandard(editingStandardId, standardData);
    } else {
      addStandard({
        ...standardData,
        subtitle: standardData.subtitle || 'Standar kepatuhan perancangan proses',
      });
    }

    setNewCode('');
    setNewSubCode('ISA');
    setNewTitle('');
    setNewSubtitle('');
    setNewUrl('');
    setEditingStandardId(null);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Regulasi utama · Capstone DTNTF</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {regulations.map((reg, i) => (
          <div
            key={reg.id}
            className={`rounded-[28px] p-6 flex flex-col gap-1.5 min-h-[150px] transition-all ${
              i === 0 ? 'bg-hero shadow-cockpit-pop' : 'glass-card hover:shadow-cockpit-pop'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-lg font-semibold leading-snug ${i === 0 ? '' : 'text-fg'}`}>{reg.title}</h3>
              {isPM && (
                <button
                  type="button"
                  onClick={() => openEditRegulationModal(reg)}
                  aria-label={`Edit regulasi ${reg.title}`}
                  title="Edit regulasi"
                  className={`w-9 h-9 -mt-1 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    i === 0 ? 'text-on-ink-2 hover:bg-white/15' : 'text-fg-3 hover:bg-muted hover:text-primary'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className={`text-sm ${i === 0 ? 'text-on-ink-2' : 'text-fg-2'}`}>{reg.subtitle}</p>
            <p className={`text-xs ${i === 0 ? 'text-on-ink-2' : 'text-fg-3'}`}>{reg.badge}</p>
            <a
              href={reg.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-auto pt-2 text-sm font-semibold inline-flex items-center gap-1 hover:underline ${i === 0 ? '' : 'text-primary'}`}
            >
              Buka <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">
          Standar industri · desain rekayasa kimia &amp; instrumentasi · {standards.length} standar
        </p>
        {isPM && (
          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[40px] px-4 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah standar
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {standards.map((std) => (
          <div key={std.id} className="glass-card !rounded-[28px] p-5 min-h-[220px] flex flex-col gap-2 hover:shadow-cockpit-pop transition-all">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-fg-2 text-[11px] font-semibold">{std.subCode}</span>
              {isPM && (
                <span className="flex items-center text-fg-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(std)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted hover:text-primary"
                    title="Edit standar"
                    aria-label={`Edit Standar ${std.subCode} - ${std.title}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStandard(std.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-danger-soft hover:text-danger"
                    title="Hapus standar"
                    aria-label={`Hapus Standar ${std.subCode} - ${std.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
            <h4 className="font-heading text-3xl font-normal text-fg leading-tight">
              {std.title.startsWith(std.subCode + ' ') && std.subCode !== 'ISO' && std.subCode !== 'ISA' && std.subCode !== 'IEC' && std.subCode !== 'API'
                ? std.title.slice(std.subCode.length + 1)
                : std.title}
            </h4>
            <p className="text-sm text-fg-2 leading-snug">{std.subtitle}</p>
            <a
              href={std.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto pt-2 text-sm font-semibold text-primary inline-flex items-center gap-1 hover:underline"
            >
              Buka <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      {/* Edit Regulation Modal */}
      {editingRegulationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Dokumen · standar & regulasi</p>
                <h3 className="v2-modal-title">
              Edit Regulasi Utama
            </h3>
              </div>
              <button type="button" onClick={() => setEditingRegulationId(null)} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveRegulation} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Regulasi</label>
                <input
                  type="text"
                  value={regulationTitle}
                  onChange={(e) => setRegulationTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Narasi / Deskripsi</label>
                <textarea
                  rows={3}
                  value={regulationSubtitle}
                  onChange={(e) => setRegulationSubtitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Badge</label>
                <input
                  type="text"
                  value={regulationBadge}
                  onChange={(e) => setRegulationBadge(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tautan Dokumen (URL)</label>
                <input
                  type="url"
                  value={regulationUrl}
                  onChange={(e) => setRegulationUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => setEditingRegulationId(null)}
                  className="px-4 py-2 text-xs font-semibold text-fg-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Standard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Dokumen · standar & regulasi</p>
                <h3 className="v2-modal-title">
              {editingStandardId ? 'Edit Standar Rujukan' : 'Tambah Standar Rujukan Baru'}
            </h3>
              </div>
              <button type="button" onClick={() => {
                    setShowAddModal(false);
                    setEditingStandardId(null);
                  }} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveStandard} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kode Standar</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Contoh: API 650"
                    className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="Contoh: API / ISO / ISA"
                    className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Judul Dokumen Standar</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Welded Tanks for Oil Storage"
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Cakupan / Deskripsi Singkat</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Spesifikasi tangki atmosferik..."
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tautan Web (URL)</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStandardId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-fg-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  {editingStandardId ? 'Simpan Perubahan' : 'Simpan Standar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
