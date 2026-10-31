import {
  AppNotification,
  MeetingLogItem,
  User,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '../types';

export const DEFAULT_PROJECT_START_DATE = '2026-09-14';
export const PROJECT_MIN_WEEK = 1;
export const PROJECT_MAX_WEEK = 16;

export const WO_PRIORITY_WEIGHT: Record<WorkOrderPriority, number> = {
  Kritis: 4,
  Tinggi: 3,
  Normal: 2,
  Rendah: 1,
};

export const WO_PRIORITIES: WorkOrderPriority[] = [
  'Rendah',
  'Normal',
  'Tinggi',
  'Kritis',
];

export const WO_ACTIVE_STATUSES: WorkOrderStatus[] = [
  'Ditugaskan',
  'Dikerjakan',
  'Blocked',
  'Diajukan',
];

export const WO_BOARD_COLUMNS: WorkOrderStatus[] = [
  'Ditugaskan',
  'Dikerjakan',
  'Blocked',
  'Diajukan',
  'Selesai',
];

export const WO_ALL_STATUSES: WorkOrderStatus[] = [
  'Ditugaskan',
  'Dikerjakan',
  'Blocked',
  'Diajukan',
  'Selesai',
  'Dibatalkan',
];

const INDONESIAN_MONTH_MAP: Record<string, number> = {
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

const SHORT_ID_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatDateToLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayLocalYmd(now: Date = new Date()): string {
  return formatDateToLocalYmd(now);
}

export function getDefaultDueDateYmd(daysFromNow = 7, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromNow);
  return formatDateToLocalYmd(d);
}

export function parseYmdToLocalMidnight(ymd: string): number | null {
  if (!ymd) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const dt = new Date(year, monthIdx, day, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.getTime();
}

export function parseIndonesianDateToYmd(
  raw?: string,
  fallbackDaysFromNow = 7
): string {
  if (!raw || !raw.trim()) {
    return getDefaultDueDateYmd(fallbackDaysFromNow);
  }
  const clean = raw.trim();
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(clean);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  const idMatch = clean.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (idMatch) {
    const day = Number(idMatch[1]);
    const monthKey = idMatch[2].toLowerCase();
    const year = Number(idMatch[3]);
    const monthIdx = INDONESIAN_MONTH_MAP[monthKey];
    if (monthIdx !== undefined) {
      const dt = new Date(year, monthIdx, day);
      if (!Number.isNaN(dt.getTime())) {
        return formatDateToLocalYmd(dt);
      }
    }
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateToLocalYmd(parsed);
  }

  return getDefaultDueDateYmd(fallbackDaysFromNow);
}

export function parseIndonesianDateToTimestamp(raw?: string): number {
  if (!raw) return 0;
  const ymd = parseIndonesianDateToYmd(raw, 0);
  const match = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(raw.trim());
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (!match && !isoMatch) {
    const direct = Date.parse(raw.trim());
    return Number.isNaN(direct) ? 0 : direct;
  }
  return parseYmdToLocalMidnight(ymd) ?? 0;
}

export function formatYmdToIndonesian(ymd: string): string {
  const ts = parseYmdToLocalMidnight(ymd);
  if (ts === null) return ymd || '-';
  const d = new Date(ts);
  return `${d.getDate()} ${SHORT_ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatIsoDateTimeShort(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const mon = SHORT_ID_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${year}, ${hh}:${mm}`;
}

export function computeProjectWeekFromDate(
  ymd: string,
  projectStartDate: string = DEFAULT_PROJECT_START_DATE
): { week: number; isOutOfRange: boolean } {
  const targetMs = parseYmdToLocalMidnight(ymd);
  const startMs =
    parseYmdToLocalMidnight(projectStartDate) ??
    parseYmdToLocalMidnight(DEFAULT_PROJECT_START_DATE)!;

  if (targetMs === null) {
    return { week: 1, isOutOfRange: false };
  }

  const diffDays = Math.floor((targetMs - startMs) / 86_400_000);
  const week = Math.floor(diffDays / 7) + 1;
  const isOutOfRange = week < PROJECT_MIN_WEEK || week > PROJECT_MAX_WEEK;
  return { week, isOutOfRange };
}

export function getDaysUntilDue(
  dueDateYmd: string,
  todayYmd: string = getTodayLocalYmd()
): number {
  const dueMs = parseYmdToLocalMidnight(dueDateYmd);
  const todayMs = parseYmdToLocalMidnight(todayYmd);
  if (dueMs === null || todayMs === null) return 0;
  return Math.round((dueMs - todayMs) / 86_400_000);
}

export function isWorkOrderOverdue(
  wo: Pick<WorkOrder, 'status' | 'dueDate'>,
  todayYmd: string = getTodayLocalYmd()
): boolean {
  if (wo.status === 'Selesai' || wo.status === 'Dibatalkan') {
    return false;
  }
  if (!wo.dueDate) return false;
  return getDaysUntilDue(wo.dueDate, todayYmd) < 0;
}

export function isUserWorkOrderAssignee(
  wo: Pick<WorkOrder, 'assigneeIds'>,
  userId: string,
  getUserFn?: (ref: string) => User | undefined
): boolean {
  if (!userId) return false;
  return wo.assigneeIds.some((id) => {
    if (id === userId) return true;
    if (getUserFn) {
      const resolved = getUserFn(id);
      return Boolean(resolved && (resolved.id === userId || resolved.legacyId === userId));
    }
    return false;
  });
}

export function isExclusivelyAssignedToCurrentPM(
  wo: Pick<WorkOrder, 'assigneeIds'>,
  currentUserId: string,
  isPM: boolean,
  getUserFn?: (ref: string) => User | undefined
): boolean {
  if (!isPM || !currentUserId || wo.assigneeIds.length === 0) return false;
  return wo.assigneeIds.every((id) => {
    if (id === currentUserId) return true;
    if (getUserFn) {
      const resolved = getUserFn(id);
      return Boolean(
        resolved &&
          (resolved.id === currentUserId || resolved.legacyId === currentUserId)
      );
    }
    return false;
  });
}

export function extractWorkOrderSeq(code: string): number {
  const m = /^WO-(\d+)$/i.exec((code || '').trim());
  return m ? Number(m[1]) : 0;
}

export function formatWorkOrderCode(seq: number): string {
  return `WO-${String(Math.max(1, seq)).padStart(3, '0')}`;
}

export function computeNextWorkOrderCode(
  existing: WorkOrder[],
  metaLastSeq = 0
): { code: string; seq: number } {
  const maxExisting = existing.reduce(
    (max, wo) => Math.max(max, extractWorkOrderSeq(wo.code)),
    0
  );
  const nextSeq = Math.max(maxExisting, metaLastSeq) + 1;
  return { code: formatWorkOrderCode(nextSeq), seq: nextSeq };
}

export function sortWorkOrdersForCockpit(
  list: WorkOrder[],
  todayYmd: string = getTodayLocalYmd()
): WorkOrder[] {
  return [...list].sort((a, b) => {
    const aOver = isWorkOrderOverdue(a, todayYmd) ? 1 : 0;
    const bOver = isWorkOrderOverdue(b, todayYmd) ? 1 : 0;
    if (bOver !== aOver) return bOver - aOver;

    const aDue = parseYmdToLocalMidnight(a.dueDate) ?? Number.MAX_SAFE_INTEGER;
    const bDue = parseYmdToLocalMidnight(b.dueDate) ?? Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;

    const aPrio = WO_PRIORITY_WEIGHT[a.priority] ?? 0;
    const bPrio = WO_PRIORITY_WEIGHT[b.priority] ?? 0;
    if (bPrio !== aPrio) return bPrio - aPrio;

    return extractWorkOrderSeq(a.code) - extractWorkOrderSeq(b.code);
  });
}

export function getLinkedScheduleProgress(
  workOrders: WorkOrder[],
  linkType: 'gantt' | 'weeklyPlan',
  targetId: string,
  todayYmd: string = getTodayLocalYmd()
): {
  completed: number;
  total: number;
  overdue: number;
  items: WorkOrder[];
} {
  // WO yang dibatalkan tidak dihitung sebagai pembilang maupun penyebut progres "x/y"
  const linked = workOrders.filter((wo) => {
    if (wo.status === 'Dibatalkan') return false;
    if (linkType === 'gantt') {
      return wo.scheduleLink.type === 'gantt' && wo.scheduleLink.taskId === targetId;
    }
    return wo.scheduleLink.type === 'weeklyPlan' && wo.scheduleLink.planId === targetId;
  });

  const completed = linked.filter((wo) => wo.status === 'Selesai').length;
  const overdue = linked.filter((wo) => isWorkOrderOverdue(wo, todayYmd)).length;

  return {
    completed,
    total: linked.length,
    overdue,
    items: sortWorkOrdersForCockpit(linked, todayYmd),
  };
}

export function findWorkOrderForTrackerAction(
  workOrders: WorkOrder[],
  trackerActionId: string
): WorkOrder | undefined {
  const matches = workOrders.filter(
    (wo) =>
      wo.origin.type === 'mom' && wo.origin.trackerActionId === trackerActionId
  );
  if (matches.length === 0) return undefined;
  return (
    matches.find((wo) => wo.status !== 'Dibatalkan') ??
    matches[matches.length - 1]
  );
}

export interface MomPeriodOption {
  key: string;
  label: string;
  fromWeek: number; // exclusive lower bound for historical pairs, inclusive when isSinceLast
  toWeek: number;
  fromDateTs: number;
  toDateTs: number;
  isLiveCurrent: boolean;
}

export function buildMomSummaryPeriodOptions(
  meetingLogs: MeetingLogItem[],
  currentProjectWeek = 5
): MomPeriodOption[] {
  const sortedAsc = [...meetingLogs].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return (
      parseIndonesianDateToTimestamp(a.dayText) -
      parseIndonesianDateToTimestamp(b.dayText)
    );
  });

  if (sortedAsc.length === 0) {
    return [
      {
        key: 'all-current',
        label: 'Seluruh Periode Proyek (Belum ada Meeting Log)',
        fromWeek: 0,
        toWeek: Math.max(16, currentProjectWeek),
        fromDateTs: 0,
        toDateTs: Number.MAX_SAFE_INTEGER,
        isLiveCurrent: true,
      },
    ];
  }

  const options: MomPeriodOption[] = [];
  const latest = sortedAsc[sortedAsc.length - 1];
  const latestTs = parseIndonesianDateToTimestamp(latest.dayText);

  options.push({
    key: `since-${latest.id}`,
    label: `Sejak ${latest.weekLabel || `Week ${latest.week}`} (${latest.dayText.split('-')[0].trim()}) → Rapat Berikutnya`,
    fromWeek: latest.week,
    toWeek: Math.max(latest.week + 1, currentProjectWeek, 16),
    fromDateTs: latestTs,
    toDateTs: Number.MAX_SAFE_INTEGER,
    isLiveCurrent: true,
  });

  for (let i = sortedAsc.length - 1; i >= 1; i--) {
    const prev = sortedAsc[i - 1];
    const curr = sortedAsc[i];
    options.push({
      key: `pair-${prev.id}-${curr.id}`,
      label: `Periode ${prev.weekLabel || `W${prev.week}`} → ${curr.weekLabel || `W${curr.week}`}`,
      fromWeek: prev.week,
      toWeek: curr.week,
      fromDateTs: parseIndonesianDateToTimestamp(prev.dayText),
      toDateTs: parseIndonesianDateToTimestamp(curr.dayText),
      isLiveCurrent: false,
    });
  }

  return options;
}

