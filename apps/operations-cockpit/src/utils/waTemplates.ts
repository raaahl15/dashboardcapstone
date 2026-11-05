/**
 * Template pesan WhatsApp Work Order (Blueprint §7.4–7.5, dokumen
 * 06_COLLABORATIVE_WORKSPACE/TEMPLATE_PESAN_WA_WO.md, LOG-062/063).
 *
 * Satu pesan per WO, dikirim langsung ke nomor WA tiap PIC (wa.me/<nomor>).
 * Tiga template: Ditugaskan, Direvisi, Disetujui. Nomor diambil dari profil
 * anggota (User.phone), bukan dari kode.
 *
 * Fungsi murni: tidak bergantung React/Firebase agar bisa diuji di Node.
 * Status "Revisi" dan jam tenggat ditulis di pesan karena cockpit belum
 * mendukungnya (UPD-01/02).
 */
import type { WorkOrder } from '../types';

export type WaTemplateKey = 'ditugaskan' | 'revisi' | 'disetujui';

export interface WaTemplateMeta {
  key: WaTemplateKey;
  label: string;
  hint: string;
}

export const WA_TEMPLATES: WaTemplateMeta[] = [
  { key: 'ditugaskan', label: 'WO Ditugaskan', hint: 'Minggu 07.00 · saat WO baru dibuat' },
  { key: 'revisi', label: 'WO Direvisi', hint: 'Revisi PM (Selasa) atau revisi dosen (Kamis)' },
  { key: 'disetujui', label: 'WO Disetujui', hint: 'Setelah review PM' },
];

export interface WaPerson {
  nickname?: string;
  name?: string;
  phone?: string;
}

export interface WaContext {
  /** Tanggal acuan (biasanya hari ini, waktu lokal). */
  today: Date;
  getUser: (id: string) => WaPerson | undefined;
  /** Rencana mingguan cockpit: dipakai untuk membaca nomor bimbingan per minggu proyek. */
  weeklyPlans: { week: number; title: string }[];
  projectStartDate: string; // 'YYYY-MM-DD'
  pmName?: string;
  cockpitUrl?: string;
}

export const RAKAI_INTRO = (pmName = 'Rahul') =>
  `Halo, aku *Rakai*, agen AI Claude Code sekaligus asisten AI ${pmName} (PM Area 1) 👋`;
export const RAKAI_SIGN = (pmName = 'Rahul') => `— Rakai, atas nama ${pmName} (PM)`;
export const DEFAULT_COCKPIT_URL = 'https://dashboardcapstonearea1.vercel.app/';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Hari `weekday` (0 = Minggu) pada atau setelah `from`. */
export const nextWeekdayOnOrAfter = (from: Date, weekday: number): Date => {
  const base = atMidnight(from);
  return addDays(base, (weekday - base.getDay() + 7) % 7);
};

export const formatDayDate = (d: Date): string =>
  `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const parseYmd = (ymd: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

/** Minggu proyek (1-based, minggu dimulai pada tanggal mulai proyek). */
export const projectWeekOf = (d: Date, projectStartDate: string): number => {
  const start = parseYmd(projectStartDate);
  if (!start) return 0;
  const diffDays = Math.round((atMidnight(d).getTime() - start.getTime()) / 86400000);
  return Math.floor(diffDays / 7) + 1;
};

/** "Bimbingan 7, Kamis, 12 Nov 2026" (nomor dari rencana mingguan; tanpa nomor bila tidak ada). */
export const bimbinganLabel = (thursday: Date, ctx: WaContext): string => {
  const week = projectWeekOf(thursday, ctx.projectStartDate);
  const plan = ctx.weeklyPlans.find((p) => p.week === week);
  const m = plan ? /Bimbingan\s+(\d+)/i.exec(plan.title) : null;
  return `${m ? `Bimbingan ${m[1]}` : 'Bimbingan'}, ${formatDayDate(thursday)}`;
};

/**
 * Normalisasi nomor WA ke format wa.me (hanya angka, kode negara 62).
 * "+62 813-9279-2724" → "6281392792724"; "0813…" → "62813…"; "813…" → "62813…".
 * Mengembalikan '' bila nomor tidak terbaca.
 */
export const normalizeWaPhone = (raw?: string): string => {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = `62${d.slice(1)}`;
  else if (d.startsWith('8')) d = `62${d}`;
  return d.length >= 10 && d.length <= 15 ? d : '';
};

/** Tampilan nomor yang ramah dibaca: +62 813-9279-2724. */
export const formatWaPhone = (digits: string): string => {
  if (!digits.startsWith('62')) return digits;
  const rest = digits.slice(2);
  const parts = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7)].filter(Boolean);
  return `+62 ${parts.join('-')}`;
};

export const waLinkTo = (phoneDigits: string, text: string) =>
  `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;

