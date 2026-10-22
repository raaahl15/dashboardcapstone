import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import {
  Plus,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  Check,
  FileCheck2,
  BookOpen,
} from 'lucide-react';

export const WeeklyMoMView: React.FC = () => {
  const {
    slideDecks,
    addSlideDeck,
    deleteSlideDeck,
    trackerActions,
    addTrackerAction,
    toggleTrackerActionStatus,
    deleteTrackerAction,
    meetingLogs,
    addMeetingLog,
    deleteMeetingLog,
    users,
    isPM,
  } = useApp();

  // Modals
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [newDeckWeek, setNewDeckWeek] = useState(5);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckPresenter, setNewDeckPresenter] = useState('user-rahul');
  const [newDeckUrl, setNewDeckUrl] = useState('');

  const [showActionModal, setShowActionModal] = useState(false);
  const [newActionWeek, setNewActionWeek] = useState('W5');
  const [newActionIssue, setNewActionIssue] = useState('');
  const [newActionPic, setNewActionPic] = useState('user-ihsan');
  const [newActionDeadline, setNewActionDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  const [showMomModal, setShowMomModal] = useState(false);
  const [newMomWeek, setNewMomWeek] = useState(5);
  const [newMomDate, setNewMomDate] = useState(() => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[now.getDay()];
    const formatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${dayName}, ${formatted} - ${hours}:${minutes} WIB`;
  });
  const [newMomLocation] = useState('Ruang Asistensi DTNTF');
  const [newMomTopic, setNewMomTopic] = useState('');
  const [newMomSummary, setNewMomSummary] = useState('');

  const activeActionsCount = trackerActions.filter((a) => a.progress === 'In Progress').length;

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    addSlideDeck({
      week: newDeckWeek,
      weekLabel: `Week ${newDeckWeek}`,
      title: newDeckTitle,
      presenter: newDeckPresenter,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      url: newDeckUrl || 'https://drive.google.com/presentation/d/new-deck',
    });
    setNewDeckTitle('');
    setShowDeckModal(false);
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionIssue.trim()) return;

    addTrackerAction({
      week: newActionWeek,
      issue: newActionIssue,
      pic: newActionPic,
      picCode: newActionPic,
      deadline: newActionDeadline,
      progress: 'In Progress',
    });
    setNewActionIssue('');
    setShowActionModal(false);
  };

  const handleCreateMom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomTopic.trim()) return;

    addMeetingLog({
      week: newMomWeek,
      weekLabel: `Week ${newMomWeek}`,
      dayText: newMomDate,
      location: newMomLocation,
      evaluator: 'Dosen Pembimbing (Dr. Ir. Chemical Eng)',
      presenceRatio: `${users.length}/${users.length} Hadir`,
      presentMembers: users.map((u) => u.id),
      topic: newMomTopic,
      summary: newMomSummary,
    });
    setNewMomTopic('');
    setNewMomSummary('');
    setShowMomModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* TOP ZONE: Heading, description, and MoM actions */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          Manage Your Progres!
        </h1>

        <div className="space-y-2.5">
          <div className="glass-faint w-full px-4 py-2.5 flex items-center">
            <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33]">
              Repositori materi presentasi asistensi mingguan, pelacak komitmen tindakan korektif, dan logbook asistensi DTNTF.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-8 px-3.5 rounded-full bg-[#0B1B33] text-white text-[12px] font-medium tracking-normal inline-flex items-center">
              FEED ASISTENSI &amp; EVALUASI
            </span>
            <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold tracking-normal inline-flex items-center">
              Semester Gasal 2026/2027
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORMAT SLIDE DECK BANNER (15 MENIT) */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0062CC]" />
            <h3 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33]">
              Format Slide Deck (15 menit)
            </h3>
          </div>
          <span className="px-3 py-1 bg-white/70 text-[#0062CC] rounded-full text-[10px] font-bold flex items-center gap-1 border border-white">
            <FileCheck2 className="w-3 h-3" /> Pedoman Asistensi Departemen
          </span>
        </div>

        {/* 2-Segment Progress Visualizer */}
        <div className="w-full h-8 rounded-full overflow-hidden flex text-white text-[11px] font-bold shadow-xs">
          <div className="w-[66.7%] bg-[#0062CC] flex items-center justify-center px-3 tracking-wide">
            10 menit - Pemaparan Teknis
          </div>
          <div className="w-[33.3%] bg-[#0B1B33] bg-hatch-pattern flex items-center justify-center px-3 tracking-wide">
            5 menit - Diskusi &amp; Q&amp;A Dosen
          </div>
        </div>

        <div className="text-[11px] text-[#4A5A72] flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-[#0B1B33]">Struktur Wajib:</span>
          <span>Slide 1 Status Capaian</span>
          <span>•</span>
          <span>Slide 2-3 Kepatuhan Standar ISA/ISO &amp; Termal</span>
          <span>•</span>
          <span>Slide 4 Hambatan Rekayasa</span>
          <span>•</span>
          <span>Slide 5 Rencana Mingguan</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN CONTENT: Slide Decks (Left) & Tracker/MoM (Right) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================== LEFT: Your Slide Deck (4 cols) ==================== */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-heading font-bold text-base text-[#0B1B33]">
                Your Slide Deck
              </h2>
              <p className="text-xs text-[#4A5A72]">
                Materi tayang kompilasi tim
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/70 text-[#0062CC]">
              {slideDecks.length} Berkas Terarsip
            </span>
            {isPM && (
              <button
                type="button"
                onClick={() => setShowDeckModal(true)}
                className="min-h-[44px] px-4 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Slide Deck
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {slideDecks.map((deck) => (
              <div
                key={deck.id}
                className="p-4 rounded-2xl bg-white/70 border border-white/80 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/70 text-[#0062CC]">
                    {deck.weekLabel}
                  </span>
                  <span className="text-[11px] text-[#4A5A72] font-medium">
                    {deck.date}
                  </span>
                </div>

                <h4 className="font-heading font-bold text-xs text-[#0B1B33] mb-3 leading-snug">
                  {deck.title}
                </h4>

                <div className="flex items-center justify-between pt-2 border-t border-white/80">
                  <UserChip
                    uid={deck.presenter || deck.presenterCode}
                    variant="avatar-nama-jabatan"
                    size="sm"
                    useNickname
                    avatarClassName="w-7 h-7 rounded-full font-heading font-bold text-[10px]"
                    nameClassName="!text-[11px] !font-bold !text-[#0B1B33]"
                    titleClassName="!text-[9px] !text-[#4A5A72]"
                  />

                  <div className="flex items-center gap-1.5">
                    {isPM && (
                      <button
                        type="button"
                        onClick={() => deleteSlideDeck(deck.id)}
                        className="p-1 text-[#4A5A72] hover:text-[#B91C1C]"
                        title="Hapus Slide Deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <a
                      href={deck.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white/70 hover:bg-[#0062CC] hover:text-white text-[#0062CC] rounded-full text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      Buka <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== RIGHT: Tracker Action & Meeting Log (8 cols) ==================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tracker Action Table */}
          <div className="glass-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-base text-[#0B1B33]">
                    Tracker Action
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    {activeActionsCount} Active
                  </span>
                </div>
                <p className="text-xs text-[#4A5A72]">
                  Daftar tindak lanjut hasil masukan &amp; koreksi dosen pembimbing
                </p>
              </div>

              {isPM && (
                <button
                  type="button"
                  onClick={() => setShowActionModal(true)}
                  className="min-h-[44px] px-4 bg-white/70 hover:bg-white text-[#0B1B33] rounded-full text-xs font-bold border border-white flex items-center gap-1 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0062CC]" />
                  Tambah Baris
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/80 bg-white/60">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-white/80 bg-white/70 text-[10px] font-heading font-bold text-[#4A5A72]">
                    <th className="p-3">ID Action</th>
                    <th className="p-3">Week</th>
                    <th className="p-3">Kendala dan Masukan Dosen</th>
                    <th className="p-3">Action PIC</th>
                    <th className="p-3">Tenggat</th>
                    <th className="p-3 text-center">Progres</th>
                    {isPM && <th className="p-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/80 text-xs">
                  {trackerActions.map((act) => (
                    <tr key={act.id} className="hover:bg-white/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#0062CC]">
                        {act.code}
                      </td>
                      <td className="p-3 font-bold text-[#0B1B33]">
                        {act.week}
                      </td>
                      <td className="p-3 max-w-[240px] text-xs text-[#0B1B33] font-medium leading-relaxed">
                        {act.issue}
                      </td>
                      <td className="p-3">
                        <UserChip
                          uid={act.pic || act.picCode || act.picName}
                          variant="avatar-nama"
                          size="xs"
                          useNickname
                          avatarClassName="w-5 h-5 rounded-full text-[10px]"
                          nameClassName="!text-xs !font-semibold !text-[#0B1B33]"
                        />
                      </td>
                      <td className="p-3 text-xs text-[#4A5A72]">
                        {act.deadline}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleTrackerActionStatus(act.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                            act.progress === 'Resolved'
                              ? 'bg-[#D1FAE5] text-[#065F46]'
                              : 'bg-[#FEF3C7] text-[#92400E]'
                          }`}
                          title="Klik untuk mengubah status (Resolved / In Progress)"
                        >
                          {act.progress === 'Resolved' ? (
                            <Check className="w-3 h-3 text-[#047857]" />
                          ) : (
                            <Clock className="w-3 h-3 text-[#B45309]" />
                          )}
                          {act.progress}
                        </button>
                      </td>
                      {isPM && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteTrackerAction(act.id)}
                            className="text-[#4A5A72] hover:text-[#B91C1C]"
                            title="Hapus Baris Action"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Meeting Log Feed */}
          <div className="glass-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-base text-[#0B1B33]">
                  Meeting Log
                </h2>
                <p className="text-xs text-[#4A5A72]">
                  Catatan resmi asistensi dan arahan teknis evaluasi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#4A5A72] font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0062CC]" /> Semester Gasal 2026/2027
                </span>
                {isPM && (
                  <button
                    type="button"
                    onClick={() => setShowMomModal(true)}
                    className="min-h-[44px] px-4 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add MoM
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {meetingLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 rounded-2xl bg-white/70 border border-white/80 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0062CC] text-white">
                        {log.weekLabel}
                      </span>
                      <span className="text-xs font-semibold text-[#0B1B33] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0062CC]" /> {log.dayText}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#4A5A72] flex items-center gap-1">
                        {log.location}
                      </span>
                      {isPM && (
                        <button
                          type="button"
                          onClick={() => deleteMeetingLog(log.id)}
                          className="min-h-[44px] min-w-[44px] rounded-full text-[#4A5A72] hover:bg-[#FEE2E2] hover:text-[#B91C1C] flex items-center justify-center transition-colors"
                          title="Hapus catatan MoM"
                          aria-label={`Hapus MoM ${log.weekLabel}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-y border-white/80 py-2">
                    <span className="text-[#4A5A72]">
                      Dosen Evaluator: <strong className="text-[#0B1B33]">{log.evaluator}</strong>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {log.presentMembers.map((memberRef, idx) => (
                          <UserChip
                            key={`${log.id}-${memberRef}-${idx}`}
                            uid={memberRef}
                            variant="avatar-nama"
                            size="xs"
                            useNickname
                            nameClassName="!text-[10px] !font-semibold !text-[#4A5A72]"
                          />
                        ))}
                      </div>
                      <span className="px-2 py-0.5 bg-[#D1FAE5] text-[#065F46] font-bold rounded-full text-[10px]">
                        {log.presenceRatio}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33]">
                      {log.topic}
                    </h4>
                    <p className="text-xs text-[#4A5A72] leading-relaxed">
                      {log.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: Add Slide Deck & Add Action Item & Add MoM */}
      {/* ========================================================================= */}
      {showDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Slide Deck Asistensi
            </h3>
            <form onSubmit={handleCreateDeck} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Minggu</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={newDeckWeek}
                    onChange={(e) => setNewDeckWeek(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Presenter</label>
                  <select
                    value={newDeckPresenter}
                    onChange={(e) => setNewDeckPresenter(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname} — {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Judul Presentasi</label>
                <input
                  type="text"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="Contoh: Slide Deck Week 5: FDS & Interlock"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tautan Drive (URL)</label>
                <input
                  type="url"
                  value={newDeckUrl}
                  onChange={(e) => setNewDeckUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeckModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Action Item Asistensi
            </h3>
            <form onSubmit={handleCreateAction} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Sesi Asistensi</label>
                  <input
                    type="text"
                    value={newActionWeek}
                    onChange={(e) => setNewActionWeek(e.target.value)}
                    placeholder="W5"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Action PIC</label>
                  <select
                    value={newActionPic}
                    onChange={(e) => setNewActionPic(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} ({u.nickname})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Kendala / Masukan Dosen</label>
                <textarea
                  rows={2}
                  value={newActionIssue}
                  onChange={(e) => setNewActionIssue(e.target.value)}
                  placeholder="Catatan koreksi atau arahan yang harus ditindaklanjuti..."
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tenggat Waktu</label>
                <input
                  type="text"
                  value={newActionDeadline}
                  onChange={(e) => setNewActionDeadline(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Catatan Meeting Log (MoM)
            </h3>
            <form onSubmit={handleCreateMom} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Minggu</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={newMomWeek}
                    onChange={(e) => setNewMomWeek(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Waktu Sesi</label>
                  <input
                    type="text"
                    value={newMomDate}
                    onChange={(e) => setNewMomDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Topik Utama</label>
                <input
                  type="text"
                  value={newMomTopic}
                  onChange={(e) => setNewMomTopic(e.target.value)}
                  placeholder="Topik Utama: Penyelarasan FDS & PFD"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Rangkuman Arahan Teknis</label>
                <textarea
                  rows={3}
                  value={newMomSummary}
                  onChange={(e) => setNewMomSummary(e.target.value)}
                  placeholder="Rangkuman detail arahan dosen evaluator..."
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMomModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan MoM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
