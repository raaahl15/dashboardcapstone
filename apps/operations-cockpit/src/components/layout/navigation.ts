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
