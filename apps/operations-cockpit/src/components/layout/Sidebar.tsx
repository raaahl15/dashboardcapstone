import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutGrid,
  ClipboardCheck,
  CalendarDays,
  Users,
  FlaskConical,
  FileText,
  BookOpen,
  Flag,
  Moon,
  Sun,
  MoreHorizontal,
  ChevronRight,
  LogOut,
  CircleUser,
  X,
  Download,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NAV_GROUPS, groupOfTab } from './navigation';
import { useTheme, setTheme } from '../../utils/theme';
import { resolveAvatarBgProps } from '../common/UserChip';

/** Ikon per menu (kunci = NavGroup.key). */
export const NAV_ICONS: Record<string, LucideIcon> = {
  beranda: LayoutGrid,
  wo: ClipboardCheck,
  jadwal: CalendarDays,
  tim: Users,
  data: FlaskConical,
  dokumen: FileText,
  rapat: BookOpen,
  stage: Flag,
};

/** Sidebar pil 80px (desktop ≥ lg) — Cockpit UI v2.0. */
interface SidebarProps {
  onOpenProfile: () => void;
  onOpenExportImport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenProfile, onOpenExportImport }) => {
  const { activeTab, setActiveTab, currentUser, isPM, logout } = useApp();
  const [theme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);
  const avatarBg = resolveAvatarBgProps(currentUser.avatarBg);
  const activeGroup = groupOfTab(activeTab);

  return (
    <aside
      className="hidden lg:flex fixed left-4 top-4 bottom-4 z-40 w-20 flex-col items-center gap-2 py-4 glass-card !rounded-[40px]"
      aria-label="Navigasi Utama"
    >
      <button
        type="button"
        onClick={() => setActiveTab('homepage')}
        className="w-12 h-12 rounded-full bg-primary text-on-primary font-heading text-base font-semibold flex items-center justify-center shrink-0"
        title="Area 1-DME · Operations Cockpit"
        aria-label="Beranda Area 1-DME"
      >
        A1
      </button>
      <span className="w-8 h-px bg-line my-1" aria-hidden="true" />
      <nav className="flex-1 flex flex-col items-center gap-1.5 overflow-y-auto scrollbar-none w-full">
        {NAV_GROUPS.map((g, i) => {
          const Icon = NAV_ICONS[g.key] ?? LayoutGrid;
          const active = activeGroup.key === g.key;
          const sectionStart = i > 0 && NAV_GROUPS[i - 1].section !== g.section;
          return (
            <React.Fragment key={g.key}>
              {sectionStart && <span className="w-6 h-px bg-line my-1 shrink-0" aria-hidden="true" />}
              <button
                type="button"
                onClick={() => setActiveTab(g.tabs[0].key)}
                aria-current={active ? 'page' : undefined}
                aria-label={g.label}
                className={`group relative w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  active ? 'bg-primary text-on-primary shadow-cockpit-card' : 'text-fg-2 hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 rounded-full bg-ink text-on-ink text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-50"
                >
                  {g.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-1 p-1 rounded-full bg-muted" role="radiogroup" aria-label="Tema tampilan">
        {(['light', 'dark'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={theme === t}
            onClick={() => setTheme(t)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === t ? 'bg-surface text-primary shadow-xs' : 'text-fg-3 hover:text-fg'}`}
            title={t === 'light' ? 'Mode terang' : 'Mode gelap'}
            aria-label={t === 'light' ? 'Mode terang' : 'Mode gelap'}
          >
            {t === 'light' ? <Sun className="w-4 h-4" strokeWidth={1.75} /> : <Moon className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        ))}
      </div>
      <div className="relative mt-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menu profil"
          className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-surface shadow-cockpit-card flex items-center justify-center"
        >
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <span style={avatarBg.style} className={`w-full h-full flex items-center justify-center text-xs font-semibold text-on-ink ${avatarBg.className}`}>
              {currentUser.avatarInitial || currentUser.code}
            </span>
          )}
        </button>
        {menuOpen && (
          <div role="menu" className="anim-pop absolute left-full bottom-0 ml-3 w-64 bg-surface rounded-[24px] shadow-cockpit-pop border border-line p-2 z-50">
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-fg truncate">{currentUser.name}</p>
              <p className="text-xs text-fg-3 truncate">{currentUser.title}</p>
            </div>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onOpenProfile(); }} className="w-full min-h-[44px] px-3 rounded-2xl text-sm text-fg hover:bg-muted flex items-center gap-2.5">
              <CircleUser className="w-4 h-4 text-primary" /> Profil saya
            </button>
            {isPM && (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onOpenExportImport(); }} className="w-full min-h-[44px] px-3 rounded-2xl text-sm text-fg hover:bg-muted flex items-center gap-2.5">
                <Download className="w-4 h-4 text-primary" /> Backup &amp; Restore
              </button>
            )}
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void logout(); }} className="w-full min-h-[44px] px-3 rounded-2xl text-sm font-semibold text-warm hover:bg-warm-soft flex items-center gap-2.5">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

