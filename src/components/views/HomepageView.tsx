import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import {
  Config,
  DeliverableItem,
  MeetingLogItem,
  SlideDeckItem,
  WorkOrder,
  WorkOrderStatus,
} from '../../types';
import {
  WO_ACTIVE_STATUSES,
  WO_BOARD_COLUMNS,
  formatYmdToIndonesian,
  getDaysUntilDue,
  getTodayLocalYmd,
  isExclusivelyAssignedToCurrentPM,
  isUserWorkOrderAssignee,
  isWorkOrderOverdue,
  sortWorkOrdersForCockpit,
} from '../../utils/workOrderHelpers';
import {
  Users,
  Clock,
  CheckCircle2,
  Circle,
  Pencil,
  ArrowRight,
  Calendar,
  Download,
  AlertTriangle,
  X,
  Flag,
  ClipboardCheck,
  CalendarCheck,
  XCircle,
  MessagesSquare,
  Presentation,
  ExternalLink,
  Archive,
  Play,
  Send,
  RotateCcw,
} from 'lucide-react';

type ProjectStatusKey = Config['projectStatus'];

interface StatusStyleConfig {
  label: ProjectStatusKey;
  cardBg: string;
  cardBorder: string;
  accentStrip: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconColor: string;
  headingText: string;
  subText: string;
  dividerBorder: string;
  editBtnHover: string;
  IconComponent: React.ComponentType<{ className?: string }>;
}

const PROJECT_STATUS_MAP: Record<ProjectStatusKey, StatusStyleConfig> = {
  'ON TRACK': {
    label: 'ON TRACK',
    cardBg: 'bg-[#D1FAE5]',
    cardBorder: 'border-[#065F46]/25',
    accentStrip: 'bg-[#065F46]',
    badgeBg: 'bg-[#D1FAE5]',
    badgeText: 'text-[#065F46]',
    badgeBorder: 'border-[#065F46]/35',
    iconColor: 'text-[#065F46]',
    headingText: 'text-[#065F46]',
    subText: 'text-[#065F46]/85',
    dividerBorder: 'border-[#065F46]/20',
    editBtnHover: 'hover:bg-white/70 text-[#065F46]',
    IconComponent: CheckCircle2,
  },
  'NEEDS ATTENTION': {
    label: 'NEEDS ATTENTION',
    cardBg: 'bg-[#FEF3C7]',
    cardBorder: 'border-[#92400E]/25',
    accentStrip: 'bg-[#92400E]',
    badgeBg: 'bg-[#FEF3C7]',
    badgeText: 'text-[#92400E]',
    badgeBorder: 'border-[#92400E]/35',
    iconColor: 'text-[#92400E]',
    headingText: 'text-[#92400E]',
    subText: 'text-[#92400E]/85',
    dividerBorder: 'border-[#92400E]/20',
    editBtnHover: 'hover:bg-white/70 text-[#92400E]',
    IconComponent: AlertTriangle,
  },
  CRITICAL: {
    label: 'CRITICAL',
    cardBg: 'bg-[#FEE2E2]',
    cardBorder: 'border-[#991B1B]/25',
    accentStrip: 'bg-[#991B1B]',
    badgeBg: 'bg-[#FEE2E2]',
    badgeText: 'text-[#991B1B]',
    badgeBorder: 'border-[#991B1B]/35',
    iconColor: 'text-[#991B1B]',
    headingText: 'text-[#991B1B]',
    subText: 'text-[#991B1B]/85',
    dividerBorder: 'border-[#991B1B]/20',
    editBtnHover: 'hover:bg-white/70 text-[#991B1B]',
    IconComponent: XCircle,
  },
};

const INDONESIAN_MONTHS: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  agu: 7,
  ags: 7,
  agustus: 7,
  aug: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
};

function parseSessionDateToTimestamp(raw?: string): number {
  if (!raw) return 0;
  const clean = raw.trim();
  const match = clean.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const day = Number(match[1]);
    const monthKey = match[2].toLowerCase();
    const year = Number(match[3]);
    const monthIdx = INDONESIAN_MONTHS[monthKey];
    if (monthIdx !== undefined) {
      return new Date(year, monthIdx, day).getTime();
    }
  }
  const direct = Date.parse(clean);
  return Number.isNaN(direct) ? 0 : direct;
}

