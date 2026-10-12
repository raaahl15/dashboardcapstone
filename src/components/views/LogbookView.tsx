import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import {
  Plus,
  AlertTriangle,
  Clock,
  Info,
  Trash2,
  Check,
} from 'lucide-react';

export const LogbookView: React.FC = () => {
  const {
    logbooks,
    addLogbook,
    toggleLogbookVerification,
    deleteLogbook,
    currentUser,
    users,
    getUser,
    verifiedLogbooksCount,
    isPM,
  } = useApp();

  const [filterAuthor, setFilterAuthor] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState('11 Okt 2026');
  const [newDesc, setNewDesc] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newSolution, setNewSolution] = useState('');

  // Filtered logbooks using UID resolution (with legacy fallback)
  const filteredLogbooks = logbooks.filter((log) => {
    if (filterAuthor === 'All') return true;
    const resolvedAuthor = getUser(log.authorId || log.authorName || log.authorCode);
    return resolvedAuthor?.id === filterAuthor;
  });

  // Calculate contribution counts per user UID
  const contributionByUid: Record<string, number> = {};
  users.forEach((u) => {
    contributionByUid[u.id] = 0;
  });

  logbooks.forEach((log) => {
    const resolvedAuthor = getUser(log.authorId || log.authorName || log.authorCode);
    if (resolvedAuthor && contributionByUid[resolvedAuthor.id] !== undefined) {
      contributionByUid[resolvedAuthor.id] += 1;
    }
  });

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    addLogbook({
      date: newDate,
      authorId: currentUser.id,
      workDescription: newDesc.trim(),
      issueSolution: `Kendala: ${newIssue.trim() || 'Tidak ada kendala kritis'}; Solusi: ${
        newSolution.trim() || 'Melanjutkan sesuai jadwal'
      }.`,
    });

    setNewDesc('');
    setNewIssue('');
    setNewSolution('');
    setShowAddModal(false);
  };

  const progressPercent = Math.min(100, Math.round((verifiedLogbooksCount / 12) * 100));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* HEADER COCKPIT BAR */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B1B33]">
            This Is Your Logbook
          </h1>
          <p className="text-xs text-[#4A5A72] mt-1">
            Audit kedisiplinan logbook & pemenuhan kuota 12 entri per unit Area 1 • Capstone K2026 DTNTF
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Logbook
        </button>
      </div>

      {/* ========================================================================= */}
      {/* COMPLIANCE TOP METRIC & FILTER CARD */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Progress to 12 Quota */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-4xl font-extrabold text-[#0B1B33] tabular-nums">
                {verifiedLogbooksCount} / 12
              </span>
              <span className="text-xs font-semibold text-[#4A5A72]">
                Entri Terpenuhi (Target 12)
              </span>
            </div>

            {/* Hatched bar */}
            <div className="w-full h-3.5 rounded-full bg-[#DCEBF7] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-hatch-pattern transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-bold text-[#0062CC] block tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* 24-Hour Rule Alert Box */}
          <div className="lg:col-span-7 p-3.5 rounded-2xl bg-[#FEF3C7]/90 border border-[#B45309]/30 flex items-start gap-2.5 text-xs text-[#92400E]">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold leading-relaxed">
                Pengingat: MoM 7 Okt belum memiliki entri logbook dalam 24 jam.
              </p>
              <p className="text-[11px] text-[#92400E]/80 mt-0.5">
                Pastikan uraian pekerjaan teknis segera didokumentasikan sebelum sesi asistensi berikutnya.
              </p>
            </div>
          </div>
        </div>

        {/* Contribution chips & Filter row */}
        <div className="pt-3 border-t border-[#EAF6FD] flex flex-wrap items-center justify-between gap-4">
          {/* Contribution Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#0B1B33]">KONTRIBUSI UNIT:</span>
            {users.map((u) => (
              <span
                key={u.id}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF6FD] text-[#0062CC] border border-white inline-flex items-center gap-1"
              >
                <span>{u.nickname}:</span>
                <strong>{contributionByUid[u.id] ?? 0}</strong>
              </span>
            ))}
          </div>

          {/* Filter Pencatat Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#0B1B33] mr-1">FILTER PENCATAT:</span>
            <button
              onClick={() => setFilterAuthor('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterAuthor === 'All'
                  ? 'bg-[#0B1B33] text-white shadow-xs'
                  : 'bg-white text-[#4A5A72] border border-[#C9DCEB] hover:bg-[#EAF6FD]'
              }`}
            >
              All
            </button>
            {users.map((u) => {
              const isSelected = filterAuthor === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setFilterAuthor(u.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0B1B33] text-white shadow-xs'
                      : 'bg-white text-[#4A5A72] border border-[#C9DCEB] hover:bg-[#EAF6FD]'
                  }`}
                >
                  {u.nickname}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOGBOOK TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white shadow-cockpit-card space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-[#EAF6FD] bg-white">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#EAF6FD] bg-[#F8FAFC] text-[10px] font-heading font-bold text-[#4A5A72] uppercase tracking-wider">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Pencatat</th>
                <th className="p-3.5">Uraian Pekerjaan</th>
                <th className="p-3.5">Kendala dan Solusi</th>
                <th className="p-3.5 text-center">Paraf Dosen & Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF6FD] text-xs">
              {filteredLogbooks.map((log) => {
                const authorRef = log.authorId || log.authorName || log.authorCode;
                const resolvedAuthor = getUser(authorRef);
                const canDelete = isPM || resolvedAuthor?.id === currentUser.id;

                return (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    {/* Tanggal */}
                    <td className="p-3.5 font-bold text-[#0B1B33] whitespace-nowrap">
                      {log.date}
                    </td>

                    {/* Pencatat (via UserChip) */}
                    <td className="p-3.5 whitespace-nowrap">
                      <UserChip
                        uid={authorRef}
                        variant="avatar-nama-jabatan"
                        size="md"
                        useNickname
                        avatarClassName="w-8 h-8 rounded-full font-heading font-bold text-xs"
                        nameClassName="font-heading !text-xs !font-bold !text-[#0B1B33]"
                        titleClassName="!text-[10px] !text-[#4A5A72]"
                      />
                    </td>

                    {/* Uraian Pekerjaan */}
                    <td className="p-3.5 max-w-[280px] text-[#0B1B33] font-medium leading-relaxed">
                      {log.workDescription}
                    </td>

                    {/* Kendala dan Solusi */}
                    <td className="p-3.5 max-w-[240px] text-[11px] leading-relaxed">
                      <p className="text-[#B45309] font-medium">
                        {log.issueSolution.split(';')[0]}
                      </p>
                      <p className="text-[#047857] font-medium mt-0.5">
                        {log.issueSolution.split(';')[1] || ''}
                      </p>
                    </td>

                    {/* Paraf & Status */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {log.verifiedByLecturer ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#065F46] flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#047857]" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#B45309]" />
                            Belum Diparaf
                          </span>
                        )}

                        {/* Interactive Toggle Switch (PM Only) */}
                        {isPM && (
                          <button
                            type="button"
                            onClick={() => toggleLogbookVerification(log.id)}
                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                              log.verifiedByLecturer ? 'bg-[#0062CC]' : 'bg-[#C9DCEB]'
                            }`}
                            title="Verifikasi Paraf Dosen (Khusus PM)"
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                log.verifiedByLecturer ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="p-3.5 text-center">
                      {canDelete && (
                        <button
                          onClick={() => deleteLogbook(log.id)}
                          className="text-[#4A5A72] hover:text-[#B91C1C] transition-colors"
                          title="Hapus Entri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Notes */}
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-[#4A5A72] border-t border-[#EAF6FD]">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-[#0062CC]" />
            <span>Status Terverifikasi merefleksikan paraf basah di logbook fisik resmi.</span>
          </div>
          <span className="font-semibold text-[#0B1B33]">
            Total {filteredLogbooks.length} entri ditampilkan • Kuota Departemen: 12 Entri Terparaf
          </span>
        </div>
      </div>

      {/* Add Logbook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Entri Logbook Baru
            </h3>
            <form onSubmit={handleCreateEntry} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Tanggal</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <span className="text-xs font-semibold text-[#0B1B33]">Pencatat:</span>
                <UserChip
                  uid={currentUser.id}
                  variant="avatar-nama-jabatan"
                  size="sm"
                  inlineTitle
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Uraian Pekerjaan Teknis
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Deskripsikan pekerjaan rekayasa spesifik (simulasi DWSIM, piping P&ID, ISA/ISO)..."
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Kendala Dihadapi</label>
                <input
                  type="text"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  placeholder="Contoh: Kesulitan penentuan parameter kinetika"
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Solusi / Tindak Lanjut</label>
                <input
                  type="text"
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  placeholder="Contoh: Konfirmasi ke dosen dan gunakan data Smith"
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5A72]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Entri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
