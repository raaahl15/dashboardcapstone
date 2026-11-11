import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { DataHealthPanel } from '../common/DataHealthPanel';
import { getRaciRoleForUserRecord } from '../../utils/migrateUserRefs';
import { STATUS_PILL, deliverableProgress, deliverableStatus } from '../../utils/docStatus';
import { parseIndoDate } from '../common/StageGateTimeline';
import {
  Config,
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
    cardBg: 'bg-success-soft',
    cardBorder: 'border-success-line/25',
    accentStrip: 'bg-success-solid',
    badgeBg: 'bg-success-soft',
    badgeText: 'text-success',
    badgeBorder: 'border-success-line/35',
    iconColor: 'text-success',
    headingText: 'text-success',
    subText: 'text-success/85',
    dividerBorder: 'border-success-line/20',
    editBtnHover: 'hover:bg-surface/70 text-success',
    IconComponent: CheckCircle2,
  },
  'NEEDS ATTENTION': {
    label: 'NEEDS ATTENTION',
    cardBg: 'bg-warm-soft',
    cardBorder: 'border-warm-line/25',
    accentStrip: 'bg-warm-solid',
    badgeBg: 'bg-warm-soft',
    badgeText: 'text-warm',
    badgeBorder: 'border-warm-line/35',
    iconColor: 'text-warm',
    headingText: 'text-warm',
    subText: 'text-warm/85',
    dividerBorder: 'border-warm-line/20',
    editBtnHover: 'hover:bg-surface/70 text-warm',
    IconComponent: AlertTriangle,
  },
  CRITICAL: {
    label: 'CRITICAL',
    cardBg: 'bg-danger-soft',
    cardBorder: 'border-danger-line/25',
    accentStrip: 'bg-danger-solid',
    badgeBg: 'bg-danger-soft',
    badgeText: 'text-danger',
    badgeBorder: 'border-danger-line/35',
    iconColor: 'text-danger',
    headingText: 'text-danger',
    subText: 'text-danger/85',
    dividerBorder: 'border-danger-line/20',
    editBtnHover: 'hover:bg-surface/70 text-danger',
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

  // Tenggat dari satu sumber: config.tenderDeadline + config.projectStartDate (P1 audit, LOG-030)
  const tenderTargetMs = useMemo(() => {
    const d = parseIndoDate(config.tenderDeadline);
    if (!d) return new Date('2026-12-15T23:59:00+07:00').getTime(); // RFP KAK-IC-DME-2026-001
    d.setHours(23, 59, 0, 0);
    return d.getTime();
  }, [config.tenderDeadline]);
  const projectStartMs = useMemo(() => {
    const [y, m, d] = config.projectStartDate.split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d).getTime() : tenderTargetMs - 16 * 7 * 86400000;
  }, [config.projectStartDate, tenderTargetMs]);

  const accSummary = useMemo(() => {
    const statuses = deliverables.map((d) => deliverableStatus(d));
    return {
      total: deliverables.length,
      acc: statuses.filter((s) => s === 'ACC Pembimbing').length,
      submitted: statuses.filter((s) => s === 'Diajukan').length,
    };
  }, [deliverables]);

  const tenderCountdown = useMemo(() => {
    const targetMs = tenderTargetMs;
    const startMs = projectStartMs;
    const diffMs = Math.max(0, targetMs - nowMs);
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const totalSpan = Math.max(1, targetMs - startMs);
    const elapsedRatio = Math.min(1, Math.max(0, (nowMs - startMs) / totalSpan));
    const dashOffset = Math.round(264 * elapsedRatio);
    return { days, hours, minutes, dashOffset };
  }, [nowMs, tenderTargetMs, projectStartMs]);

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
  const [noticeHidden, setNoticeHidden] = useState(false);
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

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* TOP ZONE v2.0: sapaan + kartu hero tenggat FEED + 4 ubin metrik */}
      <div className="flex flex-col gap-4 max-sm:contents">
        <h1 className="max-sm:order-1 font-heading text-3xl sm:text-4xl font-normal leading-tight text-fg">
          Selamat datang, {currentUser.nickname || currentUser.name.split(' ')[0]}{' '}
          <span className="font-accent text-primary text-[0.8em] whitespace-nowrap">
            — {tenderCountdown.days} hari menuju FEED
          </span>
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch max-sm:contents">
          <div className="max-sm:order-2 xl:col-span-4 bg-hero rounded-[32px] p-6 sm:p-7 shadow-cockpit-pop flex flex-col justify-between gap-5 min-h-[280px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-ink-2">
                Tenggat FEED · Gate G2
              </p>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="font-heading text-7xl sm:text-8xl font-extralight leading-none tabular-nums">
                  {tenderCountdown.days}
                </span>
                <span className="font-heading text-2xl font-light">hari</span>
              </p>
              <p className="mt-2 text-sm text-on-ink-2 tabular-nums">
                {tenderCountdown.hours} jam {tenderCountdown.minutes} menit lagi · {config.tenderDeadline}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Progress dokumen FEED</span>
                <span className="font-semibold tabular-nums">{overallWeightedProgress}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-on-ink" style={{ width: `${overallWeightedProgress}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium">{config.tenderStatusText}</span>
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium">{config.tenderPhaseText}</span>
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium">Area 1 Reaktor · PSTF 1</span>
              </div>
            </div>
          </div>

          <div className="max-sm:order-3 xl:col-span-4 grid grid-cols-2 gap-4">
            <div className="glass-card !rounded-[28px] p-5 flex flex-col gap-2 min-h-[132px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Logbook ACC</span>
              <span className="font-heading text-4xl font-semibold leading-none tabular-nums text-fg">
                {verifiedLogbooksCount}
                <span className="text-xl font-normal text-fg-3"> / {logbookTarget}</span>
              </span>
              <span className="text-xs text-fg-2">12 kelompok + 60 anggota</span>
            </div>
            <div className="glass-card !rounded-[28px] p-5 flex flex-col gap-2 min-h-[132px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">WO aktif tim</span>
              <span className="font-heading text-4xl font-semibold leading-none tabular-nums text-fg">
                {teamActiveWorkOrders.length}
              </span>
              <span
                className={`self-start px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  teamOverdueCount > 0 ? 'bg-warm-soft text-warm' : 'bg-success-soft text-success'
                }`}
              >
                {teamOverdueCount} terlambat
              </span>
            </div>
            <div className="max-sm:hidden glass-card !rounded-[28px] p-5 flex flex-col gap-2 min-h-[132px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Sesi asistensi</span>
              <span className="font-heading text-4xl font-semibold leading-none tabular-nums text-fg">
                {meetingLogs.length}
              </span>
              <span className="text-xs text-fg-2">weekly review tercatat</span>
            </div>
            <div className="max-sm:hidden glass-card !rounded-[28px] p-5 flex flex-col gap-2 min-h-[132px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">ACC pembimbing</span>
              <span className="font-heading text-4xl font-semibold leading-none tabular-nums text-fg">
                {accSummary.acc}
                <span className="text-xl font-normal text-fg-3"> / {accSummary.total} bab</span>
              </span>
              <span className="self-start px-2.5 py-0.5 rounded-full bg-primary-soft text-fg-2 text-[11px] font-semibold">
                {accSummary.submitted} menunggu ACC
              </span>
            </div>
          </div>

          {/* Bimbingan berikutnya (dipindah ke baris atas, v2.0) */}
          <div className="max-sm:order-6 xl:col-span-4 glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-2xl font-normal text-fg">Bimbingan</h2>
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 rounded-full bg-primary-soft text-fg-2 text-xs font-semibold">Berikutnya</span>
                {isPM && (
                  <button
                    type="button"
                    onClick={() => {
                      setMeetingDate(config.upcomingMeeting.date);
                      setMeetingAgenda(config.upcomingMeeting.mainAgenda);
                      setShowMeetingModal(true);
                    }}
                    className="w-10 h-10 rounded-full hover:bg-muted text-fg-2 hover:text-primary flex items-center justify-center transition-colors"
                    title="Ubah jadwal bimbingan (PM)"
                    aria-label="Ubah jadwal bimbingan"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-[22px] bg-primary text-on-primary flex flex-col items-center justify-center shrink-0">
                <span className="font-heading text-3xl font-semibold leading-none tabular-nums">{config.upcomingMeeting.dayNum}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] mt-1">{config.upcomingMeeting.month}</span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-fg">{config.upcomingMeeting.date}</p>
                <p className="text-sm text-fg-2">{config.upcomingMeeting.location}</p>
                <p className="text-xs text-fg-3 truncate">{config.supervisorReviewer}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Agenda utama</p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-2 line-clamp-5">{config.upcomingMeeting.mainAgenda}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pengumuman PM: strip tipis, bisa ditutup untuk sesi ini */}
      {!noticeHidden && (
        <div className="max-sm:order-5 rounded-full bg-warm-soft pl-2 pr-3 py-2 flex items-center gap-3 min-h-[52px]">
          <span className="shrink-0 px-3.5 py-1.5 rounded-full bg-warm-solid text-on-ink text-xs font-semibold uppercase tracking-wide">
            {config.noticeBanner.badge}
          </span>
          <p className="flex-1 min-w-0 text-sm text-fg truncate" title={config.noticeBanner.text}>
            <span className="font-semibold">{config.noticeBanner.title}:</span> {config.noticeBanner.text}
          </p>
          {isPM && (
            <button
              type="button"
              onClick={() => {
                setNoticeText(config.noticeBanner.text);
                setShowNoticeModal(true);
              }}
              className="w-9 h-9 rounded-full hover:bg-surface/60 text-warm flex items-center justify-center shrink-0"
              title="Edit pengumuman PM"
              aria-label="Edit pengumuman PM"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={() => setNoticeHidden(true)} className="shrink-0 px-2 text-sm font-semibold text-warm hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Baris utama bawah: Tugas saya, Dokumen FEED, Kesehatan data */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch max-sm:contents">
        {/* Tugas saya */}
        <section className="max-sm:order-4 xl:col-span-5 glass-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-2xl font-normal text-fg">Tugas saya</h2>
            <button
              type="button"
              onClick={() => setActiveTab('work-orders')}
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              {(isPM && woWidgetScope === 'team' ? teamActiveWorkOrders : myActiveWorkOrders).length} aktif · Semua WO
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isPM && (
            <div className="mt-3 inline-flex self-start items-center gap-1 p-1 rounded-full bg-muted border border-line">
              {(['mine', 'team'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setWoWidgetScope(sc)}
                  className={`min-h-[34px] px-3.5 rounded-full text-xs transition-all ${
                    woWidgetScope === sc ? 'bg-surface text-fg font-semibold shadow-xs' : 'text-fg-2 font-medium'
                  }`}
                >
                  {sc === 'mine' ? `Saya (${myActiveWorkOrders.length})` : `Seluruh tim (${teamActiveWorkOrders.length})`}
                </button>
              ))}
            </div>
          )}

          {isPM && woWidgetScope === 'team' && (
            <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
              {WO_BOARD_COLUMNS.map((st) => (
                <div key={st} className="py-2 rounded-2xl bg-muted">
                  <span className="block text-base font-semibold text-fg tabular-nums leading-none">{teamStatusCounts[st]}</span>
                  <span className="block text-[10px] text-fg-3 mt-1 truncate">{st}</span>
                </div>
              ))}
            </div>
          )}

          {(() => {
            const list = isPM && woWidgetScope === 'team' ? teamActiveWorkOrders : myActiveWorkOrders;
            const pillOf = (wo: WorkOrder) => {
                  const overdue = isWorkOrderOverdue(wo, todayYmd);
                  if (overdue) return { cls: 'bg-warm-soft text-warm', label: `Terlambat ${Math.abs(getDaysUntilDue(wo.dueDate, todayYmd))}h` };
                  if (wo.status === 'Dikerjakan' && wo.needsRevision) return { cls: 'bg-warm-soft text-warm', label: 'Revisi' };
                  if (wo.status === 'Dikerjakan') return { cls: 'bg-primary-soft text-fg-2', label: 'Dikerjakan' };
                  if (wo.status === 'Blocked') return { cls: 'bg-danger-soft text-danger', label: 'Blocked' };
                  if (wo.status === 'Diajukan') return { cls: 'bg-warm-soft text-warm', label: 'Review PM' };
                  return { cls: 'border border-line-strong text-fg-2', label: wo.status };
                };
            if (list.length === 0) {
              return (
                <div className="flex-1 mt-4 flex flex-col items-center justify-center text-center py-8 rounded-[24px] border border-dashed border-line-strong">
                  <CheckCircle2 className="w-6 h-6 text-success mb-2" />
                  <p className="text-sm font-semibold text-fg">Tidak ada tugas aktif</p>
                  <p className="text-xs text-fg-3 mt-1">Semua Work Order sudah tuntas atau terkendali.</p>
                </div>
              );
            }
            return (
              <ul className="mt-4 space-y-2.5 flex-1">
                {list.slice(0, 5).map((wo) => {
                  const pill = pillOf(wo);
                  const isSelfPM = isExclusivelyAssignedToCurrentPM(wo, currentUser.id, isPM, getUser);
                  const isRowBusy = busyWoId === wo.id;
                  const mine = woWidgetScope === 'mine' || !isPM;
                  const action: { key: 'start' | 'submit' | 'unblock' | 'complete-self' | 'detail'; label: string } | null = !mine
                    ? null
                    : wo.status === 'Ditugaskan'
                    ? { key: 'start', label: 'Mulai' }
                    : wo.status === 'Blocked'
                    ? { key: 'unblock', label: 'Lanjut' }
                    : wo.status === 'Dikerjakan'
                    ? isSelfPM
                      ? { key: 'complete-self', label: 'Selesai' }
                      : wo.requireEvidence && !wo.evidenceUrl
                      ? { key: 'detail', label: 'Isi bukti' }
                      : { key: 'submit', label: 'Ajukan' }
                    : null;
                  return (
                    <li key={wo.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWorkOrderId(wo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedWorkOrderId(wo.id);
                        }}
                        className="min-h-[64px] px-3 py-2.5 rounded-[20px] bg-surface hover:shadow-cockpit-card transition-all flex items-center gap-3 cursor-pointer"
                      >
                        <span className="shrink-0 px-2.5 py-1 rounded-xl bg-primary-soft text-fg-2 text-xs font-semibold tabular-nums">
                          {wo.code}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-fg truncate">{wo.title}</span>
                          <span className="block text-xs text-fg-3 truncate">
                            {wo.priority} · tenggat {formatYmdToIndonesian(wo.dueDate)} ·{' '}
                            {wo.origin.type === 'mom' ? `MoM ${wo.origin.trackerActionCode}` : `W${wo.projectWeek}`}
                          </span>
                        </span>
                        {action ? (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={(e) => void handleQuickWoAction(e, wo, action.key)}
                            className={`shrink-0 min-h-[32px] px-3 rounded-full text-xs font-semibold disabled:opacity-50 transition-colors ${
                              action.key === 'complete-self'
                                ? 'bg-success-solid text-on-ink'
                                : action.key === 'detail' || action.key === 'unblock'
                                ? 'bg-warm-soft text-warm'
                                : 'bg-primary text-on-primary'
                            }`}
                            title={pill.label}
                          >
                            {action.label}
                          </button>
                        ) : (
                          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${pill.cls}`}>{pill.label}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()}

          {tasks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLegacyTasksModal(true)}
              className="mt-3 self-center py-1.5 text-xs text-fg-3 hover:text-fg font-medium inline-flex items-center gap-1.5"
            >
              <Archive className="w-3 h-3" />
              Arsip checklist lama ({completedTasksCount}/{tasks.length})
            </button>
          )}
        </section>

        {/* Dokumen FEED */}
        <section className="max-sm:order-7 xl:col-span-4 glass-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-2xl font-normal text-fg">Dokumen FEED</h2>
            <span className="text-sm font-semibold text-primary tabular-nums">Total {overallWeightedProgress}%</span>
          </div>
          <ul className="mt-4 space-y-3.5 flex-1">
            {deliverables
              .filter((d) => d.weight > 0)
              .map((del) => {
                const delStatus = deliverableStatus(del);
                const delProgress = deliverableProgress(del);
                const critical = !!del.badgeNote && delProgress === 0;
                return (
                  <li key={del.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('workspaces')}
                      className="w-full text-left"
                      title={del.badgeNote ? `${del.title} — ${del.badgeNote}` : del.title}
                    >
                      <span className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-fg truncate">{del.title}</span>
                        <span className={`shrink-0 tabular-nums ${critical ? 'font-semibold text-warm' : 'text-fg-2'}`}>
                          {delProgress}% · {critical ? 'Jalur kritis' : delStatus}
                        </span>
                      </span>
                      <span className={`mt-1.5 block h-1.5 rounded-full overflow-hidden ${critical ? 'bg-warm-soft' : 'bg-muted'}`}>
                        <span
                          className={`block h-full rounded-full ${delProgress >= 80 ? 'bg-primary' : 'bg-chart-2'}`}
                          style={{ width: `${delProgress}%` }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
          <button
            type="button"
            onClick={() => setActiveTab('gworkspace')}
            className="mt-5 w-full min-h-[48px] rounded-full border border-line-strong bg-surface text-primary text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            Buka dokumen master
            <ExternalLink className="w-4 h-4" />
          </button>
        </section>

        {/* Kesehatan data */}
        <div className="max-sm:order-8 xl:col-span-3">
          <DataHealthPanel variant="list" />
        </div>
      </div>

      {/* Ringkasan lain: tidak ada di desain utama, dipertahankan agar fitur PM (status proyek, fokus minggu) tetap ada */}
      <div className="max-sm:order-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Status proyek */}
        <section className={`rounded-[28px] p-5 border shadow-cockpit-card ${activeStatusConfig.cardBg} ${activeStatusConfig.cardBorder}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 ${activeStatusConfig.badgeBg} ${activeStatusConfig.badgeText} ${activeStatusConfig.badgeBorder}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${activeStatusConfig.iconColor}`} />
              {activeStatusConfig.label}
            </span>
            {isPM && (
              <button
                type="button"
                onClick={handleOpenStatusModal}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeStatusConfig.editBtnHover}`}
                title="Ubah status proyek (PM)"
                aria-label="Ubah status proyek"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className={`mt-3 text-sm font-semibold leading-snug ${activeStatusConfig.headingText}`}>{config.statusDescription}</p>
          <p className={`mt-2 text-xs ${activeStatusConfig.subText}`}>
            Audit kecepatan {config.speedAuditPercent}% · Disiplin Proses &amp; Instrumentasi
          </p>
        </section>

        {/* Fokus minggu ini */}
        <section className="glass-card !rounded-[28px] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Fokus minggu ini</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="px-2.5 py-1 rounded-xl bg-primary text-on-primary text-xs font-semibold shrink-0">{config.weeklyFocus.week}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg leading-snug">{config.weeklyFocus.title}</p>
              <p className="mt-1.5 text-xs text-fg-3 inline-flex items-center gap-1">
                <Flag className="w-3 h-3 text-primary" /> {config.weeklyFocus.tag} · {config.weeklyFocus.targetDate}
              </p>
            </div>
          </div>
        </section>

        {/* RACI ringkas */}
        <section className="glass-card !rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">RACI · responsible</p>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums ${
                validRaciCount === raciRows.length ? 'bg-success-soft text-success' : 'bg-warm-soft text-warm'
              }`}
            >
              {validRaciCount}/{raciRows.length} valid
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {raciRows.slice(0, 6).map((row) => {
              const responsible = users.filter((u) => getRaciRoleForUserRecord(row, u) === 'R');
              return (
                <li key={row.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-fg-2 truncate" title={row.deliverable}>{row.deliverable}</span>
                  <span className="shrink-0 font-semibold text-primary">
                    {responsible.length === 0 ? <span className="text-warm">Belum ada R</span> : responsible.map((u) => u.code).join(', ')}
                  </span>
                </li>
              );
            })}
            {raciRows.length === 0 && <li className="text-xs text-fg-3">Matriks RACI belum diisi.</li>}
          </ul>
          <button type="button" onClick={() => setActiveTab('team-raci')} className="mt-3 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
            Matriks penuh <ArrowRight className="w-3 h-3" />
          </button>
        </section>

        {/* MoM & slide terbaru */}
        <section className="glass-card !rounded-[28px] p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Terbaru dari rapat</p>
            <button type="button" onClick={() => setActiveTab('weekly-mom')} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {latestMeetingLog ? (
            <div className="mt-3">
              <p className="text-xs text-fg-3">
                <MessagesSquare className="w-3 h-3 inline text-primary mr-1" />
                {latestMeetingLog.weekLabel || `Week ${latestMeetingLog.week}`} · {latestMeetingLog.dayText}
              </p>
              <p className="mt-1 text-sm font-medium text-fg leading-snug line-clamp-2">{latestMeetingLog.topic}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-fg-3">Belum ada Meeting Log.</p>
          )}
          {latestSlideDeck && (
            <a
              href={latestSlideDeck.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto pt-3 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <Presentation className="w-3.5 h-3.5" />
              Slide {latestSlideDeck.weekLabel || `Week ${latestSlideDeck.week}`}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Edit Project Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <h3 className="v2-modal-title">
                Ubah Status Proyek (PM)
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-11 h-11 rounded-full bg-muted text-fg flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-2">
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
                              ? 'ring-2 ring-fg border-fg font-extrabold'
                              : `${st.cardBorder} opacity-85 hover:opacity-100 font-bold`
                          }`}
                        >
                          <span className="flex items-center gap-2.5 text-xs">
                            <ItemIcon className={`w-4 h-4 ${st.iconColor}`} />
                            <span>{st.label}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-surface/80">
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
                <label className="block text-xs font-semibold text-fg mb-1">
                  Deskripsi Status
                </label>
                <input
                  type="text"
                  value={editStatusDesc}
                  onChange={(e) => setEditStatusDesc(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-fg">Audit Kecepatan (%)</span>
                  <span className="font-bold text-primary tabular-nums">
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

              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 hover:bg-muted rounded-full"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold rounded-full shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legacy-tasks-archive-title"
        >
          <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto bg-surface rounded-[32px] shadow-cockpit-pop space-y-4 v2-modal v2-form">
            <div className="v2-modal-head">
              <div>
                <h3
                  id="legacy-tasks-archive-title"
                  className="v2-modal-title"
                >
                  Arsip Checklist Lama ({completedTasksCount}/{tasks.length})
                </h3>
                <p className="text-[11px] text-fg-3 mt-0.5">
                  Mode baca-saja • Penugasan aktif kini terpusat di menu Work Order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLegacyTasksModal(false)}
                className="w-11 h-11 rounded-full bg-muted text-fg flex items-center justify-center shrink-0"
                aria-label="Tutup Arsip Checklist Lama"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-muted text-[11px] text-fg leading-relaxed">
              Daftar tugas minggu awal disimpan utuh sebagai arsip referensi proyek tanpa perubahan data.
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-muted border border-line"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-fg-3 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${
                        task.completed
                          ? 'line-through text-fg-3'
                          : 'text-fg font-semibold'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-fg-3">
                      <UserChip
                        uid={task.pic}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                        avatarClassName="w-4 h-4 text-[8px]"
                        nameClassName="!text-[10px] !text-fg-3 !font-semibold"
                      />
                      <span>• {task.day}</span>
                      {task.week && <span>• {task.week}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="v2-modal-foot">
              <button
                type="button"
                onClick={() => setShowLegacyTasksModal(false)}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 hover:bg-muted rounded-full"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLegacyTasksModal(false);
                  setActiveTab('work-orders');
                }}
                className="min-h-[44px] px-5 py-2 bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold rounded-full shadow-xs"
              >
                Buka Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Beranda · PM</p>
                <h3 className="v2-modal-title">
              Perbarui Informasi Penting (PM)
            </h3>
              </div>
              <button type="button" onClick={() => setShowNoticeModal(false)} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveNotice} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  Isi Pengumuman
                </label>
                <textarea
                  rows={3}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Beranda · PM</p>
                <h3 className="v2-modal-title">
              Perbarui Jadwal Bimbingan
            </h3>
              </div>
              <button type="button" onClick={() => setShowMeetingModal(false)} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveMeeting} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  Hari &amp; Tanggal
                </label>
                <input
                  type="text"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">
                  Agenda Utama
                </label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>
              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