const PRIMARY_MOBILE = ['beranda', 'wo', 'jadwal', 'dokumen'];
const SHORT_LABEL: Record<string, string> = { beranda: 'Beranda', wo: 'WO', jadwal: 'Jadwal', dokumen: 'Dokumen' };

interface BottomNavProps {
  onOpenProfile: () => void;
}

/** Navigasi bawah (mobile < lg): 4 menu utama + sheet "Lainnya". */
export const BottomNav: React.FC<BottomNavProps> = ({ onOpenProfile }) => {
  const { activeTab, setActiveTab, logout } = useApp();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const activeGroup = groupOfTab(activeTab);
  const primary = NAV_GROUPS.filter((g) => PRIMARY_MOBILE.includes(g.key));
  const more = NAV_GROUPS.filter((g) => !PRIMARY_MOBILE.includes(g.key));
  const moreActive = more.some((g) => g.key === activeGroup.key);

  const go = (key: (typeof NAV_GROUPS)[number]) => {
    setActiveTab(key.tabs[0].key);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Menu lainnya">
          <button
            type="button"
            className="absolute inset-0 bg-[#021024]/45"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          />
          <div className="anim-sheet absolute inset-x-0 bottom-0 bg-surface rounded-t-[28px] px-5 pt-2.5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] shadow-cockpit-pop">
            <div className="flex justify-center pb-3">
              <span className="w-10 h-1.5 rounded-full bg-line" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {more.map((g) => {
                const Icon = NAV_ICONS[g.key] ?? LayoutGrid;
                const active = g.key === activeGroup.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => go(g)}
                    className={`rounded-[20px] p-4 text-left flex flex-col gap-2.5 border ${
                      active ? 'bg-primary-soft border-primary' : 'bg-canvas border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                    <span className="text-sm font-semibold text-fg">{g.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 divide-y divide-line">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenProfile();
                }}
                className="w-full min-h-[48px] px-1 flex items-center gap-3 text-[15px] font-medium text-fg"
              >
                <CircleUser className="w-4 h-4 text-primary" />
                <span className="flex-1 text-left">Profil saya</span>
                <ChevronRight className="w-4 h-4 text-fg-3" />
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={toggleTheme}
                className="w-full min-h-[48px] px-1 flex items-center gap-3 text-[15px] font-medium text-fg"
              >
                <Moon className="w-4 h-4 text-primary" />
                <span className="flex-1 text-left">Mode gelap</span>
                <span
                  className={`w-11 h-[26px] rounded-full p-[3px] flex transition-colors ${
                    theme === 'dark' ? 'bg-primary justify-end' : 'bg-muted justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-surface shadow-xs" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="w-full min-h-[48px] px-1 flex items-center gap-3 text-[15px] font-semibold text-warm"
              >
                <LogOut className="w-4 h-4" />
                <span className="flex-1 text-left">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed z-50 inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] glass-card !rounded-full px-2 py-2 flex items-center justify-between"
        aria-label="Navigasi Utama (seluler)"
      >
        {primary.map((g) => {
          const Icon = NAV_ICONS[g.key] ?? LayoutGrid;
          const active = !open && activeGroup.key === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => go(g)}
              aria-current={active ? 'page' : undefined}
              aria-label={g.label}
              className={`h-12 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                active ? 'bg-primary text-on-primary px-4' : 'w-12 text-fg-2'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              {active && <span className="text-sm font-semibold">{SHORT_LABEL[g.key] ?? g.label}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu lainnya"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            open || moreActive ? 'bg-primary text-on-primary' : 'text-fg-2'
          }`}
        >
          {open ? <X className="w-5 h-5" strokeWidth={1.75} /> : <MoreHorizontal className="w-5 h-5" strokeWidth={1.75} />}
        </button>
      </nav>
    </>
  );
};
