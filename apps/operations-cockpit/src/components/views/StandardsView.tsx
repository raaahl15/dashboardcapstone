import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  FileText,
  ShieldCheck,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react';

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
      {/* ========================================================================= */}
      {/* TOP ZONE: Heading, description, and standards summary */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          Standar &amp; Regulasi
        </h1>

        <div className="space-y-2.5">
          <div className="glass-faint w-full px-4 py-2.5 flex items-center">
            <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33]">
              Pedoman kepatuhan regulasi Capstone DTNTF dan direktori standar internasional
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-[#0B1B33] text-white text-[12px] font-medium tracking-normal inline-flex items-center">
                GOVERNANCE &amp; STANDARDISASI
              </span>
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0B1B33] text-[12px] font-medium tracking-normal inline-flex items-center">
                CAPSTONE DTNTF
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold inline-flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" /> 3 Regulasi Utama
              </span>
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold inline-flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> {standards.length} Standar Industri
              </span>
              <span className="h-8 px-3.5 rounded-full bg-[#D1FAE5] border border-white/70 text-[#065F46] text-[12px] font-semibold inline-flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" /> EPC Compliance Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 MASTER REGULATION CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {regulations.map((reg) => (
          <div
            key={reg.id}
            className="glass-card p-6 flex flex-col justify-between hover:shadow-cockpit-pop transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/70 text-[#0062CC] flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  {isPM && (
                    <button
                      type="button"
                      onClick={() => openEditRegulationModal(reg)}
                      aria-label={`Edit regulasi ${reg.title}`}
                      title="Edit Regulasi"
                      className="w-10 h-10 rounded-full text-[#4A5A72] hover:bg-[#EAF6FD] hover:text-[#0062CC] transition-colors flex items-center justify-center"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <a
                    href={reg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buka dokumen ${reg.title}`}
                    className="text-[#4A5A72] hover:text-[#0062CC] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <h3 className="font-heading font-bold text-sm sm:text-base text-[#0B1B33] mb-1.5 leading-snug">
                {reg.title}
              </h3>
              <p className="text-xs text-[#4A5A72] mb-5 leading-relaxed">
                {reg.subtitle}
              </p>
            </div>

            <div>
              <div className="p-2.5 rounded-xl bg-white/50 text-center mb-4 border border-white/80">
                <span className="text-[11px] font-bold text-[#0062CC]">
                  {reg.badge}
                </span>
              </div>

              <a
                href={reg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                Buka <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* STANDARD REFERENCES DIRECTORY */}
      {/* ========================================================================= */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33]">
              Standard References
            </h2>
            <p className="text-xs text-[#4A5A72]">
              Direktori standar desain rekayasa kimia dan instrumentasi proses
            </p>
          </div>

          {isPM && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>

        {/* Standards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {standards.map((std) => (
            <div
              key={std.id}
              className="p-4 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl bg-white/70 text-[#0062CC] font-heading font-extrabold text-[10px] flex items-center justify-center leading-none text-center p-1 border border-white/80">
                    {std.subCode}
                  </span>
                  <div className="flex items-center gap-1 text-[#4A5A72]">
                    {isPM && (
                      <>
                        <button
                          onClick={() => openEditModal(std)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#EAF6FD] hover:text-[#0062CC] transition-colors"
                          title="Edit Standar"
                          aria-label={`Edit Standar ${std.subCode} - ${std.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteStandard(std.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-black/5 hover:text-[#B91C1C] transition-colors"
                          title="Hapus Standar"
                          aria-label={`Hapus Standar ${std.subCode} - ${std.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33] mb-1">
                  {std.title}
                </h4>
                <p className="text-[11px] text-[#4A5A72] leading-snug mb-4">
                  {std.subtitle}
                </p>
              </div>

              <a
                href={std.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-[#F8FAFC] hover:bg-[#EAF6FD] text-[#0062CC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-[#EAF6FD]"
              >
                Buka <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Regulation Modal */}
      {editingRegulationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Edit Regulasi Utama
            </h3>
            <form onSubmit={handleSaveRegulation} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Regulasi</label>
                <input
                  type="text"
                  value={regulationTitle}
                  onChange={(e) => setRegulationTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Narasi / Deskripsi</label>
                <textarea
                  rows={3}
                  value={regulationSubtitle}
                  onChange={(e) => setRegulationSubtitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Badge</label>
                <input
                  type="text"
                  value={regulationBadge}
                  onChange={(e) => setRegulationBadge(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tautan Dokumen (URL)</label>
                <input
                  type="url"
                  value={regulationUrl}
                  onChange={(e) => setRegulationUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRegulationId(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5A72]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              {editingStandardId ? 'Edit Standar Rujukan' : 'Tambah Standar Rujukan Baru'}
            </h3>
            <form onSubmit={handleSaveStandard} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kode Standar</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Contoh: API 650"
                    className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                    className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tautan Web (URL)</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStandardId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5A72]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
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