function extractCreatedSequence(id: string): number {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

export const HomepageView: React.FC = () => {
  const {
    currentUser,
    getUser,
    config,
    updateConfig,
    tasks,
    deliverables,
    updateDeliverable,
    verifiedLogbooksCount,
    users,
    raciRows,
    meetingLogs,
    slideDecks,
    overallWeightedProgress,
    setActiveTab,
    isPM,
    workOrders,
    setSelectedWorkOrderId,
    startWorkOrder,
    unblockWorkOrder,
    submitWorkOrder,
    approveWorkOrder,
  } = useApp();

  const [nowMs, setNowMs] = useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const tenderCountdown = useMemo(() => {
    const targetMs = new Date('2026-12-15T23:59:00+07:00').getTime();
    const startMs = new Date('2026-09-01T00:00:00+07:00').getTime();
    const diffMs = Math.max(0, targetMs - nowMs);
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const totalSpan = Math.max(1, targetMs - startMs);
    const elapsedRatio = Math.min(1, Math.max(0, (nowMs - startMs) / totalSpan));
    const dashOffset = Math.round(264 * elapsedRatio);
    return { days, hours, minutes, dashOffset };
  }, [nowMs]);

  const validRaciCount = useMemo(
    () => raciRows.filter((r) => r.validationStatus.startsWith('Valid')).length,
    [raciRows]
  );

  // Widget Tugas Saya (Work Order) & Arsip Checklist Lama (Baca-Saja)
  const [woWidgetScope, setWoWidgetScope] = useState<'mine' | 'team'>('mine');
  const [busyWoId, setBusyWoId] = useState<string | null>(null);
  const [showLegacyTasksModal, setShowLegacyTasksModal] = useState(false);

  const todayYmd = getTodayLocalYmd();

  const myActiveWorkOrders = useMemo(
    () =>
      sortWorkOrdersForCockpit(
        workOrders.filter(
          (wo) =>
            WO_ACTIVE_STATUSES.includes(wo.status) &&
            isUserWorkOrderAssignee(wo, currentUser.id, getUser)
        ),
        todayYmd
      ),
    [workOrders, currentUser.id, getUser, todayYmd]
  );

  const myOverdueCount = useMemo(
    () => myActiveWorkOrders.filter((wo) => isWorkOrderOverdue(wo, todayYmd)).length,
    [myActiveWorkOrders, todayYmd]
  );

  const teamActiveWorkOrders = useMemo(
    () =>
      sortWorkOrdersForCockpit(
        workOrders.filter((wo) => WO_ACTIVE_STATUSES.includes(wo.status)),
        todayYmd
      ),
    [workOrders, todayYmd]
  );

  const teamOverdueCount = useMemo(
    () => teamActiveWorkOrders.filter((wo) => isWorkOrderOverdue(wo, todayYmd)).length,
    [teamActiveWorkOrders, todayYmd]
  );

  const teamStatusCounts = useMemo(() => {
    const counts: Record<WorkOrderStatus, number> = {
      Ditugaskan: 0,
      Dikerjakan: 0,
      Blocked: 0,
      Diajukan: 0,
      Selesai: 0,
      Dibatalkan: 0,
    };
    workOrders.forEach((wo) => {
      counts[wo.status] += 1;
    });
    return counts;
  }, [workOrders]);

  const handleQuickWoAction = async (
    e: React.MouseEvent,
    wo: WorkOrder,
    action: 'start' | 'submit' | 'unblock' | 'complete-self' | 'detail'
  ) => {
    e.stopPropagation();
    if (action === 'detail') {
      setSelectedWorkOrderId(wo.id);
      return;
    }
    setBusyWoId(wo.id);
    try {
      if (action === 'start') {
        await startWorkOrder(wo.id);
      } else if (action === 'unblock') {
        await unblockWorkOrder(wo.id);
      } else if (action === 'submit') {
        await submitWorkOrder(wo.id);
      } else if (action === 'complete-self') {
        await approveWorkOrder(wo.id);
      }
    } catch {
      // Apabila butuh input tambahan (mis. bukti wajib), arahkan ke panel detail
      setSelectedWorkOrderId(wo.id);
    } finally {
      setBusyWoId(null);
    }
  };

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeText, setNoticeText] = useState(config.noticeBanner.text);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editProjectStatus, setEditProjectStatus] = useState<ProjectStatusKey>(
    config.projectStatus
  );
  const [editStatusDesc, setEditStatusDesc] = useState(config.statusDescription);
  const [editSpeedAudit, setEditSpeedAudit] = useState(config.speedAuditPercent);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingAgenda, setMeetingAgenda] = useState(config.upcomingMeeting.mainAgenda);
  const [meetingDate, setMeetingDate] = useState(config.upcomingMeeting.date);

  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableItem | null>(null);
  const [editProgress, setEditProgress] = useState(0);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const activeStatusConfig =
    PROJECT_STATUS_MAP[config.projectStatus] || PROJECT_STATUS_MAP['ON TRACK'];
  const StatusIcon = activeStatusConfig.IconComponent;

  const logbookTarget = 72;

  // Latest Meeting Log (sorted by session date desc, fallback to week desc, then creation id desc)
  const latestMeetingLog = useMemo<MeetingLogItem | null>(() => {
    if (!meetingLogs || meetingLogs.length === 0) return null;
    const sorted = [...meetingLogs].sort((a, b) => {
      const dateDiff =
        parseSessionDateToTimestamp(b.dayText) - parseSessionDateToTimestamp(a.dayText);
      if (dateDiff !== 0) return dateDiff;
      const weekDiff = (b.week || 0) - (a.week || 0);
      if (weekDiff !== 0) return weekDiff;
      return extractCreatedSequence(b.id) - extractCreatedSequence(a.id);
    });
    return sorted[0] || null;
  }, [meetingLogs]);

  // Latest Slide Deck (sorted by session date desc, fallback to week desc, then creation id desc)
  const latestSlideDeck = useMemo<SlideDeckItem | null>(() => {
    if (!slideDecks || slideDecks.length === 0) return null;
    const sorted = [...slideDecks].sort((a, b) => {
      const dateDiff =
        parseSessionDateToTimestamp(b.date) - parseSessionDateToTimestamp(a.date);
      if (dateDiff !== 0) return dateDiff;
      const weekDiff = (b.week || 0) - (a.week || 0);
      if (weekDiff !== 0) return weekDiff;
      return extractCreatedSequence(b.id) - extractCreatedSequence(a.id);
    });
    return sorted[0] || null;
  }, [slideDecks]);

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      noticeBanner: {
        ...config.noticeBanner,
        text: noticeText,
      },
    });
    setShowNoticeModal(false);
  };

  const handleOpenStatusModal = () => {
    setEditProjectStatus(config.projectStatus);
    setEditStatusDesc(config.statusDescription);
    setEditSpeedAudit(config.speedAuditPercent);
    setShowStatusModal(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      projectStatus: editProjectStatus,
      statusDescription: editStatusDesc.trim() || config.statusDescription,
      speedAuditPercent: Number(editSpeedAudit),
    });
    setShowStatusModal(false);
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      upcomingMeeting: {
        ...config.upcomingMeeting,
        date: meetingDate,
        mainAgenda: meetingAgenda,
      },
    });
    setShowMeetingModal(false);
  };

  const handleSaveDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliverable) return;
    updateDeliverable(selectedDeliverable.id, { progress: Number(editProgress) });
    setShowDeliverableModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* TOP ZONE: Large Bold Welcome Heading + Compact Description/Pills & 3 Metric Cards */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* ROW 1: Large Bold Welcome Heading Directly on Gradient Canvas */}
        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
          Welcome in, {currentUser.nickname || currentUser.name.split(' ')[0]}
        </h1>

        {/* ROW 2: 2 Columns with Equal Stretched Height (Left: Desc + Pills, Right: 3 Metric Cards) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* LEFT (col-span-7): Compact Faint Glass Description Box + 3 Pills */}
          <div className="xl:col-span-7 flex flex-col justify-between gap-2.5 h-full">
            <div className="glass-faint px-4 py-2.5 flex items-center">
              <p className="text-xs sm:text-[13.5px] leading-snug text-[#0B1B33] line-clamp-2">
                Area 1 Methanol Dehydration to Di-Methyl Ether (DME). Lead operations control, milestone track, and RACI distribution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-[#0B1B33] text-white text-[12px] font-medium tracking-normal inline-flex items-center">
                CAPSTONE EP-2026
              </span>
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0B1B33] text-[12px] font-medium tracking-normal inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4CBAF5] shrink-0" />
                <span>FEED Stage-Gate Status: In Progress</span>
              </span>
              <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold tracking-normal inline-flex items-center">
                EPC Phase: Concept &amp; FEED Verification
              </span>
            </div>
          </div>

          {/* RIGHT (col-span-5): 3 Compact Glass Metric Cards Matched to Left Block Height */}
          <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch h-full">
            {/* Metric 1: Logbook ACC */}
            <div className="glass-card px-4 py-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#0B1B33] leading-none truncate">
                  Logbook ACC
                </span>
                <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-4 h-4 text-[#0062CC]" />
                </div>
              </div>

              <div className="mt-1.5">
                <span className="font-heading text-2xl xl:text-[28px] font-bold leading-none tabular-nums text-[#0B1B33] block">
                  {verifiedLogbooksCount} / {logbookTarget}
                </span>
                <span className="text-[11px] text-[#334155] leading-tight block mt-1 truncate">
                  Target 72 (12 Kelompok + 60 Anggota)
                </span>
              </div>
            </div>

            {/* Metric 2: Engineers */}
            <div className="glass-card px-4 py-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#0B1B33] leading-none truncate">
                  Engineers
                </span>
                <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#0062CC]" />
                </div>
              </div>

              <div className="mt-1.5">
                <span className="font-heading text-2xl xl:text-[28px] font-bold leading-none tabular-nums text-[#0B1B33] block">
                  {users.length}
                </span>
                <span className="text-[11px] text-[#334155] leading-tight block mt-1 truncate">
                  anggota tim
                </span>
              </div>
            </div>

            {/* Metric 3: Weekly Reviews */}
            <div className="glass-card px-4 py-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#0B1B33] leading-none truncate">
                  Weekly Reviews
                </span>
                <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-4 h-4 text-[#0062CC]" />
                </div>
              </div>

              <div className="mt-1.5">
                <span className="font-heading text-2xl xl:text-[28px] font-bold leading-none tabular-nums text-[#0B1B33] block">
                  {meetingLogs.length}
                </span>
                <span className="text-[11px] text-[#334155] leading-tight block mt-1 truncate">
                  sesi asistensi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOTICE BANNER ("INFORMASI PENTING! - PM") */}
      {/* ========================================================================= */}
      <div className="glass-card px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-heading text-xs font-bold text-[#0B1B33]">
              {config.noticeBanner.title}
            </span>
            <span className="px-2.5 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-full text-[10px] font-extrabold uppercase">
              {config.noticeBanner.badge}
            </span>
            <span className="text-xs text-[#334155] truncate">
              {config.noticeBanner.text}
            </span>
          </div>
        </div>

        {isPM && (
          <button
            type="button"
            onClick={() => {
              setNoticeText(config.noticeBanner.text);
              setShowNoticeModal(true);
            }}
            className="w-11 h-11 rounded-full hover:bg-[rgba(234,246,253,0.7)] text-[#334155] hover:text-[#0062CC] flex items-center justify-center transition-colors shrink-0"
            title="Edit Pengumuman PM"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CORE BENTO GRID (3 Columns on >= 1280px, aligned bottom edges) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* ==================== LEFT COLUMN (3 cols) ==================== */}
        <div className="xl:col-span-3 flex flex-col gap-5">
          {/* Profile Identity Card */}
          <div className="relative w-full h-[340px] rounded-[32px] overflow-hidden border border-white/70 shadow-cockpit-card hover:shadow-cockpit-pop transition-all group">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="absolute inset-0 w-full h-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B33] via-[#004A9E] to-[#007BFF] bg-tech-grid flex items-center justify-center pb-12">
                <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 text-white font-heading font-extrabold text-3xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                  {currentUser.avatarInitial || currentUser.code}
                </div>
              </div>
            )}

            <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[10px] font-heading font-extrabold border border-white/20 shadow-xs pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>{currentUser.role === 'admin' ? 'PM LEAD' : 'ENGINEER'}</span>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-16 pb-5 px-5 flex items-end justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h3 className="font-heading font-extrabold text-lg text-white leading-tight drop-shadow-sm truncate">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs truncate flex items-center gap-1.5">
                  <span>{currentUser.title}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-[#93C5FD] font-semibold">@{currentUser.nickname}</span>
                </p>
              </div>
              <div className="shrink-0 px-3.5 py-1.5 rounded-full border border-white/60 bg-white/15 backdrop-blur-md text-white text-xs font-heading font-extrabold tracking-wide shadow-xs flex items-center justify-center">
                {currentUser.raciTag}
              </div>
            </div>
          </div>

          {/* Countdown Tender Card */}
          <div className="glass-card p-5 text-center">
            <div className="flex items-center justify-between mb-1">
              <span className="font-heading font-bold text-xs text-[#0B1B33]">
                Countdown Tender
              </span>
              <Clock className="w-4 h-4 text-[#334155]" />
            </div>
            <p className="text-[11px] text-[#334155] text-left mb-3">
              Batas: {config.tenderDeadline}
            </p>

            {/* Circular Dial Indicator */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#DCEBF7"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#007BFF"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={String(tenderCountdown.dashOffset)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-2xl font-extrabold text-[#0B1B33] leading-none tabular-nums">
                  {tenderCountdown.days}
                  <span className="text-xs font-semibold ml-0.5">hari</span>
                </span>
                <span className="text-[10px] text-[#334155] font-medium mt-1 tabular-nums">
                  {tenderCountdown.hours} jam {tenderCountdown.minutes} menit
                </span>
              </div>
            </div>

            <p className="text-[10px] text-[#334155] font-semibold border-t border-[#C9DCEB] pt-2.5">
              Critical Path Milestone 04: FEED Submittal
            </p>
          </div>

          {/* Tugas Saya (Work Order) Dark Accent Card (Exception: Solid #0B1B33, Last card in Left Column -> flex-1) */}
          <div className="flex-1 bg-[#0B1B33] text-white rounded-[28px] p-5 shadow-cockpit-pop border border-[#22314a] flex flex-col justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header & Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-heading font-bold text-sm text-white">
                  Tugas Saya
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-white/15 text-white">
                    {isPM && woWidgetScope === 'team'
                      ? `${teamActiveWorkOrders.length} Aktif`
                      : `${myActiveWorkOrders.length} Aktif`}
                  </span>
                  {(isPM && woWidgetScope === 'team'
                    ? teamOverdueCount
                    : myOverdueCount) > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-[#B91C1C] text-white inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {isPM && woWidgetScope === 'team'
                        ? teamOverdueCount
                        : myOverdueCount}{' '}
                      Terlambat
                    </span>
                  )}
                </div>
              </div>

              {/* PM Scope Switch: Saya / Seluruh Tim */}
              {isPM && (
                <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-white/10 border border-white/10 mb-3">
                  <button
                    type="button"
                    onClick={() => setWoWidgetScope('mine')}
                    className={`min-h-[34px] rounded-full text-[11px] font-bold transition-all ${
                      woWidgetScope === 'mine'
                        ? 'bg-[#007BFF] text-white shadow-xs'
                        : 'text-[#9FB3C8] hover:text-white'
                    }`}
                  >
                    Saya ({myActiveWorkOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWoWidgetScope('team')}
                    className={`min-h-[34px] rounded-full text-[11px] font-bold transition-all ${
                      woWidgetScope === 'team'
                        ? 'bg-[#007BFF] text-white shadow-xs'
                        : 'text-[#9FB3C8] hover:text-white'
                    }`}
                  >
                    Seluruh Tim ({teamActiveWorkOrders.length})
                  </button>
                </div>
              )}

              {/* Content: Team Mode vs Personal Mode */}
              {isPM && woWidgetScope === 'team' ? (
                <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                  {/* Status Distribution Grid */}
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {WO_BOARD_COLUMNS.map((st) => (
                      <div
                        key={st}
                        className="p-2 rounded-xl bg-white/10 border border-white/10"
                      >
                        <span className="font-heading text-sm font-extrabold text-white tabular-nums block leading-none">
                          {teamStatusCounts[st]}
                        </span>
                        <span className="text-[9px] text-[#9FB3C8] font-semibold block mt-1 truncate">
                          {st}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Top 5 Team Active Work Orders */}
                  {teamActiveWorkOrders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-5 px-3 rounded-2xl bg-white/5 border border-white/10">
                      <CheckCircle2 className="w-6 h-6 text-[#34D399] mb-1.5" />
                      <p className="text-xs font-semibold text-white">
                        Tidak ada tugas aktif di seluruh tim
                      </p>
                      <p className="text-[11px] text-[#9FB3C8] mt-0.5">
                        Seluruh Work Order tim telah selesai dikerjakan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 flex-1">
                      {teamActiveWorkOrders.slice(0, 5).map((wo) => {
                        const overdue = isWorkOrderOverdue(wo, todayYmd);
                        const daysDelta = getDaysUntilDue(wo.dueDate, todayYmd);
                        return (
                          <div
                            key={wo.id}
                            onClick={() => setSelectedWorkOrderId(wo.id)}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-[10px] font-extrabold text-[#4CBAF5] shrink-0">
                                  {wo.code}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-bold text-white truncate">
                                  {wo.status}
                                </span>
                                {overdue && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#B91C1C] text-[9px] font-bold text-white shrink-0">
                                    +{Math.abs(daysDelta)}h
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#9FB3C8] shrink-0">
                                {formatYmdToIndonesian(wo.dueDate)}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-white leading-snug line-clamp-1">
                              {wo.title}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {wo.assigneeIds.slice(0, 3).map((uid) => (
                                  <UserChip
                                    key={`${wo.id}-tm-${uid}`}
                                    uid={uid}
                                    variant="avatar-nama"
                                    size="xs"
                                    useNickname
                                    avatarClassName="w-4 h-4 text-[8px]"
                                    nameClassName="!text-[10px] !text-[#9FB3C8] !font-normal"
                                  />
                                ))}
                              </div>
                              {wo.status === 'Diajukan' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[9px] font-extrabold shrink-0">
                                  Review PM
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : myActiveWorkOrders.length === 0 ? (
                /* Empty State Personal Mode */
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-3 rounded-2xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-7 h-7 text-[#34D399] mb-2" />
                  <p className="text-xs font-bold text-white">
                    Tidak ada tugas aktif
                  </p>
                  <p className="text-[11px] text-[#9FB3C8] mt-1 leading-relaxed">
                    Semua Work Order milik Anda sudah tuntas atau terkendali.
                  </p>
                </div>
              ) : (
                /* Top 5 Personal Active Work Orders */
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 flex-1">
                  {myActiveWorkOrders.slice(0, 5).map((wo) => {
                    const overdue = isWorkOrderOverdue(wo, todayYmd);
                    const daysDelta = getDaysUntilDue(wo.dueDate, todayYmd);
                    const isSelfPM = isExclusivelyAssignedToCurrentPM(
                      wo,
                      currentUser.id,
                      isPM,
                      getUser
                    );
                    const isRowBusy = busyWoId === wo.id;

                    return (
                      <div
                        key={wo.id}
                        onClick={() => setSelectedWorkOrderId(wo.id)}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-extrabold text-[#4CBAF5]">
                              {wo.code}
                            </span>
                            {overdue && (
                              <span className="px-1.5 py-0.5 rounded bg-[#B91C1C] text-[9px] font-bold text-white">
                                Terlambat {Math.abs(daysDelta)}h
                              </span>
                            )}
                            {wo.needsRevision && wo.status === 'Dikerjakan' && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[9px] font-extrabold inline-flex items-center gap-0.5">
                                <RotateCcw className="w-2.5 h-2.5" />
                                Revisi
                              </span>
                            )}
                            {wo.priority === 'Kritis' && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-[9px] font-extrabold">
                                Kritis
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold shrink-0 ${
                              overdue ? 'text-[#FCA5A5]' : 'text-[#9FB3C8]'
                            }`}
                          >
                            {formatYmdToIndonesian(wo.dueDate)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-white leading-snug line-clamp-2 flex-1 min-w-0">
                            {wo.title}
                          </p>

                          {/* Quick Action Button */}
                          {wo.status === 'Ditugaskan' && (
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={(e) => void handleQuickWoAction(e, wo, 'start')}
                              className="shrink-0 min-h-[30px] px-2.5 rounded-full bg-[#007BFF] hover:bg-[#0062CC] disabled:opacity-50 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Play className="w-2.5 h-2.5" />
                              Mulai
                            </button>
                          )}

                          {wo.status === 'Dikerjakan' &&
                            (isSelfPM ? (
                              <button
                                type="button"
                                disabled={isRowBusy}
                                onClick={(e) =>
                                  void handleQuickWoAction(e, wo, 'complete-self')
                                }
                                className="shrink-0 min-h-[30px] px-2.5 rounded-full bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Selesai
                              </button>
                            ) : wo.requireEvidence && !wo.evidenceUrl ? (
                              <button
                                type="button"
                                onClick={(e) =>
                                  void handleQuickWoAction(e, wo, 'detail')
                                }
                                className="shrink-0 min-h-[30px] px-2.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-extrabold transition-colors"
                              >
                                Isi Bukti
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isRowBusy}
                                onClick={(e) =>
                                  void handleQuickWoAction(e, wo, 'submit')
                                }
                                className="shrink-0 min-h-[30px] px-2.5 rounded-full bg-[#38BDF8] hover:bg-[#0EA5E9] disabled:opacity-50 text-[#0B1B33] text-[10px] font-extrabold inline-flex items-center gap-1 transition-colors"
                              >
                                <Send className="w-2.5 h-2.5" />
                                Ajukan
                              </button>
                            ))}

                          {wo.status === 'Blocked' && (
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={(e) =>
                                void handleQuickWoAction(e, wo, 'unblock')
                              }
                              className="shrink-0 min-h-[30px] px-2.5 rounded-full bg-[#FEE2E2] text-[#991B1B] text-[10px] font-extrabold transition-colors"
                            >
                              Lanjut
                            </button>
                          )}

                          {wo.status === 'Diajukan' && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/15 text-[#FDE68A] text-[10px] font-bold">
                              Diajukan
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: Navigate to Work Order Menu & Read-Only Legacy Tasks Archive */}
            <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('work-orders')}
                className="w-full min-h-[44px] bg-white/15 hover:bg-white/25 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/20"
              >
                <span>Buka Menu Work Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {tasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowLegacyTasksModal(true)}
                  className="w-full py-1.5 text-[11px] text-[#9FB3C8] hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Archive className="w-3 h-3" />
                  <span>
                    Arsip Checklist Lama ({completedTasksCount}/{tasks.length})
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================== CENTER COLUMN (5 cols) ==================== */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <div className="flex flex-col gap-5 xl:h-[340px] xl:grid xl:grid-rows-2">
          {/* Project Status Card */}
          <div
            className={`${activeStatusConfig.cardBg} ${activeStatusConfig.cardBorder} xl:h-full rounded-[28px] p-5 border shadow-cockpit-card relative overflow-hidden transition-colors duration-200`}
          >
            <div
              className={`absolute inset-y-0 left-0 w-2 ${activeStatusConfig.accentStrip}`}
              aria-hidden="true"
            />

            <div className="pl-2">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${activeStatusConfig.badgeBg} ${activeStatusConfig.badgeText} ${activeStatusConfig.badgeBorder} inline-flex items-center gap-1.5`}
                  >
                    <StatusIcon className={`w-3.5 h-3.5 ${activeStatusConfig.iconColor}`} />
                    <span>{activeStatusConfig.label}</span>
                  </span>
                  <span className={`text-xs font-semibold ${activeStatusConfig.subText}`}>
                    Disiplin Proses &amp; Instrumentasi
                  </span>
                </div>

                {isPM && (
                  <button
                    type="button"
                    onClick={handleOpenStatusModal}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 ${activeStatusConfig.editBtnHover}`}
                    title="Ubah Status Proyek (PM)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className={`font-heading font-bold text-sm ${activeStatusConfig.headingText}`}>
                {config.statusDescription}
              </p>

              <div
                className={`mt-3 pt-2.5 border-t ${activeStatusConfig.dividerBorder} text-xs ${activeStatusConfig.subText} flex flex-wrap items-center justify-between gap-2 font-semibold`}
              >
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">
                    Audit Kecepatan: {config.speedAuditPercent}%
                  </span>
                  <span>•</span>
                  <span>
                    {config.projectStatus === 'CRITICAL'
                      ? 'Perlu Tindakan Eskalasi Segera'
                      : config.projectStatus === 'NEEDS ATTENTION'
                      ? 'Perlu Perhatian & Evaluasi'
                      : 'Zero Blocker Open'}
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold ${activeStatusConfig.headingText}`}>
                  Status: {activeStatusConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Tender Deadline and Supervisor Approval Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:h-full">
            <div className="glass-card xl:h-full p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[#334155] font-medium block">
                  Batas Penyerahan Tender
                </span>
                <span className="font-heading text-lg font-bold text-[#0B1B33] block mt-1">
                  15 Des 2026
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#E2E8F0] text-[#334155] text-[10px] font-semibold">
                  {config.tenderStatusText}
                </span>
                <span className="text-[10px] text-[#334155] font-medium">
                  {config.tenderPhaseText}
                </span>
              </div>
            </div>

            <div className="glass-card xl:h-full p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-[#334155] font-medium block">
                  Status ACC Pembimbing
                </span>
                <span className="font-heading text-lg font-bold text-[#0B1B33] block mt-1">
                  {config.supervisorStatus}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#B45309]" />
                  Pending Review
                </span>
                <span className="text-[10px] text-[#334155] truncate">
                  {config.supervisorReviewer}
                </span>
              </div>
            </div>
          </div>
          </div>

          {/* Bimbingan Mendatang Card */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0062CC]" />
                <span className="font-heading font-bold text-xs text-[#0B1B33]">
                  Bimbingan Mendatang
                </span>
              </div>
              {isPM && (
                <button
                  type="button"
                  onClick={() => {
                    setMeetingDate(config.upcomingMeeting.date);
                    setMeetingAgenda(config.upcomingMeeting.mainAgenda);
                    setShowMeetingModal(true);
                  }}
                  className="w-11 h-11 rounded-full hover:bg-[rgba(234,246,253,0.7)] text-[#334155] hover:text-[#0062CC] flex items-center justify-center transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-start gap-4">
              {/* Date Box */}
              <div className="w-14 h-16 rounded-2xl bg-[rgba(234,246,253,0.7)] border border-[#C9DCEB]/60 flex flex-col items-center justify-center shrink-0">
                <span className="font-heading text-xl font-extrabold text-[#0062CC] leading-none tabular-nums">
                  {config.upcomingMeeting.dayNum}
                </span>
                <span className="text-[10px] font-bold text-[#334155] mt-0.5 uppercase">
                  {config.upcomingMeeting.month}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33]">
                  {config.upcomingMeeting.date}
                </h4>
                <p className="text-[11px] text-[#334155] mt-0.5 leading-snug">
                  {config.upcomingMeeting.location}
                </p>

                <div className="mt-2.5 p-3 rounded-2xl bg-[rgba(234,246,253,0.7)] border border-[#DCEBF7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0062CC] block mb-0.5">
                    AGENDA UTAMA
                  </span>
                  <p className="text-xs font-semibold text-[#0B1B33]">
                    {config.upcomingMeeting.mainAgenda}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Minggu Ini Card */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-bold text-xs text-[#0B1B33]">
                Timeline Minggu Ini
              </span>
              <span className="text-[10px] font-semibold text-[#334155]">
                ISO 10628 &amp; ISA-5.1 Workflow
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="px-2.5 py-1 rounded-xl bg-[#0062CC] text-white font-heading text-xs font-extrabold shrink-0">
                {config.weeklyFocus.week}
              </span>
              <div>
                <p className="text-xs font-bold text-[#0B1B33]">
                  {config.weeklyFocus.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#334155]">
                  <span className="inline-flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-[#0062CC]" />
                    {config.weeklyFocus.tag}
                  </span>
                  <span>•</span>
                  <span>{config.weeklyFocus.targetDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RACI Assignment Ringkas (Last card in Center Column -> flex-1) */}
          <div className="flex-1 glass-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-bold text-xs text-[#0B1B33]">
                  RACI Assignment Ringkas
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('team-raci')}
                  className="text-xs text-[#0062CC] font-bold hover:underline flex items-center gap-1"
                >
                  Lihat Matriks Penuh
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="px-3 py-2 rounded-2xl bg-[rgba(234,246,253,0.7)] text-xs font-medium text-[#0B1B33] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#334155] font-semibold">Otorisasi PM</span>
                  <div className="inline-flex items-center gap-1.5">
                    <UserChip
                      uid="user-rahul"
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!font-bold !text-[#0062CC]"
                    />
                    <span className="font-extrabold text-[#0062CC]">(A)</span>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-[rgba(234,246,253,0.7)] text-xs font-medium text-[#0B1B33] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#334155] font-semibold">Bab 1 URS / Sains</span>
                  <div className="inline-flex items-center gap-1.5">
                    <UserChip
                      uid="user-ihsan"
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!font-bold !text-[#0062CC]"
                    />
                    <span className="font-extrabold text-[#0062CC]">(R)</span>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-[rgba(234,246,253,0.7)] text-xs font-medium text-[#0B1B33] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#334155] font-semibold">Bab 2 FDS &amp; Kontrol</span>
                  <div className="inline-flex items-center gap-1.5">
                    <UserChip
                      uid="user-althaf"
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!font-bold !text-[#0062CC]"
                    />
                    <span className="font-extrabold text-[#0062CC]">(R)</span>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-[rgba(234,246,253,0.7)] text-xs font-medium text-[#0B1B33] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#334155] font-semibold">Bab 4 Inst. &amp; SIS</span>
                  <div className="inline-flex items-center gap-1.5">
                    <UserChip
                      uid="user-jonathan"
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!font-bold !text-[#0062CC]"
                    />
                    <span className="font-extrabold text-[#0062CC]">(R)</span>
                  </div>
                </div>
                <div className="sm:col-span-2 px-3 py-2 rounded-2xl bg-[rgba(234,246,253,0.7)] text-xs font-medium text-[#0B1B33] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#334155] font-semibold">
                    Bab 5–6 CAPEX/OPEX &amp; Ekonomi
                  </span>
                  <div className="inline-flex items-center gap-1.5">
                    <UserChip
                      uid="user-heidi"
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!font-bold !text-[#0062CC]"
                    />
                    <span className="font-extrabold text-[#0062CC]">(R)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#C9DCEB] flex items-center justify-between text-[11px] text-[#334155]">
              <span>Aturan Governance: Tepat 1 Accountable (A) &amp; min. 1 Responsible (R)</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] tabular-nums ${
                  validRaciCount === raciRows.length
                    ? 'bg-[#D1FAE5] text-[#065F46]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {validRaciCount}/{raciRows.length} Valid
              </span>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN (4 cols) ==================== */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Progress Dokumen FEED Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#0B1B33]">
                    Progress Dokumen FEED
                  </h3>
                  <p className="text-[11px] text-[#334155]">
                    Total Pembobotan Bab &amp; Lampiran A3
                  </p>
                </div>
                <span className="font-heading text-4xl font-extrabold text-[#0062CC] tabular-nums">
                  {overallWeightedProgress}%
                </span>
              </div>

              {/* Hatched Master Progress Bar */}
              <div className="w-full h-4 rounded-full bg-[#DCEBF7] overflow-hidden my-3.5 p-0.5">
                <div
                  className="h-full rounded-full bg-hatch-pattern transition-all duration-500"
                  style={{ width: `${overallWeightedProgress}%` }}
                ></div>
              </div>

              {/* Chapter Milestone Bars */}
              <div className="space-y-3 pt-1">
                {deliverables
                  .filter((d) => d.weight > 0)
                  .map((del) => (
                    <div key={del.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0B1B33] truncate max-w-[210px]">
                          {del.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-[#0B1B33] tabular-nums">
                            {del.progress}%
                          </span>
                          {isPM && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDeliverable(del);
                                setEditProgress(del.progress);
                                setShowDeliverableModal(true);
                              }}
                              className="text-[#334155] hover:text-[#0062CC]"
                              title={`Update progres ${del.title}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#334155]">
                        <div className="flex items-center gap-1.5">
                          <span>{del.targetWeek}</span>
                          {del.badgeNote && (
                            <span className="px-1.5 py-0.5 bg-[#FEE2E2] text-[#991B1B] text-[10px] font-bold rounded-md flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {del.badgeNote}
                            </span>
                          )}
                          {del.status === 'Aktif' && (
                            <span className="px-1.5 py-0.5 bg-[#DBEAFE] text-[#1E3A8A] text-[10px] font-bold rounded-md">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#DCEBF7] overflow-hidden">
                        <div
                          className="h-full bg-[#007BFF] rounded-full transition-all duration-300"
                          style={{ width: `${del.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Export Package Button */}
            <button
              type="button"
              onClick={() => {
                alert('Mengunduh arsip paket dokumen FEED Area 1: DME-FEED-Area1-Package-Rev03.zip');
              }}
              className="w-full mt-5 min-h-[44px] bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Paket FEED (.zip / PDF)
            </button>
          </div>

          {/* Terbaru dari Weekly MoM Card (Last card in Right Column -> flex-1) */}
          <div className="flex-1 glass-card p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-heading font-bold text-sm text-[#0B1B33]">
                Terbaru dari Weekly MoM
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('weekly-mom')}
                className="text-xs text-[#0062CC] font-bold hover:underline inline-flex items-center gap-1 shrink-0"
              >
                Lihat Semua
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Two Stacked Blocks Separated by 1px #C9DCEB */}
            <div className="flex-1 flex flex-col justify-between gap-3">
              {/* Block A: Meeting Log Terbaru */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#334155] mb-1.5">
                  <MessagesSquare className="w-3.5 h-3.5 text-[#0062CC]" />
                  <span>Meeting Log Terbaru</span>
                </div>

                <div className="rounded-[20px] bg-[rgba(234,246,253,0.7)] p-3.5 border border-[#DCEBF7]">
                  {latestMeetingLog ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#334155] text-[10px] font-bold">
                          {latestMeetingLog.weekLabel || `Week ${latestMeetingLog.week}`}
                        </span>
                        <span className="text-[11px] font-medium text-[#334155]">
                          {latestMeetingLog.dayText}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#0B1B33] line-clamp-2 leading-snug">
                        {latestMeetingLog.topic}
                      </p>

                      <p className="text-[11px] font-semibold text-[#334155] truncate">
                        Evaluator: <span className="text-[#0B1B33]">{latestMeetingLog.evaluator}</span>
                      </p>

                      <p className="text-[11px] text-[#334155] line-clamp-2 leading-relaxed">
                        {latestMeetingLog.summary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#334155] py-2">
                      Belum ada Meeting Log.
                    </p>
                  )}
                </div>
              </div>

              {/* 1px #C9DCEB Horizontal Divider */}
              <div className="border-t border-[#C9DCEB]" />

              {/* Block B: Slide Deck Terbaru */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#334155] mb-1.5">
                  <Presentation className="w-3.5 h-3.5 text-[#0062CC]" />
                  <span>Slide Deck Terbaru</span>
                </div>

                <div className="rounded-[20px] bg-[rgba(234,246,253,0.7)] p-3.5 border border-[#DCEBF7]">
                  {latestSlideDeck ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#334155] text-[10px] font-bold">
                          {latestSlideDeck.weekLabel || `Week ${latestSlideDeck.week}`}
                        </span>
                        <span className="text-[11px] font-medium text-[#334155]">
                          {latestSlideDeck.date}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#0B1B33] line-clamp-2 leading-snug">
                        {latestSlideDeck.title.toLowerCase().startsWith('slide deck')
                          ? latestSlideDeck.title
                          : `Slide Deck Week ${latestSlideDeck.week}: ${latestSlideDeck.title}`}
                      </p>

                      <div className="pt-1.5 border-t border-[#C9DCEB]/60 flex items-center justify-between gap-2">
                        <UserChip
                          uid={latestSlideDeck.presenter}
                          variant="avatar-nama-jabatan"
                          size="xs"
                          useNickname
                          nameClassName="!text-[11px] !font-bold !text-[#0B1B33]"
                          titleClassName="!text-[10px] !text-[#334155]"
                        />

                        <a
                          href={latestSlideDeck.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full bg-[#0062CC] hover:bg-[#0057B8] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#334155] py-2">
                      Belum ada Slide Deck.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Edit Project Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF6FD]">
              <h3 className="font-heading font-bold text-sm text-[#0B1B33]">
                Ubah Status Proyek (PM)
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-11 h-11 rounded-full bg-[#EAF6FD] text-[#0B1B33] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1B33] mb-2">
                  Pilih Status Proyek
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {(['ON TRACK', 'NEEDS ATTENTION', 'CRITICAL'] as ProjectStatusKey[]).map(
                    (statusKey) => {
                      const st = PROJECT_STATUS_MAP[statusKey];
                      const ItemIcon = st.IconComponent;
                      const isSelected = editProjectStatus === statusKey;
                      return (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => {
                            setEditProjectStatus(statusKey);
                          }}
                          className={`w-full min-h-[44px] px-4 py-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            st.cardBg
                          } ${st.badgeText} ${
                            isSelected
                              ? 'ring-2 ring-[#0B1B33] border-[#0B1B33] font-extrabold'
                              : `${st.cardBorder} opacity-85 hover:opacity-100 font-bold`
                          }`}
                        >
                          <span className="flex items-center gap-2.5 text-xs">
                            <ItemIcon className={`w-4 h-4 ${st.iconColor}`} />
                            <span>{st.label}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/80">
                              Aktif
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1B33] mb-1">
                  Deskripsi Status
                </label>
                <input
                  type="text"
                  value={editStatusDesc}
                  onChange={(e) => setEditStatusDesc(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none focus:border-[#0062CC]"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0B1B33]">Audit Kecepatan (%)</span>
                  <span className="font-bold text-[#0062CC] tabular-nums">
                    {editSpeedAudit}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editSpeedAudit}
                  onChange={(e) => setEditSpeedAudit(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] hover:bg-[#EAF6FD] rounded-full"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold rounded-full shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read-Only Legacy Tasks Archive Modal */}
      {showLegacyTasksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legacy-tasks-archive-title"
        >
          <div className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF6FD]">
              <div>
                <h3
                  id="legacy-tasks-archive-title"
                  className="font-heading font-bold text-sm text-[#0B1B33]"
                >
                  Arsip Checklist Lama ({completedTasksCount}/{tasks.length})
                </h3>
                <p className="text-[11px] text-[#4A5A72] mt-0.5">
                  Mode baca-saja • Penugasan aktif kini terpusat di menu Work Order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLegacyTasksModal(false)}
                className="w-11 h-11 rounded-full bg-[#EAF6FD] text-[#0B1B33] flex items-center justify-center shrink-0"
                aria-label="Tutup Arsip Checklist Lama"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#EAF6FD] text-[11px] text-[#0B1B33] leading-relaxed">
              Daftar tugas minggu awal disimpan utuh sebagai arsip referensi proyek tanpa perubahan data.
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F8FAFC] border border-[#EAF6FD]"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${
                        task.completed
                          ? 'line-through text-[#64748B]'
                          : 'text-[#0B1B33] font-semibold'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-[#4A5A72]">
                      <UserChip
                        uid={task.pic}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                        avatarClassName="w-4 h-4 text-[8px]"
                        nameClassName="!text-[10px] !text-[#4A5A72] !font-semibold"
                      />
                      <span>• {task.day}</span>
                      {task.week && <span>• {task.week}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLegacyTasksModal(false)}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] hover:bg-[#EAF6FD] rounded-full"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLegacyTasksModal(false);
                  setActiveTab('work-orders');
                }}
                className="min-h-[44px] px-5 py-2 bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold rounded-full shadow-xs"
              >
                Buka Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Perbarui Informasi Penting (PM)
            </h3>
            <form onSubmit={handleSaveNotice} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B1B33] mb-1">
                  Isi Pengumuman
                </label>
                <textarea
                  rows={3}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none focus:border-[#0062CC]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Perbarui Jadwal Bimbingan
            </h3>
            <form onSubmit={handleSaveMeeting} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B1B33] mb-1">
                  Hari &amp; Tanggal
                </label>
                <input
                  type="text"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0B1B33] mb-1">
                  Agenda Utama
                </label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deliverable Progress Modal */}
      {showDeliverableModal && selectedDeliverable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-2 border-b border-[#EAF6FD]">
              Update Progres: {selectedDeliverable.title}
            </h3>
            <form onSubmit={handleSaveDeliverable} className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Persentase (%)</span>
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
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeliverableModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Perbarui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
