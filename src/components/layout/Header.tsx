import React, { useState, useRef, useEffect } from 'react';
import { useApp, NavTab } from '../../context/AppContext';
import { UserChip, resolveAvatarBgProps } from '../common/UserChip';
import {
  Bell,
  LogOut,
  CircleUser,
  Download,
  RefreshCw,
  CheckCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface HeaderProps {
  onOpenExportImport: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExportImport,
  onOpenProfile,
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

  const navItems: { key: NavTab; label: string }[] = [
    { key: 'homepage', label: 'Homepage' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'team-raci', label: 'Team & RACI' },
    { key: 'weekly-mom', label: 'Weekly MoM' },
    { key: 'standards', label: 'Standards' },
    { key: 'workspaces', label: 'Workspaces' },
    { key: 'logbook', label: 'Logbook' },
    { key: 'stage-gate', label: 'Stage-Gate' },
  ];

  const avatarBgProps = resolveAvatarBgProps(currentUser.avatarBg);
  const avatarInitials = currentUser.avatarInitial || currentUser.code;

  return (
    <header className="sticky top-0 z-40 w-full px-4 md:px-8 py-3.5 backdrop-blur-md bg-white/70 border-b border-white/60 shadow-xs">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('homepage')}
            className="inline-flex items-center gap-2.5 px-4 min-h-[44px] bg-white rounded-full shadow-xs border border-white/90 hover:shadow-sm transition-all text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#007BFF] animate-pulse"></span>
            <div className="flex flex-col">
              <span className="font-heading text-xs font-extrabold tracking-tight text-[#0B1B33]">
                Area 1-DME
              </span>
              <span className="text-[10px] text-[#4A5A72] font-medium leading-none">
                Methanol Dehydration
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Pill Navigation */}
        <nav
          className="hidden xl:flex items-center bg-white/80 p-1.5 rounded-full border border-white/90 shadow-xs overflow-x-auto scrollbar-none"
          aria-label="Navigasi Utama"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`px-4 min-h-[44px] rounded-full text-xs font-semibold tracking-tight transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B1B33] text-white shadow-xs'
                    : 'text-[#4A5A72] hover:text-[#0B1B33] hover:bg-white/90'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Sync, Notifications, 44x44 Profile Button */}
        <div className="flex items-center gap-2.5 shrink-0">
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
            className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-full bg-white/90 text-[#047857] hover:text-[#0062CC] hover:bg-white border border-white shadow-xs transition-all text-xs font-bold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'animate-spin text-[#0062CC]' : 'text-[#047857]'
              }`}
            />
            <span className="hidden md:inline text-[11px]">
              {lastSyncedAt ? `Sync ${lastSyncedAt}` : 'Live Sync'}
            </span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/90 text-[#0B1B33] hover:bg-white border border-white shadow-xs transition-all"
              aria-label="Pemberitahuan Operasional"
              aria-expanded={showNotifications}
            >
              <Bell className="w-4 h-4 text-[#0B1B33]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B91C1C] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[28px] shadow-cockpit-pop border border-white/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAF6FD]">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[#0B1B33]">
                      Notifikasi Operasional
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF6FD] text-[#0062CC]">
                      {unreadNotificationsCount} Baru
                    </span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-[#0062CC] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#EAF6FD] max-h-80 overflow-y-auto my-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 rounded-2xl transition-colors cursor-pointer ${
                        notif.read ? 'bg-transparent opacity-75' : 'bg-[#EAF6FD]/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {notif.type === 'urgent' ? (
                          <span className="p-1.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] mt-0.5 shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        ) : notif.type === 'warning' ? (
                          <span className="p-1.5 rounded-full bg-[#FEF3C7] text-[#B45309] mt-0.5 shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-full bg-[#EAF6FD] text-[#0062CC] mt-0.5 shrink-0">
                            <Info className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-xs text-[#0B1B33]">
                            {notif.title}
                          </p>
                          <p className="text-[12px] text-[#4A5A72] mt-0.5 leading-snug">
                            {notif.description}
                          </p>
                          <span className="text-[10px] text-[#9FB3C8] block mt-1">
                            {notif.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Button (Strictly 44x44px circle, photoURL or initials on avatarBg) */}
          <div className="relative" ref={userRef}>
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => {
                setShowUserMenu((prev) => !prev);
                setShowNotifications(false);
              }}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-white shadow-xs hover:shadow-sm transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#0062CC]"
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
                  className={`w-full h-full rounded-full flex items-center justify-center font-heading font-extrabold text-xs text-white ${avatarBgProps.className}`}
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
                className="absolute right-0 mt-2 w-72 bg-white rounded-[28px] shadow-cockpit-pop border border-white p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Summary Card: Avatar, Name, Title, Email */}
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#EAF6FD] mb-2.5">
                  <UserChip
                    uid={currentUser.id}
                    variant="avatar-nama-jabatan"
                    size="lg"
                    avatarClassName="w-11 h-11 rounded-full font-heading text-xs font-extrabold"
                    nameClassName="font-heading text-sm text-[#0B1B33]"
                    titleClassName="text-xs text-[#0062CC] font-semibold"
                  />
                  <p className="mt-2 text-[11px] text-[#4A5A72] font-mono truncate">
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
                    className="w-full min-h-[44px] px-3.5 rounded-full text-xs font-bold text-[#0B1B33] hover:bg-[#EAF6FD] hover:text-[#0062CC] focus:bg-[#EAF6FD] focus:text-[#0062CC] focus:outline-none flex items-center gap-2.5 transition-colors text-left"
                  >
                    <CircleUser className="w-4 h-4 text-[#0062CC] shrink-0" />
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
                      className="w-full min-h-[44px] px-3.5 rounded-full text-xs font-bold text-[#0B1B33] hover:bg-[#EAF6FD] hover:text-[#0062CC] focus:bg-[#EAF6FD] focus:text-[#0062CC] focus:outline-none flex items-center gap-2.5 transition-colors text-left"
                    >
                      <Download className="w-4 h-4 text-[#0062CC] shrink-0" />
                      <span>Backup &amp; Restore</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#EAF6FD]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      void logout();
                    }}
                    className="w-full min-h-[44px] px-3.5 rounded-full text-xs font-bold text-[#B91C1C] hover:bg-[#FEE2E2]/60 focus:bg-[#FEE2E2]/60 focus:outline-none flex items-center gap-2.5 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Pill Navigation Strip */}
      <div className="xl:hidden mt-2.5 overflow-x-auto scrollbar-none pb-1 flex gap-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`px-3.5 min-h-[44px] rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0B1B33] text-white shadow-xs'
                  : 'bg-white/80 text-[#4A5A72] border border-white/80'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
