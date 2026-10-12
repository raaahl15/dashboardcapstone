import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { ProfileModal } from '../layout/ProfileModal';
import { getRaciRoleForUser } from '../../utils/migrateUserRefs';
import {
  Users,
  FileText,
  ShieldCheck,
  RotateCcw,
  Plus,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { User, RaciRoleValue } from '../../types';

export const TeamRaciView: React.FC = () => {
  const {
    users,
    currentUser,
    getUser,
    raciRows,
    updateRaciCell,
    addRaciRow,
    isPM,
  } = useApp();

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [newDeliverableSub, setNewDeliverableSub] = useState('');

  // Unified ProfileModal state for editing a user card directly
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const toggleFlip = (userId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const openEditProfile = (u: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUserId(u.id);
  };

  const cycleRaciValue = (
    rowId: string,
    userUid: string,
    currentVal: RaciRoleValue
  ) => {
    if (!isPM && !isEditMode) return;
    const seq: RaciRoleValue[] = ['R', 'A', 'C', 'I', ''];
    const nextIdx = (seq.indexOf(currentVal) + 1) % seq.length;
    updateRaciCell(rowId, userUid, seq[nextIdx]);
  };

  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeliverableTitle.trim()) return;

    addRaciRow({
      deliverable: newDeliverableTitle.trim(),
      subtitle: newDeliverableSub.trim() || 'Paket dokumen rekayasa pendukung',
      assignments: {
        'user-rahul': 'A',
        'user-ihsan': 'R',
        'user-althaf': 'C',
        'user-jonathan': 'I',
        'user-heidi': 'I',
      },
      rahul: 'A',
      ihsan: 'R',
      althaf: 'C',
      jonathan: 'I',
      heidi: 'I',
      validationStatus: 'Valid (1A, 1R)',
    });
    setNewDeliverableTitle('');
    setNewDeliverableSub('');
    setShowAddRowModal(false);
  };

  const renderRaciBadge = (
    rowId: string,
    userUid: string,
    val: RaciRoleValue
  ) => {
    const isClickable = isPM || isEditMode;

    let bg = 'bg-[#E2E8F0] text-[#334155]';
    if (val === 'R') bg = 'bg-[#D1FAE5] text-[#065F46] font-bold';
    else if (val === 'A') bg = 'bg-[#DBEAFE] text-[#1E3A8A] font-extrabold';
    else if (val === 'C') bg = 'bg-[#FEF3C7] text-[#92400E] font-bold';
    else if (val === 'I') bg = 'bg-[#E2E8F0] text-[#4A5A72] font-semibold';

    return (
      <button
        type="button"
        disabled={!isClickable}
        onClick={() => cycleRaciValue(rowId, userUid, val)}
        className={`w-11 h-11 rounded-xl flex items-center justify-center font-heading text-xs transition-all ${bg} ${
          isClickable
            ? 'cursor-pointer hover:scale-105 active:scale-95 hover:ring-2 hover:ring-[#0062CC]'
            : 'cursor-default'
        }`}
        title={isClickable ? 'Klik untuk menggilir status RACI (R -> A -> C -> I)' : undefined}
      >
        {val || '-'}
      </button>
    );
  };

  const memberOrderUids = [
    'user-rahul',
    'user-ihsan',
    'user-althaf',
    'user-jonathan',
    'user-heidi',
  ];

  const rahulUser = getUser('user-rahul');
  const ihsanUser = getUser('user-ihsan');
  const althafUser = getUser('user-althaf');
  const jonathanUser = getUser('user-jonathan');
  const heidiUser = getUser('user-heidi');

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 bg-[#DBEAFE] text-[#1E3A8A] rounded-full text-[10px] font-bold tracking-wider font-heading uppercase">
              EPC WORK PACKAGE 1.0
            </span>
            <span className="text-xs text-[#4A5A72] font-semibold">
              Revisi Dokumen: Rev.03
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B1B33]">
            Our Team and Matrix Raci
          </h1>
          <p className="text-xs text-[#4A5A72] mt-1">
            Struktur tata kelola EPC dan akuntabilitas deliverable sesuai KAK-IC-DME-2026-001
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3.5 py-1.5 bg-[#EAF6FD] text-[#0062CC] rounded-full text-xs font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {users.length} Engineers
          </span>
          <span className="px-3.5 py-1.5 bg-[#EAF6FD] text-[#0062CC] rounded-full text-xs font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> 6 Core Deliverables
          </span>
          <span className="px-3.5 py-1.5 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" /> PM AUTHORIZATION ACTIVE
          </span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================== LEFT: Struktur Tim Operasional (5 cols) ==================== */}
        <div className="lg:col-span-5 bg-white/[0.88] backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white shadow-cockpit-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#0B1B33] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0062CC]" />
              Struktur Tim Operasional
            </h2>
            <span className="text-[11px] text-[#4A5A72] font-medium">
              Klik kartu untuk flip rincian
            </span>
          </div>

          {/* Org Tree Flow */}
          <div className="space-y-4 pt-1">
            {/* Level 1: Project Manager (Rahul) */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                {rahulUser && (
                  <FlipCard
                    user={rahulUser}
                    isFlipped={!!flippedCards['user-rahul']}
                    onFlip={() => toggleFlip('user-rahul')}
                    canEdit={isPM || currentUser.id === rahulUser.id}
                    onEdit={(e) => openEditProfile(rahulUser, e)}
                  />
                )}
              </div>
            </div>

            {/* Connecting Tree Line */}
            <div className="w-full flex justify-center">
              <div className="w-0.5 h-4 bg-[#C9DCEB]"></div>
            </div>

            {/* Level 2: Ihsan & Althaf */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ihsanUser && (
                <FlipCard
                  user={ihsanUser}
                  isFlipped={!!flippedCards['user-ihsan']}
                  onFlip={() => toggleFlip('user-ihsan')}
                  canEdit={isPM || currentUser.id === ihsanUser.id}
                  onEdit={(e) => openEditProfile(ihsanUser, e)}
                />
              )}
              {althafUser && (
                <FlipCard
                  user={althafUser}
                  isFlipped={!!flippedCards['user-althaf']}
                  onFlip={() => toggleFlip('user-althaf')}
                  canEdit={isPM || currentUser.id === althafUser.id}
                  onEdit={(e) => openEditProfile(althafUser, e)}
                />
              )}
            </div>

            {/* Connecting Tree Line */}
            <div className="w-full flex justify-center">
              <div className="w-0.5 h-4 bg-[#C9DCEB]"></div>
            </div>

            {/* Level 3: Jonathan & Heidi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {jonathanUser && (
                <FlipCard
                  user={jonathanUser}
                  isFlipped={!!flippedCards['user-jonathan']}
                  onFlip={() => toggleFlip('user-jonathan')}
                  canEdit={isPM || currentUser.id === jonathanUser.id}
                  onEdit={(e) => openEditProfile(jonathanUser, e)}
                />
              )}
              {heidiUser && (
                <FlipCard
                  user={heidiUser}
                  isFlipped={!!flippedCards['user-heidi']}
                  onFlip={() => toggleFlip('user-heidi')}
                  canEdit={isPM || currentUser.id === heidiUser.id}
                  onEdit={(e) => openEditProfile(heidiUser, e)}
                />
              )}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT: Matriks RACI Capstone (7 cols) ==================== */}
        <div className="lg:col-span-7 bg-white/[0.88] backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white shadow-cockpit-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-[#0B1B33]">
                Matriks RACI Capstone FEED &amp; DED
              </h2>
              <p className="text-xs text-[#4A5A72]">
                Pemetaan peran tanggung jawab per paket dokumen rekayasa
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isPM && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`min-h-[44px] px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isEditMode
                        ? 'bg-[#0B1B33] text-white shadow-xs'
                        : 'bg-white hover:bg-[#EAF6FD] text-[#0B1B33] border border-[#C9DCEB]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#0062CC]" />
                    {isEditMode ? 'Selesai Edit' : 'Mode Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRowModal(true)}
                    className="min-h-[44px] px-4 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Rule Warning Callout */}
          <div className="p-3.5 bg-[#FEF3C7]/80 rounded-2xl border border-[#B45309]/20 flex items-start gap-2.5 text-xs text-[#92400E]">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p className="leading-snug">
              Tiap baris sebaiknya punya tepat satu <strong>A (Accountable)</strong> dan minimal satu <strong>R (Responsible)</strong> untuk menjamin ketertelusuran dokumen.
            </p>
          </div>

          {/* RACI Legend */}
          <div className="flex flex-wrap items-center gap-3 p-2.5 bg-[#F8FAFC] rounded-2xl border border-[#EAF6FD] text-xs">
            <span className="font-bold text-[#0B1B33] text-[11px] uppercase">LEGENDA RACI:</span>
            <span className="flex items-center gap-1.5 text-[#065F46] font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#047857]"></span> R Responsible
            </span>
            <span className="flex items-center gap-1.5 text-[#1E3A8A] font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007BFF]"></span> A Accountable
            </span>
            <span className="flex items-center gap-1.5 text-[#92400E] font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]"></span> C Consulted
            </span>
            <span className="flex items-center gap-1.5 text-[#334155] font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]"></span> I Informed
            </span>
          </div>

          {/* RACI Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#EAF6FD] bg-white">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-[#EAF6FD] bg-[#F8FAFC] text-[11px] font-heading font-bold text-[#4A5A72]">
                  <th className="p-3 text-[#0B1B33]">Deliverable Dokumen</th>
                  {memberOrderUids.map((uid) => (
                    <th key={uid} className="p-3 text-center">
                      <div className="flex justify-center">
                        <UserChip
                          uid={uid}
                          variant="avatar-nama-jabatan"
                          size="xs"
                          useNickname
                          avatarClassName="hidden"
                          nameClassName="!text-[11px] font-heading !font-bold !text-[#4A5A72] text-center"
                          titleClassName="!text-[9px] font-normal font-sans !text-[#4A5A72] text-center"
                        />
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-center">Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF6FD] text-xs">
                {raciRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="p-3 max-w-[200px]">
                      <p className="font-heading font-bold text-xs text-[#0B1B33] leading-snug">
                        {row.deliverable}
                      </p>
                      <p className="text-[11px] text-[#4A5A72] mt-0.5 leading-snug">
                        {row.subtitle}
                      </p>
                    </td>
                    {memberOrderUids.map((uid) => (
                      <td key={uid} className="p-3 text-center">
                        <div className="flex justify-center">
                          {renderRaciBadge(row.id, uid, getRaciRoleForUser(row, uid))}
                        </div>
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          row.validationStatus.includes('Valid')
                            ? 'bg-[#D1FAE5] text-[#065F46]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        {row.validationStatus.includes('Valid') ? (
                          <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-[#B45309]" />
                        )}
                        {row.validationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-[#4A5A72] border-t border-[#EAF6FD]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
              Sesuai Standar Tata Kelola EPC DTNTF K2026
            </span>
            <span className="inline-flex items-center gap-1">
              Terakhir diperbarui: 24 Oktober 2026, 14:32 WIB (Disahkan oleh{' '}
              <UserChip
                uid="user-rahul"
                variant="avatar-nama"
                size="xs"
                useNickname
                avatarClassName="hidden"
                nameClassName="!text-[11px] !font-semibold !text-[#0B1B33]"
              />
              )
            </span>
          </div>
        </div>
      </div>

      {/* Unified Profile Modal for Editing Member / Self */}
      <ProfileModal
        isOpen={editingUserId !== null}
        onClose={() => setEditingUserId(null)}
        initialUserId={editingUserId || undefined}
      />

      {/* Add Row Modal */}
      {showAddRowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Baris Deliverable RACI
            </h3>
            <form onSubmit={handleAddDeliverable} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Deliverable</label>
                <input
                  type="text"
                  value={newDeliverableTitle}
                  onChange={(e) => setNewDeliverableTitle(e.target.value)}
                  placeholder="Contoh: Lampiran B: Datasheet Pompa & Vessel"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Rincian Deskripsi</label>
                <textarea
                  rows={2}
                  value={newDeliverableSub}
                  onChange={(e) => setNewDeliverableSub(e.target.value)}
                  placeholder="Keterangan cakupan paket kerja..."
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 3D Flip Card Sub-Component
const FlipCard: React.FC<{
  user: User;
  isFlipped: boolean;
  onFlip: () => void;
  canEdit: boolean;
  onEdit: (e: React.MouseEvent) => void;
}> = ({ user, isFlipped, onFlip, canEdit, onEdit }) => {
  return (
    <div
      onClick={onFlip}
      className="cursor-pointer perspective-1000 min-h-[180px] w-full"
    >
      <div
        className={`relative w-full h-full rounded-[22px] p-4.5 border border-[#EAF6FD] transition-transform duration-500 transform-style-preserve-3d shadow-xs hover:shadow-sm ${
          isFlipped ? 'rotate-y-180 bg-[#0B1B33] text-white' : 'bg-white text-[#0B1B33]'
        }`}
      >
        {/* FRONT SIDE */}
        <div className={`backface-hidden ${isFlipped ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between mb-3">
            <UserChip
              uid={user.id}
              variant="avatar"
              size="md"
              avatarClassName="w-11 h-11 rounded-2xl font-heading font-extrabold text-xs"
            />
            <div className="flex items-center gap-1.5">
              {canEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title="Edit Profil"
                  className="w-11 h-11 rounded-full bg-[#EAF6FD] text-[#0062CC] hover:bg-[#DCEBF7] flex items-center justify-center transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DBEAFE] text-[#1E3A8A]">
                {user.raciTag}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 flex-wrap">
            <h3 className="font-heading font-bold text-xs text-[#0B1B33] truncate">
              {user.name}
            </h3>
            <span className="text-[10px] font-bold text-[#0062CC]">
              ({user.nickname})
            </span>
          </div>
          <p className="text-[11px] text-[#4A5A72] font-semibold mt-0.5">
            {user.title}
          </p>

          <div className="mt-3.5 pt-2 border-t border-[#EAF6FD] flex items-center justify-between text-[10px] text-[#4A5A72]">
            <span className="flex items-center gap-1 font-medium">
              <RotateCcw className="w-3 h-3 text-[#0062CC]" /> Klik kartu untuk rincian Jobdesk
            </span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className={`backface-hidden rotate-y-180 ${!isFlipped ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/15">
            <span className="font-heading font-bold text-xs text-[#4CBAF5] uppercase tracking-wider">
              {user.title}
            </span>
            <span className="text-[10px] font-mono text-[#9FB3C8]">{user.code}</span>
          </div>

          <ul className="space-y-1 text-[10.5px] text-white/90 leading-tight">
            {user.jobdesk.map((jd, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#4CBAF5] font-bold">•</span>
                <span>{jd}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-[#4CBAF5]">
            <span className="flex items-center gap-1 font-semibold">
              <RotateCcw className="w-3 h-3" /> Kembali ke Tampilan Profil
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
