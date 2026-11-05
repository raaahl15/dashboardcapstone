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
  /** Jabatan di tim (User.title), dipakai untuk {posisi} di prompt AI. */
  title?: string;
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
  /** Sertakan tutorial kerja dengan bantuan AI (default: ya). */
  includeAiGuide?: boolean;
}

/** Sumber proyek yang dibaca AI (Blueprint §3.3; registry Google Workspace). */
export const PROJECT_GITHUB_URL = 'https://github.com/raaahl15/dashboardcapstone';
export const PROJECT_DRIVE_URL = 'https://drive.google.com/drive/folders/1aV2msrsmDPdYxKelZ3UlncmAsO6kmKod';

/** Token yang diganti per PIC saat tombol WA ditekan. */
export const TOKEN_NAME = '{nama}';
export const TOKEN_POSITION = '{posisi}';

/** Ganti {nama} dan {posisi} dengan data PIC penerima. */
export const personalizeForRecipient = (text: string, person?: WaPerson): string =>
  text
    .split(TOKEN_NAME)
    .join(person?.nickname || person?.name || 'kamu')
    .split(TOKEN_POSITION)
    .join((person?.title || '').trim() || 'anggota tim');

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
 * "+62 812-3456-7890" → "6281234567890"; "0812…" → "62812…"; "812…" → "62812…".
 * Mengembalikan '' bila nomor tidak terbaca.
 */
export const normalizeWaPhone = (raw?: string): string => {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = `62${d.slice(1)}`;
  else if (d.startsWith('8')) d = `62${d}`;
  return d.length >= 10 && d.length <= 15 ? d : '';
};

/** Tampilan nomor yang ramah dibaca: +62 812-3456-7890. */
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

/** Prompt 1: AI membaca dan merangkum proyek dulu sebelum mengerjakan apa pun. */
const PROMPT_READ_PROJECT = [
  'Kamu membantu tim Capstone Pabrik Dimetil Eter (DME) Area 1, DTNTF UGM 2026. Baca dulu proyek kami:',
  `- GitHub: ${PROJECT_GITHUB_URL}`,
  `- Google Drive: ${PROJECT_DRIVE_URL}`,
  'Baca semua file .md, mulai dari README.md, MASTER_CAPSTONE_ECOSYSTEM_BLUEPRINT.md, dan PROJECT_HISTORY_AND_AUDIT_LOG.md. Analisis lalu rangkum: tujuan proyek, struktur folder, status terkini, aturan kerja tim, dan istilah penting.',
  'Jangan mengerjakan tugas apa pun dulu. Balas hanya dengan rangkumanmu.',
];

const aiGuideAssignment = (wo: WorkOrder, dueText: string): string[] => {
  const todo = wo.checklist.filter((c) => !c.done).map((c) => `- ${tidy(c.text)}`);
  const instr = todo.length ? todo : tidy(wo.description) ? [tidy(wo.description)] : ['- (lihat detail WO di cockpit)'];
  return [
    '',
    '🤖 *CARA MENGERJAKAN DENGAN BANTUAN AI*',
    '_(Claude, Gemini, ChatGPT, atau agen AI lain)_',
    '1️⃣ Buka chat baru, kirim *Prompt 1*. Tunggu AI selesai membaca dan merangkum proyek.',
    '2️⃣ Cek rangkumannya. Kalau AI tidak bisa membuka link, hubungkan akun GitHub/Google Drive di pengaturan AI-nya, atau unggah file .md yang diminta.',
    '3️⃣ Kirim *Prompt 2* (sudah berisi nama, posisi, dan WO kamu).',
    '4️⃣ Cek ulang hasil AI: angka wajib diverifikasi manual, jangan memakai nilai PLACEHOLDER, dan status dokumen maksimal *Review Internal*.',
    '',
    '*Prompt 1* (salin isi kotak):',
    '```',
    ...PROMPT_READ_PROJECT,
    '```',
    '',
    '*Prompt 2* (kirim setelah AI membalas):',
    '```',
    `Aku ${TOKEN_NAME}, posisi ${TOKEN_POSITION} di tim Area 1 DME. Aku ditugaskan Work Order berikut:`,
    `${wo.code} – ${tidy(wo.title)} (prioritas ${wo.priority})`,
    'Instruksi:',
    ...instr,
    ...(tidy(wo.outputText || '') ? [`Output yang diserahkan: ${tidy(wo.outputText || '')}`] : []),
    ...(tidy(wo.fileUrl || '') ? [`File kerja: ${tidy(wo.fileUrl || '')}`] : []),
    `Tenggat: ${dueText}`,
    'Bantu aku mengerjakan WO ini langkah demi langkah sesuai aturan proyek yang sudah kamu baca. Mulai dengan rencana kerja singkat, lalu tanyakan data yang kamu butuhkan.',
    '```',
  ];
};

