import { useEffect, useRef } from 'react';
import type { NavTab } from '../../context/AppContext';

/**
 * Struktur menu cockpit (Blueprint v2.4 BAB IV, P2 audit Fase 4, LOG-032).
 * 8 menu dalam 3 grup Blueprint; modul lama menjadi sub-tab sehingga tidak ada data/fitur yang hilang.
 * `NavTab` tetap per modul supaya tautan internal (mis. setActiveTab('workspaces')) tetap berlaku.
 */
export type NavSection = 'Governance' | 'Engineering Hub' | 'DTNTF Academic';

export interface NavGroup {
  key: string;
  label: string;
  section: NavSection;
  tabs: { key: NavTab; label: string }[];
}

export const NAV_GROUPS: NavGroup[] = [
  { key: 'beranda', label: 'Beranda', section: 'Governance', tabs: [{ key: 'homepage', label: 'Beranda' }] },
  { key: 'wo', label: 'Work Order', section: 'Governance', tabs: [{ key: 'work-orders', label: 'Work Order' }] },
  { key: 'jadwal', label: 'Jadwal', section: 'Governance', tabs: [{ key: 'schedule', label: 'Jadwal' }] },
  { key: 'tim', label: 'Tim & RACI', section: 'Governance', tabs: [{ key: 'team-raci', label: 'Tim & RACI' }] },
  {
    key: 'data',
    label: 'Data Rekayasa',
    section: 'Engineering Hub',
    tabs: [
      { key: 'dwsim', label: 'Neraca HMB (DWSIM)' },
      { key: 'calc', label: 'Kalkulator' },
      { key: 'tags', label: 'Validasi Tag' },
    ],
  },
  {
    key: 'dokumen',
    label: 'Dokumen',
    section: 'Engineering Hub',
    tabs: [
      { key: 'workspaces', label: 'Deliverable' },
      { key: 'gworkspace', label: 'Google Workspace' },
      { key: 'library', label: 'Companion .md' },
      { key: 'standards', label: 'Standar & Regulasi' },
    ],
  },
  {
    key: 'rapat',
    label: 'Rapat & Logbook',
    section: 'DTNTF Academic',
    tabs: [
      { key: 'weekly-mom', label: 'Rapat Mingguan (MoM)' },
      { key: 'logbook', label: 'Logbook' },
    ],
  },
  { key: 'stage', label: 'Stage-Gate', section: 'DTNTF Academic', tabs: [{ key: 'stage-gate', label: 'Stage-Gate' }] },
];

export const groupOfTab = (tab: NavTab): NavGroup =>
  NAV_GROUPS.find((g) => g.tabs.some((t) => t.key === tab)) ?? NAV_GROUPS[0];

/** Kepala halaman v2.0 per modul: eyebrow (grup · keterangan), judul, dan aksen miring. */
export interface PageMeta {
  eyebrow: string;
  title?: string;
  accent?: string;
  /** Tombol utama di kanan atas bar (v2.0). pmOnly: hanya tampil untuk PM. */
  action?: { label: string; pmOnly?: boolean };
}

export const PAGE_META: Record<NavTab, PageMeta> = {
  homepage: { eyebrow: 'Area 1 Reaktor · PSTF 1 (FEED)' },
  'work-orders': { eyebrow: 'Governance · Pusat penugasan resmi PM & persetujuan penyelesaian', title: 'Work Order', accent: 'satu sumber kebenaran', action: { label: 'Buat Work Order', pmOnly: true } },
  schedule: { eyebrow: 'Governance · Gantt 18 minggu + rencana minggu berjalan', title: 'Jadwal', accent: 'rencana & Gantt PSTF 1', action: { label: 'Tambah task Gantt', pmOnly: true } },
  'team-raci': { eyebrow: 'Governance · Struktur tim EPC & akuntabilitas deliverable (KAK-IC-DME-2026-001)', title: 'Tim & RACI', accent: 'engineer & deliverable inti' },
  dwsim: { eyebrow: 'Engineering Hub · Hasil ekstraksi model DME.dwxmz', title: 'Data Rekayasa', accent: 'neraca massa & panas' },
  calc: { eyebrow: 'Engineering Hub · Verifikasi silang mesin kalkulator tools/calc', title: 'Data Rekayasa', accent: 'hasil kalkulator' },
  tags: { eyebrow: 'Engineering Hub · Hasil tools/validate_tags.py terhadap tag_map.csv', title: 'Data Rekayasa', accent: 'validasi tag' },
  workspaces: { eyebrow: 'Engineering Hub · Siklus Draft → WIP → Review Internal → Diajukan → ACC', title: 'Dokumen', accent: 'deliverable FEED' },
  gworkspace: { eyebrow: 'Engineering Hub · Master kolaborasi Sheets/Docs & folder Drive proyek', title: 'Dokumen', accent: 'Google Workspace' },
  library: { eyebrow: 'Engineering Hub · Companion .md dari repo beserta status dokumen', title: 'Dokumen', accent: 'companion .md' },
  standards: { eyebrow: 'Engineering Hub · Pedoman Capstone DTNTF & direktori standar internasional', title: 'Dokumen', accent: 'standar & regulasi' },
  'weekly-mom': { eyebrow: 'DTNTF Academic · Materi asistensi & tindak lanjut bimbingan', title: 'Rapat & Logbook', accent: 'rapat mingguan (MoM)', action: { label: 'Catat MoM', pmOnly: true } },
  logbook: { eyebrow: 'DTNTF Academic · 1 logbook kelompok + 5 logbook anggota', title: 'Rapat & Logbook', accent: 'logbook kegiatan', action: { label: 'Tambah logbook' } },
  'stage-gate': { eyebrow: 'DTNTF Academic · Kematangan teknis & berkas sebelum evaluasi', title: 'Stage-Gate', accent: 'kesiapan G1–G4', action: { label: 'Cetak rubrik' } },
};

const PAGE_ACTION_EVENT = 'cockpit:page-action';

/** Dipanggil bar atas saat tombol utama diklik; view yang aktif menangani lewat usePageAction. */
export const triggerPageAction = (tab: NavTab) => window.dispatchEvent(new CustomEvent(PAGE_ACTION_EVENT, { detail: tab }));

/** Daftarkan penangan tombol utama untuk satu tab (pakai di dalam view). */
export const usePageAction = (tab: NavTab, handler: () => void) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<NavTab>).detail === tab) ref.current();
    };
    window.addEventListener(PAGE_ACTION_EVENT, on);
    return () => window.removeEventListener(PAGE_ACTION_EVENT, on);
  }, [tab]);
};
