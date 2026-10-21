import React from 'react';
import { useApp } from '../../context/AppContext';

export type UserChipVariant = 'avatar' | 'avatar-nama' | 'avatar-nama-jabatan';

export interface AvatarColorToken {
  id: string;
  label: string;
  tokenVar: string;
  hex: string;
  bgClass: string;
}

export const AVATAR_COLOR_TOKENS: AvatarColorToken[] = [
  {
    id: 'primary',
    label: 'Primary Blue',
    tokenVar: 'var(--primary)',
    hex: '#0062CC',
    bgClass: 'bg-[var(--primary)]',
  },
  {
    id: 'acct-solid',
    label: 'Accountable Indigo',
    tokenVar: 'var(--acct-solid)',
    hex: '#1D4ED8',
    bgClass: 'bg-[var(--acct-solid)]',
  },
  {
    id: 'ok-solid',
    label: 'Process Emerald',
    tokenVar: 'var(--ok-solid)',
    hex: '#047857',
    bgClass: 'bg-[var(--ok-solid)]',
  },
  {
    id: 'warn-solid',
    label: 'Instrument Amber',
    tokenVar: 'var(--warn-solid)',
    hex: '#B45309',
    bgClass: 'bg-[var(--warn-solid)]',
  },
  {
    id: 'crit-solid',
    label: 'Safety Crimson',
    tokenVar: 'var(--crit-solid)',
    hex: '#B91C1C',
    bgClass: 'bg-[var(--crit-solid)]',
  },
  {
    id: 'surface-dark',
    label: 'Cockpit Navy',
    tokenVar: 'var(--surface-dark)',
    hex: '#0B1B33',
    bgClass: 'bg-[var(--surface-dark)]',
  },
];

export function resolveAvatarBgProps(avatarBg?: string): {
  className: string;
  style?: React.CSSProperties;
} {
  if (!avatarBg) {
    return { className: 'bg-[var(--primary)]' };
  }
  const trimmed = avatarBg.trim();
  if (trimmed.startsWith('bg-')) {
    return { className: trimmed };
  }
  return {
    className: '',
    style: { backgroundColor: trimmed },
  };
}

export interface UserChipProps {
  uid: string | undefined | null;
  variant?: UserChipVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  useNickname?: boolean;
  inlineTitle?: boolean;
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  titleClassName?: string;
}

const SIZE_MAP = {
  xs: {
    avatar: 'w-5 h-5 text-[9px] rounded',
    name: 'text-[11px]',
    title: 'text-[9px]',
    gap: 'gap-1.5',
  },
  sm: {
    avatar: 'w-6 h-6 text-[10px] rounded-md',
    name: 'text-xs',
    title: 'text-[10px]',
    gap: 'gap-2',
  },
  md: {
    avatar: 'w-8 h-8 text-xs rounded-lg',
    name: 'text-xs',
    title: 'text-[10px]',
    gap: 'gap-2.5',
  },
  lg: {
    avatar: 'w-11 h-11 text-sm rounded-xl',
    name: 'text-sm',
    title: 'text-xs',
    gap: 'gap-3',
  },
};

