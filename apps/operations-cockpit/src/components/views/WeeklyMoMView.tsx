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
import { requestLogbookDraft } from '../../utils/logbookDraft';
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
    setActiveTab,
    currentUser,
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
  // Action Item = Work Order (P2, LOG-032): action baru langsung dibuatkan WO kecuali dicentang lepas
  const [createWoForAction, setCreateWoForAction] = useState(true);
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
  const [newMomLocation, setNewMomLocation] = useState('');
  const [newMomEvaluator, setNewMomEvaluator] = useState('Dosen Pembimbing');
  const [newMomMembers, setNewMomMembers] = useState<string[]>([]);
  const [newMomTopic, setNewMomTopic] = useState('');
  const [newMomSummary, setNewMomSummary] = useState('');

  const activeActionsCount = trackerActions.filter((a) => a.progress === 'In Progress').length;

  const openAddDeckModal = () => {
    setEditingDeckId(null);
    setNewDeckWeek(currentProjectWeek);
    setNewDeckTitle('');
    setNewDeckPresenter(currentUser.id);
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

    // Link kosong disimpan sebagai '#' (ditampilkan "Link belum ada"), bukan URL contoh palsu
    const deckData = {
      week: newDeckWeek,
      weekLabel: `Week ${newDeckWeek}`,
      title: newDeckTitle.trim(),
      presenter: newDeckPresenter,
      date: newDeckDate.trim(),
      url: newDeckUrl.trim() || '#',
    };

    if (editingDeckId) updateSlideDeck(editingDeckId, deckData);
    else addSlideDeck(deckData);

    setEditingDeckId(null);
    setNewDeckTitle('');
    setShowDeckModal(false);
  };

  const openAddActionModal = () => {
    setEditingActionId(null);
    setNewActionWeek(`W${currentProjectWeek}`);
    setNewActionIssue('');
    setNewActionPic(currentUser.id);
    setNewActionProgress('In Progress');
    setCreateWoForAction(true);
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

    if (editingActionId) {
      updateTrackerAction(editingActionId, actionData);
    } else {
      const created = addTrackerAction(actionData);
      if (created && createWoForAction) {
        openWorkOrderForm({
          title: actionData.issue,
          description: `Tindak lanjut Action Item MoM ${created.code} (${actionData.week}): ${actionData.issue}`,
          assigneeIds: [getUser(newActionPic)?.id || newActionPic],
          dueDate: parseIndonesianDateToYmd(actionData.deadline),
          priority: 'Normal',
          origin: { type: 'mom', trackerActionId: created.id, trackerActionCode: created.code },
        });
      }
    }

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
    setNewMomWeek(currentProjectWeek);
    setNewMomDate(`${days[now.getDay()]}, ${formatted} - ${hours}:${minutes} WIB`);
    setNewMomLocation('');
    setNewMomEvaluator('Dosen Pembimbing');
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

        <div className="space-y-2.5">
          <div className="max-w-4xl">
            <p className="text-[13px] leading-relaxed text-fg-3">
              Repositori materi presentasi asistensi mingguan, pelacak komitmen tindakan korektif, dan logbook asistensi DTNTF.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-8 px-3.5 rounded-full bg-surface/70 border border-glass-stroke text-primary text-[12px] font-semibold tracking-normal inline-flex items-center">
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
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-xs sm:text-sm text-fg">
              Format Slide Deck Bimbingan (15 menit)
            </h3>
          </div>
          {/* Panduan Capstone tidak mengatur format slide bimbingan: ini format internal tim (LOG-051/052) */}
          <span className="px-3 py-1 bg-surface/70 text-primary rounded-full text-[10px] font-bold flex items-center gap-1 border border-glass-stroke">
            <FileCheck2 className="w-3 h-3" /> Format internal tim · template slide UGM (Canva)
          </span>
        </div>

        {/* 2-Segment Progress Visualizer */}
        <div className="w-full h-8 rounded-full overflow-hidden flex text-on-ink text-[11px] font-bold shadow-xs">
          <div className="w-[66.7%] bg-primary flex items-center justify-center px-3 tracking-wide">
            10 menit - Pemaparan Teknis
          </div>
          <div className="w-[33.3%] bg-ink bg-hatch-pattern flex items-center justify-center px-3 tracking-wide">
            5 menit - Diskusi &amp; Q&amp;A Dosen
          </div>
        </div>

        <div className="text-[11px] text-fg-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-fg">Urutan:</span>
          <span>1 Status capaian vs timeline</span>
          <span>•</span>
          <span>2 Tindak lanjut arahan bimbingan sebelumnya</span>
          <span>•</span>
          <span>3–4 Hasil kerja per WO/anggota (+ standar)</span>
          <span>•</span>
          <span>5 Risiko &amp; butir terbuka</span>
          <span>•</span>
          <span>6 Pertanyaan/keputusan untuk dosen</span>
          <span>•</span>
          <span>7 WO minggu depan</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORK ORDER SEJAK RAPAT LALU (4 KELOMPOK RINGKASAN ANTAR-RAPAT) */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="font-heading font-bold text-sm sm:text-base text-fg">
                Work Order Sejak Rapat Lalu
              </h2>
            </div>
            <p className="text-xs text-fg-3 mt-0.5">
              Ringkasan otomatis capaian dan hambatan Work Order berdasarkan periode minggu rapat berurutan
            </p>
          </div>

          {momPeriodOptions.length > 0 && (
            <select
              value={activeMomPeriod?.key || ''}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
              aria-label="Pilih periode ringkasan Work Order antar-rapat"
              className="min-h-[40px] px-3.5 rounded-full bg-surface/90 border border-line text-xs font-semibold text-fg outline-none focus:border-primary"
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
          <div className="rounded-2xl bg-surface/75 border border-success-line/60 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-success inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                Selesai
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-success-soft text-success">
                {momWoSummary.completed.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.completed.length === 0 ? (
                <p className="text-[11px] text-fg-3 py-3 text-center">
                  Belum ada WO selesai pada periode ini
                </p>
              ) : (
                momWoSummary.completed.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-success-soft/40 hover:bg-success-soft/80 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-success">
                        {wo.code}
                      </span>
                      <span className="text-[10px] text-success font-semibold">
                        {wo.completedAt
                          ? formatYmdToIndonesian(wo.completedAt.slice(0, 10))
                          : `W${wo.projectWeek}`}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-fg line-clamp-1">
                      {wo.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kelompok 2: Masih Berjalan */}
          <div className="rounded-2xl bg-surface/75 border border-line/60 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-fg-2 inline-flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-primary" />
                Masih Berjalan
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-soft text-fg-2">
                {momWoSummary.inProgress.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.inProgress.length === 0 ? (
                <p className="text-[11px] text-fg-3 py-3 text-center">
                  Tidak ada WO berjalan
                </p>
              ) : (
                momWoSummary.inProgress.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-muted/70 hover:bg-primary-soft/70 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-primary">
                        {wo.code}
                      </span>
                      <span className="text-[10px] font-bold text-fg-2">
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-fg line-clamp-1">
                      {wo.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kelompok 3: Terlambat */}
          <div className="rounded-2xl bg-surface/75 border border-danger-line/70 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-danger inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                Terlambat
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-danger-soft text-danger">
                {momWoSummary.overdue.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.overdue.length === 0 ? (
                <p className="text-[11px] text-fg-3 py-3 text-center">
                  Nihil keterlambatan WO
                </p>
              ) : (
                momWoSummary.overdue.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-danger-soft/55 hover:bg-danger-soft transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-danger">
                        {wo.code}
                      </span>
                      <span className="text-[10px] font-bold text-danger">
                        {formatYmdToIndonesian(wo.dueDate)}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-fg line-clamp-1">
                      {wo.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kelompok 4: Blocked */}
          <div className="rounded-2xl bg-surface/75 border border-warm-line/70 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-warm inline-flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5 text-warm" />
                Blocked
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-warm-soft text-warm">
                {momWoSummary.blocked.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {momWoSummary.blocked.length === 0 ? (
                <p className="text-[11px] text-fg-3 py-3 text-center">
                  Tidak ada WO yang terhambat
                </p>
              ) : (
                momWoSummary.blocked.map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelectedWorkOrderId(wo.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-warm-soft/60 hover:bg-warm-soft transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-extrabold text-warm">
                        {wo.code}
                      </span>
                      <UserChip
                        uid={wo.assigneeIds[0]}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                        avatarClassName="w-4 h-4 text-[8px]"
                        nameClassName="!text-[10px] !font-semibold !text-warm"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-fg line-clamp-1">
                      {wo.title}
                    </p>
                    {wo.blockedReason && (
                      <p className="text-[10px] text-warm line-clamp-1">
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
              <h2 className="font-heading font-bold text-base text-fg">
                Your Slide Deck
              </h2>
              <p className="text-xs text-fg-3">
                Slide paparan tiap bimbingan, terbaru di atas
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface/70 text-primary">
              {slideDecks.length} Berkas Terarsip
            </span>
            {isPM && (
              <button
                type="button"
                onClick={openAddDeckModal}
                className="min-h-[44px] px-4 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Slide Deck
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {[...slideDecks].sort((a, b) => (b.week || 0) - (a.week || 0)).map((deck) => (
              <div
                key={deck.id}
                className="p-4 rounded-2xl bg-surface/70 border border-glass-stroke shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface/70 text-primary">
                    {deck.weekLabel}
                  </span>
                  <span className="text-[11px] text-fg-3 font-medium">
                    {deck.date}
                  </span>
                </div>

                <h4 className="font-heading font-bold text-xs text-fg mb-3 leading-snug">
                  {deck.title}
                </h4>

                <div className="flex items-center justify-between pt-2 border-t border-glass-stroke">
                  <UserChip
                    uid={deck.presenter || deck.presenterCode}
                    variant="avatar-nama-jabatan"
                    size="sm"
                    useNickname
                    avatarClassName="w-7 h-7 rounded-full font-heading font-bold text-[10px]"
                    nameClassName="!text-[11px] !font-bold !text-fg"
                    titleClassName="!text-[9px] !text-fg-3"
                  />

                  <div className="flex items-center gap-1.5">
                    {isPM && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditDeckModal(deck)}
                          className="p-1 text-fg-3 hover:text-primary"
                          title="Edit Slide Deck"
                          aria-label={`Edit Slide Deck ${deck.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSlideDeck(deck.id)}
                          className="p-1 text-fg-3 hover:text-danger"
                          title="Hapus Slide Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {deck.url && deck.url !== '#' ? (
                      <a
                        href={deck.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-surface/70 hover:bg-primary hover:text-on-primary text-primary rounded-full text-[11px] font-bold flex items-center gap-1 transition-all"
                      >
                        Buka <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span
                        className="px-3 py-1 bg-muted text-fg-3 rounded-full text-[11px] font-semibold"
                        title="Link slide belum diisi; PM dapat menambahkannya lewat tombol edit"
                      >
                        Link belum ada
                      </span>
                    )}
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
                  <h2 className="font-heading font-bold text-base text-fg">
                    Action Item MoM → Work Order
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warm-soft text-warm">
                    {activeActionsCount} Active
                  </span>
                </div>
                <p className="text-xs text-fg-3">
                  Masukan dosen pembimbing; setiap action item dikerjakan sebagai Work Order dan statusnya mengikuti WO
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
                  className="min-h-[44px] px-4 bg-surface/70 hover:bg-surface text-fg rounded-full text-xs font-bold border border-glass-stroke flex items-center gap-1 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Tambah Action Item
                </button>
              )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-glass-stroke bg-surface/60">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-glass-stroke bg-surface/70 text-[10px] font-heading font-bold text-fg-3">
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
                <tbody className="divide-y divide-line text-xs">
                  {trackerActions.map((act) => {
                    const linkedWo = findWorkOrderForTrackerAction(workOrders, act.id);
                    const hasActiveLinkedWo =
                      linkedWo !== undefined && linkedWo.status !== 'Dibatalkan';
                    const picRef = act.pic || act.picCode || act.picName || 'user-ihsan';
                    const resolvedPicId = getUser(picRef)?.id || picRef;

                    return (
                      <tr key={act.id} className="hover:bg-surface/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-primary">
                          {act.code}
                        </td>
                        <td className="p-3 font-bold text-fg">
                          {act.week}
                        </td>
                        <td className="p-3 max-w-[240px] text-xs text-fg font-medium leading-relaxed">
                          {act.issue}
                        </td>
                        <td className="p-3">
                          <UserChip
                            uid={act.pic || act.picCode || act.picName}
                            variant="avatar-nama"
                            size="xs"
                            useNickname
                            avatarClassName="w-5 h-5 rounded-full text-[10px]"
                            nameClassName="!text-xs !font-semibold !text-fg"
                          />
                        </td>
                        <td className="p-3 text-xs text-fg-3">
                          {act.deadline}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={hasActiveLinkedWo}
                            onClick={() => toggleTrackerActionStatus(act.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                              act.progress === 'Resolved'
                                ? 'bg-success-soft text-success'
                                : 'bg-warm-soft text-warm'
                            }`}
                            title={
                              hasActiveLinkedWo
                                ? 'Status mengikuti Work Order terkait (selesai saat WO Selesai)'
                                : 'Klik untuk mengubah status (Resolved / In Progress)'
                            }
                          >
                            {act.progress === 'Resolved' ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Clock className="w-3 h-3 text-warm" />
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
                              className="min-h-[32px] px-3 rounded-full bg-muted hover:bg-primary text-primary hover:text-on-primary border border-line text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Buat WO
                            </button>
                          ) : linkedWo ? (
                            <button
                              type="button"
                              onClick={() => setSelectedWorkOrderId(linkedWo.id)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted text-fg-3 border border-line-strong"
                            >
                              {linkedWo.code} · Dibatalkan
                            </button>
                          ) : (
                            <span className="text-[11px] text-fg-3">—</span>
                          )}
                        </td>
                        {isPM && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditActionModal(act)}
                                className="text-fg-3 hover:text-primary"
                                title="Edit Action"
                                aria-label={`Edit Action ${act.code}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTrackerAction(act.id)}
                                className="text-fg-3 hover:text-danger"
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
                <h2 className="font-heading font-bold text-base text-fg">
                  Meeting Log
                </h2>
                <p className="text-xs text-fg-3">
                  Catatan resmi asistensi dan arahan teknis evaluasi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-fg-3 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Semester Gasal 2026/2027
                </span>
                {isPM && (
                  <button
                    type="button"
                    onClick={openAddMomModal}
                    className="min-h-[44px] px-4 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
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
                  className="p-5 rounded-2xl bg-surface/70 border border-glass-stroke shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-on-primary">
                        {log.weekLabel}
                      </span>
                      <span className="text-xs font-semibold text-fg flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {log.dayText}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-fg-3 flex items-center gap-1">
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
                          className="min-h-[44px] min-w-[44px] rounded-full text-fg-3 hover:bg-muted hover:text-primary flex items-center justify-center transition-colors"
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
                          className="min-h-[44px] min-w-[44px] rounded-full text-fg-3 hover:bg-danger-soft hover:text-danger flex items-center justify-center transition-colors"
                          title="Hapus catatan MoM"
                          aria-label={`Hapus MoM ${log.weekLabel}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-y border-glass-stroke py-2">
                    <span className="text-fg-3">
                      Dosen Evaluator: <strong className="text-fg">{log.evaluator}</strong>
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
                            nameClassName="!text-[10px] !font-semibold !text-fg-3"
                          />
                        ))}
                      </div>
                      <span className="px-2 py-0.5 bg-success-soft text-success font-bold rounded-full text-[10px]">
                        {log.presenceRatio}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-fg">
                      {log.topic}
                    </h4>
                    <p className="text-xs text-fg-3 leading-relaxed">
                      {log.summary}
                    </p>
                  </div>

                  {/* Panduan Lampiran 2: logbook maks. 1x24 jam setelah pertemuan (P2, LOG-032) */}
                  <button
                    type="button"
                    onClick={() => {
                      requestLogbookDraft({
                        weekNumber: log.week,
                        date: log.dayText.replace(/^[A-Za-z]+,\s*/, '').split(' - ')[0],
                        workDescription: `Asistensi ${log.weekLabel || `Week ${log.week}`}: ${log.topic}. ${log.summary}`,
                        issueSolution: '',
                      });
                      setActiveTab('logbook');
                    }}
                    className="min-h-[44px] px-4 rounded-full bg-muted hover:bg-primary text-primary hover:text-on-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Buat draf logbook dari MoM ini
                  </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
            <h3 className="font-heading font-bold text-sm text-fg pb-3 border-b border-line">
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
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Presenter</label>
                  <select
                    value={newDeckPresenter}
                    onChange={(e) => setNewDeckPresenter(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeckModal(false);
                    setEditingDeckId(null);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  {editingDeckId ? 'Simpan Perubahan' : 'Simpan Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
            <h3 className="font-heading font-bold text-sm text-fg pb-3 border-b border-line">
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
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Action PIC</label>
                  <select
                    value={newActionPic}
                    onChange={(e) => setNewActionPic(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tenggat Waktu</label>
                <input
                  type="text"
                  value={newActionDeadline}
                  onChange={(e) => setNewActionDeadline(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {!editingActionId && (
                <label className="flex items-start gap-2 text-xs text-fg min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createWoForAction}
                    onChange={(e) => setCreateWoForAction(e.target.checked)}
                    className="mt-0.5 w-4 h-4"
                  />
                  <span>
                    Langsung buat Work Order untuk action item ini (disarankan; status action mengikuti WO).
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setEditingActionId(null);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  {editingActionId ? 'Simpan Perubahan' : createWoForAction ? 'Simpan & Buat WO' : 'Simpan Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
            <h3 className="font-heading font-bold text-sm text-fg pb-3 border-b border-line">
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
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Waktu Sesi</label>
                  <input
                    type="text"
                    value={newMomDate}
                    onChange={(e) => setNewMomDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Dosen Evaluator</label>
                <input
                  type="text"
                  value={newMomEvaluator}
                  onChange={(e) => setNewMomEvaluator(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="block text-xs font-semibold">Anggota Hadir</legend>
                <div className="grid grid-cols-2 gap-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={newMomMembers.includes(user.id)}
                        onChange={() => toggleMomMember(user.id)}
                        className="accent-primary"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
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
