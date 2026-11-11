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
  const waShareText = [
    `*${wo.code}: ${wo.title}*`,
    `Status: ${wo.status}${wo.needsRevision ? ' (perlu revisi)' : ''} | Prioritas: ${wo.priority}`,
    `Tenggat: ${formatYmdToIndonesian(wo.dueDate)}${overdue ? ` (TERLAMBAT ${Math.abs(daysDelta)} hari)` : ''}`,
    `PIC: ${wo.assigneeIds.map((id) => getUser(id)?.nickname || getUser(id)?.name || id).join(', ')}`,
    wo.blockedReason && wo.status === 'Blocked' ? `Kendala: ${wo.blockedReason}` : '',
    `Cek di cockpit Area 1-DME > Work Order.`,
  ]
    .filter(Boolean)
    .join('\n');

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
      <div className="anim-pop w-full max-w-xl h-full sm:h-[calc(100%-2rem)] sm:m-4 bg-surface shadow-cockpit-pop sm:rounded-[32px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-7 pt-6 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-soft text-fg-2 tabular-nums">{wo.code}</span>
              <WorkOrderStatusBadge status={wo.status} needsRevision={wo.needsRevision} size="sm" />
              <WorkOrderPriorityBadge priority={wo.priority} size="sm" />
              {overdue && <WorkOrderOverdueBadge daysLate={Math.abs(daysDelta)} size="sm" />}
            </div>
            <h2 id="wo-detail-title" className="font-heading text-2xl font-normal text-fg mt-3 leading-snug">
              {wo.title}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isPM && wo.status !== 'Dibatalkan' && (
              <button
                type="button"
                onClick={() => openWorkOrderForm({ editingWorkOrderId: wo.id })}
                className="w-10 h-10 rounded-full hover:bg-muted text-fg-2 hover:text-primary flex items-center justify-center"
                title="Ubah Work Order"
                aria-label="Ubah Work Order"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedWorkOrderId(null)}
              className="w-10 h-10 rounded-full bg-muted text-fg hover:bg-primary-soft flex items-center justify-center"
              aria-label="Tutup panel detail Work Order"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 pb-5 space-y-5">
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

          {/* Blok info 2×2 */}
          <div className="rounded-[24px] bg-muted/70 p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Penanggung jawab</p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {wo.assigneeIds.map((uid) => (
                  <UserChip key={uid} uid={uid} variant="avatar-nama-jabatan" size="xs" useNickname inlineTitle nameClassName="!text-sm !font-medium !text-fg" titleClassName="!text-xs !text-fg-3" />
                ))}
              </div>
              {wo.supporterIds.length > 0 && (
                <p className="mt-1 text-xs text-fg-3">
                  Pendukung: {wo.supporterIds.map((id) => getUser(id)?.nickname || id).join(', ')}
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Tenggat</p>
              <p className={`mt-1.5 font-medium ${overdue ? 'text-warm' : 'text-fg'}`}>
                {formatYmdToIndonesian(wo.dueDate)} · W{weekInfo.week}
              </p>
              {weekInfo.isOutOfRange && <p className="text-xs text-warm">Di luar rentang Minggu 1–16</p>}
              {wo.completedAt && wo.status === 'Selesai' && <p className="text-xs text-success">Selesai: {formatIsoDateTimeShort(wo.completedAt)}</p>}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Sumber</p>
              {wo.origin.type === 'mom' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorkOrderId(null);
                    setActiveTab('weekly-mom');
                  }}
                  className="mt-1.5 font-medium text-primary hover:underline text-left"
                >
                  MoM {wo.origin.trackerActionCode}
                </button>
              ) : (
                <p className="mt-1.5 font-medium text-fg">Dibuat manual</p>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Jadwal</p>
              {linkedGantt || linkedPlan ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorkOrderId(null);
                    setActiveTab('schedule');
                  }}
                  className="mt-1.5 max-w-full font-medium text-primary hover:underline text-left inline-flex items-center gap-1"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{linkedGantt ? `Gantt ${linkedGantt.name}` : `Plan W${linkedPlan!.week}: ${linkedPlan!.title}`}</span>
                </button>
              ) : (
                <p className="mt-1.5 text-fg-3">Tidak ditautkan</p>
              )}
            </div>
          </div>

          {/* Instruksi */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Instruksi &amp; ruang lingkup</p>
            <p className="mt-2 text-sm text-fg-2 leading-relaxed whitespace-pre-line">{wo.description || 'Tidak ada catatan instruksi tambahan.'}</p>
            {(wo.outputText || wo.fileUrl) && (
              <div className="mt-2 space-y-1 text-sm">
                {wo.outputText && (
                  <p className="text-fg">
                    <span className="font-semibold">Output: </span>
                    {wo.outputText}
                  </p>
                )}
                {wo.fileUrl && sanitizeExternalUrl(wo.fileUrl) !== '#' && (
                  <a href={sanitizeExternalUrl(wo.fileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline break-all">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    Buka file kerja
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Checklist */}
          {wo.checklist.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">
                Checklist · {completedChecklistCount}/{wo.checklist.length}
              </p>
              <ul className="mt-2 space-y-0.5">
                {wo.checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!canExecute || isBusy}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`w-full min-h-[40px] px-1 rounded-xl text-left flex items-center gap-3 text-sm ${canExecute ? 'hover:bg-muted/60 cursor-pointer' : 'cursor-default'}`}
                    >
                      {item.done ? <CheckSquare className="w-5 h-5 text-success-solid shrink-0" /> : <Square className="w-5 h-5 text-line-strong shrink-0" />}
                      <span className={item.done ? 'line-through text-fg-3' : 'text-fg'}>{item.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bukti & output */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Bukti &amp; output</p>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${wo.requireEvidence ? 'bg-warm-soft text-warm' : 'bg-muted text-fg-3'}`}>
                {wo.requireEvidence ? 'Wajib saat diajukan' : 'Opsional'}
              </span>
            </div>
            {canExecute ? (
              <form onSubmit={handleSaveEvidenceOnly} className="mt-2 space-y-2.5">
                <div className="relative">
                  <Link2 className="w-4 h-4 text-fg-3 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={evidenceUrlInput}
                    onChange={(e) => setEvidenceUrlInput(e.target.value)}
                    placeholder="Tempel link Google Docs / Drive sebagai bukti..."
                    aria-label="Tautan bukti"
                    className="w-full min-h-[48px] pl-11 pr-4 rounded-2xl border border-line-strong bg-surface text-sm outline-none focus:border-primary"
                  />
                </div>
                <input
                  type="text"
                  value={evidenceNoteInput}
                  onChange={(e) => setEvidenceNoteInput(e.target.value)}
                  placeholder="Catatan hasil singkat (opsional)"
                  aria-label="Catatan hasil"
                  className="w-full min-h-[44px] px-4 rounded-2xl border border-line bg-surface text-sm outline-none focus:border-primary"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {safeExternalEvidence !== '#' ? (
                    <a href={safeExternalEvidence} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline">
                      Buka bukti tersimpan <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-fg-3">{wo.requireEvidence ? 'Wajib diisi sebelum WO bisa diajukan ke PM.' : 'Belum ada tautan bukti tersimpan.'}</span>
                  )}
                  <button type="submit" disabled={isBusy} className="min-h-[38px] px-4 rounded-full bg-muted text-fg text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary-soft">
                    <Save className="w-3.5 h-3.5 text-primary" />
                    Simpan bukti
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-2 text-sm space-y-2">
                {safeExternalEvidence !== '#' ? (
                  <a href={safeExternalEvidence} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary inline-flex items-center gap-1 hover:underline">
                    Buka tautan bukti hasil <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-fg-3">Tidak ada tautan bukti dilampirkan.</p>
                )}
                {wo.evidenceNote && <p className="p-3 rounded-2xl bg-muted text-fg">{wo.evidenceNote}</p>}
              </div>
            )}
          </div>

          {/* Kirim pesan WO ke PIC (WhatsApp) */}
          <div className="rounded-[22px] bg-success-soft px-4 py-3.5 flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-success-solid text-on-ink flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-fg">{isPM ? 'Kirim pesan WO ke PIC' : 'Bagikan WO ke WhatsApp'}</span>
              <span className="block text-xs text-success truncate">
                {isPM ? 'Template Rakai · nomor dari Profil · opsi tutorial AI' : 'Ringkasan status, tenggat, dan PIC'}
              </span>
            </span>
            {isPM ? (
              <button
                type="button"
                onClick={() => setWaOpen(true)}
                className="shrink-0 min-h-[38px] px-4 rounded-full bg-success-solid text-on-ink text-xs font-semibold hover:opacity-90"
                aria-label={`Kirim pesan WhatsApp ${wo.code}`}
              >
                Kirim
              </button>
            ) : (
              <WhatsAppShareButton label={`Bagikan ${wo.code} ke WhatsApp`} text={waShareText} />
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

          {/* Riwayat */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">Riwayat · {wo.history.length}</p>
            <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
              {[...wo.history].reverse().map((entry) => {
                const actor = getUser(entry.actorId);
                return (
                  <li key={entry.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="text-fg">
                        {actor?.nickname || entry.actorId} · {entry.eventLabel}
                        {entry.fromStatus && entry.fromStatus !== entry.toStatus ? ` (${entry.fromStatus} → ${entry.toStatus})` : ''}
                      </span>
                      {entry.note && <span className="block text-xs text-fg-3 mt-0.5">{entry.note}</span>}
                    </span>
                    <span className="text-xs text-fg-3 shrink-0 tabular-nums">{formatIsoDateTimeShort(entry.at)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Sticky Footer: Contextual Role-Based Transition Buttons */}
        <div className="px-6 sm:px-7 py-4 border-t border-line bg-surface flex flex-wrap items-center justify-between gap-2.5">
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
