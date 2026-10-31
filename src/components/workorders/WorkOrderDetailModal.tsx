import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ExternalLink,
  History,
  Link2,
  PauseCircle,
  Pencil,
  Play,
  RotateCcw,
  Save,
  Send,
  Square,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { sanitizeExternalUrl } from '../../context/appContextHelpers';
import {
  computeProjectWeekFromDate,
  formatIsoDateTimeShort,
  formatYmdToIndonesian,
  getDaysUntilDue,
  getTodayLocalYmd,
  isExclusivelyAssignedToCurrentPM,
  isUserWorkOrderAssignee,
  isWorkOrderOverdue,
} from '../../utils/workOrderHelpers';
import {
  WorkOrderOverdueBadge,
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from './WorkOrderBadges';

type ReasonDialogMode = 'block' | 'revision' | 'reopen' | 'cancel' | null;

export const WorkOrderDetailModal: React.FC = () => {
  const {
    workOrders,
    selectedWorkOrderId,
    setSelectedWorkOrderId,
    openWorkOrderForm,
    currentUser,
    isPM,
    getUser,
    config,
    ganttTasks,
    weeklyPlans,
    setActiveTab,
    updateWorkOrderExecution,
    startWorkOrder,
    blockWorkOrder,
    unblockWorkOrder,
    submitWorkOrder,
    approveWorkOrder,
    requestWorkOrderRevision,
    reopenWorkOrder,
    cancelWorkOrder,
  } = useApp();

  const wo = useMemo(
    () => workOrders.find((item) => item.id === selectedWorkOrderId),
    [workOrders, selectedWorkOrderId]
  );

  const [evidenceUrlInput, setEvidenceUrlInput] = useState('');
  const [evidenceNoteInput, setEvidenceNoteInput] = useState('');
  const [reasonMode, setReasonMode] = useState<ReasonDialogMode>(null);
  const [reasonText, setReasonText] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionInfo, setActionInfo] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!wo) return;
    setEvidenceUrlInput(wo.evidenceUrl || '');
    setEvidenceNoteInput(wo.evidenceNote || '');
    setReasonMode(null);
    setReasonText('');
    setActionError('');
    setActionInfo('');
    setIsBusy(false);
  }, [wo?.id, wo?.evidenceUrl, wo?.evidenceNote]);

  useEffect(() => {
    if (!wo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reasonMode) {
          setReasonMode(null);
        } else {
          setSelectedWorkOrderId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wo, reasonMode, setSelectedWorkOrderId]);

  if (!wo) return null;

  const todayYmd = getTodayLocalYmd();
  const overdue = isWorkOrderOverdue(wo, todayYmd);
  const daysDelta = getDaysUntilDue(wo.dueDate, todayYmd);
  const weekInfo = computeProjectWeekFromDate(wo.dueDate, config.projectStartDate);
  const isAssignee = isUserWorkOrderAssignee(wo, currentUser.id, getUser);
  const canExecute =
    (isAssignee || isPM) &&
    wo.status !== 'Selesai' &&
    wo.status !== 'Dibatalkan';
  const isSelfOnlyPM = isExclusivelyAssignedToCurrentPM(
    wo,
    currentUser.id,
    isPM,
    getUser
  );

  const linkedGantt = (() => {
    if (wo.scheduleLink.type !== 'gantt') return undefined;
    const { taskId } = wo.scheduleLink;
    return ganttTasks.find((t) => t.id === taskId);
  })();
  const linkedPlan = (() => {
    if (wo.scheduleLink.type !== 'weeklyPlan') return undefined;
    const { planId } = wo.scheduleLink;
    return weeklyPlans.find((p) => p.id === planId);
  })();

  const safeExternalEvidence = sanitizeExternalUrl(wo.evidenceUrl);

  const runAction = async (fn: () => Promise<void>, successMessage?: string) => {
    setActionError('');
    setActionInfo('');
    setIsBusy(true);
    try {
      await fn();
      if (successMessage) setActionInfo(successMessage);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses aksi.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!canExecute) return;
    const nextChecklist = wo.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    void runAction(() =>
      updateWorkOrderExecution(wo.id, { checklist: nextChecklist })
    );
  };

  const handleSaveEvidenceOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canExecute) return;
    void runAction(
      () =>
        updateWorkOrderExecution(wo.id, {
          evidenceUrl: evidenceUrlInput,
          evidenceNote: evidenceNoteInput,
        }),
      'Bukti hasil berhasil disimpan.'
    );
  };

  const handleSubmitForReview = () => {
    void runAction(
      () =>
        submitWorkOrder(wo.id, {
          evidenceUrl: evidenceUrlInput,
          evidenceNote: evidenceNoteInput,
        }),
      'Work Order berhasil diajukan untuk review PM.'
    );
  };

  const handleConfirmReasonAction = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = reasonText.trim();
    if (!clean) {
      setActionError('Catatan / alasan wajib diisi.');
      return;
    }

    if (reasonMode === 'block') {
      void runAction(async () => {
        await blockWorkOrder(wo.id, clean);
        setReasonMode(null);
        setReasonText('');
      });
    } else if (reasonMode === 'revision') {
      void runAction(async () => {
        await requestWorkOrderRevision(wo.id, clean);
        setReasonMode(null);
        setReasonText('');
      });
    } else if (reasonMode === 'reopen') {
      void runAction(async () => {
        await reopenWorkOrder(wo.id, clean);
        setReasonMode(null);
        setReasonText('');
      });
    } else if (reasonMode === 'cancel') {
      void runAction(async () => {
        await cancelWorkOrder(wo.id, clean);
        setReasonMode(null);
        setReasonText('');
      });
    }
  };

  const completedChecklistCount = wo.checklist.filter((c) => c.done).length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0B1B33]/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wo-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedWorkOrderId(null);
        }
      }}
    >
      <div className="w-full max-w-2xl h-full bg-white shadow-cockpit-pop border-l border-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Sticky Header */}
        <div className="px-6 py-4 border-b border-[#EAF6FD] bg-white/95 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#0B1B33] text-white">
                {wo.code}
              </span>
              <WorkOrderStatusBadge
                status={wo.status}
                needsRevision={wo.needsRevision}
                size="sm"
              />
              <WorkOrderPriorityBadge priority={wo.priority} size="sm" />
              {overdue && (
                <WorkOrderOverdueBadge daysLate={Math.abs(daysDelta)} size="sm" />
              )}
            </div>
            <h2
              id="wo-detail-title"
              className="font-heading font-bold text-base sm:text-lg text-[#0B1B33] mt-2 leading-snug"
            >
              {wo.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPM && wo.status !== 'Dibatalkan' && (
              <button
                type="button"
                onClick={() => openWorkOrderForm({ editingWorkOrderId: wo.id })}
                className="min-h-[44px] px-3.5 rounded-full bg-[#EAF6FD] hover:bg-[#DCEBF7] text-[#0062CC] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                title="Ubah Work Order"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ubah</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedWorkOrderId(null)}
              className="w-11 h-11 rounded-full hover:bg-[#EAF6FD] text-[#4A5A72] hover:text-[#0B1B33] flex items-center justify-center transition-colors"
              aria-label="Tutup panel detail Work Order"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {actionError && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs font-semibold text-[#991B1B] flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionInfo && (
            <div className="p-3 rounded-2xl bg-[#D1FAE5] border border-[#6EE7B7] text-xs font-semibold text-[#065F46] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionInfo}</span>
            </div>
          )}

          {/* Callout Banners: Revisi / Blocked / Dibatalkan */}
          {wo.revisionNote && (wo.needsRevision || wo.status === 'Dikerjakan') && (
            <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FCD34D] space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#92400E] flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Catatan Revisi dari PM
              </span>
              <p className="text-xs font-medium text-[#78350F] leading-relaxed">
                {wo.revisionNote}
              </p>
            </div>
          )}

          {wo.status === 'Blocked' && wo.blockedReason && (
            <div className="p-4 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#991B1B] flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5" />
                Alasan Kendala (Blocked)
              </span>
              <p className="text-xs font-medium text-[#7F1D1D] leading-relaxed">
                {wo.blockedReason}
              </p>
            </div>
          )}

          {wo.status === 'Dibatalkan' && wo.cancelReason && (
            <div className="p-4 rounded-2xl bg-[#F1F5F9] border border-[#CBD5E1] space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#334155] flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5" />
                Work Order Dibatalkan
              </span>
              <p className="text-xs font-medium text-[#334155] leading-relaxed">
                Alasan: {wo.cancelReason}
              </p>
            </div>
          )}

          {/* Instruksi / Deskripsi */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCEBF7] space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A72]">
              Instruksi &amp; Ruang Lingkup
            </span>
            <p className="text-xs text-[#0B1B33] leading-relaxed whitespace-pre-line">
              {wo.description || 'Tidak ada catatan instruksi tambahan.'}
            </p>
          </div>

          {/* Grid Metadata: Penanggung Jawab, Pendukung, Waktu, Asal & Tautan Jadwal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-[#DCEBF7] space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A72] block">
                Penanggung Jawab ({wo.assigneeIds.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {wo.assigneeIds.map((uid) => (
                  <div
                    key={uid}
                    className="px-2.5 py-1.5 rounded-xl bg-[#EAF6FD]/70 border border-[#DCEBF7]"
                  >
                    <UserChip
                      uid={uid}
                      variant="avatar-nama-jabatan"
                      size="xs"
                      useNickname
                    />
                  </div>
                ))}
              </div>

              {wo.supporterIds.length > 0 && (
                <div className="pt-2 border-t border-[#EAF6FD]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A5A72] block mb-1.5">
                    Pendukung
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {wo.supporterIds.map((uid) => (
                      <UserChip
                        key={uid}
                        uid={uid}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCEBF7] space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A72] block">
                  Tenggat &amp; Minggu Proyek
                </span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 font-bold text-[#0B1B33]">
                  <Calendar className="w-3.5 h-3.5 text-[#0062CC]" />
                  <span>{formatYmdToIndonesian(wo.dueDate)}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EAF6FD] text-[#0062CC]">
                    W{weekInfo.week}
                  </span>
                </div>
                {weekInfo.isOutOfRange && (
                  <p className="text-[11px] text-[#B45309] font-semibold mt-1">
                    Di luar rentang Minggu 1–16
                  </p>
                )}
                {wo.completedAt && wo.status === 'Selesai' && (
                  <p className="text-[11px] text-[#047857] font-semibold mt-1">
                    Selesai: {formatIsoDateTimeShort(wo.completedAt)}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#EAF6FD] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#4A5A72]">Asal:</span>
                  {wo.origin.type === 'mom' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setActiveTab('weekly-mom');
                      }}
                      className="text-[11px] font-bold text-[#0062CC] hover:underline"
                    >
                      MoM ({wo.origin.trackerActionCode})
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#0B1B33]">
                      Dibuat Manual
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-[#4A5A72] shrink-0">
                    Tautan Jadwal:
                  </span>
                  {linkedGantt ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setActiveTab('schedule');
                      }}
                      className="text-[11px] font-bold text-[#0062CC] hover:underline text-right inline-flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        Gantt: {linkedGantt.name}
                      </span>
                    </button>
                  ) : linkedPlan ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setActiveTab('schedule');
                      }}
                      className="text-[11px] font-bold text-[#0062CC] hover:underline text-right inline-flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        Plan W{linkedPlan.week}: {linkedPlan.title}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#4A5A72]">Tidak ditautkan</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Langkah Kerja */}
          {wo.checklist.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-[#DCEBF7] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B33]">
                  Checklist Langkah Kerja
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6FD] text-[#0062CC] tabular-nums">
                  {completedChecklistCount}/{wo.checklist.length} selesai
                </span>
              </div>

              <div className="space-y-1.5">
                {wo.checklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!canExecute || isBusy}
                    onClick={() => handleToggleChecklistItem(item.id)}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      item.done
                        ? 'bg-[#D1FAE5]/40 border-[#6EE7B7] text-[#065F46]'
                        : 'bg-[#F8FAFC] border-[#DCEBF7] text-[#0B1B33]'
                    } ${
                      canExecute
                        ? 'hover:border-[#0062CC] cursor-pointer'
                        : 'cursor-default opacity-85'
                    }`}
                  >
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-[#047857] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#6B7F99] shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        item.done ? 'line-through opacity-80' : ''
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bukti Hasil Pelaksanaan */}
          <div className="p-4 rounded-2xl bg-white border border-[#DCEBF7] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0B1B33]">
                Bukti Hasil Pekerjaan
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  wo.requireEvidence
                    ? 'bg-[#FEF3C7] text-[#92400E]'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                {wo.requireEvidence ? 'Wajib saat Submit' : 'Opsional'}
              </span>
            </div>

            {canExecute ? (
              <form onSubmit={handleSaveEvidenceOnly} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A5A72] mb-1">
                    Tautan Bukti (Google Drive / Dokumen / Repository)
                  </label>
                  <input
                    type="url"
                    value={evidenceUrlInput}
                    onChange={(e) => setEvidenceUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none focus:border-[#0062CC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A5A72] mb-1">
                    Catatan Hasil Singkat
                  </label>
                  <input
                    type="text"
                    value={evidenceNoteInput}
                    onChange={(e) => setEvidenceNoteInput(e.target.value)}
                    placeholder="Contoh: Revisi Rev-02 sudah sesuai batas konversi 82%"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none focus:border-[#0062CC]"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {safeExternalEvidence !== '#' ? (
                    <a
                      href={safeExternalEvidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] px-3.5 rounded-full bg-[#EAF6FD] text-[#0062CC] text-xs font-bold inline-flex items-center gap-1.5 hover:underline"
                    >
                      <span>Buka Bukti Tersimpan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#4A5A72]">
                      Belum ada tautan bukti tersimpan.
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="min-h-[40px] px-4 rounded-full bg-[#F8FAFC] hover:bg-[#EAF6FD] text-[#0B1B33] border border-[#C9DCEB] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-[#0062CC]" />
                    <span>Simpan Bukti</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-[#334155] space-y-2">
                {safeExternalEvidence !== '#' ? (
                  <a
                    href={safeExternalEvidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-4 rounded-full bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Buka Tautan Bukti Hasil</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-[#4A5A72] italic">
                    Tidak ada tautan bukti dilampirkan.
                  </p>
                )}
                {wo.evidenceNote && (
                  <p className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EAF6FD] text-xs text-[#0B1B33]">
                    {wo.evidenceNote}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Inline Dialog Alasan Wajib (Blocked / Revisi / Buka Kembali / Batal) */}
          {reasonMode && (
            <form
              onSubmit={handleConfirmReasonAction}
              className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#92400E]">
                  {reasonMode === 'block' && 'Alasan Kendala (Blocked) Wajib Diisi'}
                  {reasonMode === 'revision' && 'Catatan Revisi untuk Penanggung Jawab'}
                  {reasonMode === 'reopen' && 'Alasan Pembukaan Kembali Work Order'}
                  {reasonMode === 'cancel' &&
                    'Alasan Pembatalan Work Order (Data Tetap Tersimpan)'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReasonMode(null);
                    setReasonText('');
                  }}
                  className="text-xs font-bold text-[#4A5A72] hover:text-[#0B1B33]"
                >
                  Tutup
                </button>
              </div>
              <textarea
                rows={2}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Tuliskan keterangan yang jelas agar tercatat di riwayat..."
                className="w-full p-3 rounded-xl border border-[#D97706] bg-white text-xs text-[#0B1B33] outline-none"
                autoFocus
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReasonMode(null);
                    setReasonText('');
                  }}
                  className="min-h-[40px] px-4 rounded-full text-xs font-semibold text-[#4A5A72]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="min-h-[40px] px-5 rounded-full bg-[#0B1B33] text-white text-xs font-bold"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          )}

          {/* Riwayat Perubahan */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCEBF7] space-y-3">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0062CC]" />
              <span className="text-xs font-bold text-[#0B1B33]">
                Riwayat Perubahan ({wo.history.length})
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {[...wo.history].reverse().map((entry) => {
                const actor = getUser(entry.actorId);
                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-white border border-[#EAF6FD] text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#0B1B33]">
                        {entry.eventLabel}
                      </span>
                      <span className="text-[10px] text-[#4A5A72] font-mono">
                        {formatIsoDateTimeShort(entry.at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#4A5A72]">
                      <span>Oleh: {actor?.nickname || entry.actorId}</span>
                      {entry.fromStatus && entry.fromStatus !== entry.toStatus && (
                        <span>
                          • {entry.fromStatus} → <strong>{entry.toStatus}</strong>
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-[11px] text-[#334155] bg-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#EAF6FD] mt-1">
                        {entry.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer: Contextual Role-Based Transition Buttons */}
        <div className="px-6 py-4 border-t border-[#EAF6FD] bg-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Ditugaskan -> Dikerjakan */}
            {wo.status === 'Ditugaskan' && (isAssignee || isPM) && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void runAction(() => startWorkOrder(wo.id))}
                className="min-h-[44px] px-5 rounded-full bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Mulai Kerjakan</span>
              </button>
            )}

            {/* Dikerjakan -> Diajukan & Dikerjakan -> Blocked */}
            {wo.status === 'Dikerjakan' && (isAssignee || isPM) && !isSelfOnlyPM && (
              <button
                type="button"
                disabled={isBusy}
                onClick={handleSubmitForReview}
                className="min-h-[44px] px-5 rounded-full bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan ke PM</span>
              </button>
            )}

            {/* Shortcut Selesai langsung untuk WO milik PM sendiri */}
            {isSelfOnlyPM &&
              (wo.status === 'Ditugaskan' || wo.status === 'Dikerjakan') && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void runAction(() => approveWorkOrder(wo.id))}
                  className="min-h-[44px] px-5 rounded-full bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tandai Selesai</span>
                </button>
              )}

            {wo.status === 'Dikerjakan' && (isAssignee || isPM) && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  setReasonMode('block');
                  setReasonText('');
                  setActionError('');
                }}
                className="min-h-[44px] px-4 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Tandai Blocked</span>
              </button>
            )}

            {/* Blocked -> Dikerjakan */}
            {wo.status === 'Blocked' && (isAssignee || isPM) && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void runAction(() => unblockWorkOrder(wo.id))}
                className="min-h-[44px] px-5 rounded-full bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Lanjutkan Kerjakan</span>
              </button>
            )}

            {/* Diajukan -> Selesai / Revisi (Khusus PM) */}
            {wo.status === 'Diajukan' && isPM && (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void runAction(() => approveWorkOrder(wo.id))}
                  className="min-h-[44px] px-5 rounded-full bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui Selesai</span>
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setReasonMode('revision');
                    setReasonText('');
                    setActionError('');
                  }}
                  className="min-h-[44px] px-4 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </button>
              </>
            )}

            {wo.status === 'Diajukan' && !isPM && (
              <span className="text-xs font-semibold text-[#92400E]">
                Menunggu review &amp; persetujuan Project Manager
              </span>
            )}

            {/* Selesai -> Dibuka Kembali (Khusus PM) */}
            {wo.status === 'Selesai' && isPM && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  setReasonMode('reopen');
                  setReasonText('');
                  setActionError('');
                }}
                className="min-h-[44px] px-4 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Buka Kembali</span>
              </button>
            )}
          </div>

          {/* Batalkan WO (Khusus PM, selama belum Dibatalkan) */}
          {isPM && wo.status !== 'Dibatalkan' && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setReasonMode('cancel');
                setReasonText('');
                setActionError('');
              }}
              className="min-h-[44px] px-4 rounded-full text-xs font-bold text-[#B91C1C] hover:bg-[#FEE2E2]/60 inline-flex items-center gap-1.5 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Batalkan WO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