export const UserChip: React.FC<UserChipProps> = ({
  uid,
  variant = 'avatar-nama',
  size = 'sm',
  useNickname = false,
  inlineTitle = false,
  className = '',
  avatarClassName = '',
  nameClassName = '',
  titleClassName = '',
}) => {
  const { getUser, isUsersLoaded } = useApp();
  const dimensions = SIZE_MAP[size];

  // 1. Skeleton state while users collection is loading
  if (!isUsersLoaded) {
    return (
      <span
        className={`inline-flex items-center ${dimensions.gap} animate-pulse ${className}`}
        aria-busy="true"
      >
        <span
          className={`${dimensions.avatar} bg-slate-200 shrink-0 ${avatarClassName}`}
        />
        {variant !== 'avatar' && (
          <span className="inline-flex flex-col gap-1">
            <span className="h-3 w-20 bg-slate-200 rounded" />
            {variant === 'avatar-nama-jabatan' && (
              <span className="h-2.5 w-24 bg-slate-200 rounded" />
            )}
          </span>
        )}
      </span>
    );
  }

  // 2. Special team-wide code 'ALL' (used in Gantt chart Sidang Stage-Gate)
  if (uid && uid.trim().toUpperCase() === 'ALL') {
    const allAvatar = (
      <span
        title="Seluruh Tim — Konsorsium Area 1"
        className={`inline-flex items-center justify-center font-bold font-mono shrink-0 bg-amber-100 text-amber-800 border border-amber-300 ${dimensions.avatar} ${avatarClassName}`}
      >
        ALL
      </span>
    );

    if (variant === 'avatar') {
      return allAvatar;
    }

    return (
      <span className={`inline-flex items-center ${dimensions.gap} ${className}`}>
        {allAvatar}
        {variant === 'avatar-nama' ? (
          <span className={`font-semibold text-slate-800 ${dimensions.name} ${nameClassName}`}>
            Seluruh Tim
          </span>
        ) : inlineTitle ? (
          <span className={`font-semibold text-slate-800 ${dimensions.name} ${nameClassName}`}>
            Seluruh Tim{' '}
            <span className={`font-normal text-[#4A5A72] ${dimensions.title} ${titleClassName}`}>
              (Konsorsium Area 1)
            </span>
          </span>
        ) : (
          <span className="inline-flex flex-col leading-tight">
            <span className={`font-bold text-slate-900 ${dimensions.name} ${nameClassName}`}>
              Seluruh Tim
            </span>
            <span className={`text-[#4A5A72] ${dimensions.title} ${titleClassName}`}>
              Konsorsium Area 1
            </span>
          </span>
        )}
      </span>
    );
  }

  // 3. Resolve user from single source of truth `users` (with legacy fallback)
  const user = getUser(uid);

  // 4. Fallback if UID is empty / unassigned
  if (!uid || !uid.trim() || uid.trim() === '-') {
    if (variant === 'avatar') {
      return (
        <span
          title="Belum ditugaskan"
          className={`inline-flex items-center justify-center font-bold font-mono shrink-0 bg-slate-100 text-[#94A3B8] border border-slate-200 ${dimensions.avatar} ${avatarClassName}`}
        >
          -
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center ${dimensions.gap} text-[#4A5A72] ${className}`}
      >
        <span
          className={`inline-flex items-center justify-center font-bold font-mono shrink-0 bg-slate-100 text-[#94A3B8] border border-slate-200 ${dimensions.avatar} ${avatarClassName}`}
        >
          -
        </span>
        <span className={`italic ${dimensions.name} ${nameClassName}`}>
          Belum ditugaskan
        </span>
      </span>
    );
  }

  // 5. Neutral fallback if UID does not match any user
  if (!user) {
    if (variant === 'avatar') {
      return (
        <span
          title={`Anggota tidak ditemukan (${uid})`}
          className={`inline-flex items-center justify-center font-bold font-mono shrink-0 bg-slate-200 text-[#4A5A72] ${dimensions.avatar} ${avatarClassName}`}
        >
          ?
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center ${dimensions.gap} text-[#4A5A72] ${className}`}
      >
        <span
          className={`inline-flex items-center justify-center font-bold font-mono shrink-0 bg-slate-200 text-[#4A5A72] ${dimensions.avatar} ${avatarClassName}`}
        >
          ?
        </span>
        <span className={`italic ${dimensions.name} ${nameClassName}`}>
          Anggota tidak ditemukan
        </span>
      </span>
    );
  }

  const displayName = useNickname ? user.nickname || user.name : user.name;
  const initials = user.avatarInitial || user.code;
  const bgProps = resolveAvatarBgProps(user.avatarBg);

  const avatarNode = user.photoURL ? (
    <img
      src={user.photoURL}
      alt={displayName}
      title={`${user.name} (${user.title})`}
      className={`object-cover shrink-0 ${dimensions.avatar} ${avatarClassName}`}
    />
  ) : (
    <span
      title={`${user.name} (${user.title})`}
      style={bgProps.style}
      className={`inline-flex items-center justify-center font-bold font-mono text-white shadow-xs shrink-0 ${bgProps.className} ${dimensions.avatar} ${avatarClassName}`}
    >
      {initials}
    </span>
  );

  if (variant === 'avatar') {
    return avatarNode;
  }

  if (variant === 'avatar-nama') {
    return (
      <span className={`inline-flex items-center ${dimensions.gap} ${className}`}>
        {avatarNode}
        <span
          className={`font-semibold text-slate-800 truncate ${dimensions.name} ${nameClassName}`}
        >
          {displayName}
        </span>
      </span>
    );
  }

  // variant === 'avatar-nama-jabatan'
  return (
    <span className={`inline-flex items-center ${dimensions.gap} ${className}`}>
      {avatarNode}
      {inlineTitle ? (
        <span
          className={`font-semibold text-slate-800 truncate ${dimensions.name} ${nameClassName}`}
        >
          {displayName}{' '}
          <span
            className={`font-normal text-[#4A5A72] ${dimensions.title} ${titleClassName}`}
          >
            ({user.title})
          </span>
        </span>
      ) : (
        <span className="inline-flex flex-col leading-tight min-w-0">
          <span
            className={`font-bold text-slate-900 truncate ${dimensions.name} ${nameClassName}`}
          >
            {displayName}
          </span>
          <span
            className={`text-[#4A5A72] truncate ${dimensions.title} ${titleClassName}`}
          >
            {user.title}
          </span>
        </span>
      )}
    </span>
  );
};
