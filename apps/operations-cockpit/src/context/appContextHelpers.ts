import { collection, doc } from 'firebase/firestore';
import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';
import {
  User,
  TrackerActionItem,
  Config,
  SlideDeckItem,
  DeliverableItem,
  StandardReferenceItem,
  RegulationDirective,
  WorkOrder,
} from '../types';
import { INITIAL_USERS, INITIAL_CONFIG } from '../data/initialData';
import { isValidWorkOrderRecord } from '../utils/workOrderHelpers';
import {
  ProjectSectionKey,
  SECTION_KEYS,
  SharedProjectData,
  USER_ORDER,
} from './appContextTypes';

export const typedDoc = <T,>(
  firestore: Firestore,
  path: string,
  ...pathSegments: string[]
) => doc(firestore, path, ...pathSegments) as unknown as DocumentReference<T>;

export const typedCollection = <T,>(
  firestore: Firestore,
  path: string,
  ...pathSegments: string[]
) =>
  collection(
    firestore,
    path,
    ...pathSegments
  ) as unknown as CollectionReference<T>;

export function serializeSections(
  data: SharedProjectData
): Record<ProjectSectionKey, string> {
  const result = {} as Record<ProjectSectionKey, string>;
  for (const key of SECTION_KEYS) {
    result[key] = JSON.stringify(data[key]);
  }
  return result;
}

/**
 * Validasi dan sanitasi URL eksternal agar hanya mengizinkan protokol http: atau https:.
 * Mencegah Stored XSS melalui skema javascript:, data:, atau vbscript:.
 */
export function sanitizeExternalUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '#';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '#') return '#';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '#';
  } catch {
    return '#';
  }
}

// ID unik (hindari bentrok Date.now() saat dua anggota menambah data bersamaan).
export const newId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const formatTimeNow = (): string => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export function computeNextTrackerCode(
  trackerActions: TrackerActionItem[]
): string {
  const maxNum = trackerActions.reduce((max, a) => {
    const m = /^ACT-(\d+)$/.exec(a.code);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `ACT-${String(maxNum + 1).padStart(2, '0')}`;
}

export function translateAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  console.error('[login] Firebase auth error:', code, err);
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Email atau password tidak sesuai.';
  }
  if (code === 'auth/user-disabled') {
    return 'Akun ini telah dinonaktifkan oleh administrator.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Koneksi jaringan bermasalah. Coba lagi.';
  }
  return `Gagal masuk (${code || 'unknown'}). Periksa koneksi dan coba lagi.`;
}

const CANONICAL_ID_BY_EMAIL = new Map<string, string>(
  INITIAL_USERS.map((u) => [u.email.toLowerCase(), u.id])
);

/**
 * Tentukan legacyId (ID kanonik 'user-...') untuk dokumen users ber-ID UID.
 * Urutan: field `legacyId` → salah ketik `legacyid` (pernah terjadi di dokumen Ihsan, LOG-069)
 * → pemetaan email resmi anggota. Dokumen yang ID-nya sudah kanonik tidak diberi legacyId.
 */
function resolveLegacyId(u: User): string | undefined {
  const raw = u as User & { legacyid?: unknown };
  const explicit =
    typeof u.legacyId === 'string' && u.legacyId.trim()
      ? u.legacyId.trim()
      : typeof raw.legacyid === 'string' && raw.legacyid.trim()
        ? raw.legacyid.trim()
        : undefined;
  if (explicit) return explicit;
  const byEmail =
    typeof u.email === 'string' ? CANONICAL_ID_BY_EMAIL.get(u.email.trim().toLowerCase()) : undefined;
  return byEmail && byEmail !== u.id ? byEmail : undefined;
}

