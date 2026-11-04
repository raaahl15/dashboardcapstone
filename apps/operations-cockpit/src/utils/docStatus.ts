/**
 * Status dokumen baku (Blueprint §1.4) dan bobot progres (keputusan PM 2026-11-04, LOG-030).
 *
 * Satu-satunya sumber kosakata status untuk deliverable di cockpit. Data lama di Firestore
 * yang masih memakai kosakata pra-Fase 1.5 dipetakan saat dibaca (tidak ada migrasi otomatis):
 * nilai baru baru tersimpan ketika PM menyimpan ulang deliverable lewat modul Workspaces.
 */
import type { DeliverableItem } from '../types';

export const DOC_STATUSES = [
  'Draft',
  'WIP',
  'Review Internal',
  'Diajukan',
  'ACC Pembimbing',
  'Revisi',
] as const;

export type DocStatus = (typeof DOC_STATUSES)[number];

/** Kosakata lama yang mungkin masih ada di Firestore. */
export type LegacyDeliverableStatus = 'In Review Pembimbing' | 'ACC Final' | 'Aktif' | 'Lewat target';

/** Bobot progres per status (persen). Revisi = dikembalikan untuk dikerjakan ulang, setara WIP. */
export const STATUS_PROGRESS: Record<DocStatus, number> = {
  Draft: 0,
  WIP: 40,
  'Review Internal': 70,
  Diajukan: 90,
  'ACC Pembimbing': 100,
  Revisi: 40,
};

/**
 * Pemetaan kosakata lama → baku. `ACC Final` TIDAK otomatis menjadi `ACC Pembimbing` karena
 * data lama tidak menyimpan bukti ACC (Blueprint §1.4); dipetakan ke `Diajukan` sampai PM
 * mengisi bukti MoM dan menetapkan ACC.
 */
const LEGACY_MAP: Record<LegacyDeliverableStatus, DocStatus> = {
  'In Review Pembimbing': 'Diajukan',
  'ACC Final': 'Diajukan',
  Aktif: 'WIP',
  'Lewat target': 'WIP',
};

export const isDocStatus = (s: string): s is DocStatus =>
  (DOC_STATUSES as readonly string[]).includes(s);

export const normalizeDocStatus = (s: string | undefined): DocStatus => {
  if (!s) return 'Draft';
  if (isDocStatus(s)) return s;
  return LEGACY_MAP[s as LegacyDeliverableStatus] ?? 'Draft';
};

/** True bila status tersimpan masih kosakata lama (perlu disimpan ulang oleh PM). */
export const isLegacyStatus = (s: string | undefined): boolean => !!s && !isDocStatus(s);

/** Status yang wajib disertai bukti (Blueprint §1.4): kode WO / referensi MoM. */
export const STATUS_NEEDS_EVIDENCE: readonly DocStatus[] = ['Diajukan', 'ACC Pembimbing', 'Revisi'];

export const deliverableStatus = (d: Pick<DeliverableItem, 'status'>): DocStatus =>
  normalizeDocStatus(d.status);

export const deliverableProgress = (d: Pick<DeliverableItem, 'status'>): number =>
  STATUS_PROGRESS[deliverableStatus(d)];

/** Kelas warna pil status (kontras teks ≥ 4.5:1 pada latar pil). */
export const STATUS_PILL: Record<DocStatus, string> = {
  Draft: 'bg-[#E2E8F0] text-[#334155]',
  WIP: 'bg-[#DBEAFE] text-[#1E3A8A]',
  'Review Internal': 'bg-[#EDE9FE] text-[#5B21B6]',
  Diajukan: 'bg-[#FEF3C7] text-[#92400E]',
  'ACC Pembimbing': 'bg-[#D1FAE5] text-[#065F46]',
  Revisi: 'bg-[#FEE2E2] text-[#991B1B]',
};
