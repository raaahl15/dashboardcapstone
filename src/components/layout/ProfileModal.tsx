import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPatch, UserRole } from '../../types';
import { AVATAR_COLOR_TOKENS, resolveAvatarBgProps } from '../common/UserChip';
import {
  X,
  CircleUser,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Camera,
  Loader2,
  Check,
  Lock,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialUserId,
}) => {
  const { currentUser, users, updateUser, isPM } = useApp();

  const [selectedUid, setSelectedUid] = useState<string>(
    initialUserId || currentUser.id
  );

  // Personal fields
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarBg, setAvatarBg] = useState('');

  // Position fields (editable only by PM)
  const [role, setRole] = useState<UserRole>('member');
  const [title, setTitle] = useState('');
  const [raciTag, setRaciTag] = useState('');
  const [code, setCode] = useState('');
  const [jobdesk, setJobdesk] = useState<string[]>([]);

  // Role change confirmation state
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [roleChangeConfirmed, setRoleChangeConfirmed] = useState(false);

  // Submission status
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const targetUser = useMemo(() => {
    if (!isPM) return currentUser;
    return users.find((u) => u.id === selectedUid) || currentUser;
  }, [isPM, users, selectedUid, currentUser]);

  // Reset selectedUid when modal opens
  useEffect(() => {
    if (isOpen) {
      const targetId = isPM && initialUserId ? initialUserId : currentUser.id;
      setSelectedUid(targetId);
      setStatusMessage(null);
      setPendingRole(null);
      setRoleChangeConfirmed(false);
    }
  }, [isOpen, initialUserId, currentUser.id, isPM]);

  // Populate form fields whenever targetUser changes or modal opens
  useEffect(() => {
    if (!isOpen || !targetUser) return;
    setName(targetUser.name);
    setNickname(targetUser.nickname || targetUser.name.split(' ')[0]);
    setPhone(targetUser.phone || '');
    setAvatarBg(targetUser.avatarBg || AVATAR_COLOR_TOKENS[0].bgClass);
    setRole(targetUser.role);
    setTitle(targetUser.title);
    setRaciTag(targetUser.raciTag);
    setCode(targetUser.code);
    setJobdesk([...(targetUser.jobdesk || [])]);
    setPendingRole(null);
    setRoleChangeConfirmed(false);
  }, [isOpen, targetUser]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  const trimmedName = name.trim();
  const trimmedNickname = nickname.trim();
  const trimmedPhone = phone.trim();
  const trimmedTitle = title.trim();
  const trimmedRaciTag = raciTag.trim();
  const trimmedCode = code.trim().toUpperCase();
  const cleanedJobdesk = useMemo(
    () => jobdesk.map((item) => item.trim()).filter((item) => item.length > 0),
    [jobdesk]
  );

  // Validation: name & nickname 1-60 chars
  const nameValid = trimmedName.length >= 1 && trimmedName.length <= 60;
  const nicknameValid =
    trimmedNickname.length >= 1 && trimmedNickname.length <= 60;
  const positionValid = !isPM || (trimmedTitle.length >= 1 && trimmedRaciTag.length >= 1 && trimmedCode.length >= 1);
  const isRoleChanged = isPM && role !== targetUser.role;
  const isValidForm =
    nameValid &&
    nicknameValid &&
    positionValid &&
    (!isRoleChanged || roleChangeConfirmed);

  // Check if any field actually changed
  const computedPatch = useMemo((): UserPatch => {
    const patch: UserPatch = {};

    if (trimmedName !== targetUser.name) {
      patch.name = trimmedName;
    }
    if (trimmedNickname !== targetUser.nickname) {
      patch.nickname = trimmedNickname;
    }
    if (trimmedPhone !== (targetUser.phone || '')) {
      patch.phone = trimmedPhone;
    }
    if (avatarBg !== targetUser.avatarBg) {
      patch.avatarBg = avatarBg;
    }

    if (isPM) {
      if (role !== targetUser.role) {
        patch.role = role;
      }
      if (trimmedTitle !== targetUser.title) {
        patch.title = trimmedTitle;
      }
      if (trimmedRaciTag !== targetUser.raciTag) {
        patch.raciTag = trimmedRaciTag;
      }
      if (trimmedCode !== targetUser.code) {
        patch.code = trimmedCode;
        patch.avatarInitial = trimmedCode;
      }
      if (JSON.stringify(cleanedJobdesk) !== JSON.stringify(targetUser.jobdesk)) {
        patch.jobdesk = cleanedJobdesk;
      }
    }

    return patch;
  }, [
    trimmedName,
    trimmedNickname,
    trimmedPhone,
    avatarBg,
    isPM,
    role,
    trimmedTitle,
    trimmedRaciTag,
    trimmedCode,
    cleanedJobdesk,
    targetUser,
  ]);

  const hasChanges = Object.keys(computedPatch).length > 0;

  if (!isOpen) return null;

  const previewBgProps = resolveAvatarBgProps(avatarBg);
  const previewInitials =
    (isPM ? trimmedCode : targetUser.avatarInitial) ||
    targetUser.avatarInitial ||
    targetUser.code;

  const handleRoleSelect = (nextRole: UserRole) => {
    setStatusMessage(null);
    if (nextRole === targetUser.role) {
      setRole(nextRole);
      setPendingRole(null);
      setRoleChangeConfirmed(false);
    } else {
      setPendingRole(nextRole);
      setRoleChangeConfirmed(false);
    }
  };

  const confirmRoleChange = () => {
    if (!pendingRole) return;
    setRole(pendingRole);
    setPendingRole(null);
    setRoleChangeConfirmed(true);
  };

  const cancelRoleChange = () => {
    setPendingRole(null);
    setRole(targetUser.role);
    setRoleChangeConfirmed(false);
  };

  const handleJobdeskChange = (index: number, value: string) => {
    setStatusMessage(null);
    setJobdesk((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleAddJobdeskRow = () => {
    setStatusMessage(null);
    setJobdesk((prev) => [...prev, '']);
  };

  const handleRemoveJobdeskRow = (index: number) => {
    setStatusMessage(null);
    setJobdesk((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !isValidForm || isSaving) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateUser(targetUser.id, computedPatch);
      setStatusMessage({
        type: 'success',
        text: 'Perubahan profil berhasil disimpan dan disinkronkan.',
      });
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : '';
      const rawCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';

      if (
        rawCode.includes('permission-denied') ||
        rawMessage.toLowerCase().includes('permission-denied') ||
        rawMessage.toLowerCase().includes('insufficient permissions') ||
        rawMessage.includes('Perubahan ditolak oleh pengaturan akses')
      ) {
        setStatusMessage({
          type: 'error',
          text: 'Perubahan ditolak oleh pengaturan akses',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Gagal menyimpan perubahan profil. Periksa kembali isian Anda dan coba lagi.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-[28px] shadow-cockpit-pop border border-white overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#EAF6FD]/60 border-b border-[#C9DCEB]/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0062CC] text-white flex items-center justify-center shadow-xs shrink-0">
              <CircleUser className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="profile-modal-title"
                className="font-heading font-bold text-base text-[#0B1B33]"
              >
                Pengaturan Profil & Jabatan
              </h2>
              <p className="text-xs text-[#4A5A72]">
                Satu sumber kebenaran profil anggota Area 1-DME (`users/&#123;uid&#125;`)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-11 h-11 rounded-full bg-white hover:bg-[#DCEBF7] text-[#4A5A72] hover:text-[#0B1B33] flex items-center justify-center transition-colors border border-[#C9DCEB]/60 shrink-0"
            aria-label="Tutup modal profil"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="p-6 overflow-y-auto space-y-6 flex-1"
        >
          {/* PM Member Selector at the Top */}
          {isPM && (
            <div className="p-4 rounded-2xl bg-[#EAF6FD]/70 border border-[#C9DCEB] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="pm-member-selector"
                  className="font-heading font-bold text-xs text-[#0B1B33] flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0062CC]" />
                  Mode Admin PM: Pilih Anggota Tim (5 Engineer)
                </label>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DBEAFE] text-[#1E3A8A]">
                  Otoritas Penuh PM
                </span>
              </div>
              <select
                id="pm-member-selector"
                value={selectedUid}
                onChange={(e) => {
                  setSelectedUid(e.target.value);
                  setStatusMessage(null);
                }}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-[#6B7F99] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.nickname}) — {u.title} [{u.role === 'admin' ? 'Admin PM' : 'Member'}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Avatar & Identity Preview Card */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAF6FD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {targetUser.photoURL ? (
                <img
                  src={targetUser.photoURL}
                  alt={trimmedName || targetUser.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div
                  style={previewBgProps.style}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-heading font-extrabold text-base text-white border-2 border-white shadow-sm shrink-0 ${previewBgProps.className}`}
                >
                  {previewInitials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-sm text-[#0B1B33] truncate">
                    {trimmedName || 'Nama belum diisi'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6FD] text-[#0062CC]">
                    {trimmedNickname || 'Panggilan'}
                  </span>
                </div>
                <p className="text-xs text-[#4A5A72] font-semibold mt-0.5 truncate">
                  {trimmedTitle || targetUser.title} • {trimmedRaciTag || targetUser.raciTag}
                </p>
                <p className="text-[11px] text-[#4A5A72] truncate mt-0.5">
                  {targetUser.email}
                </p>
              </div>
            </div>

            {/* Foto Profil Placeholder ("Segera hadir") */}
            <div className="flex flex-col items-start sm:items-end shrink-0">
              <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider mb-1">
                Foto Profil
              </span>
              <span
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full bg-[#E2E8F0] text-[#334155] text-xs font-bold cursor-not-allowed select-none"
                aria-disabled="true"
              >
                <Camera className="w-3.5 h-3.5 text-[#64748B]" />
                Segera hadir
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BAGIAN 1: DATA PRIBADI */}
          {/* ================================================================= */}
          <section className="space-y-4" aria-labelledby="section-personal-heading">
            <div className="flex items-center justify-between border-b border-[#EAF6FD] pb-2">
              <h3
                id="section-personal-heading"
                className="font-heading font-bold text-sm text-[#0B1B33] flex items-center gap-2"
              >
                <CircleUser className="w-4 h-4 text-[#0062CC]" />
                Data Pribadi
              </h3>
              <span className="text-[11px] text-[#4A5A72] font-medium">
                Dapat diubah oleh pemilik akun
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="profile-full-name"
                    className="block text-xs font-semibold text-[#0B1B33]"
                  >
                    Nama Lengkap
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      nameValid ? 'text-[#4A5A72]' : 'text-[#B91C1C] font-bold'
                    }`}
                  >
                    {trimmedName.length}/60
                  </span>
                </div>
                <input
                  id="profile-full-name"
                  type="text"
                  maxLength={60}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setStatusMessage(null);
                  }}
                  placeholder="Masukkan nama lengkap (1-60 karakter)"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
                  required
                />
                {!nameValid && (
                  <p className="mt-1 text-[11px] text-[#B91C1C] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Nama lengkap wajib berisi 1 hingga 60 karakter.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="profile-nickname"
                    className="block text-xs font-semibold text-[#0B1B33]"
                  >
                    Nama Panggilan
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      nicknameValid ? 'text-[#4A5A72]' : 'text-[#B91C1C] font-bold'
                    }`}
                  >
                    {trimmedNickname.length}/60
                  </span>
                </div>
                <input
                  id="profile-nickname"
                  type="text"
                  maxLength={60}
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setStatusMessage(null);
                  }}
                  placeholder="Contoh: Ihsan"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
                  required
                />
                {!nicknameValid && (
                  <p className="mt-1 text-[11px] text-[#B91C1C] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Nama panggilan wajib berisi 1 hingga 60 karakter.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="block text-xs font-semibold text-[#0B1B33] mb-1"
              >
                Kontak / No. Telepon <span className="text-[#4A5A72] font-normal">(Opsional)</span>
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setStatusMessage(null);
                }}
                placeholder="Contoh: +62 812-3456-7890"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
              />
            </div>

            {/* 6 Color Tokens Selector from index.css */}
            <div>
              <span className="block text-xs font-semibold text-[#0B1B33] mb-2">
                Warna Avatar (6 Token Warna Sistem)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AVATAR_COLOR_TOKENS.map((token) => {
                  const isSelected =
                    avatarBg === token.bgClass ||
                    avatarBg === token.tokenVar ||
                    avatarBg.toLowerCase() === token.hex.toLowerCase();
                  return (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => {
                        setAvatarBg(token.bgClass);
                        setStatusMessage(null);
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-full border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'border-[#0B1B33] bg-[#EAF6FD] text-[#0B1B33] ring-2 ring-[#0062CC]/30'
                          : 'border-[#C9DCEB] bg-white text-[#4A5A72] hover:bg-[#F8FAFC]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ${token.bgClass}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="truncate">{token.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* BAGIAN 2: DATA JABATAN */}
          {/* ================================================================= */}
          <section className="space-y-4" aria-labelledby="section-position-heading">
            <div className="flex items-center justify-between border-b border-[#EAF6FD] pb-2">
              <h3
                id="section-position-heading"
                className="font-heading font-bold text-sm text-[#0B1B33] flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-[#0062CC]" />
                Data Jabatan
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#4A5A72] font-medium">
                {isPM ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
                    Dapat diubah oleh PM
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#64748B]" />
                    Hanya baca untuk anggota
                  </>
                )}
              </span>
            </div>

            {/* READ-ONLY VIEW FOR MEMBERS (Tanpa kolom input) */}
            {!isPM ? (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAF6FD] space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-[#EAF6FD]">
                    <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
                      Email Akun (Firebase Auth)
                    </span>
                    <span className="font-mono font-semibold text-[#0B1B33] block mt-1 break-all">
                      {targetUser.email}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#EAF6FD]">
                    <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
                      Peran Akses
                    </span>
                    <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF6FD] text-[#0062CC]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {targetUser.role === 'admin' ? 'Admin (Project Manager)' : 'Member Engineer'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#EAF6FD]">
                    <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
                      Jabatan
                    </span>
                    <span className="font-heading font-bold text-[#0B1B33] block mt-1">
                      {targetUser.title}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#EAF6FD]">
                    <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
                      Kode RACI & Inisial
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#DBEAFE] text-[#1E3A8A]">
                        {targetUser.raciTag}
                      </span>
                      <span className="font-mono font-bold text-[#4A5A72]">
                        Kode: {targetUser.code}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#EAF6FD]">
                  <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block mb-2">
                    Rincian Jobdesk Disiplin
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#0B1B33]">
                    {targetUser.jobdesk.map((jd, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0062CC] shrink-0 mt-0.5" />
                        <span>{jd}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* EDITABLE VIEW FOR PM */
              <div className="space-y-4">
                {/* Email always read-only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EAF6FD] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
                      Email (Hanya Baca • Auth)
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#0B1B33] mt-1 break-all">
                      {targetUser.email}
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-role-select"
                      className="block text-xs font-semibold text-[#0B1B33] mb-1"
                    >
                      Peran Akses Sistem
                    </label>
                    <select
                      id="profile-role-select"
                      value={pendingRole ?? role}
                      onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
                    >
                      <option value="member">Member Engineer (member)</option>
                      <option value="admin">Project Manager / Admin (admin)</option>
                    </select>
                  </div>
                </div>

                {/* Role Change Confirmation Warning Box */}
                {pendingRole !== null && pendingRole !== targetUser.role && (
                  <div
                    className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#B45309]/40 space-y-3"
                    role="alert"
                  >
                    <div className="flex items-start gap-2.5 text-xs text-[#92400E]">
                      <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-heading font-bold">
                          Konfirmasi Perubahan Peran ({targetUser.role} → {pendingRole})
                        </p>
                        <p className="mt-0.5 leading-relaxed">
                          Mengubah peran <strong>{targetUser.name}</strong> menjadi{' '}
                          <strong>{pendingRole === 'admin' ? 'Admin (PM)' : 'Member'}</strong>{' '}
                          akan mengubah hak otorisasi pengeditan jadwal, RACI, dan manajemen tim.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelRoleChange}
                        className="min-h-[44px] px-4 rounded-full bg-white text-[#4A5A72] hover:text-[#0B1B33] text-xs font-bold border border-[#C9DCEB]"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={confirmRoleChange}
                        className="min-h-[44px] px-4 rounded-full bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ya, Konfirmasi Ubah Peran
                      </button>
                    </div>
                  </div>
                )}

                {isRoleChanged && roleChangeConfirmed && (
                  <div className="p-3 rounded-xl bg-[#DBEAFE] text-[#1E3A8A] text-xs font-semibold flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Perubahan peran ke <strong>{role}</strong> telah dikonfirmasi (klik Simpan Perubahan untuk menerapkan).
                    </span>
                    <button
                      type="button"
                      onClick={cancelRoleChange}
                      className="text-[11px] underline font-bold"
                    >
                      Urungkan
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="profile-title"
                      className="block text-xs font-semibold text-[#0B1B33] mb-1"
                    >
                      Jabatan
                    </label>
                    <input
                      id="profile-title"
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setStatusMessage(null);
                      }}
                      placeholder="Contoh: Lead Process Engineer"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-raci-tag"
                      className="block text-xs font-semibold text-[#0B1B33] mb-1"
                    >
                      Kode RACI
                    </label>
                    <input
                      id="profile-raci-tag"
                      type="text"
                      value={raciTag}
                      onChange={(e) => {
                        setRaciTag(e.target.value);
                        setStatusMessage(null);
                      }}
                      placeholder="Contoh: RACI: R"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-code"
                      className="block text-xs font-semibold text-[#0B1B33] mb-1"
                    >
                      Inisial Kode Engineer
                    </label>
                    <input
                      id="profile-code"
                      type="text"
                      maxLength={4}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setStatusMessage(null);
                      }}
                      placeholder="IH"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs font-mono font-bold text-[#0B1B33] uppercase outline-none focus:border-[#0062CC]"
                      required
                    />
                  </div>
                </div>

                {/* Editable Jobdesk List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#0B1B33]">
                      Daftar Jobdesk ({jobdesk.length} baris)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddJobdeskRow}
                      className="min-h-[44px] px-3.5 rounded-full bg-[#EAF6FD] hover:bg-[#DCEBF7] text-[#0062CC] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Baris Jobdesk
                    </button>
                  </div>

                  <div className="space-y-2">
                    {jobdesk.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 text-center font-mono text-[11px] font-bold text-[#4A5A72] shrink-0">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleJobdeskChange(idx, e.target.value)}
                          placeholder="Tulis rincian tugas / tanggung jawab disiplin..."
                          aria-label={`Baris jobdesk ${idx + 1}`}
                          className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveJobdeskRow(idx)}
                          className="w-11 h-11 rounded-full bg-[#FEE2E2]/70 hover:bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center transition-colors shrink-0"
                          aria-label={`Hapus baris jobdesk ${idx + 1}`}
                          title="Hapus baris jobdesk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {jobdesk.length === 0 && (
                      <p className="text-xs text-[#4A5A72] italic py-2">
                        Belum ada rincian jobdesk. Klik &ldquo;Tambah Baris Jobdesk&rdquo; untuk menambahkan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Status Feedback Banner (Always Icon + Text) */}
          {statusMessage && (
            <div
              role="status"
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-[#D1FAE5] border-[#047857]/30 text-[#065F46]'
                  : 'bg-[#FEE2E2] border-[#B91C1C]/30 text-[#991B1B]'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Modal Footer Actions (Pill buttons, min 44px touch targets) */}
          <div className="pt-3 border-t border-[#EAF6FD] flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-[44px] px-5 rounded-full bg-[#EAF6FD] hover:bg-[#DCEBF7] text-[#0B1B33] text-xs font-bold transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={!hasChanges || !isValidForm || isSaving || pendingRole !== null}
              className={`min-h-[44px] px-6 rounded-full font-heading text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs ${
                !hasChanges || !isValidForm || isSaving || pendingRole !== null
                  ? 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                  : 'bg-[#0062CC] hover:bg-[#0057B8] text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