export function sortAndNormalizeUsers(rawUsers: User[]): User[] {
  const validIncoming = Array.isArray(rawUsers)
    ? rawUsers
        .filter((u): u is User => Boolean(u && u.id))
        .map((u) => {
          const { legacyid: _typo, ...rest } = u as User & { legacyid?: unknown };
          void _typo;
          const legacyId = resolveLegacyId(u);
          return legacyId ? { ...rest, legacyId } : rest;
        })
    : [];

  if (validIncoming.length === 0) {
    return INITIAL_USERS.map((base) => ({ ...base }));
  }

  const initialById = new Map<string, User>(
    INITIAL_USERS.map((base) => [base.id, base])
  );

  // Jika terdapat dokumen ber-UID (dengan legacyId) sekaligus dokumen kanonik lama,
  // abaikan duplikat dokumen kanonik lama tersebut.
  const legacyIdsPresentOnUidDocs = new Set<string>(
    validIncoming
      .filter((u) => Boolean(u.legacyId) && u.id !== u.legacyId)
      .map((u) => u.legacyId as string)
  );

  const normalizedList: User[] = [];
  const seenIds = new Set<string>();

  for (const incoming of validIncoming) {
    if (seenIds.has(incoming.id)) continue;
    if (!incoming.legacyId && legacyIdsPresentOnUidDocs.has(incoming.id)) {
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

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const hasStrings = (obj: Record<string, unknown>, keys: string[]): boolean =>
  keys.every((k) => typeof obj[k] === 'string' && (obj[k] as string).trim().length > 0);

const SECTION_ITEM_VALIDATORS: Record<
  Exclude<ProjectSectionKey, 'config'>,
  (item: Record<string, unknown>) => boolean
> = {
  tasks: (it) =>
    hasStrings(it, ['id', 'title', 'pic', 'day', 'week']) &&
    typeof it.completed === 'boolean',
  deliverables: (it) =>
    hasStrings(it, ['id', 'key', 'title', 'status']) &&
    typeof it.progress === 'number' &&
    typeof it.weight === 'number',
  weeklyPlans: (it) =>
    hasStrings(it, ['id', 'weekLabel', 'title', 'pic', 'status']) &&
    typeof it.week === 'number',
  ganttTasks: (it) =>
    hasStrings(it, ['id', 'phaseName', 'name']) &&
    typeof it.phaseId === 'number' &&
    typeof it.startWeek === 'number' &&
    typeof it.endWeek === 'number' &&
    (it.status === undefined ||
      ['Selesai', 'Berjalan', 'Belum', 'Terlambat', 'Perlu dicek'].includes(
        String(it.status)
      )),
  ganttPhases: (it) => typeof it.id === 'number' && hasStrings(it, ['name']),
  raciRows: (it) => hasStrings(it, ['id', 'deliverable', 'validationStatus']),
  slideDecks: (it) =>
    hasStrings(it, ['id', 'title', 'presenter', 'url']) &&
    (typeof it.week === 'number' || typeof it.week === 'string') &&
    // '#' / kosong = link belum ada (LOG-052); selain itu harus URL http(s) yang valid
    (['', '#'].includes(String(it.url).trim()) || sanitizeExternalUrl(it.url) !== '#'),
  trackerActions: (it) =>
    hasStrings(it, ['id', 'code', 'week', 'issue', 'deadline', 'progress']),
  meetingLogs: (it) =>
    hasStrings(it, ['id', 'weekLabel', 'topic', 'summary']) &&
    typeof it.week === 'number' &&
    Array.isArray(it.presentMembers),
  regulations: (it) =>
    hasStrings(it, ['id', 'title', 'subtitle', 'badge', 'url']),
  standards: (it) =>
    hasStrings(it, ['id', 'code', 'subCode', 'title', 'subtitle', 'url']),
  logbooks: (it) =>
    hasStrings(it, ['id', 'date', 'authorId', 'workDescription']) &&
    typeof it.verifiedByLecturer === 'boolean',
  rubricParameters: (it) =>
    hasStrings(it, ['id', 'title']) &&
    typeof it.score === 'number' &&
    Array.isArray(it.items),
  defenseQuestions: (it) =>
    hasStrings(it, ['id', 'axis', 'chapterTag', 'pic', 'question', 'verifiedResponse']),
  physicalChecklist: (it) =>
    hasStrings(it, ['id', 'title']) && typeof it.ready === 'boolean',
  notifications: (it) =>
    hasStrings(it, ['id', 'title', 'description']) && typeof it.read === 'boolean',
};

function isValidConfigObject(c: unknown): c is Config {
  if (!isRecord(c)) return false;
  if (
    !hasStrings(c, [
      'projectStartDate',
      'tenderDeadline',
      'projectStatus',
      'statusDescription',
    ])
  ) {
    return false;
  }
  if (!isRecord(c.upcomingMeeting) || !hasStrings(c.upcomingMeeting, ['date', 'mainAgenda'])) {
    return false;
  }
  if (!isRecord(c.weeklyFocus) || !hasStrings(c.weeklyFocus, ['week', 'title'])) {
    return false;
  }
  if (!isRecord(c.noticeBanner) || !hasStrings(c.noticeBanner, ['title', 'text'])) {
    return false;
  }
  return true;
}

export function parseAndValidateImportJson(
  jsonStr: string
): (Partial<SharedProjectData> & { workOrders?: WorkOrder[] }) | null {
  try {
    const data: unknown = JSON.parse(jsonStr);
    if (!isRecord(data)) {
      return null;
    }

    const allowedRootKeys = new Set<string>([
      'schema_version',
      'exported_at',
      'users',
      'workOrders',
      ...SECTION_KEYS,
    ]);

    // Tolak JSON yang menyertakan kunci asing di tingkat akar
    for (const key of Object.keys(data)) {
      if (!allowedRootKeys.has(key)) {
        return null;
      }
    }

    const cleanResult: Partial<SharedProjectData> & { workOrders?: WorkOrder[] } = {};
    let recognized = 0;

    const listKeys = SECTION_KEYS.filter(
      (k): k is Exclude<ProjectSectionKey, 'config'> => k !== 'config'
    );

    for (const key of listKeys) {
      if (data[key] === undefined) continue;
      const list = data[key];
      if (!Array.isArray(list)) return null;
      const validator = SECTION_ITEM_VALIDATORS[key];
      if (!list.every((item) => isRecord(item) && validator(item))) {
        return null;
      }
      if (key === 'slideDecks') {
        cleanResult.slideDecks = (list as SlideDeckItem[]).map((item) => ({
          ...item,
          url: sanitizeExternalUrl(item.url),
        }));
      } else if (key === 'deliverables') {
        cleanResult.deliverables = (list as DeliverableItem[]).map((item) => ({
          ...item,
          fileUrl: sanitizeExternalUrl(item.fileUrl),
        }));
      } else if (key === 'regulations') {
        cleanResult.regulations = (list as RegulationDirective[]).map((item) => ({
          ...item,
          url: sanitizeExternalUrl(item.url),
        }));
      } else if (key === 'standards') {
        cleanResult.standards = (list as StandardReferenceItem[]).map((item) => ({
          ...item,
          url: sanitizeExternalUrl(item.url),
        }));
      } else {
        (cleanResult as Record<string, unknown>)[key] = list;
      }
      recognized++;
    }

    if (data.config !== undefined) {
      if (!isValidConfigObject(data.config)) return null;
      cleanResult.config = {
        ...INITIAL_CONFIG,
        ...data.config,
      };
      recognized++;
    }

    if (data.users !== undefined) {
      if (
        !Array.isArray(data.users) ||
        !data.users.every(
          (u) =>
            isRecord(u) &&
            hasStrings(u, ['id', 'name', 'email']) &&
            Array.isArray(u.jobdesk)
        )
      ) {
        return null;
      }
      cleanResult.users = data.users as unknown as User[];
    }

    if (data.workOrders !== undefined) {
      if (
        !Array.isArray(data.workOrders) ||
        !data.workOrders.every((wo) => isValidWorkOrderRecord(wo))
      ) {
        return null;
      }
      cleanResult.workOrders = (data.workOrders as WorkOrder[]).map((wo) => ({
        ...wo,
        evidenceUrl: wo.evidenceUrl
          ? sanitizeExternalUrl(wo.evidenceUrl) === '#'
            ? ''
            : sanitizeExternalUrl(wo.evidenceUrl)
          : '',
      }));
      recognized++;
    }

    if (recognized === 0) return null;

    return cleanResult;
  } catch {
    return null;
  }
}
