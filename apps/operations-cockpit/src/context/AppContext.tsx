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
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  QueryDocumentSnapshot,
  QuerySnapshot,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
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
  WorkOrderDraft,
  WorkOrderHistoryEntry,
  WorkOrderScheduleLink,
  CreateWorkOrderInput,
  UpdateWorkOrderMetaInput,
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
import { auth, db, firebaseConfigured, isLiveFirebaseConfig } from '../firebase';
import {
  MigrationPreviewResult,
  getRaciRoleForUser,
  previewMigrateUserRefs,
  resolveUserFromRef,
} from '../utils/migrateUserRefs';
import {
  ADMIN_ONLY_USER_FIELDS,
  AppContextType,
  INITIAL_PROJECT_DATA,
  ImportDataResult,
  NavTab,
  PROJECT_DATA_REF,
  ProjectSectionKey,
  SECTION_KEYS,
  SharedProjectData,
  USER_ORDER,
} from './appContextTypes';
import {
  computeNextTrackerCode,
  formatTimeNow,
  newId,
  parseAndValidateImportJson,
  sanitizeExternalUrl,
  serializeSections,
  sortAndNormalizeUsers,
  translateAuthError,
  typedCollection,
  typedDoc,
} from './appContextHelpers';
import {
  computeDeadlineReminderNotifications,
  computeNextWorkOrderCode,
  computeProjectWeekFromDate,
  extractWorkOrderSeq,
  findWorkOrderForTrackerAction,
  formatIsoDateTimeShort,
  formatWorkOrderCode,
  formatYmdToIndonesian,
  getTodayLocalYmd,
  isExclusivelyAssignedToCurrentPM,
  isUserWorkOrderAssignee,
} from '../utils/workOrderHelpers';

export type { NavTab, AppContextType };

const AppContext = createContext<AppContextType | undefined>(undefined);

