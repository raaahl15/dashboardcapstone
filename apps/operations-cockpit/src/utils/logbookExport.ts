import { LogbookItem, User } from '../types';

/**
 * Ekspor rekap logbook ke CSV (Blueprint BAB IV modul 11, Fase 5: "ekspor rekap untuk Simaster").
 * Kolom mengikuti isi wajib logbook Panduan Capstone Lampiran 2 (tanggal, uraian spesifik, kendala/solusi,
 * paraf pembimbing). Format unggah Simaster belum terdokumentasi di proyek, jadi keluaran berupa CSV umum
 * (UTF-8 + BOM agar terbaca benar di Excel) yang dapat disalin/disesuaikan ke format Simaster.
 */
export const LOGBOOK_CSV_HEADER = [
  'Minggu',
  'Tanggal',
  'Kategori',
  'Penulis',
  'Uraian Kegiatan',
  'Kendala dan Solusi',
  'Diparaf Dosen',
  'Tanggal Paraf',
];

const quote = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function buildLogbookCsv(items: LogbookItem[], getUser: (id: string) => User | undefined): string {
  const author = (l: LogbookItem) =>
    l.authorId === 'team-area-1' ? 'Kelompok Area 1' : getUser(l.authorId)?.name || l.authorName || l.authorId;
  const rows = [...items]
    .sort(
      (a, b) =>
        (a.category === 'kelompok' ? 0 : 1) - (b.category === 'kelompok' ? 0 : 1) ||
        author(a).localeCompare(author(b)) ||
        (a.weekNumber ?? 0) - (b.weekNumber ?? 0)
    )
    .map((l) => [
      String(l.weekNumber ?? ''),
      l.date,
      l.category === 'kelompok' ? 'Kelompok' : 'Anggota',
      author(l),
      l.workDescription,
      l.issueSolution,
      l.verifiedByLecturer ? 'Ya' : 'Belum',
      l.verifiedDate ?? '',
    ]);
  return '﻿' + [LOGBOOK_CSV_HEADER, ...rows].map((r) => r.map((c) => quote(c ?? '')).join(',')).join('\r\n') + '\r\n';
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
