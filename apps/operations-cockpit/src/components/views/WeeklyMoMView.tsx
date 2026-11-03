import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { WhatsAppShareButton } from '../common/WhatsAppShareButton';
import {
  buildMomSummaryPeriodOptions,
  computeMomPeriodWorkOrders,
  computeProjectWeekFromDate,
  findWorkOrderForTrackerAction,
  formatYmdToIndonesian,
  getTodayLocalYmd,
  parseIndonesianDateToYmd,
} from '../../utils/workOrderHelpers';
import { STATUS_BADGE_CONFIG } from '../workorders/WorkOrderBadges';
import {
  Plus,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  Check,
  FileCheck2,
  BookOpen,
  Pencil,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';

export const WeeklyMoMView: React.FC = () => {
  const {
    slideDecks,
    addSlideDeck,
    updateSlideDeck,
    deleteSlideDeck,
    trackerActions,
    addTrackerAction,
    updateTrackerAction,
    toggleTrackerActionStatus,
    deleteTrackerAction,
    meetingLogs,
    addMeetingLog,
    updateMeetingLog,
    deleteMeetingLog,
    getUser,
    users,
    isPM,
    config,
    workOrders,
    setSelectedWorkOrderId,
    openWorkOrderForm,
  } = useApp();

  const todayYmd = getTodayLocalYmd();
  const currentProjectWeek = useMemo(
    () => computeProjectWeekFromDate(todayYmd, config.projectStartDate).week,
    [todayYmd, config.projectStartDate]
  );

  const momPeriodOptions = useMemo(
    () => buildMomSummaryPeriodOptions(meetingLogs, currentProjectWeek),
    [meetingLogs, currentProjectWeek]
  );

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const activeMomPeriod = useMemo(
    () =>
      momPeriodOptions.find((opt) => opt.key === selectedPeriodKey) ??
      momPeriodOptions[0],
    [momPeriodOptions, selectedPeriodKey]
  );

  const momWoSummary = useMemo(
    () =>
      computeMomPeriodWorkOrders(
        workOrders,
        activeMomPeriod,
        config.projectStartDate,
        todayYmd
      ),
    [workOrders, activeMomPeriod, config.projectStartDate, todayYmd]
  );

  // Modals
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [newDeckWeek, setNewDeckWeek] = useState(5);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckPresenter, setNewDeckPresenter] = useState('user-rahul');
  const [newDeckDate, setNewDeckDate] = useState(() =>
    new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  );
  const [newDeckUrl, setNewDeckUrl] = useState('');

  const [showActionModal, setShowActionModal] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [newActionWeek, setNewActionWeek] = useState('W5');
  const [newActionIssue, setNewActionIssue] = useState('');
  const [newActionPic, setNewActionPic] = useState('user-ihsan');
  const [newActionProgress, setNewActionProgress] = useState<'Resolved' | 'In Progress'>('In Progress');
  const [newActionDeadline, setNewActionDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  const [showMomModal, setShowMomModal] = useState(false);
  const [editingMomId, setEditingMomId] = useState<string | null>(null);
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
  const [newMomLocation, setNewMomLocation] = useState('Ruang Asistensi DTNTF');
  const [newMomEvaluator, setNewMomEvaluator] = useState('Dosen Pembimbing (Dr. Ir. Chemical Eng)');
  const [newMomMembers, setNewMomMembers] = useState<string[]>([]);
  const [newMomTopic, setNewMomTopic] = useState('');
  const [newMomSummary, setNewMomSummary] = useState('');

  const activeActionsCount = trackerActions.filter((a) => a.progress === 'In Progress').length;

  const openAddDeckModal = () => {
    setEditingDeckId(null);
    setNewDeckWeek(5);
    setNewDeckTitle('');
    setNewDeckPresenter('user-rahul');
    setNewDeckDate(new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }));
    setNewDeckUrl('');
    setShowDeckModal(true);
  };

  const openEditDeckModal = (deck: (typeof slideDecks)[number]) => {
    setEditingDeckId(deck.id);
    setNewDeckWeek(deck.week);
    setNewDeckTitle(deck.title);
    const presenterRef = deck.presenter || deck.presenterCode || 'user-rahul';
    setNewDeckPresenter(getUser(presenterRef)?.id || presenterRef);
    setNewDeckDate(deck.date);
    setNewDeckUrl(deck.url === '#' ? '' : deck.url);
    setShowDeckModal(true);
  };

  const handleSaveDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    const originalDeck = slideDecks.find((deck) => deck.id === editingDeckId);
    const deckData = {
      week: newDeckWeek,
      weekLabel: `Week ${newDeckWeek}`,
      title: newDeckTitle.trim(),
      presenter: newDeckPresenter,
      date: newDeckDate.trim(),
      url: newDeckUrl.trim() || (originalDeck?.url ?? 'https://drive.google.com/presentation/d/new-deck'),
    };

    if (editingDeckId) updateSlideDeck(editingDeckId, deckData);
    else addSlideDeck(deckData);

    setEditingDeckId(null);
    setNewDeckTitle('');
    setShowDeckModal(false);
  };

  const openAddActionModal = () => {
    setEditingActionId(null);
    setNewActionWeek('W5');
    setNewActionIssue('');
    setNewActionPic('user-ihsan');
    setNewActionProgress('In Progress');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    setNewActionDeadline(deadline.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }));
    setShowActionModal(true);
  };

  const openEditActionModal = (action: (typeof trackerActions)[number]) => {
    setEditingActionId(action.id);
    setNewActionWeek(action.week);
    setNewActionIssue(action.issue);
    const picRef = action.pic || action.picCode || 'user-ihsan';
    setNewActionPic(getUser(picRef)?.id || picRef);
    setNewActionProgress(action.progress);
    setNewActionDeadline(action.deadline);
    setShowActionModal(true);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionIssue.trim()) return;

    const actionData = {
      week: newActionWeek.trim(),
      issue: newActionIssue.trim(),
      pic: newActionPic,
      picCode: newActionPic,
      deadline: newActionDeadline.trim(),
      progress: newActionProgress,
    };

    if (editingActionId) updateTrackerAction(editingActionId, actionData);
    else addTrackerAction(actionData);

    setEditingActionId(null);
    setNewActionIssue('');
    setShowActionModal(false);
  };

  const openAddMomModal = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const formatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setEditingMomId(null);
    setNewMomWeek(5);
    setNewMomDate(`${days[now.getDay()]}, ${formatted} - ${hours}:${minutes} WIB`);
    setNewMomLocation('Ruang Asistensi DTNTF');
    setNewMomEvaluator('Dosen Pembimbing (Dr. Ir. Chemical Eng)');
    setNewMomMembers(users.map((user) => user.id));
    setNewMomTopic('');
    setNewMomSummary('');
    setShowMomModal(true);
  };

  const openEditMomModal = (log: (typeof meetingLogs)[number]) => {
    setEditingMomId(log.id);
    setNewMomWeek(log.week);
    setNewMomDate(log.dayText);
    setNewMomLocation(log.location);
    setNewMomEvaluator(log.evaluator);
    setNewMomMembers(log.presentMembers.map((ref) => getUser(ref)?.id || ref));
    setNewMomTopic(log.topic);
    setNewMomSummary(log.summary);
    setShowMomModal(true);
  };

  const handleSaveMom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomTopic.trim()) return;

    const momData = {
      week: newMomWeek,
      weekLabel: `Week ${newMomWeek}`,
      dayText: newMomDate.trim(),
      location: newMomLocation,
      evaluator: newMomEvaluator.trim(),
      presenceRatio: `${newMomMembers.length}/${users.length} Hadir`,
      presentMembers: newMomMembers,
      topic: newMomTopic.trim(),
      summary: newMomSummary.trim(),
    };

    if (editingMomId) updateMeetingLog(editingMomId, momData);
    else addMeetingLog(momData);

    setEditingMomId(null);
    setNewMomTopic('');
    setNewMomSummary('');
    setShowMomModal(false);
  };

  const toggleMomMember = (uid: string) => {
    setNewMomMembers((prev) =>
      prev.includes(uid) ? prev.filter((memberId) => memberId !== uid) : [...prev, uid]
    );
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
      {/* WORK ORDER SEJAK RAPAT LALU (4 KELOMPOK RINGKASAN ANTAR-RAPAT) */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0062CC]" />
              <h2 className="font-heading font-bold text-sm sm:text-base text-[#0B1B33]">
                Work Order Sejak Rapat Lalu
              </h2>
            </div>
            <p className="text-xs text-[#4A5A72] mt-0.5">
              Ringkasan otomatis capaian dan hambatan Work Order berdasarkan periode minggu rapat berurutan
            </p>
          </div>

          {momPeriodOptions.length > 0 && (
            <select
              value={activeMomPeriod?.key || ''}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
              aria-label="Pilih periode ringkasan Work Order antar-rapat"
              className="min-h-[40px] px-3.5 rounded-full bg-white/90 border border-[#C9DCEB] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
            >
              {momPeriodOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Kelompok 1: Selesai */}
          <div className="rounded-2xl bg-white/75 border border-[#6EE7B7]/60 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-[#065F46] inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                Selesai
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D1FAE5] text-[#065F46]">
                {momWoSummary.completed.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.completed.length === 0 ? (
                <p className="text-[11px] text-[#4A5A72] py-3 text-center">
                  Belum ada WO selesai pada periode ini
                </p>
              ) : (
                momWoSummary.completed.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#D1FAE5]/40 hover:bg-[#D1FAE5]/80 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-[#065F46]">
                        {wo.code}
                      </span>
                      <span className="text-[10px] text-[#065F46] font-semibold">
                        {wo.completedAt
                          ? formatYmdToIndonesian(wo.completedAt.slice(0, 10))
                          : `W${wo.projectWeek}`}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-[#0B1B33] line-clamp-1">
                      {wo.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kelompok 2: Masih Berjalan */}
          <div className="rounded-2xl bg-white/75 border border-[#93C5FD]/60 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-[#1E3A8A] inline-flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-[#0062CC]" />
                Masih Berjalan
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DBEAFE] text-[#1E3A8A]">
                {momWoSummary.inProgress.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.inProgress.length === 0 ? (
                <p className="text-[11px] text-[#4A5A72] py-3 text-center">
                  Tidak ada WO berjalan
                </p>
              ) : (
                momWoSummary.inProgress.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#EAF6FD]/70 hover:bg-[#DBEAFE]/70 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-[#0062CC]">
                        {wo.code}
                      </span>
                      <span className="text-[10px] font-bold text-[#334155]">
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-[#0B1B33] line-clamp-1">
                      {wo.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kelompok 3: Terlambat */}
          <div className="rounded-2xl bg-white/75 border border-[#FCA5A5]/70 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-[#991B1B] inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C]" />
                Terlambat
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEE2E2] text-[#991B1B]">
                {momWoSummary.overdue.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.overdue.length === 0 ? (
                <p className="text-[11px] text-[#4A5A72] py-3 text-center">
                  Nihil keterlambatan WO
                </p>
              ) : (
                momWoSummary.overdue.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#FEE2E2]/55 hover:bg-[#FEE2E2] transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-[#991B1B]">
                        {wo.code}
                      </span>
                      <span className="text-[10px] font-bold text-[#B91C1C]">
                        {formatYmdToIndonesian(wo.dueDate)}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-[#0B1B33] line-clamp-1">
                      {wo.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kelompok 4: Blocked */}
          <div className="rounded-2xl bg-white/75 border border-[#FCD34D]/70 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-[#92400E] inline-flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5 text-[#B45309]" />
                Blocked
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3C7] text-[#92400E]">
                {momWoSummary.blocked.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.blocked.length === 0 ? (
                <p className="text-[11px] text-[#4A5A72] py-3 text-center">
                  Tidak ada WO yang terhambat
                </p>
              ) : (
                momWoSummary.blocked.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-[#92400E]">
                        {wo.code}
                      </span>
                      <UserChip
                        uid={wo.assigneeIds[0]}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                        avatarClassName="w-4 h-4 text-[8px]"
                        nameClassName="!text-[10px] !font-semibold !text-[#92400E]"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-[#0B1B33] line-clamp-1">
                      {wo.title}
                    </p>
                    {wo.blockedReason && (
                      <p className="text-[10px] text-[#92400E] line-clamp-1">
                        Alasan: {wo.blockedReason}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
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
                onClick={openAddDeckModal}
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
                      <>
                        <button
                          type="button"
                          onClick={() => openEditDeckModal(deck)}
                          className="p-1 text-[#4A5A72] hover:text-[#0062CC]"
                          title="Edit Slide Deck"
                          aria-label={`Edit Slide Deck ${deck.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSlideDeck(deck.id)}
                          className="p-1 text-[#4A5A72] hover:text-[#B91C1C]"
                          title="Hapus Slide Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
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

              <div className="flex flex-wrap items-center gap-2">
              <WhatsAppShareButton
                label="Bagikan action item aktif ke WhatsApp"
                text={[
                  `*Action Item MoM aktif (${activeActionsCount})*`,
                  ...trackerActions
                    .filter((a) => a.progress === 'In Progress')
                    .map((a) => {
                      const pic = getUser(a.pic || a.picCode);
                      return `- ${a.code} (${a.week}): ${a.issue} | PIC ${pic?.nickname || pic?.name || a.picName || a.picCode} | tenggat ${a.deadline}`;
                    }),
                ].join('\n')}
              />
              {isPM && (
                <button
                  type="button"
                  onClick={openAddActionModal}
                  className="min-h-[44px] px-4 bg-white/70 hover:bg-white text-[#0B1B33] rounded-full text-xs font-bold border border-white flex items-center gap-1 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0062CC]" />
                  Tambah Baris
                </button>
              )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/80 bg-white/60">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/80 bg-white/70 text-[10px] font-heading font-bold text-[#4A5A72]">
                    <th className="p-3">ID Action</th>
                    <th className="p-3">Week</th>
                    <th className="p-3">Kendala dan Masukan Dosen</th>
                    <th className="p-3">Action PIC</th>
                    <th className="p-3">Tenggat</th>
                    <th className="p-3 text-center">Progres</th>
                    <th className="p-3 text-center">Work Order</th>
                    {isPM && <th className="p-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/80 text-xs">
                  {trackerActions.map((act) => {
                    const linkedWo = findWorkOrderForTrackerAction(workOrders, act.id);
                    const hasActiveLinkedWo =
                      linkedWo !== undefined && linkedWo.status !== 'Dibatalkan';
                    const picRef = act.pic || act.picCode || act.picName || 'user-ihsan';
                    const resolvedPicId = getUser(picRef)?.id || picRef;

                    return (
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
                        <td className="p-3 text-center whitespace-nowrap">
                          {hasActiveLinkedWo && linkedWo ? (
                            <button
                              type="button"
                              onClick={() => setSelectedWorkOrderId(linkedWo.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 transition-all hover:shadow-xs ${
                                STATUS_BADGE_CONFIG[linkedWo.status].bg
                              } ${STATUS_BADGE_CONFIG[linkedWo.status].text} ${
                                STATUS_BADGE_CONFIG[linkedWo.status].border
                              }`}
                              title={`Buka ${linkedWo.code}`}
                            >
                              <span className="font-mono font-extrabold">
                                {linkedWo.code}
                              </span>
                              <span>·</span>
                              <span>
                                {linkedWo.status}
                                {linkedWo.needsRevision &&
                                linkedWo.status === 'Dikerjakan'
                                  ? ' (Revisi)'
                                  : ''}
                              </span>
                            </button>
                          ) : isPM ? (
                            <button
                              type="button"
                              onClick={() =>
                                openWorkOrderForm({
                                  title: act.issue,
                                  description: `Tindak lanjut Action Item MoM ${act.code} (${act.week}): ${act.issue}`,
                                  assigneeIds: [resolvedPicId],
                                  dueDate: parseIndonesianDateToYmd(act.deadline),
                                  priority: 'Normal',
                                  origin: {
                                    type: 'mom',
                                    trackerActionId: act.id,
                                    trackerActionCode: act.code,
                                  },
                                })
                              }
                              className="min-h-[32px] px-3 rounded-full bg-[#EAF6FD] hover:bg-[#0062CC] text-[#0062CC] hover:text-white border border-[#BAE6FD] text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Jadikan Tugas
                            </button>
                          ) : linkedWo ? (
                            <button
                              type="button"
                              onClick={() => setSelectedWorkOrderId(linkedWo.id)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]"
                            >
                              {linkedWo.code} · Dibatalkan
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">—</span>
                          )}
                        </td>
                        {isPM && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditActionModal(act)}
                                className="text-[#4A5A72] hover:text-[#0062CC]"
                                title="Edit Action"
                                aria-label={`Edit Action ${act.code}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTrackerAction(act.id)}
                                className="text-[#4A5A72] hover:text-[#B91C1C]"
                                title="Hapus Baris Action"
                                aria-label={`Hapus Action ${act.code}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
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
                    onClick={openAddMomModal}
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
                      <WhatsAppShareButton
                        compact
                        label={`Bagikan ringkasan MoM ${log.weekLabel} ke WhatsApp`}
                        text={[
                          `*MoM ${log.weekLabel}: ${log.topic}*`,
                          `${log.dayText} | ${log.location} | ${log.evaluator}`,
                          `Kehadiran: ${log.presenceRatio}`,
                          '',
                          log.summary,
                        ].join('\n')}
                      />
                      {isPM && (
                        <button
                          type="button"
                          onClick={() => openEditMomModal(log)}
                          className="min-h-[44px] min-w-[44px] rounded-full text-[#4A5A72] hover:bg-[#EAF6FD] hover:text-[#0062CC] flex items-center justify-center transition-colors"
                          title="Edit catatan MoM"
                          aria-label={`Edit MoM ${log.weekLabel}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
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
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              {editingDeckId ? 'Edit Slide Deck Asistensi' : 'Tambah Slide Deck Asistensi'}
            </h3>
            <form onSubmit={handleSaveDeck} className="mt-4 space-y-3">
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
                <label className="block text-xs font-semibold mb-1">Tanggal</label>
                <input
                  type="text"
                  value={newDeckDate}
                  onChange={(e) => setNewDeckDate(e.target.value)}
                  placeholder="Contoh: 22 Okt 2026"
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
                  onClick={() => {
                    setShowDeckModal(false);
                    setEditingDeckId(null);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  {editingDeckId ? 'Simpan Perubahan' : 'Simpan Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              {editingActionId ? 'Edit Action Item Asistensi' : 'Tambah Action Item Asistensi'}
            </h3>
            <form onSubmit={handleSaveAction} className="mt-4 space-y-3">
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

              <div>
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select
                  value={newActionProgress}
                  onChange={(e) =>
                    setNewActionProgress(e.target.value as 'Resolved' | 'In Progress')
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setEditingActionId(null);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  {editingActionId ? 'Simpan Perubahan' : 'Simpan Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              {editingMomId ? 'Edit Catatan Meeting Log (MoM)' : 'Tambah Catatan Meeting Log (MoM)'}
            </h3>
            <form onSubmit={handleSaveMom} className="mt-4 space-y-3">
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
                <label className="block text-xs font-semibold mb-1">Lokasi / Media</label>
                <input
                  type="text"
                  value={newMomLocation}
                  onChange={(e) => setNewMomLocation(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Dosen Evaluator</label>
                <input
                  type="text"
                  value={newMomEvaluator}
                  onChange={(e) => setNewMomEvaluator(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="block text-xs font-semibold">Anggota Hadir</legend>
                <div className="grid grid-cols-2 gap-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 rounded-xl border border-[#EAF6FD] px-3 py-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={newMomMembers.includes(user.id)}
                        onChange={() => toggleMomMember(user.id)}
                        className="accent-[#0062CC]"
                      />
                      <span>{user.nickname}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
                  onClick={() => {
                    setShowMomModal(false);
                    setEditingMomId(null);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  {editingMomId ? 'Simpan Perubahan' : 'Simpan MoM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
