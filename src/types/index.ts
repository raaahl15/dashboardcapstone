export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  legacyId?: string;
  name: string;
  nickname: string;
  readonly email: string;
  role: UserRole;
  title: string;
  raciTag: string;
  code: string;
  jobdesk: string[];
  avatarBg: string;
  avatarInitial: string;
  tag?: string;
  phone?: string;
  photoURL?: string;
  readNotificationIds?: string[];
  updatedAt?: unknown;
  updatedBy?: string;
}

export type UserPatch = Partial<
  Omit<User, 'id' | 'legacyId' | 'email' | 'updatedAt' | 'updatedBy'>
>;

export interface Config {
  projectStartDate: string;
  tenderDeadline: string; // "15 Des 2026, 23:59 WIB"
  projectStatus: 'ON TRACK' | 'NEEDS ATTENTION' | 'CRITICAL';
  statusDescription: string;
  speedAuditPercent: number;
  zeroBlocker: boolean;
  tenderStatusText: string;
  tenderPhaseText: string;
  supervisorStatus: 'Dosen Review' | 'Revisi Mayor' | 'ACC Bersyarat' | 'Full ACC';
  supervisorReviewer: string;
  upcomingMeeting: {
    date: string;
    dayNum: string;
    month: string;
    time: string;
    location: string;
    mainAgenda: string;
  };
  weeklyFocus: {
    week: string;
    title: string;
    tag: string;
    targetDate: string;
  };
  noticeBanner: {
    title: string;
    badge: string;
    text: string;
  };
  readinessLocked: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  pic: string; // UID ('user-ihsan', etc.) or legacy name
  day: string;
  completed: boolean;
  week: string;
}

export interface DeliverableItem {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  progress: number;
  targetWeek: string;
  status: 'Draft' | 'In Review Pembimbing' | 'ACC Final' | 'Aktif' | 'Lewat target';
  badgeNote?: string;
  fileUrl: string;
  modelTag?: string;
  weight: number; // For overall weighted percentage calculation
}

export interface WeeklyPlanItem {
  id: string;
  week: number;
  weekLabel: string;
  title: string;
  pic: string; // UID ('user-rahul', etc.) or legacy name
  picCode?: string; // Legacy field preserved
  status: 'Done' | 'In Progress' | 'Planning';
  keyOutput: string;
  docTag: string;
  autoCompletedByWo?: boolean;
}

export interface GanttTaskItem {
  id: string;
  phaseId: number;
  phaseName: string;
  name: string;
  pic?: string; // UID ('user-rahul', etc.) or 'ALL'
  picCode: string; // Legacy field preserved (stores UID or legacy code)
  picName?: string; // Legacy field preserved
  startWeek: number; // 1 - 16
  endWeek: number;   // 1 - 16
  isCritical?: boolean;
  isStageGateMilestone?: boolean;
  status?: GanttTaskStatus;
  autoCompletedByWo?: boolean;
}

export type GanttTaskStatus = 'Selesai' | 'Berjalan' | 'Belum' | 'Terlambat' | 'Perlu dicek';

export interface GanttPhase {
  id: number;
  name: string;
}

export type RaciRoleValue = 'R' | 'A' | 'C' | 'I' | '';

export interface RaciRow {
  id: string;
  deliverable: string;
  subtitle: string;
  assignments?: Record<string, RaciRoleValue>; // Keyed by user UID ('user-rahul', etc.)
  rahul: RaciRoleValue; // Legacy field preserved
  ihsan: RaciRoleValue; // Legacy field preserved
  althaf: RaciRoleValue; // Legacy field preserved
  jonathan: RaciRoleValue; // Legacy field preserved
  heidi: RaciRoleValue; // Legacy field preserved
  validationStatus: string;
}

export interface SlideDeckItem {
  id: string;
  week: number;
  weekLabel: string;
  title: string;
  presenter: string; // UID ('user-ihsan', etc.) or legacy name
  presenterRole?: string; // Legacy field preserved
  presenterCode?: string; // Legacy field preserved
  date: string;
  url: string;
}

export interface TrackerActionItem {
  id: string;
  code: string;
  week: string;
  issue: string;
  pic?: string; // UID ('user-rahul', etc.)
  picCode: string; // Legacy field preserved
  picName?: string; // Legacy field preserved
  deadline: string;
  progress: 'Resolved' | 'In Progress';
}

