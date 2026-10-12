import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  QueryDocumentSnapshot,
  QuerySnapshot,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';
import {
  User,
  UserPatch,
  Config,
  TaskItem,
  DeliverableItem,
  WeeklyPlanItem,
  GanttTaskItem,
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
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CONFIG,
  INITIAL_TASKS,
  INITIAL_DELIVERABLES,
  INITIAL_WEEKLY_PLANS,
  INITIAL_GANTT_TASKS,
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
import { auth, db, firebaseConfigured, isLiveFirebaseConfig } from '../firebase';
import {
  MigrationPreviewResult,
  getRaciRoleForUser,
  previewMigrateUserRefs,
  resolveUserFromRef,
} from '../utils/migrateUserRefs';

export type NavTab =
  | 'homepage'
  | 'schedule'
  | 'team-raci'
  | 'weekly-mom'
  | 'standards'
  | 'workspaces'
  | 'logbook'
  | 'stage-gate';

interface AppContextType {
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
  deleteGanttTask: (id: string) => void;

  raciRows: RaciRow[];
  updateRaciCell: (
    rowId: string,
    memberUidOrKey: string,
    value: RaciRoleValue
  ) => void;
  addRaciRow: (row: Omit<RaciRow, 'id'>) => void;

  slideDecks: SlideDeckItem[];
  addSlideDeck: (deck: Omit<SlideDeckItem, 'id'>) => void;
  deleteSlideDeck: (id: string) => void;

  trackerActions: TrackerActionItem[];
  addTrackerAction: (item: Omit<TrackerActionItem, 'id' | 'code'>) => void;
  toggleTrackerActionStatus: (id: string) => void;
  deleteTrackerAction: (id: string) => void;

  meetingLogs: MeetingLogItem[];
  addMeetingLog: (log: Omit<MeetingLogItem, 'id'>) => void;

  regulations: RegulationDirective[];
  standards: StandardReferenceItem[];
  addStandard: (std: Omit<StandardReferenceItem, 'id'>) => void;
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

  // Calculated Metrics
  verifiedLogbooksCount: number;
  totalLogbooksCount: number;
  overallWeightedProgress: number;
  averageRubricScore: number;
  stageGateReadinessPercent: number;
  unreadNotificationsCount: number;

  // Backup, Restore & Migration
  exportDataToJson: () => string;
  importDataFromJson: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
  previewUserMigration: () => MigrationPreviewResult;
  executeUserMigration: () => Promise<MigrationPreviewResult>;
}

interface SharedProjectData {
  users?: User[];
  config: Config;
  tasks: TaskItem[];
  deliverables: DeliverableItem[];
  weeklyPlans: WeeklyPlanItem[];
  ganttTasks: GanttTaskItem[];
  raciRows: RaciRow[];
  slideDecks: SlideDeckItem[];
  trackerActions: TrackerActionItem[];
  meetingLogs: MeetingLogItem[];
  standards: StandardReferenceItem[];
  logbooks: LogbookItem[];
  rubricParameters: RubricParameter[];
  defenseQuestions: DefenseQuestion[];
  physicalChecklist: PhysicalBundleItem[];
  notifications: AppNotification[];
}

const INITIAL_PROJECT_DATA: SharedProjectData = {
  users: INITIAL_USERS,
  config: INITIAL_CONFIG,
  tasks: INITIAL_TASKS,
  deliverables: INITIAL_DELIVERABLES,
  weeklyPlans: INITIAL_WEEKLY_PLANS,
  ganttTasks: INITIAL_GANTT_TASKS,
  raciRows: INITIAL_RACI_ROWS,
  slideDecks: INITIAL_SLIDE_DECKS,
  trackerActions: INITIAL_TRACKER_ACTIONS,
  meetingLogs: INITIAL_MEETING_LOGS,
  standards: INITIAL_STANDARDS,
  logbooks: INITIAL_LOGBOOKS,
  rubricParameters: INITIAL_RUBRIC_PARAMETERS,
  defenseQuestions: INITIAL_DEFENSE_QUESTIONS,
  physicalChecklist: INITIAL_PHYSICAL_CHECKLIST,
  notifications: INITIAL_NOTIFICATIONS,
};

const USER_ORDER = ['user-rahul', 'user-ihsan', 'user-althaf', 'user-jonathan', 'user-heidi'];
const ADMIN_ONLY_USER_FIELDS: Array<keyof UserPatch> = [
  'role',
  'title',
  'raciTag',
  'code',
  'jobdesk',
];

const typedDoc = <T,>(
  firestore: Firestore,
  path: string,
  ...pathSegments: string[]
) => doc(firestore, path, ...pathSegments) as unknown as DocumentReference<T>;

const typedCollection = <T,>(
  firestore: Firestore,
  path: string,
  ...pathSegments: string[]
) => collection(firestore, path, ...pathSegments) as unknown as CollectionReference<T>;

const PROJECT_DATA_REF = ['projectData', 'area1'] as const;
const LOCAL_STORAGE_SESSION_KEY = 'area1_dme_session_user_id';
const LOCAL_STORAGE_DATA_KEY = 'area1_dme_project_data';
const LOCAL_STORAGE_USERS_KEY = 'area1_dme_users_data';
const BROADCAST_CHANNEL_NAME = 'area1_dme_realtime_sync';

function sortAndNormalizeUsers(rawUsers: User[]): User[] {
  const validIncoming = Array.isArray(rawUsers)
    ? rawUsers.filter((u): u is User => Boolean(u && u.id))
    : [];

  if (validIncoming.length === 0) {
    return INITIAL_USERS.map((base) => ({ ...base }));
  }

  const initialById = new Map<string, User>(
    INITIAL_USERS.map((base) => [base.id, base])
  );

  const isFirestoreMode = validIncoming.some(
    (u) => Boolean(u.legacyId) || !initialById.has(u.id)
  );

  // If in Firestore mode and rawUsers contains both UID-based docs (with legacyId)
  // and stale legacy-ID docs (e.g. from old localStorage cache), ignore the stale legacy-ID duplicates
  const legacyIdsPresentOnUidDocs = new Set<string>(
    validIncoming
      .filter((u) => Boolean(u.legacyId) && u.id !== u.legacyId)
      .map((u) => u.legacyId as string)
  );

  const normalizedList: User[] = [];
  const seenIds = new Set<string>();

  for (const incoming of validIncoming) {
    if (seenIds.has(incoming.id)) continue;
    if (
      isFirestoreMode &&
      !incoming.legacyId &&
      legacyIdsPresentOnUidDocs.has(incoming.id)
    ) {
      continue;
    }
    seenIds.add(incoming.id);

    const fallback =
      initialById.get(incoming.id) ??
      (incoming.legacyId ? initialById.get(incoming.legacyId) : undefined);

    const definedIncoming = Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => value !== undefined)
    ) as Partial<User>;

    const merged: User = {
      ...(fallback ? { ...fallback } : ({} as User)),
      ...definedIncoming,
      id: incoming.id,
    };

    if (incoming.legacyId !== undefined) {
      merged.legacyId = incoming.legacyId;
    }

    if (merged.nickname === undefined) {
      merged.nickname =
        fallback?.nickname ?? (merged.name ? merged.name.split(' ')[0] : '');
    }

    normalizedList.push(merged);
  }

  if (!isFirestoreMode) {
    for (const base of INITIAL_USERS) {
      if (!seenIds.has(base.id)) {
        normalizedList.push({ ...base });
      }
    }
  }

  return normalizedList.sort((a, b) => {
    const keyA = a.legacyId ?? a.id;
    const keyB = b.legacyId ?? b.id;
    const idxA = USER_ORDER.indexOf(keyA);
    const idxB = USER_ORDER.indexOf(keyB);
    const rankA = idxA === -1 ? USER_ORDER.length : idxA;
    const rankB = idxB === -1 ? USER_ORDER.length : idxB;
    return rankA - rankB;
  });
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('homepage');
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (saved) {
        return sortAndNormalizeUsers(JSON.parse(saved) as User[]);
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_USERS;
  });
  const [currentUserId, setCurrentUserId] = useState('');
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(INITIAL_DELIVERABLES);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanItem[]>(INITIAL_WEEKLY_PLANS);
  const [ganttTasks, setGanttTasks] = useState<GanttTaskItem[]>(INITIAL_GANTT_TASKS);
  const [raciRows, setRaciRows] = useState<RaciRow[]>(INITIAL_RACI_ROWS);
  const [slideDecks, setSlideDecks] = useState<SlideDeckItem[]>(INITIAL_SLIDE_DECKS);
  const [trackerActions, setTrackerActions] = useState<TrackerActionItem[]>(INITIAL_TRACKER_ACTIONS);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLogItem[]>(INITIAL_MEETING_LOGS);
  const [regulations] = useState<RegulationDirective[]>(INITIAL_REGULATIONS);
  const [standards, setStandards] = useState<StandardReferenceItem[]>(INITIAL_STANDARDS);
  const [logbooks, setLogbooks] = useState<LogbookItem[]>(INITIAL_LOGBOOKS);
  const [rubricParameters, setRubricParameters] = useState<RubricParameter[]>(INITIAL_RUBRIC_PARAMETERS);
  const [defenseQuestions, setDefenseQuestions] = useState<DefenseQuestion[]>(INITIAL_DEFENSE_QUESTIONS);
  const [physicalChecklist, setPhysicalChecklist] = useState<PhysicalBundleItem[]>(INITIAL_PHYSICAL_CHECKLIST);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const lastSyncedPayload = useRef<string | null>(null);
  const lastServerTimestampRef = useRef<number>(0);
  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const seedInProgress = useRef(false);
  const usersSeedInProgress = useRef(false);
  const usersCollectionActiveRef = useRef(false);
  const dataUnsubscribe = useRef<(() => void) | null>(null);
  const usersUnsubscribe = useRef<(() => void) | null>(null);

  // Current active user from single source of truth `users` (matches id or legacyId)
  const currentUser = useMemo(() => {
    return (
      users.find(
        (u) =>
          u.id === currentUserId ||
          (Boolean(u.legacyId) && u.legacyId === currentUserId)
      ) || users[0]
    );
  }, [users, currentUserId]);

  const isPM = currentUser.role === 'admin';

  // Helper getUser(uid): resolves by UID with fallback to nickname, name, code, or raciTag
  const getUser = useCallback(
    (uidOrLegacyRef: string | undefined | null): User | undefined => {
      return resolveUserFromRef(uidOrLegacyRef, users);
    },
    [users]
  );

  // Helper updateUser(uid, patch): updates only changed fields with updateDoc + serverTimestamp + updatedBy
  const updateUser = useCallback(
    async (uid: string, patch: UserPatch): Promise<void> => {
      const targetUser = users.find((u) => u.id === uid);
      if (!targetUser) {
        throw new Error('Pengguna tidak ditemukan.');
      }

      const changedFields: Record<string, unknown> = {};
      (Object.keys(patch) as Array<keyof UserPatch>).forEach((key) => {
        const nextVal = patch[key];
        if (nextVal !== undefined && JSON.stringify(targetUser[key]) !== JSON.stringify(nextVal)) {
          changedFields[key] = nextVal;
        }
      });

      if (Object.keys(changedFields).length === 0) return;

      // Enforce role & ownership access rules matching firestore.rules
      const hasAdminOnlyField = ADMIN_ONLY_USER_FIELDS.some((field) => field in changedFields);
      if (!isPM) {
        if (uid !== currentUser.id || hasAdminOnlyField) {
          throw new Error('Perubahan ditolak oleh pengaturan akses');
        }
      } else {
        // Admin cannot demote themselves if they are the sole admin
        const adminCount = users.filter((u) => u.role === 'admin').length;
        if (uid === currentUser.id && changedFields.role === 'member' && adminCount <= 1) {
          throw new Error('Perubahan ditolak oleh pengaturan akses');
        }
      }

      // Validate string lengths (1..60) for name and nickname
      if ('name' in changedFields) {
        const val = changedFields.name;
        if (typeof val !== 'string' || val.trim().length < 1 || val.trim().length > 60) {
          throw new Error('Nama lengkap wajib diisi (1–60 karakter).');
        }
      }
      if ('nickname' in changedFields) {
        const val = changedFields.nickname;
        if (typeof val !== 'string' || val.trim().length < 1 || val.trim().length > 60) {
          throw new Error('Nama panggilan wajib diisi (1–60 karakter).');
        }
      }

      const actorUid = currentUser.id;
      const nowIso = new Date().toISOString();
      const previousUsers = users;

      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === uid
            ? {
                ...u,
                ...(changedFields as UserPatch),
                updatedAt: nowIso,
                updatedBy: actorUid,
              }
            : u
        );
        try {
          window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });

      // Broadcast granular per-field user patch for instant cross-tab sync without overwriting other fields
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'USER_PATCH',
          clientId: clientIdRef.current,
          uid,
          patch: changedFields,
          updatedAt: nowIso,
          updatedBy: actorUid,
        });
      } catch {
        // ignore BroadcastChannel errors
      }

      if (isLiveFirebaseConfig && db && auth?.currentUser) {
        const firestoreDb = db;
        const userDocRef = typedDoc<User>(firestoreDb, 'users', uid);
        try {
          await updateDoc(userDocRef, {
            ...changedFields,
            updatedAt: serverTimestamp(),
            updatedBy: actorUid,
          });
        } catch (err: unknown) {
          // Roll back optimistic state on Firestore rejection
          setUsers(previousUsers);
          try {
            window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(previousUsers));
          } catch {
            // ignore
          }
          const rawCode =
            typeof err === 'object' && err !== null && 'code' in err
              ? String((err as { code?: unknown }).code)
              : '';
          const rawMsg = err instanceof Error ? err.message : '';
          if (
            rawCode.includes('permission-denied') ||
            rawMsg.toLowerCase().includes('permission') ||
            rawMsg.toLowerCase().includes('insufficient')
          ) {
            throw new Error('Perubahan ditolak oleh pengaturan akses');
          }
          throw new Error(
            'Gagal menyimpan perubahan profil. Periksa koneksi jaringan Anda dan coba lagi.'
          );
        }
      }
    },
    [users, currentUser.id, isPM]
  );

  // Expose updateUser on window for console testing (e.g. testing member role change rejection)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (
        window as unknown as {
          updateUser?: (uid: string, patch: UserPatch) => Promise<void>;
        }
      ).updateUser = updateUser;
    }
  }, [updateUser]);

  const formatTimeNow = () => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const applyProjectData = useCallback(
    (
      raw?: Partial<SharedProjectData>,
      updatedAt?: number,
      options?: { skipUsersIfFirestoreActive?: boolean }
    ) => {
      const payload: SharedProjectData = {
        ...INITIAL_PROJECT_DATA,
        ...(raw || {}),
      };
      const serialized = JSON.stringify(payload);
      lastSyncedPayload.current = serialized;
      if (typeof updatedAt === 'number' && updatedAt > 0) {
        lastServerTimestampRef.current = updatedAt;
      }
      try {
        window.localStorage.setItem(LOCAL_STORAGE_DATA_KEY, serialized);
      } catch {
        // ignore localStorage quota errors
      }
      const shouldApplyUsers =
        !(options?.skipUsersIfFirestoreActive && usersCollectionActiveRef.current) &&
        payload.users &&
        Array.isArray(payload.users) &&
        payload.users.length > 0;

      if (shouldApplyUsers && payload.users) {
        const normalizedUsers = sortAndNormalizeUsers(payload.users);
        setUsers(normalizedUsers);
        setIsUsersLoaded(true);
        try {
          window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(normalizedUsers));
        } catch {
          // ignore
        }
      }
      setConfig(payload.config);
      setTasks(payload.tasks);
      setDeliverables(payload.deliverables);
      setWeeklyPlans(payload.weeklyPlans);
      setGanttTasks(payload.ganttTasks);
      setRaciRows(payload.raciRows);
      setSlideDecks(payload.slideDecks);
      setTrackerActions(payload.trackerActions);
      setMeetingLogs(payload.meetingLogs);
      setStandards(payload.standards);
      setLogbooks(payload.logbooks);
      setRubricParameters(payload.rubricParameters);
      setDefenseQuestions(payload.defenseQuestions);
      setPhysicalChecklist(payload.physicalChecklist);
      setNotifications(payload.notifications);
      setLastSyncedAt(formatTimeNow());
    },
    []
  );

  const fetchSharedServerData = useCallback(
    async (forceApply = false): Promise<boolean> => {
      try {
        setIsSyncing(true);
        const response = await fetch('/api/project-data', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) return false;
        const result = (await response.json()) as {
          updatedAt?: number;
          clientId?: string;
          data?: Partial<SharedProjectData> | null;
        };
        if (result && result.data) {
          const remoteTime = result.updatedAt || 0;
          if (
            forceApply ||
            remoteTime > lastServerTimestampRef.current ||
            !lastSyncedPayload.current
          ) {
            applyProjectData(result.data, remoteTime, {
              skipUsersIfFirestoreActive: true,
            });
          }
          setIsDataLoaded(true);
          setIsUsersLoaded(true);
          setIsLoading(false);
          setSyncError(null);
          return true;
        } else if (result && !result.data) {
          let seedData: SharedProjectData = INITIAL_PROJECT_DATA;
          try {
            const saved = window.localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
            if (saved) {
              seedData = {
                ...INITIAL_PROJECT_DATA,
                ...(JSON.parse(saved) as Partial<SharedProjectData>),
              };
            }
          } catch {
            // use INITIAL_PROJECT_DATA
          }
          applyProjectData(seedData, Date.now(), {
            skipUsersIfFirestoreActive: true,
          });
          await fetch('/api/project-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: clientIdRef.current,
              data: seedData,
            }),
          }).catch(() => {});
          setIsDataLoaded(true);
          setIsUsersLoaded(true);
          setIsLoading(false);
          setSyncError(null);
          return true;
        }
      } catch {
        // Server endpoint unavailable; fallback to localStorage
      } finally {
        setIsSyncing(false);
      }
      return false;
    },
    [applyProjectData]
  );

  const loadLocalProjectData = useCallback(async () => {
    const syncedFromServer = await fetchSharedServerData(true);
    if (syncedFromServer) return;

    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
      if (saved) {
        applyProjectData(JSON.parse(saved) as Partial<SharedProjectData>);
      } else {
        applyProjectData(INITIAL_PROJECT_DATA);
        window.localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(INITIAL_PROJECT_DATA));
      }
    } catch {
      applyProjectData(INITIAL_PROJECT_DATA);
    }
    setIsDataLoaded(true);
    setIsUsersLoaded(true);
    setIsLoading(false);
    setSyncError(null);
  }, [applyProjectData, fetchSharedServerData]);

  const refreshData = useCallback(async () => {
    const ok = await fetchSharedServerData(true);
    if (!ok) {
      try {
        const saved = window.localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
        if (saved) {
          applyProjectData(JSON.parse(saved) as Partial<SharedProjectData>);
        }
      } catch {
        // ignore
      }
    }
  }, [applyProjectData, fetchSharedServerData]);

  // Real-time listeners: SSE (/api/project-data/stream), polling fallback, BroadcastChannel, and storage event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_DATA_KEY && event.newValue) {
        if (event.newValue !== lastSyncedPayload.current) {
          try {
            applyProjectData(JSON.parse(event.newValue) as Partial<SharedProjectData>, undefined, {
              skipUsersIfFirestoreActive: true,
            });
          } catch {
            // ignore invalid json
          }
        }
      }
      if (event.key === LOCAL_STORAGE_USERS_KEY && event.newValue) {
        try {
          setUsers(sortAndNormalizeUsers(JSON.parse(event.newValue) as User[]));
          setIsUsersLoaded(true);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        const msg = event.data as {
          type?: string;
          clientId?: string;
          uid?: string;
          patch?: UserPatch;
          updatedAt?: number | string;
          updatedBy?: string;
          data?: Partial<SharedProjectData>;
        };
        if (!msg || msg.clientId === clientIdRef.current) return;

        if (msg.type === 'USER_PATCH' && msg.uid && msg.patch) {
          setUsers((prev) => {
            const next = prev.map((u) =>
              u.id === msg.uid
                ? {
                    ...u,
                    ...msg.patch,
                    updatedAt: msg.updatedAt ?? u.updatedAt,
                    updatedBy: msg.updatedBy ?? u.updatedBy,
                  }
                : u
            );
            try {
              window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
          return;
        }

        if (msg.data) {
          applyProjectData(
            msg.data,
            typeof msg.updatedAt === 'number' ? msg.updatedAt : undefined,
            { skipUsersIfFirestoreActive: true }
          );
        }
      };
    }

    let eventSource: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        eventSource = new EventSource('/api/project-data/stream');
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data) as {
              updatedAt?: number;
              clientId?: string;
              data?: Partial<SharedProjectData>;
            };
            if (
              parsed &&
              parsed.data &&
              parsed.clientId !== clientIdRef.current &&
              (parsed.updatedAt || 0) >= lastServerTimestampRef.current
            ) {
              const incomingSerialized = JSON.stringify({
                ...INITIAL_PROJECT_DATA,
                ...parsed.data,
              });
              if (incomingSerialized !== lastSyncedPayload.current) {
                applyProjectData(parsed.data, parsed.updatedAt, {
                  skipUsersIfFirestoreActive: true,
                });
              }
            }
          } catch {
            // ignore malformed SSE message
          }
        };
      } catch {
        // ignore SSE setup errors
      }
    }

    const pollInterval = window.setInterval(() => {
      void fetchSharedServerData(false);
    }, 2000);

    const handleFocus = () => {
      void fetchSharedServerData(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(pollInterval);
      eventSource?.close();
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, [applyProjectData, fetchSharedServerData]);

  // Firebase Auth & Firestore onSnapshot listeners for `users` collection and `projectData/area1`
  useEffect(() => {
    if (!isLiveFirebaseConfig || !auth || !db) {
      setIsUsersLoaded(true);
      const savedUserId = window.localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      const matched = INITIAL_USERS.find((u) => u.id === savedUserId);
      if (matched) {
        setCurrentUserId(matched.id);
        setIsLoggedIn(true);
        void loadLocalProjectData();
      } else {
        setIsLoggedIn(false);
        setCurrentUserId('');
        setIsLoading(false);
      }
      return;
    }

    const firebaseAuth = auth;
    const firestoreDb = db;

    const unsubscribeAuth = onAuthStateChanged(
      firebaseAuth,
      (firebaseUser) => {
        dataUnsubscribe.current?.();
        dataUnsubscribe.current = null;
        usersUnsubscribe.current?.();
        usersUnsubscribe.current = null;
        usersCollectionActiveRef.current = false;
        setIsDataLoaded(false);

        if (!firebaseUser) {
          const savedUserId = window.localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          const localUser = INITIAL_USERS.find((u) => u.id === savedUserId);
          if (localUser) {
            setCurrentUserId(localUser.id);
            setIsLoggedIn(true);
            setIsUsersLoaded(true);
            void loadLocalProjectData();
            return;
          }
          setIsLoggedIn(false);
          setCurrentUserId('');
          setIsUsersLoaded(true);
          setIsLoading(false);
          return;
        }

        const matchedUser = INITIAL_USERS.find(
          (user) => user.email.toLowerCase() === firebaseUser.email?.toLowerCase()
        );
        if (!matchedUser) {
          setAuthError('Akun ini tidak terdaftar sebagai anggota tim Area 1.');
          setIsLoggedIn(false);
          setCurrentUserId('');
          setIsUsersLoaded(true);
          setIsLoading(false);
          void signOut(firebaseAuth).catch((error: unknown) => {
            setAuthError(
              error instanceof Error ? error.message : 'Gagal mengakhiri sesi Firebase.'
            );
          });
          return;
        }

        setAuthError(null);
        setSyncError(null);
        setCurrentUserId(matchedUser.id);
        setIsLoggedIn(true);
        setIsLoading(true);

        // 1. Single realtime onSnapshot listener for `users` collection
        const usersColRef = typedCollection<User>(firestoreDb, 'users');
        usersUnsubscribe.current = onSnapshot(
          usersColRef,
          (snapshot: QuerySnapshot<User>) => {
            if (snapshot.empty) {
              if (snapshot.metadata.fromCache) return;
              if (!usersSeedInProgress.current) {
                usersSeedInProgress.current = true;
                Promise.all(
                  INITIAL_USERS.map((u) =>
                    setDoc(typedDoc<User>(firestoreDb, 'users', u.id), {
                      ...u,
                      updatedAt: serverTimestamp(),
                      updatedBy: matchedUser.id,
                    })
                  )
                )
                  .then(() => {
                    usersSeedInProgress.current = false;
                    usersCollectionActiveRef.current = true;
                    setIsUsersLoaded(true);
                  })
                  .catch(() => {
                    usersSeedInProgress.current = false;
                    setIsUsersLoaded(true);
                  });
              }
              return;
            }

            usersCollectionActiveRef.current = true;
            const loadedUsers = snapshot.docs.map((docSnap: QueryDocumentSnapshot<User>) => ({
              ...docSnap.data(),
              id: docSnap.id,
            }));
            const normalized = sortAndNormalizeUsers(loadedUsers);
            setUsers(normalized);
            setIsUsersLoaded(true);
            try {
              window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(normalized));
            } catch {
              // ignore storage errors
            }
          },
          () => {
            // Fallback to local users if Firestore rules or connectivity block `users` collection
            usersCollectionActiveRef.current = false;
            setIsUsersLoaded(true);
          }
        );

        // 2. Realtime onSnapshot listener for `projectData/area1`
        const projectRef = typedDoc<SharedProjectData>(firestoreDb, ...PROJECT_DATA_REF);
        dataUnsubscribe.current = onSnapshot(
          projectRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              if (snapshot.metadata.fromCache) return;
              if (!seedInProgress.current) {
                seedInProgress.current = true;
                const seed = INITIAL_PROJECT_DATA;
                const seedPayload = JSON.stringify(seed);
                void setDoc(projectRef, seed)
                  .then(() => {
                    lastSyncedPayload.current = seedPayload;
                    seedInProgress.current = false;
                    setIsDataLoaded(true);
                    setIsLoading(false);
                  })
                  .catch(() => {
                    seedInProgress.current = false;
                    void loadLocalProjectData();
                  });
              }
              return;
            }

            applyProjectData(snapshot.data() as Partial<SharedProjectData>, Date.now(), {
              skipUsersIfFirestoreActive: true,
            });
            setIsDataLoaded(true);
            setIsLoading(false);
            setSyncError(null);
          },
          () => {
            void loadLocalProjectData();
          }
        );
      },
      () => {
        setIsUsersLoaded(true);
        void loadLocalProjectData();
      }
    );

    return () => {
      unsubscribeAuth();
      dataUnsubscribe.current?.();
      usersUnsubscribe.current?.();
    };
  }, [applyProjectData, loadLocalProjectData]);

  // Push any state change immediately to shared server, BroadcastChannel, localStorage, and Firestore
  useEffect(() => {
    if (!isLoggedIn || !isDataLoaded) return;

    const payload: SharedProjectData = {
      users,
      config,
      tasks,
      deliverables,
      weeklyPlans,
      ganttTasks,
      raciRows,
      slideDecks,
      trackerActions,
      meetingLogs,
      standards,
      logbooks,
      rubricParameters,
      defenseQuestions,
      physicalChecklist,
      notifications,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSyncedPayload.current) return;

    lastSyncedPayload.current = serialized;
    const now = Date.now();
    lastServerTimestampRef.current = now;
    setLastSyncedAt(formatTimeNow());

    try {
      window.localStorage.setItem(LOCAL_STORAGE_DATA_KEY, serialized);
    } catch {
      // ignore storage quota errors
    }

    try {
      broadcastChannelRef.current?.postMessage({
        clientId: clientIdRef.current,
        updatedAt: now,
        data: payload,
      });
    } catch {
      // ignore BroadcastChannel errors
    }

    void fetch('/api/project-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientIdRef.current,
        data: payload,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const json = (await res.json()) as { updatedAt?: number };
          if (json.updatedAt) {
            lastServerTimestampRef.current = json.updatedAt;
          }
        }
      })
      .catch(() => {
        // persisted in localStorage as fallback
      });

    if (isLiveFirebaseConfig && db) {
      const firestoreDb = db;
      void setDoc(typedDoc<SharedProjectData>(firestoreDb, ...PROJECT_DATA_REF), payload).catch(() => {
        // persisted locally and on shared server
      });
    }
  }, [
    isLoggedIn,
    isDataLoaded,
    users,
    config,
    tasks,
    deliverables,
    weeklyPlans,
    ganttTasks,
    raciRows,
    slideDecks,
    trackerActions,
    meetingLogs,
    standards,
    logbooks,
    rubricParameters,
    defenseQuestions,
    physicalChecklist,
    notifications,
  ]);

  const login = async (identifier: string, password: string) => {
    const cleanInput = identifier.trim();
    const matchedUser = resolveUserFromRef(cleanInput, users);

    if (!matchedUser) {
      const msg = 'Akun tidak terdaftar pada tim Area 1. Gunakan email atau username anggota tim.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!password || password.trim().length < 4) {
      const msg = 'Password tidak valid.';
      setAuthError(msg);
      throw new Error(msg);
    }

    setAuthError(null);
    window.localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, matchedUser.id);

    if (isLiveFirebaseConfig && auth) {
      try {
        await signInWithEmailAndPassword(auth, matchedUser.email, password);
        return;
      } catch {
        try {
          await createUserWithEmailAndPassword(auth, matchedUser.email, password);
          return;
        } catch {
          // Fall back to local/shared server authenticated session when offline
        }
      }
    }

    setCurrentUserId(matchedUser.id);
    setIsLoggedIn(true);
    setIsUsersLoaded(true);
    await loadLocalProjectData();
  };

  const logout = async () => {
    window.localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    if (isLiveFirebaseConfig && auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore signOut errors
      }
    }
    setIsLoggedIn(false);
    setCurrentUserId('');
  };

  // State mutators
  const updateConfig = (patch: Partial<Config>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const addTask = (newTask: Omit<TaskItem, 'id'>) => {
    const resolvedUid = getUser(newTask.pic)?.id || newTask.pic;
    const item: TaskItem = {
      ...newTask,
      pic: resolvedUid,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [item, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateDeliverable = (id: string, patch: Partial<DeliverableItem>) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  const addWeeklyPlan = (plan: Omit<WeeklyPlanItem, 'id'>) => {
    const resolvedUid = getUser(plan.pic)?.id || plan.pic;
    const newPlan: WeeklyPlanItem = {
      ...plan,
      pic: resolvedUid,
      id: `plan-${Date.now()}`,
    };
    setWeeklyPlans((prev) => [...prev, newPlan]);
  };

  const updateWeeklyPlan = (id: string, patch: Partial<WeeklyPlanItem>) => {
    const nextPatch = { ...patch };
    if (nextPatch.pic) {
      nextPatch.pic = getUser(nextPatch.pic)?.id || nextPatch.pic;
    }
    setWeeklyPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...nextPatch } : p))
    );
  };

  const deleteWeeklyPlan = (id: string) => {
    setWeeklyPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const addGanttTask = (gt: Omit<GanttTaskItem, 'id'>) => {
    const rawRef = gt.pic || gt.picCode;
    const resolvedUid =
      rawRef?.toUpperCase() === 'ALL' ? 'ALL' : getUser(rawRef)?.id || rawRef;
    const newTask: GanttTaskItem = {
      ...gt,
      pic: resolvedUid,
      picCode: resolvedUid,
      id: `gt-${Date.now()}`,
    };
    setGanttTasks((prev) => [...prev, newTask]);
  };

  const deleteGanttTask = (id: string) => {
    setGanttTasks((prev) => prev.filter((gt) => gt.id !== id));
  };

  const updateRaciCell = (
    rowId: string,
    memberUidOrKey: string,
    value: RaciRoleValue
  ) => {
    const resolvedUser = getUser(memberUidOrKey);
    const targetUid =
      resolvedUser?.legacyId || resolvedUser?.id || memberUidOrKey;
    const uidToLegacyKey: Record<
      string,
      'rahul' | 'ihsan' | 'althaf' | 'jonathan' | 'heidi'
    > = {
      'user-rahul': 'rahul',
      'user-ihsan': 'ihsan',
      'user-althaf': 'althaf',
      'user-jonathan': 'jonathan',
      'user-heidi': 'heidi',
    };
    const legacyKey = uidToLegacyKey[targetUid];

    setRaciRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const currentAssignments: Record<string, RaciRoleValue> = {
          'user-rahul': getRaciRoleForUser(row, 'user-rahul'),
          'user-ihsan': getRaciRoleForUser(row, 'user-ihsan'),
          'user-althaf': getRaciRoleForUser(row, 'user-althaf'),
          'user-jonathan': getRaciRoleForUser(row, 'user-jonathan'),
          'user-heidi': getRaciRoleForUser(row, 'user-heidi'),
          ...(row.assignments || {}),
          [targetUid]: value,
        };
        const updated: RaciRow = {
          ...row,
          assignments: currentAssignments,
          ...(legacyKey ? { [legacyKey]: value } : {}),
        };
        const vals = USER_ORDER.map((uid) => currentAssignments[uid] || '');
        const aCount = vals.filter((v) => v === 'A').length;
        const rCount = vals.filter((v) => v === 'R').length;
        const status =
          aCount === 1 && rCount >= 1
            ? `Valid (1A, ${rCount}R)`
            : `Peringatan: Butuh tepat 1A & min 1R (Saat ini: ${aCount}A, ${rCount}R)`;
        return { ...updated, validationStatus: status };
      })
    );
  };

  const addRaciRow = (row: Omit<RaciRow, 'id'>) => {
    const assignments: Record<string, RaciRoleValue> = {
      'user-rahul': row.assignments?.['user-rahul'] ?? row.rahul ?? '',
      'user-ihsan': row.assignments?.['user-ihsan'] ?? row.ihsan ?? '',
      'user-althaf': row.assignments?.['user-althaf'] ?? row.althaf ?? '',
      'user-jonathan': row.assignments?.['user-jonathan'] ?? row.jonathan ?? '',
      'user-heidi': row.assignments?.['user-heidi'] ?? row.heidi ?? '',
    };
    const newRow: RaciRow = {
      ...row,
      assignments,
      id: `raci-${Date.now()}`,
    };
    setRaciRows((prev) => [...prev, newRow]);
  };

  const addSlideDeck = (deck: Omit<SlideDeckItem, 'id'>) => {
    const resolvedUid = getUser(deck.presenter)?.id || deck.presenter;
    const item: SlideDeckItem = {
      ...deck,
      presenter: resolvedUid,
      id: `deck-${Date.now()}`,
    };
    setSlideDecks((prev) => [item, ...prev]);
  };

  const deleteSlideDeck = (id: string) => {
    setSlideDecks((prev) => prev.filter((d) => d.id !== id));
  };

  const addTrackerAction = (item: Omit<TrackerActionItem, 'id' | 'code'>) => {
    const nextNum = trackerActions.length + 1;
    const code = `ACT-0${nextNum}`;
    const rawRef = item.pic || item.picCode;
    const resolvedUid = getUser(rawRef)?.id || rawRef;
    const newItem: TrackerActionItem = {
      ...item,
      pic: resolvedUid,
      picCode: resolvedUid,
      id: `act-${Date.now()}`,
      code,
    };
    setTrackerActions((prev) => [...prev, newItem]);
  };

  const toggleTrackerActionStatus = (id: string) => {
    setTrackerActions((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              progress: act.progress === 'Resolved' ? 'In Progress' : 'Resolved',
            }
          : act
      )
    );
  };

  const deleteTrackerAction = (id: string) => {
    setTrackerActions((prev) => prev.filter((a) => a.id !== id));
  };

  const addMeetingLog = (log: Omit<MeetingLogItem, 'id'>) => {
    const normalizedMembers = log.presentMembers.map(
      (ref) => getUser(ref)?.id || ref
    );
    const newLog: MeetingLogItem = {
      ...log,
      presentMembers: normalizedMembers,
      id: `mom-${Date.now()}`,
    };
    setMeetingLogs((prev) => [newLog, ...prev]);
  };

  const addStandard = (std: Omit<StandardReferenceItem, 'id'>) => {
    const newStd: StandardReferenceItem = {
      ...std,
      id: `std-${Date.now()}`,
    };
    setStandards((prev) => [...prev, newStd]);
  };

  const deleteStandard = (id: string) => {
    setStandards((prev) => prev.filter((s) => s.id !== id));
  };

  const addLogbook = (entry: Omit<LogbookItem, 'id' | 'verifiedByLecturer'>) => {
    const resolvedUid = getUser(entry.authorId)?.id || entry.authorId;
    const newEntry: LogbookItem = {
      date: entry.date,
      authorId: resolvedUid,
      workDescription: entry.workDescription,
      issueSolution: entry.issueSolution,
      id: `log-${Date.now()}`,
      verifiedByLecturer: false,
    };
    setLogbooks((prev) => [newEntry, ...prev]);
  };

  const toggleLogbookVerification = (id: string) => {
    setLogbooks((prev) =>
      prev.map((log) =>
        log.id === id
          ? {
              ...log,
              verifiedByLecturer: !log.verifiedByLecturer,
              verifiedDate: !log.verifiedByLecturer ? 'Hari ini' : undefined,
            }
          : log
      )
    );
  };

  const deleteLogbook = (id: string) => {
    setLogbooks((prev) => prev.filter((l) => l.id !== id));
  };

  const updateRubricScore = (id: string, score: number) => {
    setRubricParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, score } : p))
    );
  };

  const toggleRubricItem = (paramId: string, itemIdx: number) => {
    setRubricParameters((prev) =>
      prev.map((p) => {
        if (p.id !== paramId) return p;
        const newItems = p.items.map((it, idx) =>
          idx === itemIdx ? { ...it, checked: !it.checked } : it
        );
        return { ...p, items: newItems };
      })
    );
  };

  const updateRubricMitigation = (id: string, mitigation: string) => {
    setRubricParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, mitigation } : p))
    );
  };

  const updateDefenseResponse = (id: string, newResponse: string) => {
    setDefenseQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, verifiedResponse: newResponse } : q))
    );
  };

  const addDefenseQuestion = (q: Omit<DefenseQuestion, 'id'>) => {
    const resolvedUid = getUser(q.pic)?.id || q.pic;
    const newQ: DefenseQuestion = {
      ...q,
      pic: resolvedUid,
      id: `q-${Date.now()}`,
    };
    setDefenseQuestions((prev) => [...prev, newQ]);
  };

  const togglePhysicalItem = (id: string) => {
    setPhysicalChecklist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ready: !it.ready } : it))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Metrics
  const verifiedLogbooksCount = useMemo(() => {
    return logbooks.filter((l) => l.verifiedByLecturer).length;
  }, [logbooks]);

  const totalLogbooksCount = logbooks.length;

  const overallWeightedProgress = useMemo(() => {
    const coreDeliverables = deliverables.filter((d) => d.weight > 0);
    const totalWeight = coreDeliverables.reduce((acc, curr) => acc + curr.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = coreDeliverables.reduce(
      (acc, curr) => acc + (curr.progress * curr.weight) / 100,
      0
    );
    return Math.round((weightedSum / totalWeight) * 100);
  }, [deliverables]);

  const averageRubricScore = useMemo(() => {
    if (rubricParameters.length === 0) return 0;
    const sum = rubricParameters.reduce((acc, curr) => acc + curr.score, 0);
    return Number((sum / rubricParameters.length).toFixed(1));
  }, [rubricParameters]);

  const stageGateReadinessPercent = useMemo(() => {
    let totalItems = 0;
    let checkedItems = 0;

    rubricParameters.forEach((p) => {
      p.items.forEach((it) => {
        totalItems++;
        if (it.checked) checkedItems++;
      });
    });

    physicalChecklist.forEach((pb) => {
      totalItems++;
      if (pb.ready) checkedItems++;
    });

    if (totalItems === 0) return 78;
    return Math.round((checkedItems / totalItems) * 100);
  }, [rubricParameters, physicalChecklist]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // JSON Export / Import
  const exportDataToJson = () => {
    const payload = {
      schema_version: '3.3',
      exported_at: new Date().toISOString(),
      users,
      config,
      tasks,
      deliverables,
      weeklyPlans,
      ganttTasks,
      raciRows,
      slideDecks,
      trackerActions,
      meetingLogs,
      standards,
      logbooks,
      rubricParameters,
      defenseQuestions,
      physicalChecklist,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataFromJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (
        data.users &&
        Array.isArray(data.users) &&
        !usersCollectionActiveRef.current
      ) {
        setUsers(sortAndNormalizeUsers(data.users as User[]));
      }
      if (data.config) setConfig(data.config);
      if (data.tasks) setTasks(data.tasks);
      if (data.deliverables) setDeliverables(data.deliverables);
      if (data.weeklyPlans) setWeeklyPlans(data.weeklyPlans);
      if (data.ganttTasks) setGanttTasks(data.ganttTasks);
      if (data.raciRows) setRaciRows(data.raciRows);
      if (data.slideDecks) setSlideDecks(data.slideDecks);
      if (data.trackerActions) setTrackerActions(data.trackerActions);
      if (data.meetingLogs) setMeetingLogs(data.meetingLogs);
      if (data.standards) setStandards(data.standards);
      if (data.logbooks) setLogbooks(data.logbooks);
      if (data.rubricParameters) setRubricParameters(data.rubricParameters);
      if (data.defenseQuestions) setDefenseQuestions(data.defenseQuestions);
      if (data.physicalChecklist) setPhysicalChecklist(data.physicalChecklist);
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = () => {
    if (!usersCollectionActiveRef.current) {
      setUsers(INITIAL_USERS);
    }
    setConfig(INITIAL_CONFIG);
    setTasks(INITIAL_TASKS);
    setDeliverables(INITIAL_DELIVERABLES);
    setWeeklyPlans(INITIAL_WEEKLY_PLANS);
    setGanttTasks(INITIAL_GANTT_TASKS);
    setRaciRows(INITIAL_RACI_ROWS);
    setSlideDecks(INITIAL_SLIDE_DECKS);
    setTrackerActions(INITIAL_TRACKER_ACTIONS);
    setMeetingLogs(INITIAL_MEETING_LOGS);
    setStandards(INITIAL_STANDARDS);
    setLogbooks(INITIAL_LOGBOOKS);
    setRubricParameters(INITIAL_RUBRIC_PARAMETERS);
    setDefenseQuestions(INITIAL_DEFENSE_QUESTIONS);
    setPhysicalChecklist(INITIAL_PHYSICAL_CHECKLIST);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const previewUserMigration = useCallback((): MigrationPreviewResult => {
    return previewMigrateUserRefs(
      {
        config,
        tasks,
        deliverables,
        weeklyPlans,
        ganttTasks,
        raciRows,
        slideDecks,
        trackerActions,
        meetingLogs,
        regulations,
        standards,
        logbooks,
        rubric: rubricParameters,
        defenseQuestions,
        physicalChecklist,
        notifications,
      },
      users
    );
  }, [
    config,
    tasks,
    deliverables,
    weeklyPlans,
    ganttTasks,
    raciRows,
    slideDecks,
    trackerActions,
    meetingLogs,
    regulations,
    standards,
    logbooks,
    rubricParameters,
    defenseQuestions,
    physicalChecklist,
    notifications,
    users,
  ]);

  const executeUserMigration = useCallback(async (): Promise<MigrationPreviewResult> => {
    if (!isPM) {
      throw new Error('Hanya Admin (Project Manager) yang dapat menjalankan migrasi referensi pengguna.');
    }
    const preview = previewUserMigration();
    if (preview.totalRecordsToChange > 0) {
      const m = preview.migratedData;
      setTasks(m.tasks);
      setWeeklyPlans(m.weeklyPlans);
      setGanttTasks(m.ganttTasks);
      setRaciRows(m.raciRows);
      setSlideDecks(m.slideDecks);
      setTrackerActions(m.trackerActions);
      setMeetingLogs(m.meetingLogs);
      setLogbooks(m.logbooks);
      setRubricParameters(m.rubric);
      setDefenseQuestions(m.defenseQuestions);
    }

    if (isLiveFirebaseConfig && db && !usersCollectionActiveRef.current) {
      const firestoreDb = db;
      await Promise.all(
        users.map((u) =>
          setDoc(typedDoc<User>(firestoreDb, 'users', u.id), {
            ...u,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.id,
          }).catch(() => {})
        )
      );
    }

    return preview;
  }, [isPM, previewUserMigration, users, currentUser.id]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        isUsersLoaded,
        getUser,
        updateUser,
        isLoggedIn,
        isLoading,
        isDataLoaded,
        authError,
        syncError,
        firebaseConfigured,
        lastSyncedAt,
        isSyncing,
        refreshData,
        activeTab,
        setActiveTab,
        login,
        logout,
        isPM,

        config,
        updateConfig,

        tasks,
        addTask,
        toggleTask,
        deleteTask,

        deliverables,
        updateDeliverable,

        weeklyPlans,
        addWeeklyPlan,
        updateWeeklyPlan,
        deleteWeeklyPlan,

        ganttTasks,
        addGanttTask,
        deleteGanttTask,

        raciRows,
        updateRaciCell,
        addRaciRow,

        slideDecks,
        addSlideDeck,
        deleteSlideDeck,

        trackerActions,
        addTrackerAction,
        toggleTrackerActionStatus,
        deleteTrackerAction,

        meetingLogs,
        addMeetingLog,

        regulations,
        standards,
        addStandard,
        deleteStandard,

        logbooks,
        addLogbook,
        toggleLogbookVerification,
        deleteLogbook,

        rubricParameters,
        updateRubricScore,
        toggleRubricItem,
        updateRubricMitigation,

        defenseQuestions,
        updateDefenseResponse,
        addDefenseQuestion,

        physicalChecklist,
        togglePhysicalItem,

        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        verifiedLogbooksCount,
        totalLogbooksCount,
        overallWeightedProgress,
        averageRubricScore,
        stageGateReadinessPercent,
        unreadNotificationsCount,

        exportDataToJson,
        importDataFromJson,
        resetToDefaults,
        previewUserMigration,
        executeUserMigration,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