const nameOf = (id: string, ctx: WaContext) => ctx.getUser(id)?.nickname || ctx.getUser(id)?.name || id;
const names = (ids: string[], ctx: WaContext) => ids.map((id) => nameOf(id, ctx)).join(', ');
const greetNames = (ids: string[], ctx: WaContext) => {
  const list = ids.map((id) => nameOf(id, ctx));
  if (list.length <= 1) return list[0] || 'tim';
  return `${list.slice(0, -1).join(', ')} & ${list[list.length - 1]}`;
};

const tidy = (s: string) => (s || '').replace(/[ \t]+/g, ' ').trim();

/** Template yang disarankan untuk sebuah WO berdasarkan statusnya. */
export function suggestTemplate(wo: WorkOrder): WaTemplateKey {
  if (wo.needsRevision && wo.status !== 'Selesai') return 'revisi';
  if (wo.status === 'Selesai' || wo.status === 'Diajukan') return 'disetujui';
  return 'ditugaskan';
}

/** Rincian tugas: checklist yang belum selesai, atau deskripsi bila tidak ada checklist. */
const taskLines = (wo: WorkOrder, label: string): string[] => {
  const todo = wo.checklist.filter((c) => !c.done).map((c) => tidy(c.text));
  if (todo.length) return [`📝 ${label}:`, ...todo.map((t) => `   • ${t}`)];
  if (tidy(wo.description)) return [`📝 ${label}:`, tidy(wo.description)];
  return [];
};

const outputLines = (wo: WorkOrder): string[] => [
  ...(tidy(wo.outputText || '') ? [`📦 Output: ${tidy(wo.outputText || '')}`] : []),
  ...(tidy(wo.fileUrl || '') ? [`📁 File: ${tidy(wo.fileUrl || '')}`] : []),
];

/**
 * Susun pesan WhatsApp untuk satu WO. `recipientIds` = PIC yang disapa
 * (default semua penanggung jawab WO).
 */