export function computeMomPeriodWorkOrders(
  workOrders: WorkOrder[],
  period: MomPeriodOption | undefined,
  projectStartDate: string = DEFAULT_PROJECT_START_DATE,
  todayYmd: string = getTodayLocalYmd()
): {
  completed: WorkOrder[];
  inProgress: WorkOrder[];
  overdue: WorkOrder[];
  blocked: WorkOrder[];
} {
  const nonCancelled = workOrders.filter((wo) => wo.status !== 'Dibatalkan');
  if (!period) {
    return { completed: [], inProgress: [], overdue: [], blocked: [] };
  }

  const completed: WorkOrder[] = [];
  const inProgress: WorkOrder[] = [];
  const overdue: WorkOrder[] = [];
  const blocked: WorkOrder[] = [];

  for (const wo of nonCancelled) {
    if (wo.status === 'Selesai') {
      const completedYmd = wo.completedAt
        ? wo.completedAt.slice(0, 10)
        : wo.updatedAt.slice(0, 10);
      const { week: completedWeek } = computeProjectWeekFromDate(
        completedYmd,
        projectStartDate
      );
      const completedDayTs = parseYmdToLocalMidnight(completedYmd) ?? 0;

      if (period.isLiveCurrent) {
        const matchesDate =
          period.fromDateTs > 0 && completedDayTs > 0
            ? completedDayTs >= period.fromDateTs
            : completedWeek >= period.fromWeek;
        if (matchesDate || completedWeek > period.fromWeek) {
          completed.push(wo);
        }
      } else {
        const inWeekWindow =
          period.fromWeek === period.toWeek
            ? completedWeek === period.toWeek
            : completedWeek > period.fromWeek && completedWeek <= period.toWeek;
        const inDateWindow =
          period.fromDateTs > 0 &&
          period.toDateTs > 0 &&
          completedDayTs > period.fromDateTs &&
          completedDayTs <= period.toDateTs;
        if (inWeekWindow || inDateWindow) {
          completed.push(wo);
        }
      }
      continue;
    }

    // Untuk mode historis antar-rapat, hanya sertakan WO yang sudah dijadwalkan/dibuat hingga minggu rapat tujuan
    if (!period.isLiveCurrent) {
      const createdYmd = wo.createdAt ? wo.createdAt.slice(0, 10) : '';
      const createdWeek = createdYmd
        ? computeProjectWeekFromDate(createdYmd, projectStartDate).week
        : wo.projectWeek;
      if (wo.projectWeek > period.toWeek && createdWeek > period.toWeek) {
        continue;
      }
    }

    if (wo.status === 'Blocked') {
      blocked.push(wo);
    } else if (isWorkOrderOverdue(wo, todayYmd)) {
      overdue.push(wo);
    } else {
      inProgress.push(wo);
    }
  }

  return {
    completed: sortWorkOrdersForCockpit(completed, todayYmd),
    inProgress: sortWorkOrdersForCockpit(inProgress, todayYmd),
    overdue: sortWorkOrdersForCockpit(overdue, todayYmd),
    blocked: sortWorkOrdersForCockpit(blocked, todayYmd),
  };
}