const SYNC_DEBOUNCE_MS = 400;

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
      // Bersihkan sisa cache dari versi lama (mode lokal sudah dihapus).
      ['area1_dme_session_user_id', 'area1_dme_project_data', 'area1_dme_users_data'].forEach(
        (key) => window.localStorage.removeItem(key)
      );
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
  const [ganttPhases, setGanttPhases] = useState<GanttPhase[]>(INITIAL_GANTT_PHASES);
  const [raciRows, setRaciRows] = useState<RaciRow[]>(INITIAL_RACI_ROWS);
  const [slideDecks, setSlideDecks] = useState<SlideDeckItem[]>(INITIAL_SLIDE_DECKS);
  const [trackerActions, setTrackerActions] = useState<TrackerActionItem[]>(INITIAL_TRACKER_ACTIONS);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLogItem[]>(INITIAL_MEETING_LOGS);
  const [regulations, setRegulations] = useState<RegulationDirective[]>(INITIAL_REGULATIONS);
  const [standards, setStandards] = useState<StandardReferenceItem[]>(INITIAL_STANDARDS);
  const [logbooks, setLogbooks] = useState<LogbookItem[]>(INITIAL_LOGBOOKS);
  const [rubricParameters, setRubricParameters] = useState<RubricParameter[]>(INITIAL_RUBRIC_PARAMETERS);
  const [defenseQuestions, setDefenseQuestions] = useState<DefenseQuestion[]>(INITIAL_DEFENSE_QUESTIONS);
  const [physicalChecklist, setPhysicalChecklist] = useState<PhysicalBundleItem[]>(INITIAL_PHYSICAL_CHECKLIST);
  const [rawNotifications, setRawNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isWorkOrdersLoaded, setIsWorkOrdersLoaded] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);
  const [workOrderFormDraft, setWorkOrderFormDraft] = useState<WorkOrderDraft | null>(null);

  const lastSyncedSections = useRef<Record<ProjectSectionKey, string> | null>(null);
  const pendingSectionKeysRef = useRef<Set<ProjectSectionKey>>(new Set());
  const syncDebounceRef = useRef<number>(0);
  const seedInProgress = useRef(false);
  const usersSeedInProgress = useRef(false);
  const usersCollectionActiveRef = useRef(false);
  const dataUnsubscribe = useRef<(() => void) | null>(null);
  const usersUnsubscribe = useRef<(() => void) | null>(null);
  const workOrdersUnsubscribe = useRef<(() => void) | null>(null);
  const loadTimeoutRef = useRef<number>(0);
  const isDataLoadedRef = useRef(false);
  const usersRef = useRef<User[]>(users);
  const rawNotificationsRef = useRef<AppNotification[]>(rawNotifications);

  useEffect(() => {
    isDataLoadedRef.current = isDataLoaded;
  }, [isDataLoaded]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    rawNotificationsRef.current = rawNotifications;
  }, [rawNotifications]);

  // Matched active user from single source of truth `users` (matches id or legacyId)
  const matchedCurrentUser = useMemo(() => {
    if (!currentUserId) return undefined;
    return users.find(
      (u) =>
        u.id === currentUserId ||
        (Boolean(u.legacyId) && u.legacyId === currentUserId)
    );
  }, [users, currentUserId]);

  const currentUser = useMemo(() => {
    return matchedCurrentUser || users[0];
  }, [matchedCurrentUser, users]);

  // Jangan pernah memberikan hak isPM dari fallback users[0] saat currentUserId kosong/tidak cocok
  const isPM = Boolean(
    isLoggedIn && currentUserId && matchedCurrentUser && matchedCurrentUser.role === 'admin'
  );

  // Helper getUser(uid): resolves by UID with fallback to nickname, name, code, or raciTag
  const getUser = useCallback(
    (uidOrLegacyRef: string | undefined | null): User | undefined => {
      return (
        resolveUserFromRef(uidOrLegacyRef, users) ??
        resolveUserFromRef(uidOrLegacyRef, INITIAL_USERS)
      );
    },
    [users]
  );

  // Per-user notification read status, recipient filtering, & ephemeral WO deadline reminders
  const notifications = useMemo(() => {
    const readIds = new Set<string>(matchedCurrentUser?.readNotificationIds || []);
    const activeUid = matchedCurrentUser?.id || '';
    const activeLegacyId = matchedCurrentUser?.legacyId || '';

    const visibleStored = rawNotifications
      .filter((n) => {
        if (!n.recipientIds || n.recipientIds.length === 0) return true;
        if (!activeUid) return false;
        return n.recipientIds.some(
          (rid) => rid === activeUid || (Boolean(activeLegacyId) && rid === activeLegacyId)
        );
      })
      .map((n) => ({
        ...n,
        read: Boolean(n.read || readIds.has(n.id)),
      }));

    const deadlineReminders = activeUid
      ? computeDeadlineReminderNotifications(
          workOrders,
          activeUid,
          isPM,
          readIds,
          getTodayLocalYmd(),
          getUser
        )
      : [];

    return [...deadlineReminders, ...visibleStored];
  }, [rawNotifications, matchedCurrentUser, workOrders, isPM, getUser]);

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
      const nextUsersList = previousUsers.map((u) =>
        u.id === uid
          ? {
              ...u,
              ...(changedFields as UserPatch),
              updatedAt: nowIso,
              updatedBy: actorUid,
            }
          : u
      );

      setUsers(nextUsersList);

      if (isLiveFirebaseConfig && db && auth?.currentUser) {
        const firestoreDb = db;
        const userDocRef = typedDoc<User>(firestoreDb, 'users', uid);
        const firestoreChanges = { ...changedFields };
        if (
          isPM &&
          !('nickname' in firestoreChanges) &&
          targetUser.nickname.trim().length >= 1 &&
          targetUser.nickname.trim().length <= 60
        ) {
          firestoreChanges.nickname = targetUser.nickname.trim();
        }
        try {
          await updateDoc(userDocRef, {
            ...firestoreChanges,
            updatedAt: serverTimestamp(),
            updatedBy: actorUid,
          });
          // Sinkronkan jumlah admin ke /config/adminMeta bila role diubah oleh PM
          if (isPM && 'role' in changedFields) {
            const nextAdminCount = nextUsersList.filter((u) => u.role === 'admin').length;
            await setDoc(
              typedDoc<Record<string, unknown>>(firestoreDb, 'config', 'adminMeta'),
              {
                adminCount: nextAdminCount,
                updatedAt: serverTimestamp(),
                updatedBy: actorUid,
              },
              { merge: true }
            ).catch(() => {
              // Abaikan bila gagal menulis metadata opsional
            });
          }
        } catch (err: unknown) {
          // Roll back optimistic state on Firestore rejection
          setUsers(previousUsers);
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

  const applyProjectData = useCallback(
    (
      raw?: Partial<SharedProjectData>,
      options?: {
        skipUsersIfFirestoreActive?: boolean;
        preservePendingSections?: boolean;
      }
    ) => {
      const payload: SharedProjectData = {
        ...INITIAL_PROJECT_DATA,
        ...(raw || {}),
      };
      const incomingSerialized = serializeSections(payload);
      const pendingKeys = options?.preservePendingSections
        ? pendingSectionKeysRef.current
        : new Set<ProjectSectionKey>();

      if (!lastSyncedSections.current) {
        lastSyncedSections.current = incomingSerialized;
      } else {
        for (const key of SECTION_KEYS) {
          if (!pendingKeys.has(key)) {
            lastSyncedSections.current[key] = incomingSerialized[key];
          }
        }
      }

      const shouldApplyUsers =
        !(options?.skipUsersIfFirestoreActive && usersCollectionActiveRef.current) &&
        raw?.users &&
        Array.isArray(raw.users) &&
        raw.users.length > 0;

      if (shouldApplyUsers && raw?.users) {
        const normalizedUsers = sortAndNormalizeUsers(raw.users);
        setUsers(normalizedUsers);
        setIsUsersLoaded(true);
      }
      if (!pendingKeys.has('config')) setConfig(payload.config);
      if (!pendingKeys.has('tasks')) setTasks(payload.tasks);
      if (!pendingKeys.has('deliverables')) setDeliverables(payload.deliverables);
      if (!pendingKeys.has('weeklyPlans')) setWeeklyPlans(payload.weeklyPlans);
      if (!pendingKeys.has('ganttTasks')) setGanttTasks(payload.ganttTasks);
      if (!pendingKeys.has('ganttPhases')) setGanttPhases(payload.ganttPhases);
      if (!pendingKeys.has('raciRows')) setRaciRows(payload.raciRows);
      if (!pendingKeys.has('slideDecks')) setSlideDecks(payload.slideDecks);
      if (!pendingKeys.has('trackerActions')) setTrackerActions(payload.trackerActions);
      if (!pendingKeys.has('meetingLogs') && payload.meetingLogs) setMeetingLogs(payload.meetingLogs);
      if (!pendingKeys.has('regulations') && payload.regulations) setRegulations(payload.regulations);
      if (!pendingKeys.has('standards') && payload.standards) setStandards(payload.standards);
      if (!pendingKeys.has('logbooks')) setLogbooks(payload.logbooks);
      if (!pendingKeys.has('rubricParameters')) setRubricParameters(payload.rubricParameters);
      if (!pendingKeys.has('defenseQuestions')) setDefenseQuestions(payload.defenseQuestions);
      if (!pendingKeys.has('physicalChecklist')) setPhysicalChecklist(payload.physicalChecklist);
      if (!pendingKeys.has('notifications')) setRawNotifications(payload.notifications);
      setLastSyncedAt(formatTimeNow());
    },
    []
  );

  // Muat ulang paksa dari server Firestore (listener onSnapshot sudah real-time; ini untuk tombol segarkan).
  const refreshData = useCallback(async () => {
    if (!isLiveFirebaseConfig || !db) return;
    setIsSyncing(true);
    try {
      const [snap, woSnap] = await Promise.all([
        getDocFromServer(typedDoc<SharedProjectData>(db, ...PROJECT_DATA_REF)),
        getDocsFromServer(typedCollection<WorkOrder>(db, 'workOrders')).catch(() => null),
      ]);
      if (snap.exists()) {
        applyProjectData(snap.data() as Partial<SharedProjectData>, {
          skipUsersIfFirestoreActive: true,
        });
        setSyncError(null);
      }
      if (woSnap) {
        const loadedWos = woSnap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .sort((a, b) => extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code));
        setWorkOrders(loadedWos);
        setIsWorkOrdersLoaded(true);
      }
    } catch (err: unknown) {
      console.error('[firestore] gagal menyegarkan data:', err);
      setSyncError('gagal menyegarkan data dari server.');
    } finally {
      setIsSyncing(false);
    }
  }, [applyProjectData]);

  // Firebase Auth & Firestore onSnapshot listeners for `users`, `projectData/area1`, and `workOrders`
  useEffect(() => {
    if (!isLiveFirebaseConfig || !auth || !db) {
      setIsUsersLoaded(true);
      setIsWorkOrdersLoaded(true);
      setIsLoggedIn(false);
      setCurrentUserId('');
      setIsLoading(false);
      return;
    }

    const firebaseAuth = auth;
    const firestoreDb = db;

    const unsubscribeAuth = onAuthStateChanged(
      firebaseAuth,
      (firebaseUser) => {
        window.clearTimeout(loadTimeoutRef.current);
        window.clearTimeout(syncDebounceRef.current);
        pendingSectionKeysRef.current.clear();
        dataUnsubscribe.current?.();
        dataUnsubscribe.current = null;
        usersUnsubscribe.current?.();
        usersUnsubscribe.current = null;
        workOrdersUnsubscribe.current?.();
        workOrdersUnsubscribe.current = null;
        usersCollectionActiveRef.current = false;
        setIsDataLoaded(false);
        setIsWorkOrdersLoaded(false);

        if (!firebaseUser) {
          setIsLoggedIn(false);
          setCurrentUserId('');
          setWorkOrders([]);
          setIsUsersLoaded(true);
          setIsWorkOrdersLoaded(true);
          setIsLoading(false);
          return;
        }

        const matchedUser =
          usersRef.current.find(
            (user) => user.email.toLowerCase() === firebaseUser.email?.toLowerCase()
          ) ??
          INITIAL_USERS.find(
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

        loadTimeoutRef.current = window.setTimeout(() => {
          if (!isDataLoadedRef.current) {
            console.error('[firestore] timeout: tidak ada respons dari projectData/area1 setelah 15 detik');
            setSyncError(
              'Tidak ada respons dari Firestore. Pastikan database Firestore sudah dibuat (mode Native) dan aturan (rules) sudah dipublish.'
            );
            setIsLoading(false);
          }
        }, 15000);

        // 1. Single realtime onSnapshot listener for `users` collection
        const usersColRef = typedCollection<User>(firestoreDb, 'users');
        usersUnsubscribe.current = onSnapshot(
          usersColRef,
          (snapshot: QuerySnapshot<User>) => {
            if (snapshot.empty) {
              if (snapshot.metadata.fromCache) return;
              if (!usersSeedInProgress.current) {
                usersSeedInProgress.current = true;
                // Inisialisasi kelima akun kanonik tim bila koleksi users masih kosong
                const docsToSeed = INITIAL_USERS;
                Promise.all(
                  docsToSeed.map((u) =>
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
                  .catch((err: { code?: string; message?: string }) => {
                    console.warn('[firestore] seeding koleksi users dilewati/ditolak:', err);
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
          },
          (err) => {
            console.warn('[firestore] listener koleksi users gagal, memakai daftar bawaan:', err);
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
                const { users: _seedUsers, ...seed } = INITIAL_PROJECT_DATA;
                void _seedUsers;
                void setDoc(projectRef, seed)
                  .then(() => {
                    window.clearTimeout(loadTimeoutRef.current);
                    lastSyncedSections.current = serializeSections({
                      ...INITIAL_PROJECT_DATA,
                    });
                    seedInProgress.current = false;
                    setIsDataLoaded(true);
                    setIsLoading(false);
                  })
                  .catch((err: { code?: string; message?: string }) => {
                    console.error('[firestore] seeding projectData/area1 failed:', err);
                    setSyncError(`Firestore: ${err.code ?? err.message}`);
                    seedInProgress.current = false;
                    setIsLoading(false);
                  });
              }
              return;
            }

            window.clearTimeout(loadTimeoutRef.current);

            // Jika ada pendingWrites lokal, tetap terapkan seksi lain yang tidak sedang diedit lokal
            applyProjectData(snapshot.data() as Partial<SharedProjectData>, {
              skipUsersIfFirestoreActive: true,
              preservePendingSections:
                snapshot.metadata.hasPendingWrites ||
                pendingSectionKeysRef.current.size > 0,
            });
            setIsDataLoaded(true);
            setIsLoading(false);
            setSyncError(null);
          },
          (err) => {
            window.clearTimeout(loadTimeoutRef.current);
            console.error('[firestore] projectData/area1 listener error:', err);
            setSyncError(`Firestore: ${err.code ?? err.message}`);
            setIsLoading(false);
          }
        );

        // 3. Realtime onSnapshot listener for `workOrders` collection
        const woColRef = typedCollection<WorkOrder>(firestoreDb, 'workOrders');
        workOrdersUnsubscribe.current = onSnapshot(
          woColRef,
          (snapshot: QuerySnapshot<WorkOrder>) => {
            const loadedWos = snapshot.docs
              .map((docSnap: QueryDocumentSnapshot<WorkOrder>) => ({
                ...docSnap.data(),
                id: docSnap.id,
              }))
              .sort((a, b) => extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code));
            setWorkOrders(loadedWos);
            setIsWorkOrdersLoaded(true);
          },
          (err) => {
            console.warn('[firestore] listener koleksi workOrders gagal:', err);
            setIsWorkOrdersLoaded(true);
          }
        );
      },
      (err) => {
        console.error('[auth] onAuthStateChanged error:', err);
        setAuthError(err.message);
        setIsUsersLoaded(true);
        setIsWorkOrdersLoaded(true);
        setIsLoading(false);
      }
    );

    return () => {
      window.clearTimeout(loadTimeoutRef.current);
      window.clearTimeout(syncDebounceRef.current);
      unsubscribeAuth();
      dataUnsubscribe.current?.();
      usersUnsubscribe.current?.();
      workOrdersUnsubscribe.current?.();
    };
  }, [applyProjectData]);

  // Push only the changed sections to Firestore with 400ms debounce
  useEffect(() => {
    if (!isLoggedIn || !isDataLoaded) return;

    const payload: SharedProjectData = {
      config,
      tasks,
      deliverables,
      weeklyPlans,
      ganttTasks,
      ganttPhases,
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
      notifications: rawNotifications,
    };
    const current = serializeSections(payload);
    const previous = lastSyncedSections.current;
    const changedKeys = SECTION_KEYS.filter((key) => !previous || previous[key] !== current[key]);
    if (changedKeys.length === 0) return;

    changedKeys.forEach((k) => pendingSectionKeysRef.current.add(k));
    window.clearTimeout(syncDebounceRef.current);

    const flushToFirestore = () => {
      const prev = lastSyncedSections.current;
      const keysToFlush = SECTION_KEYS.filter((key) => !prev || prev[key] !== current[key]);
      if (keysToFlush.length === 0) {
        pendingSectionKeysRef.current.clear();
        return;
      }

      lastSyncedSections.current = {
        ...(prev || current),
        ...Object.fromEntries(keysToFlush.map((k) => [k, current[k]])),
      } as Record<ProjectSectionKey, string>;
      setLastSyncedAt(formatTimeNow());

      if (isLiveFirebaseConfig && db) {
        const firestoreDb = db;
        const patch: Record<string, unknown> = {};
        keysToFlush.forEach((key) => {
          patch[key] = payload[key];
        });
        setIsSyncing(true);
        updateDoc(typedDoc<SharedProjectData>(firestoreDb, ...PROJECT_DATA_REF), patch)
          .then(() => {
            keysToFlush.forEach((k) => pendingSectionKeysRef.current.delete(k));
            setSyncError(null);
          })
          .catch((err: { code?: string; message?: string }) => {
            console.error('[firestore] gagal menyimpan projectData/area1:', err);
            keysToFlush.forEach((k) => pendingSectionKeysRef.current.delete(k));
            if (lastSyncedSections.current) {
              keysToFlush.forEach((key) => {
                lastSyncedSections.current![key] = '';
              });
            }
            setSyncError(
              err.code === 'permission-denied'
                ? 'akses ditolak oleh aturan Firestore.'
                : `gagal menyimpan (${err.code ?? err.message ?? 'unknown'}).`
            );
          })
          .finally(() => setIsSyncing(false));
      } else {
        pendingSectionKeysRef.current.clear();
      }
    };

    syncDebounceRef.current = window.setTimeout(flushToFirestore, SYNC_DEBOUNCE_MS);

    const handleBeforeUnload = () => {
      window.clearTimeout(syncDebounceRef.current);
      flushToFirestore();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    isLoggedIn,
    isDataLoaded,
    config,
    tasks,
    deliverables,
    weeklyPlans,
    ganttTasks,
    ganttPhases,
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
    rawNotifications,
  ]);

  // Helper transaksi atomik untuk operasi tambah/ubah/hapus item koleksi kolaboratif
  const commitSectionTransaction = useCallback(
    <K extends ProjectSectionKey>(
      sectionKey: K,
      fallbackCurrent: SharedProjectData[K],
      updater: (currentList: SharedProjectData[K]) => SharedProjectData[K],
      applyState: (nextList: SharedProjectData[K]) => void
    ) => {
      pendingSectionKeysRef.current.add(sectionKey);
      const optimisticNext = updater(fallbackCurrent);
      if (lastSyncedSections.current) {
        lastSyncedSections.current[sectionKey] = JSON.stringify(optimisticNext);
      }
      applyState(optimisticNext);
      setLastSyncedAt(formatTimeNow());

      if (!isLiveFirebaseConfig || !db) {
        pendingSectionKeysRef.current.delete(sectionKey);
        return;
      }

      const firestoreDb = db;
      const projectRef = typedDoc<SharedProjectData>(firestoreDb, ...PROJECT_DATA_REF);
      setIsSyncing(true);

      void runTransaction(firestoreDb, async (tx) => {
        const snap = await tx.get(projectRef);
        const serverData = snap.exists()
          ? (snap.data() as Partial<SharedProjectData>)
          : undefined;
        const baseSection = (serverData?.[sectionKey] ??
          fallbackCurrent) as SharedProjectData[K];
        const committedNext = updater(baseSection);
        tx.update(projectRef, { [sectionKey]: committedNext });
        return committedNext;
      })
        .then((committedNext) => {
          if (lastSyncedSections.current) {
            lastSyncedSections.current[sectionKey] = JSON.stringify(committedNext);
          }
          applyState(committedNext);
          pendingSectionKeysRef.current.delete(sectionKey);
          setSyncError(null);
        })
        .catch((err: { code?: string; message?: string }) => {
          console.error(`[firestore] transaksi ${sectionKey} gagal:`, err);
          pendingSectionKeysRef.current.delete(sectionKey);
          if (lastSyncedSections.current) {
            lastSyncedSections.current[sectionKey] = '';
          }
          setSyncError(
            err.code === 'permission-denied'
              ? 'akses ditolak oleh aturan Firestore.'
              : `gagal menyimpan (${err.code ?? err.message ?? 'unknown'}).`
          );
        })
        .finally(() => setIsSyncing(false));
    },
    []
  );

  const login = async (identifier: string, password: string) => {
    const cleanInput = identifier.trim();
    const matchedUser =
      resolveUserFromRef(cleanInput, users) ?? resolveUserFromRef(cleanInput, INITIAL_USERS);

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

    if (!isLiveFirebaseConfig || !auth) {
      const msg = 'Firebase belum dikonfigurasi. Login tidak tersedia.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      // Sesi ditetapkan oleh onAuthStateChanged setelah Firebase memverifikasi kredensial.
      await signInWithEmailAndPassword(auth, matchedUser.email, password);
    } catch (err: unknown) {
      const msg = translateAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    window.clearTimeout(loadTimeoutRef.current);
    window.clearTimeout(syncDebounceRef.current);
    pendingSectionKeysRef.current.clear();
    dataUnsubscribe.current?.();
    dataUnsubscribe.current = null;
    usersUnsubscribe.current?.();
    usersUnsubscribe.current = null;
    workOrdersUnsubscribe.current?.();
    workOrdersUnsubscribe.current = null;
    usersCollectionActiveRef.current = false;

    if (isLiveFirebaseConfig && auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore signOut errors
      }
    }

    lastSyncedSections.current = null;
    setIsLoggedIn(false);
    setIsDataLoaded(false);
    setIsWorkOrdersLoaded(false);
    setCurrentUserId('');
    setActiveTab('homepage');
    setSelectedWorkOrderId(null);
    setIsWorkOrderFormOpen(false);
    setWorkOrderFormDraft(null);
    setAuthError(null);
    setSyncError(null);
    setWorkOrders([]);
    setConfig(INITIAL_CONFIG);
    setTasks(INITIAL_TASKS);
    setDeliverables(INITIAL_DELIVERABLES);
    setWeeklyPlans(INITIAL_WEEKLY_PLANS);
    setGanttTasks(INITIAL_GANTT_TASKS);
    setGanttPhases(INITIAL_GANTT_PHASES);
    setRaciRows(INITIAL_RACI_ROWS);
    setSlideDecks(INITIAL_SLIDE_DECKS);
    setTrackerActions(INITIAL_TRACKER_ACTIONS);
    setMeetingLogs(INITIAL_MEETING_LOGS);
    setRegulations(INITIAL_REGULATIONS);
    setStandards(INITIAL_STANDARDS);
    setLogbooks(INITIAL_LOGBOOKS);
    setRubricParameters(INITIAL_RUBRIC_PARAMETERS);
    setDefenseQuestions(INITIAL_DEFENSE_QUESTIONS);
    setPhysicalChecklist(INITIAL_PHYSICAL_CHECKLIST);
    setRawNotifications(INITIAL_NOTIFICATIONS);
    setUsers(INITIAL_USERS);
  };

  // State mutators
  const updateConfig = (patch: Partial<Config>) => {
    if (!isPM) return;
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const addTask = (newTask: Omit<TaskItem, 'id'>) => {
    if (!isPM) return;
    const resolvedUid = getUser(newTask.pic)?.id || newTask.pic;
    const itemId = `task-${newId()}`;
    commitSectionTransaction(
      'tasks',
      tasks,
      (list) => [
        { ...newTask, pic: resolvedUid, id: itemId },
        ...list.filter((t) => t.id !== itemId),
      ],
      setTasks
    );
  };

  const toggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const resolvedOwner = getUser(target.pic);
    if (!isPM && resolvedOwner?.id !== currentUser.id) return;

    commitSectionTransaction(
      'tasks',
      tasks,
      (list) =>
        list.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      setTasks
    );
  };

  const deleteTask = (id: string) => {
    if (!isPM) return;
    commitSectionTransaction(
      'tasks',
      tasks,
      (list) => list.filter((t) => t.id !== id),
      setTasks
    );
  };

  const updateDeliverable = (id: string, patch: Partial<DeliverableItem>) => {
    if (!isPM) return;
    const nextPatch: Partial<DeliverableItem> = { ...patch };
    if (nextPatch.fileUrl !== undefined) {
      nextPatch.fileUrl = sanitizeExternalUrl(nextPatch.fileUrl);
    }
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...nextPatch } : d))
    );
  };

  const addWeeklyPlan = (plan: Omit<WeeklyPlanItem, 'id'>) => {
    if (!isPM) return;
    const resolvedUid = getUser(plan.pic)?.id || plan.pic;
    const newPlan: WeeklyPlanItem = {
      ...plan,
      pic: resolvedUid,
      id: `plan-${newId()}`,
    };
    setWeeklyPlans((prev) => [...prev, newPlan]);
  };

  const updateWeeklyPlan = (id: string, patch: Partial<WeeklyPlanItem>) => {
    if (!isPM) return;
    const nextPatch: Partial<WeeklyPlanItem> = { ...patch };
    if (nextPatch.pic) {
      nextPatch.pic = getUser(nextPatch.pic)?.id || nextPatch.pic;
    }
    if ('status' in patch && patch.autoCompletedByWo === undefined) {
      nextPatch.autoCompletedByWo = false;
    }
    setWeeklyPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...nextPatch } : p))
    );
  };

  const deleteWeeklyPlan = (id: string) => {
    if (!isPM) return;
    setWeeklyPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const addGanttTask = (gt: Omit<GanttTaskItem, 'id'>) => {
    if (!isPM) return;
    const rawRef = gt.pic || gt.picCode;
    const resolvedUid =
      rawRef?.toUpperCase() === 'ALL' ? 'ALL' : getUser(rawRef)?.id || rawRef;
    const newTask: GanttTaskItem = {
      ...gt,
      pic: resolvedUid,
      picCode: resolvedUid,
      id: `gt-${newId()}`,
    };
    setGanttTasks((prev) => [...prev, newTask]);
  };

  const updateGanttTask = (id: string, patch: Partial<GanttTaskItem>) => {
    if (!isPM) return;
    const nextPatch: Partial<GanttTaskItem> = { ...patch };
    const rawRef = nextPatch.pic || nextPatch.picCode;
    if (rawRef) {
      const resolvedUid = rawRef.toUpperCase() === 'ALL' ? 'ALL' : getUser(rawRef)?.id || rawRef;
      nextPatch.pic = resolvedUid;
      nextPatch.picCode = resolvedUid;
    }
    if ('status' in patch && patch.autoCompletedByWo === undefined) {
      nextPatch.autoCompletedByWo = false;
    }
    setGanttTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...nextPatch } : task))
    );
  };

  const deleteGanttTask = (id: string) => {
    if (!isPM) return;
    setGanttTasks((prev) => prev.filter((gt) => gt.id !== id));
  };

  const addGanttPhase = (phase: Omit<GanttPhase, 'id'>) => {
    if (!isPM) return 0;
    const id = ganttPhases.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
    setGanttPhases((prev) => [...prev, { ...phase, id }]);
    return id;
  };

  const updateGanttPhase = (id: number, patch: Partial<GanttPhase>) => {
    if (!isPM) return;
    setGanttPhases((prev) =>
      prev.map((phase) => (phase.id === id ? { ...phase, ...patch, id } : phase))
    );
    if (patch.name?.trim()) {
      const name = patch.name.trim();
      setGanttTasks((prev) =>
        prev.map((task) => (task.phaseId === id ? { ...task, phaseName: name } : task))
      );
    }
  };

  const deleteGanttPhase = (id: number) => {
    if (!isPM || ganttPhases.length <= 1) return;
    setGanttPhases((prev) => prev.filter((phase) => phase.id !== id));
    setGanttTasks((prev) => prev.filter((task) => task.phaseId !== id));
  };

  const updateRaciCell = (
    rowId: string,
    memberUidOrKey: string,
    value: RaciRoleValue
  ) => {
    if (!isPM) return;
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
    if (!isPM) return;
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
      id: `raci-${newId()}`,
    };
    setRaciRows((prev) => [...prev, newRow]);
  };

  const addSlideDeck = (deck: Omit<SlideDeckItem, 'id'>) => {
    if (!isPM) return;
    const resolvedUid = getUser(deck.presenter)?.id || deck.presenter;
    const item: SlideDeckItem = {
      ...deck,
      presenter: resolvedUid,
      url: sanitizeExternalUrl(deck.url),
      id: `deck-${newId()}`,
    };
    setSlideDecks((prev) => [item, ...prev]);
  };

  const updateSlideDeck = (
    id: string,
    patch: Partial<Omit<SlideDeckItem, 'id'>>
  ) => {
    if (!isPM) return;
    setSlideDecks((prev) =>
      prev.map((deck) =>
        deck.id === id
          ? {
              ...deck,
              ...patch,
              ...(patch.presenter !== undefined
                ? { presenter: getUser(patch.presenter)?.id || patch.presenter }
                : {}),
              ...(patch.url !== undefined
                ? { url: sanitizeExternalUrl(patch.url) }
                : {}),
            }
          : deck
      )
    );
  };

  const deleteSlideDeck = (id: string) => {
    if (!isPM) return;
    setSlideDecks((prev) => prev.filter((d) => d.id !== id));
  };

  const addTrackerAction = (item: Omit<TrackerActionItem, 'id' | 'code'>) => {
    if (!isPM) return;
    const rawRef = item.pic || item.picCode;
    const resolvedUid = getUser(rawRef)?.id || rawRef;
    const itemId = `act-${newId()}`;

    commitSectionTransaction(
      'trackerActions',
      trackerActions,
      (list) => {
        const existing = list.find((a) => a.id === itemId);
        if (existing) return list;
        const code = computeNextTrackerCode(list);
        const newItem: TrackerActionItem = {
          ...item,
          pic: resolvedUid,
          picCode: resolvedUid,
          id: itemId,
          code,
        };
        return [...list, newItem];
      },
      setTrackerActions
    );
  };

  const updateTrackerAction = (
    id: string,
    patch: Partial<Omit<TrackerActionItem, 'id' | 'code'>>
  ) => {
    if (!isPM) return;
    const rawRef = patch.pic || patch.picCode;
    const resolvedUid = rawRef ? getUser(rawRef)?.id || rawRef : undefined;
    commitSectionTransaction(
      'trackerActions',
      trackerActions,
      (list) =>
        list.map((action) =>
          action.id === id
            ? {
                ...action,
                ...patch,
                ...(resolvedUid ? { pic: resolvedUid, picCode: resolvedUid } : {}),
              }
            : action
        ),
      setTrackerActions
    );
  };

  const toggleTrackerActionStatus = (id: string) => {
    commitSectionTransaction(
      'trackerActions',
      trackerActions,
      (list) =>
        list.map((act) =>
          act.id === id
            ? {
                ...act,
                progress: act.progress === 'Resolved' ? 'In Progress' : 'Resolved',
              }
            : act
        ),
      setTrackerActions
    );
  };

  const deleteTrackerAction = (id: string) => {
    if (!isPM) return;
    commitSectionTransaction(
      'trackerActions',
      trackerActions,
      (list) => list.filter((a) => a.id !== id),
      setTrackerActions
    );
  };

  const addMeetingLog = (log: Omit<MeetingLogItem, 'id'>) => {
    if (!isPM) return;
    const normalizedMembers = log.presentMembers.map(
      (ref) => getUser(ref)?.id || ref
    );
    const newLog: MeetingLogItem = {
      ...log,
      presentMembers: normalizedMembers,
      id: `mom-${newId()}`,
    };
    setMeetingLogs((prev) => [newLog, ...prev]);
  };

  const updateMeetingLog = (
    id: string,
    patch: Partial<Omit<MeetingLogItem, 'id'>>
  ) => {
    if (!isPM) return;
    setMeetingLogs((prev) =>
      prev.map((log) =>
        log.id === id
          ? {
              ...log,
              ...patch,
              ...(patch.presentMembers
                ? {
                    presentMembers: patch.presentMembers.map(
                      (ref) => getUser(ref)?.id || ref
                    ),
                  }
                : {}),
            }
          : log
      )
    );
  };

  const deleteMeetingLog = (id: string) => {
    if (!isPM) return;
    setMeetingLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const updateRegulation = (
    id: string,
    patch: Partial<Omit<RegulationDirective, 'id'>>
  ) => {
    if (!isPM) return;
    setRegulations((prev) =>
      prev.map((regulation) =>
        regulation.id === id
          ? {
              ...regulation,
              ...patch,
              ...(patch.url !== undefined
                ? { url: sanitizeExternalUrl(patch.url) }
                : {}),
            }
          : regulation
      )
    );
  };

  const addStandard = (std: Omit<StandardReferenceItem, 'id'>) => {
    if (!isPM) return;
    const newStd: StandardReferenceItem = {
      ...std,
      url: sanitizeExternalUrl(std.url),
      id: `std-${newId()}`,
    };
    setStandards((prev) => [...prev, newStd]);
  };

  const updateStandard = (
    id: string,
    patch: Partial<Omit<StandardReferenceItem, 'id'>>
  ) => {
    if (!isPM) return;
    setStandards((prev) =>
      prev.map((standard) =>
        standard.id === id
          ? {
              ...standard,
              ...patch,
              ...(patch.url !== undefined
                ? { url: sanitizeExternalUrl(patch.url) }
                : {}),
            }
          : standard
      )
    );
  };

  const deleteStandard = (id: string) => {
    if (!isPM) return;
    setStandards((prev) => prev.filter((s) => s.id !== id));
  };

  const addLogbook = (entry: Omit<LogbookItem, 'id' | 'verifiedByLecturer'>) => {
    const isTeam =
      entry.authorId === 'team-area-1' ||
      entry.authorId === 'kelompok' ||
      entry.authorId === 'area-1';
    const requestedUid = isTeam ? 'team-area-1' : (getUser(entry.authorId)?.id || entry.authorId);
    // Non-PM hanya boleh mencatat atas nama sendiri atau kelompok
    const resolvedUid = (!isPM && requestedUid !== 'team-area-1') ? currentUser.id : requestedUid;
    const itemId = `log-${newId()}`;
    const newEntry: LogbookItem = {
      date: entry.date,
      weekNumber: entry.weekNumber,
      category: isTeam ? 'kelompok' : (entry.category || 'anggota'),
      authorId: resolvedUid,
      workDescription: entry.workDescription,
      issueSolution: entry.issueSolution,
      id: itemId,
      verifiedByLecturer: false,
    };
    commitSectionTransaction(
      'logbooks',
      logbooks,
      (list) => [newEntry, ...list.filter((l) => l.id !== itemId)],
      setLogbooks
    );
  };

  const updateLogbook = (id: string, patch: Partial<LogbookItem>) => {
    commitSectionTransaction(
      'logbooks',
      logbooks,
      (list) =>
        list.map((l) => {
          if (l.id !== id) return l;
          const targetAuthor = getUser(l.authorId || l.authorName || l.authorCode);
          const isTeamEntry =
            l.authorId === 'team-area-1' ||
            l.authorId === 'kelompok' ||
            l.authorId === 'area-1' ||
            l.category === 'kelompok';

          // Hanya PM, pencatat kelompok, atau pemilik entri yang boleh mengedit
          if (!isPM && !isTeamEntry && targetAuthor?.id !== currentUser.id) {
            return l;
          }

          // Non-PM dilarang memalsukan status paraf dosen atau memindahkan authorId
          const safePatch = { ...patch };
          if (!isPM) {
            delete safePatch.verifiedByLecturer;
            delete safePatch.verifiedDate;
            delete safePatch.authorId;
          }
          return { ...l, ...safePatch };
        }),
      setLogbooks
    );
  };

  const resetLogbooksToDefault = () => {
    if (!isPM) return;
    commitSectionTransaction(
      'logbooks',
      logbooks,
      (list) => {
        // Non-destructive backfill: pertahankan entri yang sudah ada, lengkapi slot kuota yang belum terisi
        const existingKeys = new Set(
          list.map((l) => {
            const isTeam =
              l.authorId === 'team-area-1' ||
              l.authorId === 'kelompok' ||
              l.authorId === 'area-1' ||
              l.category === 'kelompok';
            const authorKey = isTeam
              ? 'team-area-1'
              : (getUser(l.authorId || l.authorName || l.authorCode)?.id || l.authorId);
            return `${authorKey}_${l.weekNumber}`;
          })
        );
        const missingFromTemplate = INITIAL_LOGBOOKS.filter((init) => {
          const key = `${init.authorId}_${init.weekNumber}`;
          return !existingKeys.has(key);
        });
        return [...list, ...missingFromTemplate];
      },
      setLogbooks
    );
  };

  const toggleLogbookVerification = (id: string) => {
    if (!isPM) return;
    commitSectionTransaction(
      'logbooks',
      logbooks,
      (list) =>
        list.map((log) =>
          log.id === id
            ? {
                ...log,
                verifiedByLecturer: !log.verifiedByLecturer,
                verifiedDate: !log.verifiedByLecturer ? 'Hari ini' : undefined,
              }
            : log
        ),
      setLogbooks
    );
  };

  const deleteLogbook = (id: string) => {
    const target = logbooks.find((l) => l.id === id);
    if (!target) return;
    const resolvedAuthor = getUser(target.authorId || target.authorName || target.authorCode);
    if (!isPM && resolvedAuthor?.id !== currentUser.id) return;

    commitSectionTransaction(
      'logbooks',
      logbooks,
      (list) => list.filter((l) => l.id !== id),
      setLogbooks
    );
  };

  const updateRubricScore = (id: string, score: number) => {
    if (config.readinessLocked) return;
    const clampedScore = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
    commitSectionTransaction(
      'rubricParameters',
      rubricParameters,
      (list) => list.map((p) => (p.id === id ? { ...p, score: clampedScore } : p)),
      setRubricParameters
    );
  };

  const toggleRubricItem = (paramId: string, itemIdx: number) => {
    if (config.readinessLocked) return;
    commitSectionTransaction(
      'rubricParameters',
      rubricParameters,
      (list) =>
        list.map((p) => {
          if (p.id !== paramId) return p;
          const newItems = p.items.map((it, idx) =>
            idx === itemIdx ? { ...it, checked: !it.checked } : it
          );
          return { ...p, items: newItems };
        }),
      setRubricParameters
    );
  };

  const updateRubricMitigation = (id: string, mitigation: string) => {
    if (config.readinessLocked) return;
    commitSectionTransaction(
      'rubricParameters',
      rubricParameters,
      (list) => list.map((p) => (p.id === id ? { ...p, mitigation } : p)),
      setRubricParameters
    );
  };

  const updateDefenseResponse = (id: string, newResponse: string) => {
    if (config.readinessLocked) return;
    commitSectionTransaction(
      'defenseQuestions',
      defenseQuestions,
      (list) =>
        list.map((q) => (q.id === id ? { ...q, verifiedResponse: newResponse } : q)),
      setDefenseQuestions
    );
  };

  const addDefenseQuestion = (q: Omit<DefenseQuestion, 'id'>) => {
    if (!isPM || config.readinessLocked) return;
    const resolvedUid = getUser(q.pic)?.id || q.pic;
    const newQ: DefenseQuestion = {
      ...q,
      pic: resolvedUid,
      id: `q-${newId()}`,
    };
    commitSectionTransaction(
      'defenseQuestions',
      defenseQuestions,
      (list) => [...list, newQ],
      setDefenseQuestions
    );
  };

  const togglePhysicalItem = (id: string) => {
    if (!isPM || config.readinessLocked) return;
    commitSectionTransaction(
      'physicalChecklist',
      physicalChecklist,
      (list) => list.map((it) => (it.id === id ? { ...it, ready: !it.ready } : it)),
      setPhysicalChecklist
    );
  };

  const markNotificationAsRead = (id: string) => {
    if (!matchedCurrentUser) return;
    const existing = matchedCurrentUser.readNotificationIds || [];
    if (existing.includes(id)) return;
    const nextReadIds = [...existing, id];
    void updateUser(matchedCurrentUser.id, { readNotificationIds: nextReadIds }).catch(() => {
      // ignore background read-status sync error
    });
  };

  const markAllNotificationsAsRead = () => {
    if (!matchedCurrentUser) return;
    const allIds = Array.from(
      new Set([
        ...(matchedCurrentUser.readNotificationIds || []),
        ...notifications.map((n) => n.id),
      ])
    );
    void updateUser(matchedCurrentUser.id, { readNotificationIds: allIds }).catch(() => {
      // ignore background read-status sync error
    });
  };

  // =========================================================================
  // WORK ORDERS (MENU KE-9) & ONE-WAY INTEGRATIONS
  // =========================================================================

  const openWorkOrderDetail = useCallback((woId: string) => {
    setSelectedWorkOrderId(woId);
    setActiveTab('work-orders');
  }, []);

  const openWorkOrderForm = useCallback((draft?: WorkOrderDraft) => {
    setWorkOrderFormDraft(draft ?? null);
    setIsWorkOrderFormOpen(true);
  }, []);

  const closeWorkOrderForm = useCallback(() => {
    setIsWorkOrderFormOpen(false);
    setWorkOrderFormDraft(null);
  }, []);

  const pushTargetedNotification = useCallback(
    (params: {
      title: string;
      description: string;
      type: AppNotification['type'];
      recipientIds: string[];
      workOrderId?: string;
    }) => {
      const uniqueRecipients = Array.from(
        new Set(params.recipientIds.map((r) => getUser(r)?.id || r).filter(Boolean))
      );
      if (uniqueRecipients.length === 0) return;

      const nowIso = new Date().toISOString();
      const notifId = `notif-${newId()}`;
      const newNotif: AppNotification = {
        id: notifId,
        title: params.title,
        description: params.description,
        timeAgo: formatIsoDateTimeShort(nowIso),
        createdAt: nowIso,
        type: params.type,
        read: false,
        recipientIds: uniqueRecipients,
        ...(params.workOrderId ? { workOrderId: params.workOrderId } : {}),
      };

      commitSectionTransaction(
        'notifications',
        rawNotificationsRef.current,
        (list) => [newNotif, ...list.filter((n) => n.id !== notifId)].slice(0, 60),
        setRawNotifications
      );
    },
    [commitSectionTransaction, getUser]
  );

  const getAdminUserIds = useCallback((): string[] => {
    const admins = users.filter((u) => u.role === 'admin').map((u) => u.id);
    return admins.length > 0 ? admins : ['user-rahul'];
  }, [users]);

  const applyScheduleSideEffectFromWorkOrders = useCallback(
    (
      nextWorkOrders: WorkOrder[],
      link: WorkOrderScheduleLink,
      mode: 'approved-or-cancelled' | 'reopened'
    ) => {
      if (!isPM || link.type === 'none') return;

      if (link.type === 'gantt') {
        const activeLinked = nextWorkOrders.filter(
          (w) =>
            w.status !== 'Dibatalkan' &&
            w.scheduleLink.type === 'gantt' &&
            w.scheduleLink.taskId === link.taskId
        );
        commitSectionTransaction(
          'ganttTasks',
          ganttTasks,
          (list) =>
            list.map((gt) => {
              if (gt.id !== link.taskId) return gt;
              // Status Terlambat & Perlu dicek di Gantt tidak diubah otomatis
              if (gt.status === 'Terlambat' || gt.status === 'Perlu dicek') {
                return gt;
              }
              if (mode === 'reopened') {
                if (gt.status === 'Selesai' && gt.autoCompletedByWo) {
                  return { ...gt, status: 'Berjalan', autoCompletedByWo: false };
                }
                return gt;
              }
              if (activeLinked.length === 0) return gt;
              const completedCount = activeLinked.filter((w) => w.status === 'Selesai').length;
              if (completedCount === activeLinked.length) {
                if (gt.status === 'Selesai') return gt;
                return { ...gt, status: 'Selesai', autoCompletedByWo: true };
              }
              if (completedCount > 0 && (!gt.status || gt.status === 'Belum')) {
                return { ...gt, status: 'Berjalan', autoCompletedByWo: false };
              }
              return gt;
            }),
          setGanttTasks
        );
      } else if (link.type === 'weeklyPlan') {
        const activeLinked = nextWorkOrders.filter(
          (w) =>
            w.status !== 'Dibatalkan' &&
            w.scheduleLink.type === 'weeklyPlan' &&
            w.scheduleLink.planId === link.planId
        );
        commitSectionTransaction(
          'weeklyPlans',
          weeklyPlans,
          (list) =>
            list.map((plan) => {
              if (plan.id !== link.planId) return plan;
              if (mode === 'reopened') {
                if (plan.status === 'Done' && plan.autoCompletedByWo) {
                  return { ...plan, status: 'In Progress', autoCompletedByWo: false };
                }
                return plan;
              }
              if (activeLinked.length === 0) return plan;
              const completedCount = activeLinked.filter((w) => w.status === 'Selesai').length;
              if (completedCount === activeLinked.length) {
                if (plan.status === 'Done') return plan;
                return { ...plan, status: 'Done', autoCompletedByWo: true };
              }
              if (completedCount > 0 && plan.status === 'Planning') {
                return { ...plan, status: 'In Progress', autoCompletedByWo: false };
              }
              return plan;
            }),
          setWeeklyPlans
        );
      }
    },
    [isPM, commitSectionTransaction, ganttTasks, weeklyPlans]
  );

  const applyMomActionSideEffect = useCallback(
    (wo: WorkOrder, nextProgress: 'Resolved' | 'In Progress') => {
      if (!isPM || wo.origin.type !== 'mom') return;
      const targetActionId = wo.origin.trackerActionId;
      commitSectionTransaction(
        'trackerActions',
        trackerActions,
        (list) =>
          list.map((act) =>
            act.id === targetActionId ? { ...act, progress: nextProgress } : act
          ),
        setTrackerActions
      );
    },
    [isPM, commitSectionTransaction, trackerActions]
  );

  const normalizeUserIdList = useCallback(
    (rawIds: string[]): string[] => {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const raw of rawIds) {
        const clean = raw.trim();
        if (!clean) continue;
        const resolved = getUser(clean)?.id || clean;
        if (!seen.has(resolved)) {
          seen.add(resolved);
          result.push(resolved);
        }
      }
      return result;
    },
    [getUser]
  );

  const sanitizeOptionalHttpUrl = (rawUrl?: string): string => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return '';
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const clean = sanitizeExternalUrl(candidate);
    if (clean === '#') {
      throw new Error('Tautan bukti hasil tidak valid. Gunakan URL http:// atau https://.');
    }
    return clean;
  };

  const commitWorkOrderPatch = useCallback(
    async (woId: string, patchFields: Partial<WorkOrder>, nextWo: WorkOrder): Promise<void> => {
      const previousList = workOrders;
      setWorkOrders((prev) =>
        prev
          .map((item) => (item.id === woId ? nextWo : item))
          .sort((a, b) => extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code))
      );
      setLastSyncedAt(formatTimeNow());

      if (!isLiveFirebaseConfig || !db) return;

      const firestoreDb = db;
      setIsSyncing(true);
      try {
        await updateDoc(
          typedDoc<WorkOrder>(firestoreDb, 'workOrders', woId),
          patchFields as Record<string, unknown>
        );
        setSyncError(null);
      } catch (err: unknown) {
        setWorkOrders(previousList);
        const e = err as { code?: string; message?: string };
        console.error('[firestore] gagal memperbarui Work Order:', err);
        const msg =
          e?.code === 'permission-denied'
            ? 'Perubahan Work Order ditolak oleh aturan akses Firestore.'
            : `Gagal menyimpan Work Order (${e?.code ?? e?.message ?? 'unknown'}).`;
        setSyncError(msg);
        throw new Error(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    [workOrders]
  );

  const createWorkOrder = useCallback(
    async (input: CreateWorkOrderInput): Promise<WorkOrder | null> => {
      if (!isPM) {
        throw new Error('Hanya Project Manager yang dapat membuat Work Order.');
      }
      const title = input.title.trim();
      if (!title || title.length > 240) {
        throw new Error('Judul Work Order wajib diisi (maksimal 240 karakter).');
      }

      const assigneeIds = normalizeUserIdList(input.assigneeIds);
      if (assigneeIds.length === 0) {
        throw new Error('Pilih minimal satu penanggung jawab.');
      }

      const supporterIds = normalizeUserIdList(input.supporterIds || []).filter(
        (uid) => !assigneeIds.includes(uid)
      );

      if (!input.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate.trim())) {
        throw new Error('Tanggal tenggat wajib diisi.');
      }
      const dueDate = input.dueDate.trim();
      const { week: projectWeek } = computeProjectWeekFromDate(
        dueDate,
        config.projectStartDate
      );

      const origin = input.origin ?? { type: 'manual' as const };
      if (origin.type === 'mom') {
        const existingLinked = findWorkOrderForTrackerAction(
          workOrders,
          origin.trackerActionId
        );
        if (existingLinked && existingLinked.status !== 'Dibatalkan') {
          throw new Error(
            `Action item ${origin.trackerActionCode} sudah memiliki Work Order (${existingLinked.code}).`
          );
        }
      }

      const checklist: WorkOrderChecklistItem[] = (input.checklist || [])
        .map((c) => ({
          id: c.id || `chk-${newId()}`,
          text: c.text.trim(),
          done: Boolean(c.done),
        }))
        .filter((c) => c.text.length > 0);

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const woId = `wo-${newId()}`;
      const localMaxSeq = workOrders.reduce(
        (max, w) => Math.max(max, extractWorkOrderSeq(w.code)),
        0
      );
      const optimisticCode = computeNextWorkOrderCode(workOrders, localMaxSeq).code;

      const buildWoObject = (finalCode: string): WorkOrder => {
        const initialHistory: WorkOrderHistoryEntry = {
          id: `hist-${newId()}`,
          at: nowIso,
          actorId,
          fromStatus: null,
          toStatus: 'Ditugaskan',
          eventLabel:
            origin.type === 'mom'
              ? `Dibuat dari Action Item MoM (${origin.trackerActionCode})`
              : 'Work Order dibuat & ditugaskan',
          note: '',
        };

        return {
          id: woId,
          code: finalCode,
          title,
          description: input.description.trim(),
          assigneeIds,
          supporterIds,
          priority: input.priority,
          status: 'Ditugaskan',
          dueDate,
          projectWeek,
          scheduleLink: input.scheduleLink,
          origin,
          checklist,
          requireEvidence: Boolean(input.requireEvidence),
          evidenceUrl: '',
          evidenceNote: '',
          blockedReason: '',
          needsRevision: false,
          revisionNote: '',
          cancelReason: '',
          reopenReason: '',
          submittedAt: '',
          completedAt: '',
          cancelledAt: '',
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
          history: [initialHistory],
        };
      };

      let committedWo = buildWoObject(optimisticCode);
      const previousList = workOrders;

      if (isLiveFirebaseConfig && db) {
        const firestoreDb = db;
        const metaRef = typedDoc<{ lastSeq?: number; updatedAt?: string; updatedBy?: string }>(
          firestoreDb,
          'config',
          'workOrderMeta'
        );
        const woRef = typedDoc<WorkOrder>(firestoreDb, 'workOrders', woId);
        setIsSyncing(true);
        try {
          committedWo = await runTransaction(firestoreDb, async (tx) => {
            const metaSnap = await tx.get(metaRef);
            const serverSeq = metaSnap.exists() ? Number(metaSnap.data().lastSeq || 0) : 0;
            const nextSeq = Math.max(localMaxSeq, serverSeq) + 1;
            const finalCode = formatWorkOrderCode(nextSeq);
            const finalWo = buildWoObject(finalCode);
            tx.set(metaRef, {
              lastSeq: nextSeq,
              updatedAt: nowIso,
              updatedBy: actorId,
            });
            tx.set(woRef, finalWo);
            return finalWo;
          });
          setWorkOrders((prev) =>
            [committedWo, ...prev.filter((w) => w.id !== committedWo.id)].sort(
              (a, b) => extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code)
            )
          );
          setLastSyncedAt(formatTimeNow());
          setSyncError(null);
        } catch (err: unknown) {
          setWorkOrders(previousList);
          const e = err as { code?: string; message?: string };
          console.error('[firestore] gagal membuat Work Order:', err);
          const msg =
            e?.code === 'permission-denied'
              ? 'Pembuatan Work Order ditolak oleh aturan Firestore (pastikan firestore.rules terbaru sudah dideploy).'
              : `Gagal membuat Work Order (${e?.code ?? e?.message ?? 'unknown'}).`;
          setSyncError(msg);
          throw new Error(msg);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setWorkOrders((prev) => [committedWo, ...prev]);
      }

      const recipients = assigneeIds.filter((uid) => uid !== actorId);
      if (recipients.length > 0) {
        pushTargetedNotification({
          title: `Work Order Baru: ${committedWo.code}`,
          description: `"${committedWo.title}" ditugaskan kepada Anda (Tenggat: ${formatYmdToIndonesian(committedWo.dueDate)}, Prioritas: ${committedWo.priority}).`,
          type: committedWo.priority === 'Kritis' ? 'urgent' : 'info',
          recipientIds: recipients,
          workOrderId: committedWo.id,
        });
      }

      return committedWo;
    },
    [
      isPM,
      normalizeUserIdList,
      config.projectStartDate,
      workOrders,
      currentUser.id,
      pushTargetedNotification,
    ]
  );

  const updateWorkOrderMeta = useCallback(
    async (id: string, input: UpdateWorkOrderMetaInput): Promise<void> => {
      if (!isPM) {
        throw new Error('Hanya Project Manager yang dapat mengubah konfigurasi Work Order.');
      }
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status === 'Dibatalkan') {
        throw new Error('Work Order yang sudah dibatalkan tidak dapat diubah.');
      }

      const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
      if (!nextTitle || nextTitle.length > 240) {
        throw new Error('Judul Work Order wajib diisi (maksimal 240 karakter).');
      }

      const nextDescription =
        input.description !== undefined ? input.description.trim() : existing.description;

      const nextAssigneeIds =
        input.assigneeIds !== undefined
          ? normalizeUserIdList(input.assigneeIds)
          : existing.assigneeIds;
      if (nextAssigneeIds.length === 0) {
        throw new Error('Pilih minimal satu penanggung jawab.');
      }

      const nextSupporterIds = (
        input.supporterIds !== undefined
          ? normalizeUserIdList(input.supporterIds)
          : existing.supporterIds
      ).filter((uid) => !nextAssigneeIds.includes(uid));

      const nextPriority = input.priority ?? existing.priority;
      const nextDueDate =
        input.dueDate !== undefined ? input.dueDate.trim() : existing.dueDate;
      const { week: nextProjectWeek } = computeProjectWeekFromDate(
        nextDueDate,
        config.projectStartDate
      );

      // Tautan jadwal bisa diubah selama WO belum Selesai
      const nextScheduleLink =
        existing.status === 'Selesai'
          ? existing.scheduleLink
          : (input.scheduleLink ?? existing.scheduleLink);

      const nextChecklist =
        input.checklist !== undefined
          ? input.checklist
              .map((c) => ({
                id: c.id || `chk-${newId()}`,
                text: c.text.trim(),
                done: Boolean(c.done),
              }))
              .filter((c) => c.text.length > 0)
          : existing.checklist;

      const nextRequireEvidence =
        input.requireEvidence !== undefined
          ? Boolean(input.requireEvidence)
          : existing.requireEvidence;

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const newEntries: WorkOrderHistoryEntry[] = [];

      const prevAssigneesKey = [...existing.assigneeIds].sort().join(',');
      const nextAssigneesKey = [...nextAssigneeIds].sort().join(',');
      const assigneesChanged = prevAssigneesKey !== nextAssigneesKey;
      const dueDateChanged = existing.dueDate !== nextDueDate;

      if (assigneesChanged) {
        const names = nextAssigneeIds
          .map((uid) => getUser(uid)?.nickname || uid)
          .join(', ');
        newEntries.push({
          id: `hist-${newId()}`,
          at: nowIso,
          actorId,
          fromStatus: existing.status,
          toStatus: existing.status,
          eventLabel: 'Penanggung jawab diperbarui',
          note: `Penanggung jawab: ${names}`,
        });
      }

      if (dueDateChanged) {
        newEntries.push({
          id: `hist-${newId()}`,
          at: nowIso,
          actorId,
          fromStatus: existing.status,
          toStatus: existing.status,
          eventLabel: 'Tenggat diperbarui',
          note: `${formatYmdToIndonesian(existing.dueDate)} → ${formatYmdToIndonesian(nextDueDate)}`,
        });
      }

      if (newEntries.length === 0) {
        newEntries.push({
          id: `hist-${newId()}`,
          at: nowIso,
          actorId,
          fromStatus: existing.status,
          toStatus: existing.status,
          eventLabel: 'Detail Work Order diperbarui oleh PM',
          note: '',
        });
      }

      const nextHistory = [...existing.history, ...newEntries];
      const patchFields: Partial<WorkOrder> = {
        title: nextTitle,
        description: nextDescription,
        assigneeIds: nextAssigneeIds,
        supporterIds: nextSupporterIds,
        priority: nextPriority,
        dueDate: nextDueDate,
        projectWeek: nextProjectWeek,
        scheduleLink: nextScheduleLink,
        checklist: nextChecklist,
        requireEvidence: nextRequireEvidence,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: nextHistory,
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      await commitWorkOrderPatch(id, patchFields, nextWo);

      if (assigneesChanged) {
        const added = nextAssigneeIds.filter(
          (uid) => !existing.assigneeIds.includes(uid) && uid !== actorId
        );
        const removed = existing.assigneeIds.filter(
          (uid) => !nextAssigneeIds.includes(uid) && uid !== actorId
        );
        if (added.length > 0) {
          pushTargetedNotification({
            title: `Penugasan Baru: ${nextWo.code}`,
            description: `Anda ditambahkan sebagai penanggung jawab pada "${nextWo.title}" (Tenggat: ${formatYmdToIndonesian(nextWo.dueDate)}).`,
            type: nextWo.priority === 'Kritis' ? 'urgent' : 'info',
            recipientIds: added,
            workOrderId: nextWo.id,
          });
        }
        if (removed.length > 0) {
          pushTargetedNotification({
            title: `Penugasan Dialihkan: ${nextWo.code}`,
            description: `Penugasan Anda pada "${nextWo.title}" telah dialihkan oleh PM.`,
            type: 'info',
            recipientIds: removed,
            workOrderId: nextWo.id,
          });
        }
      } else if (dueDateChanged) {
        const recipients = nextAssigneeIds.filter((uid) => uid !== actorId);
        if (recipients.length > 0) {
          pushTargetedNotification({
            title: `Tenggat Diubah: ${nextWo.code}`,
            description: `Tenggat "${nextWo.title}" diperbarui menjadi ${formatYmdToIndonesian(nextDueDate)}.`,
            type: 'info',
            recipientIds: recipients,
            workOrderId: nextWo.id,
          });
        }
      }
    },
    [
      isPM,
      workOrders,
      normalizeUserIdList,
      config.projectStartDate,
      currentUser.id,
      getUser,
      commitWorkOrderPatch,
      pushTargetedNotification,
    ]
  );

  const updateWorkOrderExecution = useCallback(
    async (
      id: string,
      patch: {
        checklist?: WorkOrderChecklistItem[];
        evidenceUrl?: string;
        evidenceNote?: string;
      }
    ): Promise<void> => {
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status === 'Selesai' || existing.status === 'Dibatalkan') {
        throw new Error('Work Order yang sudah selesai atau dibatalkan tidak dapat diubah.');
      }
      const isAssignee = isUserWorkOrderAssignee(existing, currentUser.id, getUser);
      if (!isPM && !isAssignee) {
        throw new Error('Hanya penanggung jawab atau PM yang dapat memperbarui pelaksanaan WO ini.');
      }

      const nextChecklist =
        patch.checklist !== undefined ? patch.checklist : existing.checklist;
      const nextEvidenceUrl =
        patch.evidenceUrl !== undefined
          ? sanitizeOptionalHttpUrl(patch.evidenceUrl)
          : existing.evidenceUrl;
      const nextEvidenceNote =
        patch.evidenceNote !== undefined
          ? patch.evidenceNote.trim()
          : existing.evidenceNote;

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const evidenceChanged =
        nextEvidenceUrl !== existing.evidenceUrl ||
        nextEvidenceNote !== existing.evidenceNote;

      const nextHistory = evidenceChanged
        ? [
            ...existing.history,
            {
              id: `hist-${newId()}`,
              at: nowIso,
              actorId,
              fromStatus: existing.status,
              toStatus: existing.status,
              eventLabel: 'Bukti hasil diperbarui',
              note: nextEvidenceNote || nextEvidenceUrl,
            },
          ]
        : existing.history;

      const patchFields: Partial<WorkOrder> = {
        checklist: nextChecklist,
        evidenceUrl: nextEvidenceUrl,
        evidenceNote: nextEvidenceNote,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: nextHistory,
      };

      await commitWorkOrderPatch(id, patchFields, { ...existing, ...patchFields });
    },
    [workOrders, currentUser.id, getUser, isPM, commitWorkOrderPatch]
  );

  const startWorkOrder = useCallback(
    async (id: string): Promise<void> => {
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status !== 'Ditugaskan') {
        throw new Error('Hanya Work Order berstatus Ditugaskan yang dapat dimulai.');
      }
      const isAssignee = isUserWorkOrderAssignee(existing, currentUser.id, getUser);
      if (!isPM && !isAssignee) {
        throw new Error('Hanya penanggung jawab atau PM yang dapat memulai Work Order ini.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: 'Ditugaskan',
        toStatus: 'Dikerjakan',
        eventLabel: 'Mulai dikerjakan',
        note: '',
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Dikerjakan',
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      await commitWorkOrderPatch(id, patchFields, { ...existing, ...patchFields });
    },
    [workOrders, currentUser.id, getUser, isPM, commitWorkOrderPatch]
  );

  const blockWorkOrder = useCallback(
    async (id: string, reason: string): Promise<void> => {
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status !== 'Dikerjakan') {
        throw new Error('Hanya Work Order berstatus Dikerjakan yang dapat ditandai Blocked.');
      }
      const isAssignee = isUserWorkOrderAssignee(existing, currentUser.id, getUser);
      if (!isPM && !isAssignee) {
        throw new Error('Hanya penanggung jawab atau PM yang dapat mengubah status Blocked.');
      }
      const cleanReason = reason.trim();
      if (!cleanReason) {
        throw new Error('Alasan kendala (Blocked) wajib diisi.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: 'Dikerjakan',
        toStatus: 'Blocked',
        eventLabel: 'Ditandai Blocked',
        note: cleanReason,
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Blocked',
        blockedReason: cleanReason,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      await commitWorkOrderPatch(id, patchFields, nextWo);

      const pmRecipients = getAdminUserIds().filter((uid) => uid !== actorId);
      if (pmRecipients.length > 0) {
        pushTargetedNotification({
          title: `${nextWo.code} Tertahan (Blocked)`,
          description: `${currentUser.nickname} melaporkan kendala pada "${nextWo.title}": ${cleanReason}`,
          type: 'warning',
          recipientIds: pmRecipients,
          workOrderId: nextWo.id,
        });
      }
    },
    [
      workOrders,
      currentUser.id,
      currentUser.nickname,
      getUser,
      isPM,
      commitWorkOrderPatch,
      getAdminUserIds,
      pushTargetedNotification,
    ]
  );

  const unblockWorkOrder = useCallback(
    async (id: string): Promise<void> => {
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status !== 'Blocked') {
        throw new Error('Work Order ini tidak sedang berstatus Blocked.');
      }
      const isAssignee = isUserWorkOrderAssignee(existing, currentUser.id, getUser);
      if (!isPM && !isAssignee) {
        throw new Error('Hanya penanggung jawab atau PM yang dapat melanjutkan Work Order ini.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: 'Blocked',
        toStatus: 'Dikerjakan',
        eventLabel: 'Kendala teratasi — kembali dikerjakan',
        note: '',
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Dikerjakan',
        blockedReason: '',
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      await commitWorkOrderPatch(id, patchFields, { ...existing, ...patchFields });
    },
    [workOrders, currentUser.id, getUser, isPM, commitWorkOrderPatch]
  );

  const submitWorkOrder = useCallback(
    async (
      id: string,
      evidence?: { evidenceUrl?: string; evidenceNote?: string }
    ): Promise<void> => {
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status !== 'Dikerjakan') {
        throw new Error('Hanya Work Order berstatus Dikerjakan yang dapat diajukan.');
      }
      const isAssignee = isUserWorkOrderAssignee(existing, currentUser.id, getUser);
      if (!isPM && !isAssignee) {
        throw new Error('Hanya penanggung jawab atau PM yang dapat mengajukan Work Order ini.');
      }

      const finalEvidenceUrl =
        evidence?.evidenceUrl !== undefined
          ? sanitizeOptionalHttpUrl(evidence.evidenceUrl)
          : existing.evidenceUrl;
      const finalEvidenceNote =
        evidence?.evidenceNote !== undefined
          ? evidence.evidenceNote.trim()
          : existing.evidenceNote;

      if (existing.requireEvidence && !finalEvidenceUrl) {
        throw new Error(
          'Work Order ini mewajibkan tautan bukti hasil (URL) sebelum dapat diajukan.'
        );
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: 'Dikerjakan',
        toStatus: 'Diajukan',
        eventLabel: existing.needsRevision
          ? 'Diajukan ulang setelah revisi'
          : 'Diajukan untuk review PM',
        note: finalEvidenceNote || finalEvidenceUrl,
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Diajukan',
        evidenceUrl: finalEvidenceUrl,
        evidenceNote: finalEvidenceNote,
        needsRevision: false,
        submittedAt: nowIso,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      await commitWorkOrderPatch(id, patchFields, nextWo);

      const pmRecipients = getAdminUserIds().filter((uid) => uid !== actorId);
      if (pmRecipients.length > 0) {
        pushTargetedNotification({
          title: `${nextWo.code} Menunggu Persetujuan PM`,
          description: `${currentUser.nickname} mengajukan hasil pekerjaan "${nextWo.title}".`,
          type: 'info',
          recipientIds: pmRecipients,
          workOrderId: nextWo.id,
        });
      }
    },
    [
      workOrders,
      currentUser.id,
      currentUser.nickname,
      getUser,
      isPM,
      commitWorkOrderPatch,
      getAdminUserIds,
      pushTargetedNotification,
    ]
  );

  const approveWorkOrder = useCallback(
    async (id: string): Promise<void> => {
      if (!isPM) {
        throw new Error('Hanya Project Manager yang dapat menyetujui Work Order menjadi Selesai.');
      }
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');

      const isSelfOnlyPM = isExclusivelyAssignedToCurrentPM(
        existing,
        currentUser.id,
        isPM,
        getUser
      );
      const canDirectComplete =
        isSelfOnlyPM &&
        (existing.status === 'Ditugaskan' || existing.status === 'Dikerjakan');

      if (existing.status !== 'Diajukan' && !canDirectComplete) {
        throw new Error('Work Order harus berstatus Diajukan sebelum disetujui Selesai.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: existing.status,
        toStatus: 'Selesai',
        eventLabel: canDirectComplete
          ? 'Ditandai Selesai langsung oleh PM'
          : 'Disetujui Selesai oleh PM',
        note: '',
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Selesai',
        needsRevision: false,
        completedAt: nowIso,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      const nextList = workOrders.map((w) => (w.id === id ? nextWo : w));
      await commitWorkOrderPatch(id, patchFields, nextWo);

      // Integrasi satu arah ke Schedule & Weekly MoM
      applyScheduleSideEffectFromWorkOrders(
        nextList,
        nextWo.scheduleLink,
        'approved-or-cancelled'
      );
      applyMomActionSideEffect(nextWo, 'Resolved');

      const recipients = nextWo.assigneeIds.filter((uid) => uid !== actorId);
      if (recipients.length > 0) {
        pushTargetedNotification({
          title: `${nextWo.code} Disetujui Selesai`,
          description: `PM menyetujui hasil pekerjaan "${nextWo.title}".`,
          type: 'info',
          recipientIds: recipients,
          workOrderId: nextWo.id,
        });
      }
    },
    [
      isPM,
      workOrders,
      currentUser.id,
      getUser,
      commitWorkOrderPatch,
      applyScheduleSideEffectFromWorkOrders,
      applyMomActionSideEffect,
      pushTargetedNotification,
    ]
  );

  const requestWorkOrderRevision = useCallback(
    async (id: string, revisionNote: string): Promise<void> => {
      if (!isPM) {
        throw new Error('Hanya Project Manager yang dapat meminta revisi Work Order.');
      }
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status !== 'Diajukan') {
        throw new Error('Hanya Work Order berstatus Diajukan yang dapat diminta revisi.');
      }
      const cleanNote = revisionNote.trim();
      if (!cleanNote) {
        throw new Error('Catatan revisi wajib diisi oleh PM.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: 'Diajukan',
        toStatus: 'Dikerjakan',
        eventLabel: 'Revisi diminta oleh PM (kembali ke Dikerjakan)',
        note: cleanNote,
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Dikerjakan',
        needsRevision: true,
        revisionNote: cleanNote,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      await commitWorkOrderPatch(id, patchFields, nextWo);

      const recipients = nextWo.assigneeIds.filter((uid) => uid !== actorId);
      if (recipients.length > 0) {
        pushTargetedNotification({
          title: `Revisi Diperlukan: ${nextWo.code}`,
          description: `Catatan PM pada "${nextWo.title}": ${cleanNote}`,
          type: 'warning',
          recipientIds: recipients,
          workOrderId: nextWo.id,
        });
      }
    },
    [
      isPM,
      workOrders,
      currentUser.id,
      commitWorkOrderPatch,
      pushTargetedNotification,
    ]
  );

  const reopenWorkOrder = useCallback(
    async (id: string, reason: string): Promise<void> => {
      if (!isPM) {
        throw new Error('Hanya Project Manager yang dapat membuka kembali Work Order.');
      }
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status !== 'Selesai') {
        throw new Error('Hanya Work Order berstatus Selesai yang dapat dibuka kembali.');
      }
      const cleanReason = reason.trim();
      if (!cleanReason) {
        throw new Error('Alasan pembukaan kembali wajib diisi.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: 'Selesai',
        toStatus: 'Dikerjakan',
        eventLabel: 'Dibuka kembali oleh PM',
        note: cleanReason,
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Dikerjakan',
        reopenReason: cleanReason,
        completedAt: '',
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      const nextList = workOrders.map((w) => (w.id === id ? nextWo : w));
      await commitWorkOrderPatch(id, patchFields, nextWo);

      applyScheduleSideEffectFromWorkOrders(nextList, nextWo.scheduleLink, 'reopened');
      applyMomActionSideEffect(nextWo, 'In Progress');

      const recipients = nextWo.assigneeIds.filter((uid) => uid !== actorId);
      if (recipients.length > 0) {
        pushTargetedNotification({
          title: `${nextWo.code} Dibuka Kembali`,
          description: `PM membuka kembali "${nextWo.title}": ${cleanReason}`,
          type: 'warning',
          recipientIds: recipients,
          workOrderId: nextWo.id,
        });
      }
    },
    [
      isPM,
      workOrders,
      currentUser.id,
      commitWorkOrderPatch,
      applyScheduleSideEffectFromWorkOrders,
      applyMomActionSideEffect,
      pushTargetedNotification,
    ]
  );

  const cancelWorkOrder = useCallback(
    async (id: string, reason: string): Promise<void> => {
      if (!isPM) {
        throw new Error('Hanya Project Manager yang dapat membatalkan Work Order.');
      }
      const existing = workOrders.find((w) => w.id === id);
      if (!existing) throw new Error('Work Order tidak ditemukan.');
      if (existing.status === 'Dibatalkan') {
        throw new Error('Work Order ini sudah dibatalkan.');
      }
      const cleanReason = reason.trim();
      if (!cleanReason) {
        throw new Error('Alasan pembatalan wajib diisi.');
      }

      const nowIso = new Date().toISOString();
      const actorId = currentUser.id;
      const historyEntry: WorkOrderHistoryEntry = {
        id: `hist-${newId()}`,
        at: nowIso,
        actorId,
        fromStatus: existing.status,
        toStatus: 'Dibatalkan',
        eventLabel: 'Dibatalkan oleh PM',
        note: cleanReason,
      };

      const patchFields: Partial<WorkOrder> = {
        status: 'Dibatalkan',
        cancelReason: cleanReason,
        cancelledAt: nowIso,
        updatedAt: nowIso,
        updatedBy: actorId,
        history: [...existing.history, historyEntry],
      };

      const nextWo: WorkOrder = { ...existing, ...patchFields };
      const nextList = workOrders.map((w) => (w.id === id ? nextWo : w));
      await commitWorkOrderPatch(id, patchFields, nextWo);

      // Jika WO dibatalkan, hitung ulang apakah sisa WO aktif pada jadwal tertaut kini semuanya Selesai
      applyScheduleSideEffectFromWorkOrders(
        nextList,
        nextWo.scheduleLink,
        'approved-or-cancelled'
      );

      const recipients = nextWo.assigneeIds.filter((uid) => uid !== actorId);
      if (recipients.length > 0) {
        pushTargetedNotification({
          title: `${nextWo.code} Dibatalkan`,
          description: `PM membatalkan "${nextWo.title}": ${cleanReason}`,
          type: 'warning',
          recipientIds: recipients,
          workOrderId: nextWo.id,
        });
      }
    },
    [
      isPM,
      workOrders,
      currentUser.id,
      commitWorkOrderPatch,
      applyScheduleSideEffectFromWorkOrders,
      pushTargetedNotification,
    ]
  );

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

    if (totalItems === 0) return 0;
    return Math.round((checkedItems / totalItems) * 100);
  }, [rubricParameters, physicalChecklist]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // JSON Export / Import
  const exportDataToJson = () => {
    const payload = {
      schema_version: '3.4',
      exported_at: new Date().toISOString(),
      users,
      config,
      tasks,
      deliverables,
      weeklyPlans,
      ganttTasks,
      ganttPhases,
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
      notifications: rawNotifications,
      workOrders,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataFromJson = (jsonStr: string): ImportDataResult => {
    if (!isPM) return 'invalid';
    const d = parseAndValidateImportJson(jsonStr);
    if (!d) return 'invalid';
    if (d.users !== undefined && usersCollectionActiveRef.current) {
      return 'users-unavailable';
    }

    if (d.users && !usersCollectionActiveRef.current) {
      setUsers(sortAndNormalizeUsers(d.users));
    }
    if (d.config) setConfig(d.config);
    if (d.tasks) setTasks(d.tasks);
    if (d.deliverables) setDeliverables(d.deliverables);
    if (d.weeklyPlans) setWeeklyPlans(d.weeklyPlans);
    if (d.ganttTasks) setGanttTasks(d.ganttTasks);
    if (d.ganttPhases) setGanttPhases(d.ganttPhases);
    if (d.raciRows) setRaciRows(d.raciRows);
    if (d.slideDecks) setSlideDecks(d.slideDecks);
    if (d.trackerActions) setTrackerActions(d.trackerActions);
    if (d.meetingLogs) setMeetingLogs(d.meetingLogs);
    if (d.regulations) setRegulations(d.regulations);
    if (d.standards) setStandards(d.standards);
    if (d.logbooks) setLogbooks(d.logbooks);
    if (d.rubricParameters) setRubricParameters(d.rubricParameters);
    if (d.defenseQuestions) setDefenseQuestions(d.defenseQuestions);
    if (d.physicalChecklist) setPhysicalChecklist(d.physicalChecklist);
    if (d.notifications) setRawNotifications(d.notifications);
    if (d.workOrders) {
      setWorkOrders(
        [...d.workOrders].sort(
          (a, b) => extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code)
        )
      );
      if (isLiveFirebaseConfig && db) {
        const firestoreDb = db;
        const importedWos = d.workOrders;
        const maxImportedSeq = importedWos.reduce(
          (max, w) => Math.max(max, extractWorkOrderSeq(w.code)),
          0
        );
        void Promise.all([
          ...importedWos.map((wo) =>
            setDoc(typedDoc<WorkOrder>(firestoreDb, 'workOrders', wo.id), wo)
          ),
          ...(maxImportedSeq > 0
            ? [
                setDoc(
                  typedDoc<Record<string, unknown>>(
                    firestoreDb,
                    'config',
                    'workOrderMeta'
                  ),
                  {
                    lastSeq: maxImportedSeq,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUser.id,
                  },
                  { merge: true }
                ),
              ]
            : []),
        ]).catch((err: unknown) => {
          console.error('[firestore] gagal memulihkan koleksi workOrders:', err);
        });
      }
    }
    return 'success';
  };

  const resetToDefaults = () => {
    if (!isPM) return;
    if (!usersCollectionActiveRef.current) {
      setUsers(INITIAL_USERS);
    }
    setConfig(INITIAL_CONFIG);
    setTasks(INITIAL_TASKS);
    setDeliverables(INITIAL_DELIVERABLES);
    setWeeklyPlans(INITIAL_WEEKLY_PLANS);
    setGanttTasks(INITIAL_GANTT_TASKS);
    setGanttPhases(INITIAL_GANTT_PHASES);
    setRaciRows(INITIAL_RACI_ROWS);
    setSlideDecks(INITIAL_SLIDE_DECKS);
    setTrackerActions(INITIAL_TRACKER_ACTIONS);
    setMeetingLogs(INITIAL_MEETING_LOGS);
    setRegulations(INITIAL_REGULATIONS);
    setStandards(INITIAL_STANDARDS);
    setLogbooks(INITIAL_LOGBOOKS);
    setRubricParameters(INITIAL_RUBRIC_PARAMETERS);
    setDefenseQuestions(INITIAL_DEFENSE_QUESTIONS);
    setPhysicalChecklist(INITIAL_PHYSICAL_CHECKLIST);
    setRawNotifications(INITIAL_NOTIFICATIONS);
    setUsers(INITIAL_USERS);
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
        notifications: rawNotifications,
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
    rawNotifications,
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
      try {
        await Promise.all(
          users.map((u) =>
            setDoc(typedDoc<User>(firestoreDb, 'users', u.id), {
              ...u,
              updatedAt: serverTimestamp(),
              updatedBy: currentUser.id,
            })
          )
        );
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error('[firestore] gagal menyimpan koleksi users saat migrasi:', err);
        setSyncError(`Gagal menyinkronkan profil pengguna (${e?.code ?? e?.message ?? 'unknown'}).`);
      }
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
        updateGanttTask,
        deleteGanttTask,
        ganttPhases,
        addGanttPhase,
        updateGanttPhase,
        deleteGanttPhase,

        raciRows,
        updateRaciCell,
        addRaciRow,

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

        regulations,
        updateRegulation,
        standards,
        addStandard,
        updateStandard,
        deleteStandard,

        logbooks,
        addLogbook,
        updateLogbook,
        toggleLogbookVerification,
        deleteLogbook,
        resetLogbooksToDefault,

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

        workOrders,
        isWorkOrdersLoaded,
        selectedWorkOrderId,
        setSelectedWorkOrderId,
        openWorkOrderDetail,
        isWorkOrderFormOpen,
        workOrderFormDraft,
        openWorkOrderForm,
        closeWorkOrderForm,
        createWorkOrder,
        updateWorkOrderMeta,
        updateWorkOrderExecution,
        startWorkOrder,
        blockWorkOrder,
        unblockWorkOrder,
        submitWorkOrder,
        approveWorkOrder,
        requestWorkOrderRevision,
        reopenWorkOrder,
        cancelWorkOrder,

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
