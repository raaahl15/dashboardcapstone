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
  MessageCircle,
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
import { WhatsAppShareButton } from '../common/WhatsAppShareButton';
import { WaComposerModal } from './WaComposerModal';
import { consumeWaAutoOpen, suggestTemplate } from '../../utils/waTemplates';
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
  const [waOpen, setWaOpen] = useState(false);

  // WO yang baru dibuat PM langsung membuka panel WA (template Ditugaskan)
  useEffect(() => {
    setWaOpen(Boolean(wo && isPM && consumeWaAutoOpen(wo.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo?.id]);

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
    if (!wo || waOpen) return; // Escape saat penyusun WA terbuka hanya menutup penyusun
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
  }, [wo, reasonMode, waOpen, setSelectedWorkOrderId]);

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
      className="fixed inset-0 z-50 flex justify-end bg-ink/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wo-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedWorkOrderId(null);
        }
      }}
    >
      <div className="w-full max-w-2xl h-full bg-surface shadow-cockpit-pop border-l border-glass-stroke flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Sticky Header */}
        <div className="px-6 py-4 border-b border-line bg-surface/95 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-ink text-on-ink">
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
              className="font-heading font-bold text-base sm:text-lg text-fg mt-2 leading-snug"
            >
              {wo.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPM ? (
              <button
                type="button"
                onClick={() => setWaOpen(true)}
                title={`Kirim pesan WhatsApp ${wo.code} (template Rakai)`}
                aria-label={`Kirim pesan WhatsApp ${wo.code}`}
                className="min-h-[44px] px-3.5 rounded-full bg-success-soft hover:bg-success-soft text-success text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            ) : (
            <WhatsAppShareButton
              label={`Bagikan ${wo.code} ke WhatsApp`}
              text={[
                `*${wo.code}: ${wo.title}*`,
                `Status: ${wo.status}${wo.needsRevision ? ' (perlu revisi)' : ''} | Prioritas: ${wo.priority}`,
                `Tenggat: ${formatYmdToIndonesian(wo.dueDate)}${overdue ? ` (TERLAMBAT ${Math.abs(daysDelta)} hari)` : ''}`,
                `PIC: ${wo.assigneeIds.map((id) => getUser(id)?.nickname || getUser(id)?.name || id).join(', ')}`,
                wo.blockedReason && wo.status === 'Blocked' ? `Kendala: ${wo.blockedReason}` : '',
                `Cek di cockpit Area 1-DME > Work Order.`,
              ]
                .filter(Boolean)
                .join('\n')}
            />
            )}
            {isPM && wo.status !== 'Dibatalkan' && (
              <button
                type="button"
                onClick={() => openWorkOrderForm({ editingWorkOrderId: wo.id })}
                className="min-h-[44px] px-3.5 rounded-full bg-muted hover:bg-muted text-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                title="Ubah Work Order"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ubah</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedWorkOrderId(null)}
              className="w-11 h-11 rounded-full hover:bg-muted text-fg-3 hover:text-fg flex items-center justify-center transition-colors"
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
              className="p-3 rounded-2xl bg-danger-soft border border-danger-line text-xs font-semibold text-danger flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionInfo && (
            <div className="p-3 rounded-2xl bg-success-soft border border-success-line text-xs font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionInfo}</span>
            </div>
          )}

          {/* Callout Banners: Revisi / Blocked / Dibatalkan */}
          {wo.revisionNote && (wo.needsRevision || wo.status === 'Dikerjakan') && (
            <div className="p-4 rounded-2xl bg-warm-soft border border-warm-line space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-warm flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Catatan Revisi dari PM
              </span>
              <p className="text-xs font-medium text-warm leading-relaxed">
                {wo.revisionNote}
              </p>
            </div>
          )}

          {wo.status === 'Blocked' && wo.blockedReason && (
            <div className="p-4 rounded-2xl bg-danger-soft border border-danger-line space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-danger flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5" />
                Alasan Kendala (Blocked)
              </span>
              <p className="text-xs font-medium text-danger leading-relaxed">
                {wo.blockedReason}
              </p>
            </div>
          )}

          {wo.status === 'Dibatalkan' && wo.cancelReason && (
            <div className="p-4 rounded-2xl bg-muted border border-line-strong space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-fg-2 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5" />
                Work Order Dibatalkan
              </span>
              <p className="text-xs font-medium text-fg-2 leading-relaxed">
                Alasan: {wo.cancelReason}
              </p>
            </div>
          )}

          {/* Instruksi / Deskripsi */}
          <div className="p-4 rounded-2xl bg-muted border border-line space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-3">
              Instruksi &amp; Ruang Lingkup
            </span>
            <p className="text-xs text-fg leading-relaxed whitespace-pre-line">
              {wo.description || 'Tidak ada catatan instruksi tambahan.'}
            </p>
            {(wo.outputText || wo.fileUrl) && (
              <div className="pt-2 mt-1 border-t border-line space-y-1 text-xs">
                {wo.outputText && (
                  <p className="text-fg">
                    <span className="font-bold">Output: </span>
                    {wo.outputText}
                  </p>
                )}
                {wo.fileUrl && sanitizeExternalUrl(wo.fileUrl) !== '#' && (
                  <a
                    href={sanitizeExternalUrl(wo.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    Buka file kerja
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Grid Metadata: Penanggung Jawab, Pendukung, Waktu, Asal & Tautan Jadwal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-fg-3 block">
                Penanggung Jawab ({wo.assigneeIds.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {wo.assigneeIds.map((uid) => (
                  <div
                    key={uid}
                    className="px-2.5 py-1.5 rounded-xl bg-muted/70 border border-line"
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
                <div className="pt-2 border-t border-line">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-3 block mb-1.5">
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

            <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-fg-3 block">
                  Tenggat &amp; Minggu Proyek
                </span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 font-bold text-fg">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{formatYmdToIndonesian(wo.dueDate)}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-primary">
                    W{weekInfo.week}
                  </span>
                </div>
                {weekInfo.isOutOfRange && (
                  <p className="text-[11px] text-warm font-semibold mt-1">
                    Di luar rentang Minggu 1–16
                  </p>
                )}
                {wo.completedAt && wo.status === 'Selesai' && (
                  <p className="text-[11px] text-success font-semibold mt-1">
                    Selesai: {formatIsoDateTimeShort(wo.completedAt)}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-line space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-fg-3">Asal:</span>
                  {wo.origin.type === 'mom' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setActiveTab('weekly-mom');
                      }}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      MoM ({wo.origin.trackerActionCode})
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-fg">
                      Dibuat Manual
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-fg-3 shrink-0">
                    Tautan Jadwal:
                  </span>
                  {linkedGantt ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderId(null);
                        setActiveTab('schedule');
                      }}
                      className="text-[11px] font-bold text-primary hover:underline text-right inline-flex items-center gap-1"
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
                      className="text-[11px] font-bold text-primary hover:underline text-right inline-flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        Plan W{linkedPlan.week}: {linkedPlan.title}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-fg-3">Tidak ditautkan</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Langkah Kerja */}
          {wo.checklist.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fg">
                  Checklist Langkah Kerja
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-primary tabular-nums">
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
                        ? 'bg-success-soft/40 border-success-line text-success'
                        : 'bg-muted border-line text-fg'
                    } ${
                      canExecute
                        ? 'hover:border-primary cursor-pointer'
                        : 'cursor-default opacity-85'
                    }`}
                  >
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-fg-3 shrink-0" />
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
          <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-fg">
                Bukti Hasil Pekerjaan
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  wo.requireEvidence
                    ? 'bg-warm-soft text-warm'
                    : 'bg-muted text-fg-3'
                }`}
              >
                {wo.requireEvidence ? 'Wajib saat Submit' : 'Opsional'}
              </span>
            </div>

            {canExecute ? (
              <form onSubmit={handleSaveEvidenceOnly} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-fg-3 mb-1">
                    Tautan Bukti (Google Drive / Dokumen / Repository)
                  </label>
                  <input
                    type="url"
                    value={evidenceUrlInput}
                    onChange={(e) => setEvidenceUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-fg-3 mb-1">
                    Catatan Hasil Singkat
                  </label>
                  <input
                    type="text"
                    value={evidenceNoteInput}
                    onChange={(e) => setEvidenceNoteInput(e.target.value)}
                    placeholder="Contoh: Revisi Rev-02 sudah sesuai batas konversi 82%"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {safeExternalEvidence !== '#' ? (
                    <a
                      href={safeExternalEvidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] px-3.5 rounded-full bg-muted text-primary text-xs font-bold inline-flex items-center gap-1.5 hover:underline"
                    >
                      <span>Buka Bukti Tersimpan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-fg-3">
                      Belum ada tautan bukti tersimpan.
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="min-h-[40px] px-4 rounded-full bg-muted hover:bg-muted text-fg border border-line text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-primary" />
                    <span>Simpan Bukti</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-fg-2 space-y-2">
                {safeExternalEvidence !== '#' ? (
                  <a
                    href={safeExternalEvidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-4 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Buka Tautan Bukti Hasil</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-fg-3 italic">
                    Tidak ada tautan bukti dilampirkan.
                  </p>
                )}
                {wo.evidenceNote && (
                  <p className="p-2.5 rounded-xl bg-muted border border-line text-xs text-fg">
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
              className="p-4 rounded-2xl bg-warm-soft border border-warm-line space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-warm">
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
                  className="text-xs font-bold text-fg-3 hover:text-fg"
                >
                  Tutup
                </button>
              </div>
              <textarea
                rows={2}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Tuliskan keterangan yang jelas agar tercatat di riwayat..."
                className="w-full p-3 rounded-xl border border-warm-line bg-surface text-xs text-fg outline-none"
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
                  className="min-h-[40px] px-4 rounded-full text-xs font-semibold text-fg-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="min-h-[40px] px-5 rounded-full bg-ink text-on-ink text-xs font-bold"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          )}

          {/* Riwayat Perubahan */}
          <div className="p-4 rounded-2xl bg-muted border border-line space-y-3">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-fg">
                Riwayat Perubahan ({wo.history.length})
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {[...wo.history].reverse().map((entry) => {
                const actor = getUser(entry.actorId);
                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-surface border border-line text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-fg">
                        {entry.eventLabel}
                      </span>
                      <span className="text-[10px] text-fg-3 font-mono">
                        {formatIsoDateTimeShort(entry.at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-fg-3">
                      <span>Oleh: {actor?.nickname || entry.actorId}</span>
                      {entry.fromStatus && entry.fromStatus !== entry.toStatus && (
                        <span>
                          • {entry.fromStatus} → <strong>{entry.toStatus}</strong>
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-[11px] text-fg-2 bg-muted px-2.5 py-1.5 rounded-lg border border-line mt-1">
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
        <div className="px-6 py-4 border-t border-line bg-surface flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Ditugaskan -> Dikerjakan */}
            {wo.status === 'Ditugaskan' && (isAssignee || isPM) && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void runAction(() => startWorkOrder(wo.id))}
                className="min-h-[44px] px-5 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
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
                className="min-h-[44px] px-5 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
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
                  className="min-h-[44px] px-5 rounded-full bg-success-solid hover:bg-success-solid text-on-ink text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
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
                className="min-h-[44px] px-4 rounded-full bg-danger-soft hover:bg-danger-soft text-danger text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
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
                className="min-h-[44px] px-5 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
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
                  className="min-h-[44px] px-5 rounded-full bg-success-solid hover:bg-success-solid text-on-ink text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
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
                  className="min-h-[44px] px-4 rounded-full bg-warm-soft hover:bg-warm-soft text-warm text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </button>
              </>
            )}

            {wo.status === 'Diajukan' && !isPM && (
              <span className="text-xs font-semibold text-warm">
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
                className="min-h-[44px] px-4 rounded-full bg-warm-soft hover:bg-warm-soft text-warm text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
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
              className="min-h-[44px] px-4 rounded-full text-xs font-bold text-danger hover:bg-danger-soft/60 inline-flex items-center gap-1.5 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Batalkan WO</span>
            </button>
          )}
        </div>
      </div>

      {isPM && (
        <WaComposerModal
          open={waOpen}
          onClose={() => setWaOpen(false)}
          wo={wo}
          initialTemplate={suggestTemplate(wo)}
        />
      )}
    </div>
  );
};