const aiGuideRevision = (wo: WorkOrder, note: string, dueText: string): string[] => [
  '',
  '🤖 *KALAU DIBANTU AI*',
  'Lanjutkan di chat AI yang sama. Kalau memakai chat baru, kirim dulu Prompt 1 dari pesan penugasan WO ini. Lalu kirim:',
  '```',
  `Aku ${TOKEN_NAME} (${TOKEN_POSITION}). ${wo.code} – ${tidy(wo.title)} perlu revisi.`,
  `Catatan revisi: ${note}`,
  `Tenggat revisi: ${dueText}`,
  'Perbaiki hasil sebelumnya sesuai catatan ini dan tunjukkan bagian mana saja yang berubah.',
  '```',
];

const outputLines = (wo: WorkOrder): string[] => [
  ...(tidy(wo.outputText || '') ? [`📦 Output: ${tidy(wo.outputText || '')}`] : []),
  ...(tidy(wo.fileUrl || '') ? [`📁 File: ${tidy(wo.fileUrl || '')}`] : []),
];

/**
 * Susun pesan WhatsApp untuk satu WO. Sapaan memakai token {nama} (dan prompt AI
 * memakai {posisi}); keduanya diganti per PIC lewat personalizeForRecipient saat dikirim.
 */
export function buildWoMessage(key: WaTemplateKey, wo: WorkOrder, ctx: WaContext): string {
  const today = atMidnight(ctx.today);
  const url = ctx.cockpitUrl || DEFAULT_COCKPIT_URL;
  const pm = ctx.pmName || 'Rahul';
  const withAi = ctx.includeAiGuide !== false;
  const sup = wo.supporterIds.length ? ` | Pendukung: ${names(wo.supporterIds, ctx)}` : '';
  const out: string[] = [RAKAI_INTRO(pm), '', `Halo ${TOKEN_NAME},`];

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
    if (withAi) out.push(...aiGuideAssignment(wo, `${formatDayDate(due)} pukul 19.00`));
    out.push('', 'Semangat, terima kasih! 🙏', RAKAI_SIGN(pm));
    return out.join('\n');
  }

  if (key === 'revisi') {
    const dow = today.getDay();
    const fromLecturer = dow >= 4 && dow <= 6; // Kamis–Sabtu = revisi hasil bimbingan
    out.push(`Work Order kamu perlu *revisi*${fromLecturer ? ' (hasil bimbingan)' : ' (review PM)'}:`, '');
    out.push(`🔁 *${wo.code} – ${tidy(wo.title)}*`);
    out.push(`👤 PIC: ${names(wo.assigneeIds, ctx)}${sup}`);
    const note = tidy(wo.revisionNote) || '[isi catatan revisi]';
    out.push(`🗒️ ${fromLecturer ? 'Arahan dosen' : 'Catatan revisi'}: ${note}`);
    out.push(...taskLines(wo, 'Yang perlu diperbaiki'));
    out.push(...outputLines(wo));
    out.push('', 'Status: *REVISI*');
    let dueText: string;
    if (fromLecturer) {
      const saturday = nextWeekdayOnOrAfter(today, 6);
      dueText = `${formatDayDate(saturday)} pukul 19.00`;
      out.push(`⏰ Tenggat revisi: *${dueText}* (review PM s.d. 22.00)`);
      out.push(`Status revisi diumumkan ${formatDayDate(addDays(saturday, 1))} pukul 07.00.`);
    } else {
      const wednesday = nextWeekdayOnOrAfter(today, 3);
      dueText = `${formatDayDate(wednesday)} pukul 23.59`;
      out.push(`⏰ Tenggat revisi: *${dueText}*`);
      out.push(`⚠️ Toleransi terakhir: *${formatDayDate(addDays(wednesday, 1))} pukul 07.00* (sebelum bimbingan)`);
    }
    out.push('', 'Setelah diperbaiki, ajukan lagi di cockpit (status *Diajukan*).');
    out.push(`📌 ${url} → Work Order`);
    if (withAi) out.push(...aiGuideRevision(wo, note, dueText));
    out.push('', RAKAI_SIGN(pm));
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