export interface MeetingLogItem {
  id: string;
  week: number;
  weekLabel: string;
  dayText: string;
  location: string;
  evaluator: string;
  presenceRatio: string;
  presentMembers: string[]; // Array of UIDs ('user-rahul', etc.) or legacy codes
  topic: string;
  summary: string;
}

export interface RegulationDirective {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  url: string;
}

export interface StandardReferenceItem {
  id: string;
  code: string;
  subCode: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface LogbookItem {
  id: string;
  date: string;
  authorId: string; // UID ('user-ihsan', etc.)
  authorName?: string; // Legacy field preserved
  authorRole?: string; // Legacy field preserved
  authorCode?: string; // Legacy field preserved
  workDescription: string;
  issueSolution: string;
  verifiedByLecturer: boolean;
  verifiedDate?: string;
}

export interface RubricCheckItem {
  text: string;
  statusText: string;
  checked: boolean;
}

export interface RubricParameter {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  pic?: string; // UID ('user-ihsan', etc.)
  picCode: string; // Legacy field preserved
  picName?: string; // Legacy field preserved
  score: number;
  items: RubricCheckItem[];
  mitigation: string;
}

export interface DefenseQuestion {
  id: string;
  axis: 'koordinator' | 'praktisi';
  chapterTag: string;
  pic: string; // UID ('user-ihsan', etc.) or legacy name
  question: string;
  verifiedResponse: string;
}

export interface PhysicalBundleItem {
  id: string;
  title: string;
  subtitle: string;
  statusBadge: string;
  ready: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  createdAt?: string;
  type: 'urgent' | 'warning' | 'info';
  read: boolean;
  recipientIds?: string[]; // Canonical UIDs; undefined/empty = broadcast to all team members
  workOrderId?: string;
}

export type WorkOrderPriority = 'Rendah' | 'Normal' | 'Tinggi' | 'Kritis';

export type WorkOrderStatus =
  | 'Ditugaskan'
  | 'Dikerjakan'
  | 'Blocked'
  | 'Diajukan'
  | 'Selesai'
  | 'Dibatalkan';

export type WorkOrderScheduleLink =
  | { type: 'none' }
  | { type: 'gantt'; taskId: string }
  | { type: 'weeklyPlan'; planId: string };

export type WorkOrderOrigin =
  | { type: 'manual' }
  | { type: 'mom'; trackerActionId: string; trackerActionCode: string };

export interface WorkOrderChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface WorkOrderHistoryEntry {
  id: string;
  at: string; // ISO 8601 timestamp
  actorId: string; // Canonical UID ('user-rahul', etc.)
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  eventLabel: string;
  note: string;
}

export interface WorkOrder {
  id: string;
  code: string; // WO-001, WO-002, ...
  title: string;
  description: string;
  assigneeIds: string[]; // >= 1 equal responsible owners
  supporterIds: string[]; // Optional supporting members
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  dueDate: string; // 'YYYY-MM-DD'
  projectWeek: number;
  scheduleLink: WorkOrderScheduleLink;
  origin: WorkOrderOrigin;
  checklist: WorkOrderChecklistItem[];
  requireEvidence: boolean;
  evidenceUrl: string;
  evidenceNote: string;
  blockedReason: string;
  needsRevision: boolean;
  revisionNote: string;
  cancelReason: string;
  reopenReason: string;
  submittedAt: string;
  completedAt: string;
  cancelledAt: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  history: WorkOrderHistoryEntry[];
}

export interface CreateWorkOrderInput {
  title: string;
  description: string;
  assigneeIds: string[];
  supporterIds?: string[];
  priority: WorkOrderPriority;
  dueDate: string;
  scheduleLink: WorkOrderScheduleLink;
  origin?: WorkOrderOrigin;
  checklist?: WorkOrderChecklistItem[];
  requireEvidence?: boolean;
}

export interface UpdateWorkOrderMetaInput {
  title?: string;
  description?: string;
  assigneeIds?: string[];
  supporterIds?: string[];
  priority?: WorkOrderPriority;
  dueDate?: string;
  scheduleLink?: WorkOrderScheduleLink;
  checklist?: WorkOrderChecklistItem[];
  requireEvidence?: boolean;
}

export interface WorkOrderDraft {
  editingWorkOrderId?: string;
  title?: string;
  description?: string;
  assigneeIds?: string[];
  supporterIds?: string[];
  priority?: WorkOrderPriority;
  dueDate?: string;
  scheduleLink?: WorkOrderScheduleLink;
  origin?: WorkOrderOrigin;
  checklist?: WorkOrderChecklistItem[];
  requireEvidence?: boolean;
}
