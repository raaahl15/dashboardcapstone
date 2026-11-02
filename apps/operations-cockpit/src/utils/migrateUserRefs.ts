import {
  User,
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

export interface ProjectDataCollections {
  config: Config;
  tasks: TaskItem[];
  deliverables: DeliverableItem[];
  weeklyPlans: WeeklyPlanItem[];
  ganttTasks: GanttTaskItem[];
  raciRows: RaciRow[];
  slideDecks: SlideDeckItem[];
  trackerActions: TrackerActionItem[];
  meetingLogs: MeetingLogItem[];
  regulations: RegulationDirective[];
  standards: StandardReferenceItem[];
  logbooks: LogbookItem[];
  rubric: RubricParameter[];
  defenseQuestions: DefenseQuestion[];
  physicalChecklist: PhysicalBundleItem[];
  notifications: AppNotification[];
}

export interface MigrationBreakdownItem {
  category: string;
  count: number;
}

export interface MigrationPreviewResult {
  totalRecordsToChange: number;
  firestoreDocumentsToChange: number;
  breakdown: MigrationBreakdownItem[];
  migratedData: ProjectDataCollections;
}

const LEGACY_ALIAS_TO_UID: Record<string, string> = {
  'user-rahul': 'user-rahul',
  rahul: 'user-rahul',
  'rahul gunawan': 'user-rahul',
  'rahul ghulam hidayatulloh': 'user-rahul',
  'rahul g.': 'user-rahul',
  'rahul g': 'user-rahul',
  rg: 'user-rahul',
  rahul_pm: 'user-rahul',

  'user-ihsan': 'user-ihsan',
  ihsan: 'user-ihsan',
  'ihsan halim': 'user-ihsan',
  'ihsan h.': 'user-ihsan',
  'ihsan h': 'user-ihsan',
  'ihsan (lead process)': 'user-ihsan',
  ih: 'user-ihsan',
  ihsan_process: 'user-ihsan',

  'user-althaf': 'user-althaf',
  althaf: 'user-althaf',
  'm. althaf': 'user-althaf',
  'm althaf': 'user-althaf',
  'althaf l.': 'user-althaf',
  'althaf l': 'user-althaf',
  'althaf (lead inst 1)': 'user-althaf',
  al: 'user-althaf',
  althaf_inst1: 'user-althaf',

  'user-jonathan': 'user-jonathan',
  jonathan: 'user-jonathan',
  'jonathan (lead inst 2)': 'user-jonathan',
  'jonathan / althaf': 'user-jonathan',
  jn: 'user-jonathan',
  jonathan_inst2: 'user-jonathan',

  'user-heidi': 'user-heidi',
  heidi: 'user-heidi',
  'heidi (cost engineer)': 'user-heidi',
  hd: 'user-heidi',
  heidi_cost: 'user-heidi',
};

const CANONICAL_UID_TO_EMAIL: Record<string, string> = {
  'user-rahul': 'rahulghulamhidayatulloh2004@mail.ugm.ac.id',
  'user-ihsan': 'ihsaanzauhairtsaqifprawira@mail.ugm.ac.id',
  'user-althaf': 'altaframadhanparvez@mail.ugm.ac.id',
  'user-jonathan': 'jonathanpangihutanms@mail.ugm.ac.id',
  'user-heidi': 'heidifalinabrilian@mail.ugm.ac.id',
};

/**
 * Mencocokkan referensi pengguna (UID atau string nama/kode/raciTag lama) ke objek User.
 * Mendukung fallback baca untuk data lama yang masih berupa nama ('Ihsan'), kode ('IH'), atau raciTag.
 */
export function resolveUserFromRef(
  rawRef: string | undefined | null,
  users: User[]
): User | undefined {
  if (!rawRef || typeof rawRef !== 'string') return undefined;
  const trimmed = rawRef.trim();
  if (!trimmed || trimmed.toUpperCase() === 'ALL') return undefined;
  const normalized = trimmed.toLowerCase();

  // 1. Cek kecocokan langsung pada id (UID) atau legacyId (case-insensitive)
  const byId = users.find(
    (u) =>
      u.id.toLowerCase() === normalized ||
      (typeof u.legacyId === 'string' && u.legacyId.toLowerCase() === normalized)
  );
  if (byId) return byId;

  // 2. Cek kecocokan pada nickname, name, code, atau email
  const byDirectField = users.find(
    (u) =>
      (u.nickname && u.nickname.toLowerCase() === normalized) ||
      u.name.toLowerCase() === normalized ||
      u.code.toLowerCase() === normalized ||
      u.email.toLowerCase() === normalized
  );
  if (byDirectField) return byDirectField;

  // 3. Cek kamus alias historis (mis. 'Rahul Gunawan', 'Ihsan H.', 'Althaf (Lead Inst 1)')
  const mappedUid = LEGACY_ALIAS_TO_UID[normalized];
  if (mappedUid) {
    const canonicalEmail = CANONICAL_UID_TO_EMAIL[mappedUid];
    const byAlias = users.find(
      (u) =>
        u.id.toLowerCase() === mappedUid.toLowerCase() ||
        (typeof u.legacyId === 'string' && u.legacyId.toLowerCase() === mappedUid.toLowerCase()) ||
        (canonicalEmail && u.email && u.email.toLowerCase() === canonicalEmail.toLowerCase())
    );
    if (byAlias) return byAlias;
  }

  // 4. Cek apakah diawali dengan nickname atau name anggota (mis. 'Ihsan (Lead Process)')
  const byPrefix = users.find((u) => {
    const nick = u.nickname?.toLowerCase();
    return (
      (nick &&
        (normalized.startsWith(`${nick} `) ||
          normalized.startsWith(`${nick}/`) ||
          normalized.startsWith(`${nick} (`))) ||
      normalized.startsWith(u.name.toLowerCase())
    );
  });
  if (byPrefix) return byPrefix;

  // 5. Fallback ke raciTag jika unik
  const byRaci = users.filter((u) => u.raciTag.toLowerCase() === normalized);
  if (byRaci.length === 1) return byRaci[0];

  return undefined;
}

/**
 * Mengembalikan UID kanonik ('user-rahul', dst.) dari nilai referensi lama atau UID.
 */
export function resolveUserUid(
  rawRef: string | undefined | null,
  users: User[]
): string | undefined {
  return resolveUserFromRef(rawRef, users)?.id;
}

/**
 * Membaca nilai peran RACI ('R' | 'A' | 'C' | 'I' | '') untuk seorang user pada baris RACI,
 * dengan fallback dari map assignments[uid] ke field legacy (rahul, ihsan, althaf, jonathan, heidi).
 */
export function getRaciRoleForUser(row: RaciRow, userId: string): RaciRoleValue {
  if (row.assignments && userId in row.assignments) {
    return row.assignments[userId] || '';
  }
  const legacyKeyMap: Record<string, keyof Pick<RaciRow, 'rahul' | 'ihsan' | 'althaf' | 'jonathan' | 'heidi'>> = {
    'user-rahul': 'rahul',
    'user-ihsan': 'ihsan',
    'user-althaf': 'althaf',
    'user-jonathan': 'jonathan',
    'user-heidi': 'heidi',
  };
  const legacyKey = legacyKeyMap[userId];
  return legacyKey ? row[legacyKey] || '' : '';
}

/**
 * Menghitung preview dan hasil migrasi referensi nama pengguna lama ke UID secara idempotent.
 * Field lama TIDAK dihapus agar tetap kompatibel sebelum penghapusan disetujui.
 */
export function previewMigrateUserRefs(
  data: ProjectDataCollections,
  users: User[]
): MigrationPreviewResult {
  const breakdown: MigrationBreakdownItem[] = [];

  // 1. Tasks (pic)
  let tasksChanged = 0;
  const migratedTasks: TaskItem[] = data.tasks.map((task) => {
    const resolvedUid = resolveUserUid(task.pic, users);
    if (resolvedUid && task.pic !== resolvedUid) {
      tasksChanged += 1;
      return { ...task, pic: resolvedUid };
    }
    return task;
  });
  if (tasksChanged > 0) {
    breakdown.push({ category: 'Tugas Mingguan (Tasks)', count: tasksChanged });
  }

  // 2. Weekly Plans (pic, dengan fallback dari picCode; field lama picCode dipertahankan)
  let weeklyPlansChanged = 0;
  const migratedWeeklyPlans: WeeklyPlanItem[] = data.weeklyPlans.map((plan) => {
    const resolvedUid =
      resolveUserUid(plan.pic, users) || resolveUserUid(plan.picCode, users);
    if (resolvedUid && plan.pic !== resolvedUid) {
      weeklyPlansChanged += 1;
      return { ...plan, pic: resolvedUid };
    }
    return plan;
  });
  if (weeklyPlansChanged > 0) {
    breakdown.push({ category: 'Rencana Mingguan (Weekly Plans)', count: weeklyPlansChanged });
  }

  // 3. Gantt Tasks (pic, dari pic / picCode / picName; field lama picCode & picName dipertahankan)
  let ganttTasksChanged = 0;
  const migratedGanttTasks: GanttTaskItem[] = data.ganttTasks.map((gt) => {
    const rawCandidate = gt.pic || gt.picCode || gt.picName;
    if (rawCandidate?.toUpperCase() === 'ALL') {
      if (gt.pic !== 'ALL') {
        ganttTasksChanged += 1;
        return { ...gt, pic: 'ALL' };
      }
      return gt;
    }
    const resolvedUid =
      resolveUserUid(gt.pic, users) ||
      resolveUserUid(gt.picCode, users) ||
      resolveUserUid(gt.picName, users);
    if (resolvedUid && gt.pic !== resolvedUid) {
      ganttTasksChanged += 1;
      return { ...gt, pic: resolvedUid };
    }
    return gt;
  });
  if (ganttTasksChanged > 0) {
    breakdown.push({ category: 'Jadwal Induk (Gantt Tasks)', count: ganttTasksChanged });
  }

  // 4. RACI Rows (assignments[uid] diisi dari field legacy tanpa menghapus field legacy)
  let raciRowsChanged = 0;
  const canonicalUserIds = ['user-rahul', 'user-ihsan', 'user-althaf', 'user-jonathan', 'user-heidi'];
  const migratedRaciRows: RaciRow[] = data.raciRows.map((row) => {
    const nextAssignments: Record<string, RaciRoleValue> = { ...(row.assignments || {}) };
    let rowModified = false;
    for (const uid of canonicalUserIds) {
      const expectedVal = getRaciRoleForUser(row, uid);
      if (!row.assignments || row.assignments[uid] !== expectedVal) {
        nextAssignments[uid] = expectedVal;
        rowModified = true;
      }
    }
    if (rowModified) {
      raciRowsChanged += 1;
      return { ...row, assignments: nextAssignments };
    }
    return row;
  });
  if (raciRowsChanged > 0) {
    breakdown.push({ category: 'Matriks RACI (RACI Rows)', count: raciRowsChanged });
  }

  // 5. Slide Decks (presenter, dengan fallback presenterCode; field lama dipertahankan)
  let slideDecksChanged = 0;
  const migratedSlideDecks: SlideDeckItem[] = data.slideDecks.map((deck) => {
    const resolvedUid =
      resolveUserUid(deck.presenter, users) || resolveUserUid(deck.presenterCode, users);
    if (resolvedUid && deck.presenter !== resolvedUid) {
      slideDecksChanged += 1;
      return { ...deck, presenter: resolvedUid };
    }
    return deck;
  });
  if (slideDecksChanged > 0) {
    breakdown.push({ category: 'Slide Deck Asistensi', count: slideDecksChanged });
  }

  // 6. Tracker Actions (pic, dengan fallback picCode / picName; field lama dipertahankan)
  let trackerActionsChanged = 0;
  const migratedTrackerActions: TrackerActionItem[] = data.trackerActions.map((act) => {
    const resolvedUid =
      resolveUserUid(act.pic, users) ||
      resolveUserUid(act.picCode, users) ||
      resolveUserUid(act.picName, users);
    if (resolvedUid && act.pic !== resolvedUid) {
      trackerActionsChanged += 1;
      return { ...act, pic: resolvedUid };
    }
    return act;
  });
  if (trackerActionsChanged > 0) {
    breakdown.push({ category: 'Tracker Action Items', count: trackerActionsChanged });
  }

  // 7. Meeting Logs (presentMembers: string[])
  let meetingLogsChanged = 0;
  const migratedMeetingLogs: MeetingLogItem[] = data.meetingLogs.map((mom) => {
    let changed = false;
    const nextMembers = mom.presentMembers.map((memberRef) => {
      const resolvedUid = resolveUserUid(memberRef, users);
      if (resolvedUid && memberRef !== resolvedUid) {
        changed = true;
        return resolvedUid;
      }
      return memberRef;
    });
    if (changed) {
      meetingLogsChanged += 1;
      return { ...mom, presentMembers: nextMembers };
    }
    return mom;
  });
  if (meetingLogsChanged > 0) {
    breakdown.push({ category: 'Log Kehadiran MoM', count: meetingLogsChanged });
  }

  // 8. Logbooks (authorId, dengan fallback authorName / authorCode; field lama dipertahankan)
  let logbooksChanged = 0;
  const migratedLogbooks: LogbookItem[] = data.logbooks.map((log) => {
    const resolvedUid =
      resolveUserUid(log.authorId, users) ||
      resolveUserUid(log.authorName, users) ||
      resolveUserUid(log.authorCode, users);
    if (resolvedUid && log.authorId !== resolvedUid) {
      logbooksChanged += 1;
      return { ...log, authorId: resolvedUid };
    }
    return log;
  });
  if (logbooksChanged > 0) {
    breakdown.push({ category: 'Logbook Individu', count: logbooksChanged });
  }

  // 9. Rubric Parameters (pic, dengan fallback picCode / picName; field lama dipertahankan)
  let rubricChanged = 0;
  const migratedRubric: RubricParameter[] = data.rubric.map((param) => {
    const resolvedUid =
      resolveUserUid(param.pic, users) ||
      resolveUserUid(param.picCode, users) ||
      resolveUserUid(param.picName, users);
    if (resolvedUid && param.pic !== resolvedUid) {
      rubricChanged += 1;
      return { ...param, pic: resolvedUid };
    }
    return param;
  });
  if (rubricChanged > 0) {
    breakdown.push({ category: 'Parameter Rubrik Stage-Gate', count: rubricChanged });
  }

  // 10. Defense Questions (pic)
  let defenseQuestionsChanged = 0;
  const migratedDefenseQuestions: DefenseQuestion[] = data.defenseQuestions.map((q) => {
    const resolvedUid = resolveUserUid(q.pic, users);
    if (resolvedUid && q.pic !== resolvedUid) {
      defenseQuestionsChanged += 1;
      return { ...q, pic: resolvedUid };
    }
    return q;
  });
  if (defenseQuestionsChanged > 0) {
    breakdown.push({ category: 'Matriks Tanya-Jawab Sidang (Defense)', count: defenseQuestionsChanged });
  }

  const totalRecordsToChange = breakdown.reduce((sum, item) => sum + item.count, 0);

  return {
    totalRecordsToChange,
    firestoreDocumentsToChange: totalRecordsToChange > 0 ? 1 : 0,
    breakdown,
    migratedData: {
      ...data,
      tasks: migratedTasks,
      weeklyPlans: migratedWeeklyPlans,
      ganttTasks: migratedGanttTasks,
      raciRows: migratedRaciRows,
      slideDecks: migratedSlideDecks,
      trackerActions: migratedTrackerActions,
      meetingLogs: migratedMeetingLogs,
      logbooks: migratedLogbooks,
      rubric: migratedRubric,
      defenseQuestions: migratedDefenseQuestions,
    },
  };
}

