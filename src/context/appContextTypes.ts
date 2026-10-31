import {
  User,
  UserPatch,
  Config,
  TaskItem,
  DeliverableItem,
  WeeklyPlanItem,
  GanttTaskItem,
  GanttPhase,
  RaciRow,
  RaciRoleValue,
  SlideDeckItem,
  TrackerActionItem,
  MeetingLogItem,
  RegulationDirective,
  StandardReferenceItem,
  LogbookItem,
  RubricParameter,
  DefenseQuestion,
  PhysicalBundleItem,
  AppNotification,
  WorkOrder,
  WorkOrderChecklistItem,
  CreateWorkOrderInput,
  UpdateWorkOrderMetaInput,
  WorkOrderDraft,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CONFIG,
  INITIAL_TASKS,
  INITIAL_DELIVERABLES,
  INITIAL_WEEKLY_PLANS,
  INITIAL_GANTT_TASKS,
  INITIAL_GANTT_PHASES,
  INITIAL_RACI_ROWS,
  INITIAL_SLIDE_DECKS,
  INITIAL_TRACKER_ACTIONS,
  INITIAL_MEETING_LOGS,
  INITIAL_REGULATIONS,
  INITIAL_STANDARDS,
  INITIAL_LOGBOOKS,
  INITIAL_RUBRIC_PARAMETERS,
  INITIAL_DEFENSE_QUESTIONS,
  INITIAL_PHYSICAL_CHECKLIST,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import { MigrationPreviewResult } from '../utils/migrateUserRefs';

export type NavTab =
  | 'homepage'
  | 'work-orders'
  | 'schedule'
  | 'team-raci'
  | 'weekly-mom'
  | 'standards'
  | 'workspaces'
  | 'logbook'
  | 'stage-gate';

export type ImportDataResult = 'success' | 'invalid' | 'users-unavailable';

export interface AppContextType {
  // Auth, Users & Session
  currentUser: User;
  users: User[];
  isUsersLoaded: boolean;
  getUser: (uidOrLegacyRef: string | undefined | null) => User | undefined;
  updateUser: (uid: string, patch: UserPatch) => Promise<void>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDataLoaded: boolean;
  authError: string | null;
  syncError: string | null;
  firebaseConfigured: boolean;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  refreshData: () => Promise<void>;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isPM: boolean;

  // Data states & mutators
  config: Config;
  updateConfig: (patch: Partial<Config>) => void;

  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  deliverables: DeliverableItem[];
  updateDeliverable: (id: string, patch: Partial<DeliverableItem>) => void;

  weeklyPlans: WeeklyPlanItem[];
  addWeeklyPlan: (plan: Omit<WeeklyPlanItem, 'id'>) => void;
  updateWeeklyPlan: (id: string, patch: Partial<WeeklyPlanItem>) => void;
  deleteWeeklyPlan: (id: string) => void;

  ganttTasks: GanttTaskItem[];
  addGanttTask: (task: Omit<GanttTaskItem, 'id'>) => void;
  updateGanttTask: (id: string, patch: Partial<GanttTaskItem>) => void;
  deleteGanttTask: (id: string) => void;
  ganttPhases: GanttPhase[];
  addGanttPhase: (phase: Omit<GanttPhase, 'id'>) => number;
  updateGanttPhase: (id: number, patch: Partial<GanttPhase>) => void;
  deleteGanttPhase: (id: number) => void;

  raciRows: RaciRow[];
  updateRaciCell: (
    rowId: string,
    memberUidOrKey: string,
    value: RaciRoleValue
  ) => void;
  addRaciRow: (row: Omit<RaciRow, 'id'>) => void;

  slideDecks: SlideDeckItem[];
  addSlideDeck: (deck: Omit<SlideDeckItem, 'id'>) => void;
  updateSlideDeck: (id: string, patch: Partial<Omit<SlideDeckItem, 'id'>>) => void;
  deleteSlideDeck: (id: string) => void;

  trackerActions: TrackerActionItem[];
  addTrackerAction: (item: Omit<TrackerActionItem, 'id' | 'code'>) => void;
  updateTrackerAction: (id: string, patch: Partial<Omit<TrackerActionItem, 'id' | 'code'>>) => void;
  toggleTrackerActionStatus: (id: string) => void;
  deleteTrackerAction: (id: string) => void;

  meetingLogs: MeetingLogItem[];
  addMeetingLog: (log: Omit<MeetingLogItem, 'id'>) => void;
  updateMeetingLog: (id: string, patch: Partial<Omit<MeetingLogItem, 'id'>>) => void;
  deleteMeetingLog: (id: string) => void;

  regulations: RegulationDirective[];
  updateRegulation: (id: string, patch: Partial<Omit<RegulationDirective, 'id'>>) => void;
  standards: StandardReferenceItem[];
  addStandard: (std: Omit<StandardReferenceItem, 'id'>) => void;
  updateStandard: (id: string, patch: Partial<Omit<StandardReferenceItem, 'id'>>) => void;
  deleteStandard: (id: string) => void;

  logbooks: LogbookItem[];
  addLogbook: (entry: Omit<LogbookItem, 'id' | 'verifiedByLecturer'>) => void;
  toggleLogbookVerification: (id: string) => void;
  deleteLogbook: (id: string) => void;

  rubricParameters: RubricParameter[];
  updateRubricScore: (id: string, score: number) => void;
  toggleRubricItem: (paramId: string, itemIdx: number) => void;
  updateRubricMitigation: (id: string, mitigation: string) => void;

  defenseQuestions: DefenseQuestion[];
  updateDefenseResponse: (id: string, newResponse: string) => void;
  addDefenseQuestion: (q: Omit<DefenseQuestion, 'id'>) => void;

  physicalChecklist: PhysicalBundleItem[];
  togglePhysicalItem: (id: string) => void;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Work Orders (Menu ke-9)
  workOrders: WorkOrder[];
  isWorkOrdersLoaded: boolean;
  selectedWorkOrderId: string | null;
  setSelectedWorkOrderId: (id: string | null) => void;
  openWorkOrderDetail: (id: string) => void;
  isWorkOrderFormOpen: boolean;
  workOrderFormDraft: WorkOrderDraft | null;
  openWorkOrderForm: (draft?: WorkOrderDraft) => void;
  closeWorkOrderForm: () => void;
  createWorkOrder: (input: CreateWorkOrderInput) => Promise<WorkOrder | null>;
  updateWorkOrderMeta: (id: string, input: UpdateWorkOrderMetaInput) => Promise<void>;
  updateWorkOrderExecution: (
    id: string,
    patch: {
      checklist?: WorkOrderChecklistItem[];
      evidenceUrl?: string;
      evidenceNote?: string;
    }
  ) => Promise<void>;
  startWorkOrder: (id: string) => Promise<void>;
  blockWorkOrder: (id: string, reason: string) => Promise<void>;
  unblockWorkOrder: (id: string) => Promise<void>;
  submitWorkOrder: (
    id: string,
    evidence?: { evidenceUrl?: string; evidenceNote?: string }
  ) => Promise<void>;
  approveWorkOrder: (id: string) => Promise<void>;
  requestWorkOrderRevision: (id: string, revisionNote: string) => Promise<void>;
  reopenWorkOrder: (id: string, reason: string) => Promise<void>;
  cancelWorkOrder: (id: string, reason: string) => Promise<void>;

  // Calculated Metrics
  verifiedLogbooksCount: number;
  totalLogbooksCount: number;
  overallWeightedProgress: number;
  averageRubricScore: number;
  stageGateReadinessPercent: number;
  unreadNotificationsCount: number;

  // Backup, Restore & Migration
  exportDataToJson: () => string;
  importDataFromJson: (jsonStr: string) => ImportDataResult;
  resetToDefaults: () => void;
  previewUserMigration: () => MigrationPreviewResult;
  executeUserMigration: () => Promise<MigrationPreviewResult>;
}

export interface SharedProjectData {
  users?: User[];
  config: Config;
  tasks: TaskItem[];
  deliverables: DeliverableItem[];
  weeklyPlans: WeeklyPlanItem[];
  ganttTasks: GanttTaskItem[];
  ganttPhases: GanttPhase[];
  raciRows: RaciRow[];
  slideDecks: SlideDeckItem[];
  trackerActions: TrackerActionItem[];
  meetingLogs: MeetingLogItem[];
  regulations: RegulationDirective[];
  standards: StandardReferenceItem[];
  logbooks: LogbookItem[];
  rubricParameters: RubricParameter[];
  defenseQuestions: DefenseQuestion[];
  physicalChecklist: PhysicalBundleItem[];
  notifications: AppNotification[];
}

export const INITIAL_PROJECT_DATA: SharedProjectData = {
  config: INITIAL_CONFIG,
  tasks: INITIAL_TASKS,
  deliverables: INITIAL_DELIVERABLES,
  weeklyPlans: INITIAL_WEEKLY_PLANS,
  ganttTasks: INITIAL_GANTT_TASKS,
  ganttPhases: INITIAL_GANTT_PHASES,
  raciRows: INITIAL_RACI_ROWS,
  slideDecks: INITIAL_SLIDE_DECKS,
  trackerActions: INITIAL_TRACKER_ACTIONS,
  meetingLogs: INITIAL_MEETING_LOGS,
  regulations: INITIAL_REGULATIONS,
  standards: INITIAL_STANDARDS,
  logbooks: INITIAL_LOGBOOKS,
  rubricParameters: INITIAL_RUBRIC_PARAMETERS,
  defenseQuestions: INITIAL_DEFENSE_QUESTIONS,
  physicalChecklist: INITIAL_PHYSICAL_CHECKLIST,
  notifications: INITIAL_NOTIFICATIONS,
};

export const USER_ORDER = [
  'user-rahul',
  'user-ihsan',
  'user-althaf',
  'user-jonathan',
  'user-heidi',
];

export const ADMIN_ONLY_USER_FIELDS: Array<keyof UserPatch> = [
  'role',
  'title',
  'raciTag',
  'code',
  'jobdesk',
];

export const PROJECT_DATA_REF = ['projectData', 'area1'] as const;

export const SECTION_KEYS = [
  'config',
  'tasks',
  'deliverables',
  'weeklyPlans',
  'ganttTasks',
  'ganttPhases',
  'raciRows',
  'slideDecks',
  'trackerActions',
  'meetingLogs',
  'regulations',
  'standards',
  'logbooks',
  'rubricParameters',
  'defenseQuestions',
  'physicalChecklist',
  'notifications',
] as const;

export type ProjectSectionKey = (typeof SECTION_KEYS)[number];
