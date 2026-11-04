import { useEffect, useState } from 'react';

/**
 * Data rekayasa statis (Blueprint §3.6) dibundel ke public/data/ oleh tools/build_manifest.js.
 * Data ini TIDAK berasal dari Firestore; kesegarannya mengikuti deploy terakhir, jadi setiap view
 * wajib menampilkan tanggal ekstraksinya.
 */
const cache = new Map<string, unknown>();

export type StaticState<T> = { data: T | null; error: string | null; loading: boolean };

export function useStaticData<T>(file: string): StaticState<T> {
  const [state, setState] = useState<StaticState<T>>(() => ({
    data: (cache.get(file) as T) ?? null,
    error: null,
    loading: !cache.has(file),
  }));

  useEffect(() => {
    if (cache.has(file)) return;
    let alive = true;
    fetch(`/data/${file}`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((json) => {
        cache.set(file, json);
        if (alive) setState({ data: json, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (alive) setState({ data: null, error: `Gagal memuat ${file}: ${e instanceof Error ? e.message : String(e)}`, loading: false });
      });
    return () => {
      alive = false;
    };
  }, [file]);

  return state;
}

export const fmtNum = (v: number | null | undefined, digits = 2): string =>
  v === null || v === undefined || Number.isNaN(v)
    ? '–'
    : v.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtDateTime = (iso: string | undefined): string => {
  if (!iso) return '–';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const daysSince = (iso: string | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 86_400_000);
};

const STATUS_STYLE: Record<string, string> = {
  HMB: 'bg-[#D1FAE5] text-[#065F46]',
  STANDAR: 'bg-[#D1FAE5] text-[#065F46]',
  LITERATUR: 'bg-[#D1FAE5] text-[#065F46]',
  ASUMSI: 'bg-[#FEF3C7] text-[#92400E]',
  PLACEHOLDER: 'bg-[#FEE2E2] text-[#991B1B]',
  PASS: 'bg-[#D1FAE5] text-[#065F46]',
  FAIL: 'bg-[#FEE2E2] text-[#991B1B]',
  ERROR: 'bg-[#FEE2E2] text-[#991B1B]',
  WARNING: 'bg-[#FEF3C7] text-[#92400E]',
  Draft: 'bg-[#E2E8F0] text-[#334155]',
  WIP: 'bg-[#EAF6FD] text-[#0062CC]',
  'Review Internal': 'bg-[#EDE9FE] text-[#5B21B6]',
  Diajukan: 'bg-[#FEF3C7] text-[#92400E]',
  'ACC Pembimbing': 'bg-[#D1FAE5] text-[#065F46]',
  Revisi: 'bg-[#FEE2E2] text-[#991B1B]',
};

export const statusClass = (s: string): string => STATUS_STYLE[s] ?? 'bg-[#E2E8F0] text-[#334155]';

/**
 * Tautan langsung ke tab tertentu di Master Library (mis. dari panel Kesehatan Data).
 * Disimpan di variabel modul: cukup untuk satu sesi SPA, tanpa URL/penyimpanan browser.
 */
export type LibraryTab = 'docs' | 'calc' | 'tags';
let pendingLibraryTab: LibraryTab | null = null;
export const requestLibraryTab = (tab: LibraryTab): void => {
  pendingLibraryTab = tab;
};
export const consumeLibraryTab = (): LibraryTab | null => {
  const t = pendingLibraryTab;
  pendingLibraryTab = null;
  return t;
};
