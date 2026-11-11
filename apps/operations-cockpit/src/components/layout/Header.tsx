import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip, resolveAvatarBgProps } from '../common/UserChip';
import { groupOfTab, PAGE_META, triggerPageAction } from './navigation';
import {
  Bell,
  LogOut,
  CircleUser,
  Download,
  RefreshCw,
  CheckCheck,
  AlertTriangle,
  Info,
  Search,
  Plus,
  Printer,
} from 'lucide-react';

interface HeaderProps {
  onOpenExportImport: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExportImport,
  onOpenProfile,
  onOpenSearch,
}) => {
  const {
    currentUser,
    isPM,
    activeTab,
    setActiveTab,
    logout,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openWorkOrderDetail,
    refreshData,
    lastSyncedAt,
    isSyncing,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside and Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUserMenu) {
          setShowUserMenu(false);
          profileButtonRef.current?.focus();
        }
        if (showNotifications) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu, showNotifications]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!menuContainerRef.current) return;
    const focusableItems = Array.from(
      menuContainerRef.current.querySelectorAll<HTMLButtonElement>(
        'button[role="menuitem"]'
      )
    );
    if (focusableItems.length === 0) return;

    const currentIndex = focusableItems.indexOf(
      document.activeElement as HTMLButtonElement
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex =
        currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
      focusableItems[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
      focusableItems[prevIndex]?.focus();
    }
  };

  // 8 menu bergrup (Blueprint v2.4 BAB IV, LOG-032); sub-tab dirender di App.tsx
  const activeGroup = groupOfTab(activeTab);
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const pageMeta = PAGE_META[activeTab];

  const avatarBgProps = resolveAvatarBgProps(currentUser.avatarBg);
  const avatarInitials = currentUser.avatarInitial || currentUser.code;

  return (
    <header className="relative z-30 w-full px-4 lg:px-8 pt-5 pb-4">
      <div className="max-w-[1440px] mx-auto flex items-center lg:items-start justify-between gap-3">
        {/* Kiri: eyebrow tanggal + judul menu aktif */}
        <div className="min-w-0 flex-1 flex items-center gap-3 max-lg:order-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-[13px] text-fg-3 truncate">
              {pageMeta.title ? pageMeta.eyebrow : `${todayLabel} · ${pageMeta.eyebrow}`}
            </p>
            {pageMeta.title && (
              <h1 className="font-heading text-[23px] sm:text-4xl leading-tight font-normal tracking-[-0.02em] text-fg truncate">
                {pageMeta.title}
                {pageMeta.accent && (
                  <span className="hidden sm:inline font-accent text-primary text-[0.72em] ml-3 whitespace-nowrap">
                    — {pageMeta.accent}
                  </span>
                )}
              </h1>
            )}
          </div>
        </div>

        {/* Right Actions: Sync, Notifications, 44x44 Profile Button */}
        <div className="flex items-center gap-2 shrink-0 max-lg:contents">
          {/* Pencarian cepat (Ctrl K) */}
          <button data-order="search"
            type="button"
            onClick={onOpenSearch}
            className="max-lg:order-3 inline-flex items-center justify-center gap-2 max-md:w-11 md:px-3.5 lg:w-72 min-h-[44px] rounded-full bg-surface/90 text-fg-3 hover:text-fg border border-glass-stroke shadow-xs transition-all text-sm"
            aria-label="Buka pencarian cepat"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline flex-1 text-left">Cari WO, dokumen, tag…</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold">Ctrl K</kbd>
          </button>

          {/* Real-Time Sync Button */}
          <button
            type="button"
            onClick={() => {
              void refreshData();
            }}
            title={
              lastSyncedAt
                ? `Sinkronisasi Real-Time Aktif (Terakhir: ${lastSyncedAt}) — Klik untuk segarkan`
                : 'Sinkronkan data antar-perangkat'
            }
            className="max-lg:order-3 hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full bg-surface/90 text-success hover:text-primary hover:bg-surface border border-glass-stroke shadow-xs transition-all"
            aria-label={lastSyncedAt ? `Sinkron terakhir ${lastSyncedAt}; klik untuk segarkan` : 'Sinkronkan data'}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'animate-spin text-primary' : 'text-success'
              }`}
            />
          </button>

          {/* Notifications Bell */}
          <div className="relative max-lg:order-4" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-full bg-surface/90 text-fg hover:bg-surface border border-glass-stroke shadow-xs transition-all"
              aria-label="Pemberitahuan Operasional"
              aria-expanded={showNotifications}
            >
              <Bell className="w-4 h-4 text-fg" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-solid text-on-ink text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-surface rounded-[28px] shadow-cockpit-pop border border-glass-stroke p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-fg">
                      Notifikasi Operasional
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-primary">
                      {unreadNotificationsCount} Baru
                    </span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="divide-y divide-line max-h-80 overflow-y-auto my-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 px-3 text-center text-xs text-fg-3">
                      Belum ada notifikasi operasional untuk akun Anda.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.workOrderId) {
                            openWorkOrderDetail(notif.workOrderId);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-colors cursor-pointer hover:bg-muted/70 ${
                          notif.read ? 'bg-transparent opacity-75' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {notif.type === 'urgent' ? (
                            <span className="p-1.5 rounded-full bg-danger-soft text-danger mt-0.5 shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          ) : notif.type === 'warning' ? (
                            <span className="p-1.5 rounded-full bg-warm-soft text-warm mt-0.5 shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1.5 rounded-full bg-muted text-primary mt-0.5 shrink-0">
                              <Info className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-xs text-fg">
                              {notif.title}
                            </p>
                            <p className="text-[12px] text-fg-3 mt-0.5 leading-snug">
                              {notif.description}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[10px] text-fg-3">
                                {notif.timeAgo}
                              </span>
                              {notif.workOrderId && (
                                <span className="text-[10px] font-bold text-primary">
                                  Buka WO →
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {pageMeta.action && (!pageMeta.action.pmOnly || isPM) && (
            <button
              type="button"
              onClick={() => triggerPageAction(activeTab)}
              aria-label={pageMeta.action.label}
              className="max-lg:fixed max-lg:z-40 max-lg:right-4 max-lg:bottom-[calc(6rem+env(safe-area-inset-bottom))] max-lg:shadow-cockpit-pop inline-flex items-center justify-center gap-1.5 px-5 min-h-[48px] lg:min-h-[44px] rounded-full bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold shadow-cockpit-card transition-colors"
            >
              {activeTab === 'stage-gate' ? <Printer className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{pageMeta.action.label}</span>
            </button>
          )}

          {/* User Profile Button (Strictly 44x44px circle, photoURL or initials on avatarBg) */}
          <div className="relative lg:hidden max-lg:order-1 shrink-0" ref={userRef}>
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => {
                setShowUserMenu((prev) => !prev);
                setShowNotifications(false);
              }}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-glass-stroke shadow-xs hover:shadow-sm transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-focus"
              aria-label="Menu profil pengguna"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span
                  style={avatarBgProps.style}
                  className={`w-full h-full rounded-full flex items-center justify-center font-heading font-extrabold text-xs text-on-ink ${avatarBgProps.className}`}
                >
                  {avatarInitials}
                </span>
              )}
            </button>

            {/* Profile Dropdown (Width 288px = w-72, Solid White, Radius 28px, shadow-cockpit-pop) */}
            {showUserMenu && (
              <div
                ref={menuContainerRef}
                role="menu"
                aria-label="Menu Profil"
                onKeyDown={handleMenuKeyDown}
                className="absolute left-0 mt-2 w-72 bg-surface rounded-[28px] shadow-cockpit-pop border border-glass-stroke p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Summary Card: Avatar, Name, Title, Email */}
                <div className="p-3 rounded-2xl bg-muted border border-line mb-2.5">
                  <UserChip
                    uid={currentUser.id}
                    variant="avatar-nama-jabatan"
                    size="lg"
                    avatarClassName="w-11 h-11 rounded-full font-heading text-xs font-extrabold"
                    nameClassName="font-heading text-sm text-fg"
                    titleClassName="text-xs text-primary font-semibold"
                  />
                  <p className="mt-2 text-[11px] text-fg-3 font-mono truncate">
                    {currentUser.email}
                  </p>
                </div>

                {/* Menu Items (min 44px touch target, keyboard accessible) */}
                <div className="space-y-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full min-h-[44px] px-3.5 rounded-full text-xs font-bold text-fg hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary focus:outline-none flex items-center gap-2.5 transition-colors text-left"
                  >
                    <CircleUser className="w-4 h-4 text-primary shrink-0" />
                    <span>Profil Saya</span>
                  </button>

                  {isPM && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenExportImport();
                      }}
                      className="w-full min-h-[44px] px-3.5 rounded-full text-xs font-bold text-fg hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary focus:outline-none flex items-center gap-2.5 transition-colors text-left"
                    >
                      <Download className="w-4 h-4 text-primary shrink-0" />
                      <span>Backup &amp; Restore</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      void logout();
                    }}
                    className="w-full min-h-[44px] px-3.5 rounded-full text-xs font-bold text-danger hover:bg-danger-soft/60 focus:bg-danger-soft/60 focus:outline-none flex items-center gap-2.5 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-danger shrink-0" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