/**
 * Menghitung pengingat tenggat (H-2..H-1, Hari H, dan Terlambat) di sisi klien
 * tanpa menyimpan dokumen notifikasi ke Firestore agar bebas duplikat dan hemat kuota.
 * Status baca disimpan per WO, per tahap, dan per dueDate pada user.readNotificationIds.
 */
export function computeDeadlineReminderNotifications(
  workOrders: WorkOrder[],
  currentUserId: string,
  isPM: boolean,
  readIds: Set<string>,
  todayYmd: string = getTodayLocalYmd(),
  getUserFn?: (ref: string) => User | undefined
): AppNotification[] {
  if (!currentUserId) return [];

  const reminders: AppNotification[] = [];

  for (const wo of workOrders) {
    if (wo.status === 'Selesai' || wo.status === 'Dibatalkan') continue;
    if (!wo.dueDate) continue;

    const isAssignee = isUserWorkOrderAssignee(wo, currentUserId, getUserFn);
    const daysLeft = getDaysUntilDue(wo.dueDate, todayYmd);
    const formattedDue = formatYmdToIndonesian(wo.dueDate);

    if (daysLeft < 0) {
      // Terlambat -> Penanggung jawab dan PM
      if (!isAssignee && !isPM) continue;
      const overdueDays = Math.abs(daysLeft);
      const id = `wo-reminder:${wo.id}:overdue:${wo.dueDate}`;
      reminders.push({
        id,
        title: `${wo.code} Terlambat (${overdueDays} hari)`,
        description: `"${wo.title}" melewati tenggat ${formattedDue} dan berstatus ${wo.status}.`,
        timeAgo: `Tenggat ${formattedDue}`,
        type: 'urgent',
        read: readIds.has(id),
        workOrderId: wo.id,
      });
    } else if (daysLeft === 0) {
      // Hari H -> Penanggung jawab
      if (!isAssignee) continue;
      const id = `wo-reminder:${wo.id}:due-today:${wo.dueDate}`;
      reminders.push({
        id,
        title: `Tenggat Hari Ini: ${wo.code}`,
        description: `"${wo.title}" jatuh tempo hari ini (${formattedDue}).`,
        timeAgo: 'Hari ini',
        type: 'warning',
        read: readIds.has(id),
        workOrderId: wo.id,
      });
    } else if (daysLeft <= 2) {
      // H-2 atau H-1 -> Penanggung jawab
      if (!isAssignee) continue;
      const id = `wo-reminder:${wo.id}:due-soon:${wo.dueDate}`;
      reminders.push({
        id,
        title: `Mendekati Tenggat (H-${daysLeft}): ${wo.code}`,
        description: `"${wo.title}" jatuh tempo pada ${formattedDue}.`,
        timeAgo: `${daysLeft} hari lagi`,
        type: 'warning',
        read: readIds.has(id),
        workOrderId: wo.id,
      });
    }
  }

  return reminders;
}

