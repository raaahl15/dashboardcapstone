import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  FileText,
  Link2,
  ListChecks,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import {
  WorkOrderChecklistItem,
  WorkOrderOrigin,
  WorkOrderPriority,
  WorkOrderScheduleLink,
} from '../../types';
import {
  WO_PRIORITIES,
  computeProjectWeekFromDate,
  formatYmdToIndonesian,
  getDefaultDueDateYmd,
} from '../../utils/workOrderHelpers';
import { formatWaPhone, markWaAutoOpen, normalizeWaPhone } from '../../utils/waTemplates';

export const WorkOrderFormModal: React.FC = () => {
  const {
    isPM,
    isWorkOrderFormOpen,
    workOrderFormDraft,
    closeWorkOrderForm,
    workOrders,
    createWorkOrder,
    updateWorkOrderMeta,
    openWorkOrderDetail,
    users,
    ganttTasks,
    weeklyPlans,
    config,
  } = useApp();

  const editingWo = useMemo(() => {
    if (!workOrderFormDraft?.editingWorkOrderId) return undefined;
    return workOrders.find((w) => w.id === workOrderFormDraft.editingWorkOrderId);
  }, [workOrderFormDraft, workOrders]);

  const isEditMode = Boolean(editingWo);
  const isScheduleLocked = editingWo?.status === 'Selesai';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [supporterIds, setSupporterIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<WorkOrderPriority>('Normal');
  const [dueDate, setDueDate] = useState(() => getDefaultDueDateYmd(7));
  const [linkMode, setLinkMode] = useState<'none' | 'gantt' | 'weeklyPlan'>('none');
  const [linkedGanttId, setLinkedGanttId] = useState('');
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [origin, setOrigin] = useState<WorkOrderOrigin>({ type: 'manual' });
  const [checklist, setChecklist] = useState<WorkOrderChecklistItem[]>([]);
  const [newStepText, setNewStepText] = useState('');
  const [requireEvidence, setRequireEvidence] = useState(false);
  const [outputText, setOutputText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isWorkOrderFormOpen) return;

    if (editingWo) {
      setTitle(editingWo.title);
      setDescription(editingWo.description);
      setAssigneeIds(editingWo.assigneeIds);
      setSupporterIds(editingWo.supporterIds);
      setPriority(editingWo.priority);
      setDueDate(editingWo.dueDate);
      if (editingWo.scheduleLink.type === 'gantt') {
        setLinkMode('gantt');
        setLinkedGanttId(editingWo.scheduleLink.taskId);
        setLinkedPlanId(weeklyPlans[0]?.id || '');
      } else if (editingWo.scheduleLink.type === 'weeklyPlan') {
        setLinkMode('weeklyPlan');
        setLinkedPlanId(editingWo.scheduleLink.planId);
        setLinkedGanttId(ganttTasks[0]?.id || '');
      } else {
        setLinkMode('none');
        setLinkedGanttId(ganttTasks[0]?.id || '');
        setLinkedPlanId(weeklyPlans[0]?.id || '');
      }
      setOrigin(editingWo.origin);
      setChecklist(editingWo.checklist);
      setRequireEvidence(editingWo.requireEvidence);
      setOutputText(editingWo.outputText || '');
      setFileUrl(editingWo.fileUrl || '');
    } else {
      const draft = workOrderFormDraft;
      setTitle(draft?.title || '');
      setDescription(draft?.description || '');
      setAssigneeIds(
        draft?.assigneeIds && draft.assigneeIds.length > 0
          ? draft.assigneeIds
          : [users[1]?.id || users[0]?.id || 'user-ihsan']
      );
      setSupporterIds(draft?.supporterIds || []);
      setPriority(draft?.priority || 'Normal');
      setDueDate(draft?.dueDate || getDefaultDueDateYmd(7));
      if (draft?.scheduleLink?.type === 'gantt') {
        setLinkMode('gantt');
        setLinkedGanttId(draft.scheduleLink.taskId);
        setLinkedPlanId(weeklyPlans[0]?.id || '');
      } else if (draft?.scheduleLink?.type === 'weeklyPlan') {
        setLinkMode('weeklyPlan');
        setLinkedPlanId(draft.scheduleLink.planId);
        setLinkedGanttId(ganttTasks[0]?.id || '');
      } else {
        setLinkMode('none');
        setLinkedGanttId(ganttTasks[0]?.id || '');
        setLinkedPlanId(weeklyPlans[0]?.id || '');
      }
      setOrigin(draft?.origin || { type: 'manual' });
      setChecklist(draft?.checklist || []);
      // Default bukti wajib = false (opsional per WO)
      setRequireEvidence(Boolean(draft?.requireEvidence));
      setOutputText('');
      setFileUrl('');
    }

    setNewStepText('');
    setErrorMsg('');
    setIsSaving(false);
  }, [isWorkOrderFormOpen, editingWo, workOrderFormDraft, users, ganttTasks, weeklyPlans]);

  useEffect(() => {
    if (!isWorkOrderFormOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWorkOrderForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkOrderFormOpen, closeWorkOrderForm]);

  const weekInfo = useMemo(
    () => computeProjectWeekFromDate(dueDate, config.projectStartDate),
    [dueDate, config.projectStartDate]
  );

  if (!isWorkOrderFormOpen || !isPM) return null;

  const toggleAssignee = (uid: string) => {
    setAssigneeIds((prev) => {
      const exists = prev.includes(uid);
      const next = exists ? prev.filter((id) => id !== uid) : [...prev, uid];
      return next;
    });
    // Hapus dari pendukung jika dipilih sebagai penanggung jawab utama
    setSupporterIds((prev) => prev.filter((id) => id !== uid));
  };

  const toggleSupporter = (uid: string) => {
    if (assigneeIds.includes(uid)) return;
    setSupporterIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAddChecklistStep = () => {
    const clean = newStepText.trim();
    if (!clean) return;
    setChecklist((prev) => [
      ...prev,
      {
        id: `chk-${Date.now()}-${prev.length}`,
        text: clean,
        done: false,
      },
    ]);
    setNewStepText('');
  };

  const handleRemoveChecklistStep = (stepId: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== stepId));
  };

  const buildScheduleLink = (): WorkOrderScheduleLink => {
    if (linkMode === 'gantt' && linkedGanttId) {
      return { type: 'gantt', taskId: linkedGanttId };
    }
    if (linkMode === 'weeklyPlan' && linkedPlanId) {
      return { type: 'weeklyPlan', planId: linkedPlanId };
    }
    return { type: 'none' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Judul Work Order wajib diisi.');
      return;
    }
    if (assigneeIds.length === 0) {
      setErrorMsg('Pilih minimal satu penanggung jawab.');
      return;
    }
    if (!dueDate) {
      setErrorMsg('Tanggal tenggat wajib diisi.');
      return;
    }

    // Jika masih ada teks langkah kerja yang belum ditekan Tambah, ikut sertakan
    const finalChecklist = newStepText.trim()
      ? [
          ...checklist,
          {
            id: `chk-${Date.now()}-auto`,
            text: newStepText.trim(),
            done: false,
          },
        ]
      : checklist;

    const scheduleLink = buildScheduleLink();

    setIsSaving(true);
    try {
      if (isEditMode && editingWo) {
        await updateWorkOrderMeta(editingWo.id, {
          title: title.trim(),
          description: description.trim(),
          assigneeIds,
          supporterIds,
          priority,
          dueDate,
          scheduleLink,
          checklist: finalChecklist,
          requireEvidence,
          outputText,
          fileUrl,
        });
        closeWorkOrderForm();
      } else {
        const created = await createWorkOrder({
          title: title.trim(),
          description: description.trim(),
          assigneeIds,
          supporterIds,
          priority,
          dueDate,
          scheduleLink,
          origin,
          checklist: finalChecklist,
          requireEvidence,
          outputText,
          fileUrl,
        });
        closeWorkOrderForm();
        if (created && origin.type !== 'mom') {
          markWaAutoOpen(created.id); // panel WA "Ditugaskan" langsung terbuka
          openWorkOrderDetail(created.id);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyimpan Work Order.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wo-form-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ink text-on-ink">
                {isEditMode && editingWo ? editingWo.code : 'WORK ORDER BARU'}
              </span>
              {origin.type === 'mom' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-primary">
                  Asal: MoM {origin.trackerActionCode}
                </span>
              )}
            </div>
            <h2
              id="wo-form-modal-title"
              className="font-heading font-bold text-base text-fg mt-1.5"
            >
              {isEditMode
                ? `Ubah Konfigurasi ${editingWo?.code}`
                : 'Buat & Tugaskan Work Order'}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeWorkOrderForm}
            className="w-11 h-11 rounded-full hover:bg-muted text-fg-3 hover:text-fg flex items-center justify-center transition-colors shrink-0"
            aria-label="Tutup modal form Work Order"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-danger-soft border border-danger-line text-xs font-semibold text-danger flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judul & Instruksi */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-fg mb-1">
                Judul Work Order <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={240}
                placeholder="Contoh: Validasi neraca energi reaktor R-101 di DWSIM"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-line-strong text-xs text-fg outline-none focus:border-primary focus:ring-2 focus:ring-focus/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1">
                Instruksi / Deskripsi Teknis
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian deliverable, acuan standar (ISO/ISA), atau kriteria penerimaan oleh PM..."
                className="w-full p-3.5 rounded-xl border border-line-strong text-xs text-fg outline-none focus:border-primary focus:ring-2 focus:ring-focus/20"
              />
            </div>

            {/* Output & Link file (opsional, ikut ke template pesan WA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  Output yang Diserahkan
                </label>
                <input
                  type="text"
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  maxLength={1000}
                  placeholder="Contoh: Bab 2 rev1 (.docx) + tabel neraca massa"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-line-strong text-xs text-fg outline-none focus:border-primary focus:ring-2 focus:ring-focus/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  Link File Kerja (Drive/Docs/Sheets)
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  maxLength={1000}
                  placeholder="https://docs.google.com/..."
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-line-strong text-xs text-fg outline-none focus:border-primary focus:ring-2 focus:ring-focus/20"
                />
              </div>
            </div>
            <p className="text-[11px] text-fg-3 -mt-1">
              Opsional. Output dan link file ikut tampil di pesan WhatsApp Work Order.
            </p>
          </div>

          {/* Penanggung Jawab (Multi-select setara) */}
          <div className="p-4 rounded-2xl bg-muted border border-line space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-fg">
                  Penanggung Jawab (boleh lebih dari satu) <span className="text-danger">*</span>
                </label>
                <span className="text-[11px] font-semibold text-primary">
                  {assigneeIds.length} dipilih
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => {
                  const selected = assigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAssignee(u.id)}
                      className={`min-h-[44px] px-3 rounded-full text-xs font-semibold border flex items-center gap-2 transition-all ${
                        selected
                          ? 'bg-ink text-on-ink border-fg shadow-xs'
                          : 'bg-surface text-fg-2 border-line hover:bg-muted'
                      }`}
                    >
                      <UserChip
                        uid={u.id}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                        nameClassName={
                          selected
                            ? '!text-on-ink !font-bold'
                            : '!text-fg !font-semibold'
                        }
                      />
                      {selected && <Check className="w-3.5 h-3.5 text-on-ink-accent" />}
                    </button>
                  );
                })}
              </div>
              {assigneeIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  {assigneeIds.map((uid) => {
                    const u = users.find((x) => x.id === uid);
                    const wa = normalizeWaPhone(u?.phone);
                    return (
                      <span key={uid} className={wa ? 'text-success font-semibold' : 'text-warm font-semibold'}>
                        WA {u?.nickname || uid}: {wa ? formatWaPhone(wa) : 'belum ada (isi di Profil)'}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pendukung (Opsional) */}
            <div className="pt-2.5 border-t border-line">
              <label className="block text-[11px] font-bold text-fg-3 mb-1.5">
                Anggota Pendukung (Opsional — tidak memegang kewajiban submit)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {users
                  .filter((u) => !assigneeIds.includes(u.id))
                  .map((u) => {
                    const selected = supporterIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleSupporter(u.id)}
                        className={`min-h-[38px] px-3 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                          selected
                            ? 'bg-muted text-primary border-primary'
                            : 'bg-surface text-fg-3 border-line hover:bg-surface/90'
                        }`}
                      >
                        <span>{u.nickname}</span>
                        {selected && <Check className="w-3 h-3 text-primary" />}
                      </button>
                    );
                  })}
                {users.filter((u) => !assigneeIds.includes(u.id)).length === 0 && (
                  <span className="text-[11px] text-fg-3 italic">
                    Seluruh anggota telah dipilih sebagai penanggung jawab.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Prioritas & Tenggat Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-fg mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-line-strong text-xs font-semibold text-fg bg-surface outline-none focus:border-primary"
              >
                {WO_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg mb-1">
                Tenggat Waktu <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-line-strong text-xs font-semibold text-fg bg-surface outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Informasi Minggu Proyek Otomatis & Peringatan di luar W1-W16 */}
          <div
            className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              weekInfo.isOutOfRange
                ? 'bg-warm-soft border-warm-line text-warm'
                : 'bg-muted border-line text-fg'
            }`}
          >
            <div className="flex items-center gap-2">
              {weekInfo.isOutOfRange ? (
                <AlertTriangle className="w-4 h-4 text-warm shrink-0" />
              ) : (
                <Calendar className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className="font-semibold">
                Tenggat {formatYmdToIndonesian(dueDate)} jatuh pada{' '}
                <strong>
                  Minggu Proyek ke-{weekInfo.week} (W{weekInfo.week})
                </strong>
              </span>
            </div>
            {weekInfo.isOutOfRange && (
              <span className="text-[11px] font-bold">
                Peringatan: Di luar rentang standar Minggu 1–16
              </span>
            )}
          </div>

          {/* Tautan Jadwal Eksklusif (Tidak ditautkan | Gantt Task | Weekly Plan) */}
          <div className="p-4 rounded-2xl bg-muted border border-line space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-fg">
                  Tautan Jadwal (Opsional, pilih salah satu)
                </span>
              </div>
              {isScheduleLocked && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-fg-2">
                  Terkunci karena WO sudah Selesai
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: 'none' as const, label: 'Tidak Ditautkan' },
                { key: 'gantt' as const, label: 'Gantt Task' },
                { key: 'weeklyPlan' as const, label: 'Weekly Plan (arsip)' },
              ]
                // Weekly Plan sudah diarsipkan (P2, LOG-032): hanya tampil bila WO ini memang tertaut ke sana
                .filter((opt) => opt.key !== 'weeklyPlan' || linkMode === 'weeklyPlan')
                .map((opt) => {
                const active = linkMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={isScheduleLocked}
                    onClick={() => setLinkMode(opt.key)}
                    className={`min-h-[44px] px-3 rounded-xl text-xs font-bold border transition-all disabled:opacity-60 ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface text-fg-2 border-line hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {linkMode === 'gantt' && (
              <div>
                <label className="block text-[11px] font-semibold text-fg-3 mb-1">
                  Pilih Item Gantt Chart
                </label>
                <select
                  value={linkedGanttId}
                  disabled={isScheduleLocked}
                  onChange={(e) => setLinkedGanttId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs text-fg bg-surface outline-none"
                >
                  {ganttTasks.map((gt) => (
                    <option key={gt.id} value={gt.id}>
                      [W{gt.startWeek}–W{gt.endWeek}] {gt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkMode === 'weeklyPlan' && (
              <div>
                <label className="block text-[11px] font-semibold text-fg-3 mb-1">
                  Pilih Item Weekly Planner
                </label>
                <select
                  value={linkedPlanId}
                  disabled={isScheduleLocked}
                  onChange={(e) => setLinkedPlanId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs text-fg bg-surface outline-none"
                >
                  {weeklyPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      [W{plan.week}] {plan.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Checklist Langkah Kerja */}
          <div className="p-4 rounded-2xl bg-muted border border-line space-y-2.5">
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-fg">
                Checklist Langkah Kerja (Opsional)
              </span>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1.5">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface border border-line text-xs"
                  >
                    <span className="text-fg font-medium">
                      {idx + 1}. {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistStep(item.id)}
                      className="w-8 h-8 rounded-full text-fg-3 hover:bg-danger-soft hover:text-danger flex items-center justify-center shrink-0"
                      aria-label={`Hapus langkah ${item.text}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistStep();
                  }
                }}
                placeholder="Tambah sub-langkah teknis lalu klik Tambah..."
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-line-strong text-xs bg-surface outline-none"
              />
              <button
                type="button"
                onClick={handleAddChecklistStep}
                className="min-h-[44px] px-4 rounded-xl bg-surface hover:bg-muted text-primary border border-line text-xs font-bold inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Toggle Bukti Wajib Saat Submit (Opsional per WO, default mati) */}
          <label className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-muted/60 border border-line cursor-pointer">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-fg block">
                  Wajibkan Tautan Bukti Hasil Saat Submit
                </span>
                <span className="text-[11px] text-fg-3">
                  Jika aktif, penanggung jawab wajib melampirkan URL bukti (Drive/dokumen) sebelum mengajukan review ke PM.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requireEvidence}
              onChange={(e) => setRequireEvidence(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
            <button
              type="button"
              onClick={closeWorkOrderForm}
              className="min-h-[44px] px-5 rounded-full text-xs font-bold text-fg-3 hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-6 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary text-xs font-bold shadow-xs transition-all"
            >
              {isSaving
                ? 'Menyimpan...'
                : isEditMode
                ? 'Simpan Perubahan'
                : 'Tugaskan Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