export function buildWoMessage(
  key: WaTemplateKey,
  wo: WorkOrder,
  ctx: WaContext,
  recipientIds: string[] = wo.assigneeIds
): string {
  const today = atMidnight(ctx.today);
  const url = ctx.cockpitUrl || DEFAULT_COCKPIT_URL;
  const pm = ctx.pmName || 'Rahul';
  const sup = wo.supporterIds.length ? ` | Pendukung: ${names(wo.supporterIds, ctx)}` : '';
  const out: string[] = [RAKAI_INTRO(pm), '', `Halo ${greetNames(recipientIds, ctx)},`];

  if (key === 'ditugaskan') {
    const due = parseYmd(wo.dueDate) || nextWeekdayOnOrAfter(today, 2);
    const thursday = nextWeekdayOnOrAfter(addDays(due, 1), 4);
    out.push('ada Work Order baru untuk kamu:', '');
    out.push(`📋 *${wo.code} – ${tidy(wo.title)}*`);
    out.push(`⚡ Prioritas: ${wo.priority}`);
    out.push(`👤 PIC: ${names(wo.assigneeIds, ctx)}${sup}`);
    out.push(...taskLines(wo, 'Tugas'));
    out.push(...outputLines(wo));
    out.push('');
    out.push(`⏰ Tenggat pengajuan: *${formatDayDate(due)} pukul 19.00*`);
    out.push(`🗣️ Dipaparkan: *${bimbinganLabel(thursday, ctx)}*`);
    out.push('');
    out.push(`Kalau sudah selesai, ubah status WO di cockpit menjadi *Diajukan* sebelum tenggat.`);
    out.push(`📌 Detail & checklist: ${url} → Work Order`);
    out.push('', 'Semangat, terima kasih! 🙏', RAKAI_SIGN(pm));
    return out.join('\n');
  }

  if (key === 'revisi') {
    const dow = today.getDay();
    const fromLecturer = dow >= 4 && dow <= 6; // Kamis–Sabtu = revisi hasil bimbingan
    out.push(`Work Order kamu perlu *revisi*${fromLecturer ? ' (hasil bimbingan)' : ' (review PM)'}:`, '');
    out.push(`🔁 *${wo.code} – ${tidy(wo.title)}*`);
    out.push(`👤 PIC: ${names(wo.assigneeIds, ctx)}${sup}`);
    out.push(`🗒️ ${fromLecturer ? 'Arahan dosen' : 'Catatan revisi'}: ${tidy(wo.revisionNote) || '[isi catatan revisi]'}`);
    out.push(...taskLines(wo, 'Yang perlu diperbaiki'));
    out.push(...outputLines(wo));
    out.push('', 'Status: *REVISI*');
    if (fromLecturer) {
      const saturday = nextWeekdayOnOrAfter(today, 6);
      out.push(`⏰ Tenggat revisi: *${formatDayDate(saturday)} pukul 19.00* (review PM s.d. 22.00)`);
      out.push(`Status revisi diumumkan ${formatDayDate(addDays(saturday, 1))} pukul 07.00.`);
    } else {
      const wednesday = nextWeekdayOnOrAfter(today, 3);
      out.push(`⏰ Tenggat revisi: *${formatDayDate(wednesday)} pukul 23.59*`);
      out.push(`⚠️ Toleransi terakhir: *${formatDayDate(addDays(wednesday, 1))} pukul 07.00* (sebelum bimbingan)`);
    }
    out.push('', 'Setelah diperbaiki, ajukan lagi di cockpit (status *Diajukan*).');
    out.push(`📌 ${url} → Work Order`, '', RAKAI_SIGN(pm));
    return out.join('\n');
  }

  // disetujui
  const dow = today.getDay();
  out.push('Work Order kamu sudah direview PM dan *disetujui* ✅', '');
  out.push(`✅ *${wo.code} – ${tidy(wo.title)}*`);
  out.push(`👤 PIC: ${names(wo.assigneeIds, ctx)}${sup}`);
  out.push(...outputLines(wo));
  out.push('', 'Status: *SELESAI*');
  if (dow <= 4) {
    // Minggu–Kamis: masih ada bimbingan minggu ini
    out.push(`🗣️ Siap dipaparkan di *${bimbinganLabel(nextWeekdayOnOrAfter(today, 4), ctx)}*.`);
    out.push('Mohon siapkan penjelasan singkat untuk bagianmu.');
  }
  out.push('', 'Terima kasih, kerja bagus! 🙌', RAKAI_SIGN(pm));
  return out.join('\n');
}

/**
 * Penanda "buka panel WA otomatis" untuk WO yang baru dibuat. Form WO menandai,
 * panel detail membaca sekali saat WO tersebut terbuka.
 */
let pendingAutoOpenWoId: string | null = null;
export const markWaAutoOpen = (woId: string) => {
  pendingAutoOpenWoId = woId;
};
export const consumeWaAutoOpen = (woId: string): boolean => {
  if (pendingAutoOpenWoId !== woId) return false;
  pendingAutoOpenWoId = null;
  return true;
};