export function isValidWorkOrderRecord(raw: unknown): raw is WorkOrder {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    r.id.trim().length > 0 &&
    typeof r.code === 'string' &&
    r.code.trim().length > 0 &&
    typeof r.title === 'string' &&
    r.title.trim().length > 0 &&
    typeof r.description === 'string' &&
    Array.isArray(r.assigneeIds) &&
    r.assigneeIds.length >= 1 &&
    r.assigneeIds.every((id) => typeof id === 'string') &&
    Array.isArray(r.supporterIds) &&
    WO_PRIORITIES.includes(r.priority as WorkOrderPriority) &&
    WO_ALL_STATUSES.includes(r.status as WorkOrderStatus) &&
    typeof r.dueDate === 'string' &&
    typeof r.projectWeek === 'number' &&
    typeof r.scheduleLink === 'object' &&
    r.scheduleLink !== null &&
    typeof r.origin === 'object' &&
    r.origin !== null &&
    Array.isArray(r.checklist) &&
    typeof r.requireEvidence === 'boolean' &&
    typeof r.evidenceUrl === 'string' &&
    typeof r.evidenceNote === 'string' &&
    typeof r.blockedReason === 'string' &&
    typeof r.needsRevision === 'boolean' &&
    typeof r.revisionNote === 'string' &&
    typeof r.cancelReason === 'string' &&
    typeof r.reopenReason === 'string' &&
    typeof r.createdAt === 'string' &&
    typeof r.createdBy === 'string' &&
    typeof r.updatedAt === 'string' &&
    typeof r.updatedBy === 'string' &&
    Array.isArray(r.history)
  );
}
