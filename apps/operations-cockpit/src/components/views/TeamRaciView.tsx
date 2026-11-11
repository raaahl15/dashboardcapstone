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
    if (!isPM || !isEditMode) return;
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
    const isClickable = isPM && isEditMode;

    let bg = 'bg-muted text-fg-2';
    if (val === 'R') bg = 'bg-success-soft text-success font-bold';
    else if (val === 'A') bg = 'bg-primary-soft text-fg-2 font-extrabold';
    else if (val === 'C') bg = 'bg-warm-soft text-warm font-bold';
    else if (val === 'I') bg = 'bg-muted text-fg-3 font-semibold';

    return (
      <button
        type="button"
        disabled={!isClickable}
        onClick={() => cycleRaciValue(rowId, userUid, val)}
        className={`w-11 h-11 rounded-xl flex items-center justify-center font-heading text-xs transition-all ${bg} ${
          isClickable
            ? 'cursor-pointer hover:scale-105 active:scale-95 hover:ring-2 hover:ring-focus'
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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Ringkasan + kartu anggota (v2.0: berjajar, klik untuk flip rincian) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="h-8 px-3.5 rounded-full bg-primary-soft text-fg-2 text-[12px] font-semibold inline-flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> {users.length} Engineers
        </span>
        <span className="h-8 px-3.5 rounded-full bg-primary-soft text-fg-2 text-[12px] font-semibold inline-flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> 6 Core Deliverables
        </span>
        <span className="h-8 px-3.5 rounded-full bg-surface border border-line text-fg-2 text-[12px] font-medium inline-flex items-center">
          Revisi Dokumen: Rev.03
        </span>
        <span className="h-8 px-3.5 rounded-full bg-success-soft text-success text-[12px] font-semibold inline-flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> PM AUTHORIZATION ACTIVE
        </span>
        <span className="ml-auto text-xs text-fg-3">Klik kartu untuk flip rincian</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[rahulUser, ihsanUser, althafUser, jonathanUser, heidiUser].map(
          (member) =>
            member && (
              <div key={member.id} className="h-[300px]">
                <FlipCard
                  user={member}
                  isFlipped={!!flippedCards[member.legacyId || member.id]}
                  onFlip={() => toggleFlip(member.legacyId || member.id)}
                  canEdit={isPM || currentUser.id === member.id}
                  onEdit={(e) => openEditProfile(member, e)}
                />
              </div>
            )
        )}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* ==================== RIGHT: Matriks RACI Capstone (7 cols) ==================== */}
        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-fg">
                Matriks RACI Capstone FEED &amp; DED
              </h2>
              <p className="text-xs text-fg-3">
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
                        ? 'bg-ink text-on-ink shadow-xs'
                        : 'bg-surface hover:bg-muted text-fg border border-line'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    {isEditMode ? 'Selesai Edit' : 'Mode Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRowModal(true)}
                    className="min-h-[44px] px-4 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Rule Warning Callout */}
          <div className="p-3.5 bg-warm-soft/80 rounded-2xl border border-warm-line/20 flex items-start gap-2.5 text-xs text-warm">
            <AlertTriangle className="w-4 h-4 text-warm shrink-0 mt-0.5" />
            <p className="leading-snug">
              Tiap baris sebaiknya punya tepat satu <strong>A (Accountable)</strong> dan minimal satu <strong>R (Responsible)</strong> untuk menjamin ketertelusuran dokumen.
            </p>
          </div>

          {/* RACI Legend */}
          <div className="flex flex-wrap items-center gap-3 p-2.5 bg-surface/50 rounded-2xl border border-glass-stroke text-xs">
            <span className="font-bold text-fg text-[11px] uppercase">LEGENDA RACI:</span>
            <span className="flex items-center gap-1.5 text-success font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-success-solid"></span> R Responsible
            </span>
            <span className="flex items-center gap-1.5 text-fg-2 font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> A Accountable
            </span>
            <span className="flex items-center gap-1.5 text-warm font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-warm-solid"></span> C Consulted
            </span>
            <span className="flex items-center gap-1.5 text-fg-2 font-semibold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-fg-3"></span> I Informed
            </span>
          </div>

          {/* RACI Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-glass-stroke bg-surface/60">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-glass-stroke bg-surface/70 text-[11px] font-heading font-bold text-fg-3">
                  <th className="p-3 text-fg">Deliverable Dokumen</th>
                  {memberOrderUids.map((uid) => (
                    <th key={uid} className="p-3 text-center">
                      <div className="flex justify-center">
                        <UserChip
                          uid={uid}
                          variant="avatar-nama-jabatan"
                          size="xs"
                          useNickname
                          avatarClassName="hidden"
                          nameClassName="!text-[11px] font-heading !font-bold !text-fg-3 text-center"
                          titleClassName="!text-[9px] font-normal font-sans !text-fg-3 text-center"
                        />
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-center">Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {raciRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface/70 transition-colors">
                    <td className="p-3 max-w-[200px]">
                      <p className="font-heading font-bold text-xs text-fg leading-snug">
                        {row.deliverable}
                      </p>
                      <p className="text-[11px] text-fg-3 mt-0.5 leading-snug">
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
                            ? 'bg-success-soft text-success'
                            : 'bg-warm-soft text-warm'
                        }`}
                      >
                        {row.validationStatus.includes('Valid') ? (
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-warm" />
                        )}
                        {row.validationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-fg-3 border-t border-line">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-success-solid"></span>
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
                nameClassName="!text-[11px] !font-semibold !text-fg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
            <h3 className="font-heading font-bold text-sm text-fg pb-3 border-b border-line">
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
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
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
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
      className="cursor-pointer perspective-1000 min-h-[180px] w-full lg:h-full lg:min-h-0"
    >
      <div
        className={`relative h-full min-h-[180px] w-full rounded-[22px] border border-glass-stroke transition-transform duration-500 transform-style-preserve-3d shadow-xs hover:shadow-sm ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT SIDE */}
        <div
          className={`backface-hidden absolute inset-0 overflow-hidden rounded-[22px] ${
            isFlipped ? 'hidden' : 'block'
          }`}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-hero text-4xl font-extrabold text-on-ink">
              {user.avatarInitial || user.code}
            </div>
          )}

          <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-end gap-1.5">
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                title="Edit Profil"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/45 text-on-ink backdrop-blur-md transition-colors hover:bg-black/65"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-4 pt-14">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-heading text-sm font-extrabold leading-tight text-on-ink drop-shadow-sm">
                  {user.name}
                </h3>
                <p className="mt-0.5 truncate text-[11px] font-medium text-on-ink/80 drop-shadow-xs">
                  {user.title}
                  <span className="text-on-ink/40"> • </span>
                  <span className="font-semibold text-on-ink-accent">@{user.nickname}</span>
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-glass-stroke bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-on-ink backdrop-blur-md">
                {user.raciTag}
              </span>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className={`backface-hidden absolute inset-0 overflow-y-auto rounded-[22px] bg-ink p-4.5 text-on-ink rotate-y-180 ${
            !isFlipped ? 'hidden' : 'block'
          }`}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/15">
            <span className="font-heading font-bold text-xs text-on-ink-accent uppercase tracking-wider">
              {user.title}
            </span>
            <span className="text-[10px] font-mono text-on-ink-2">{user.code}</span>
          </div>

          <ul className="space-y-1 text-[10.5px] text-on-ink/90 leading-tight">
            {user.jobdesk.map((jd, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-on-ink-accent font-bold">•</span>
                <span>{jd}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-on-ink-accent">
            <span className="flex items-center gap-1 font-semibold">
              <RotateCcw className="w-3 h-3" /> Kembali ke Tampilan Profil
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
