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
  HMB: 'bg-success-soft text-success',
  STANDAR: 'bg-success-soft text-success',
  LITERATUR: 'bg-success-soft text-success',
  ASUMSI: 'bg-warm-soft text-warm',
  PLACEHOLDER: 'bg-danger-soft text-danger',
  PASS: 'bg-success-soft text-success',
  FAIL: 'bg-danger-soft text-danger',
  ERROR: 'bg-danger-soft text-danger',
  WARNING: 'bg-warm-soft text-warm',
  Draft: 'bg-muted text-fg-2',
  WIP: 'bg-muted text-primary',
  'Review Internal': 'bg-primary-soft text-fg-2',
  Diajukan: 'bg-warm-soft text-warm',
  'ACC Pembimbing': 'bg-success-soft text-success',
  Revisi: 'bg-danger-soft text-danger',
};

export const statusClass = (s: string): string => STATUS_STYLE[s] ?? 'bg-muted text-fg-2';

