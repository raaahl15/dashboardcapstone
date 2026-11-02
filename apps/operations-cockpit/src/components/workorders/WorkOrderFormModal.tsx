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
        });
        closeWorkOrderForm();
        if (created && origin.type !== 'mom') {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wo-form-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EAF6FD]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B1B33] text-white">
                {isEditMode && editingWo ? editingWo.code : 'WORK ORDER BARU'}
              </span>
              {origin.type === 'mom' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6FD] text-[#0062CC]">
                  Asal: MoM {origin.trackerActionCode}
                </span>
              )}
            </div>
            <h2
              id="wo-form-modal-title"
              className="font-heading font-bold text-base text-[#0B1B33] mt-1.5"
            >
              {isEditMode
                ? `Ubah Konfigurasi ${editingWo?.code}`
                : 'Buat & Tugaskan Work Order'}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeWorkOrderForm}
            className="w-11 h-11 rounded-full hover:bg-[#EAF6FD] text-[#4A5A72] hover:text-[#0B1B33] flex items-center justify-center transition-colors shrink-0"
            aria-label="Tutup modal form Work Order"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs font-semibold text-[#991B1B] flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judul & Instruksi */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                Judul Work Order <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={240}
                placeholder="Contoh: Validasi neraca energi reaktor R-01 di DWSIM"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC] focus:ring-2 focus:ring-[#0062CC]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                Instruksi / Deskripsi Teknis
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian deliverable, acuan standar (ISO/ISA), atau kriteria penerimaan oleh PM..."
                className="w-full p-3.5 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC] focus:ring-2 focus:ring-[#0062CC]/20"
              />
            </div>
          </div>

          {/* Penanggung Jawab (Multi-select setara) */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCEBF7] space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-[#0B1B33]">
                  Penanggung Jawab (boleh lebih dari satu) <span className="text-[#B91C1C]">*</span>
                </label>
                <span className="text-[11px] font-semibold text-[#0062CC]">
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
                          ? 'bg-[#0B1B33] text-white border-[#0B1B33] shadow-xs'
                          : 'bg-white text-[#334155] border-[#C9DCEB] hover:bg-[#EAF6FD]'
                      }`}
                    >
                      <UserChip
                        uid={u.id}
                        variant="avatar-nama"
                        size="xs"
                        useNickname
                        nameClassName={
                          selected
                            ? '!text-white !font-bold'
                            : '!text-[#0B1B33] !font-semibold'
                        }
                      />
                      {selected && <Check className="w-3.5 h-3.5 text-[#4CBAF5]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pendukung (Opsional) */}
            <div className="pt-2.5 border-t border-[#DCEBF7]">
              <label className="block text-[11px] font-bold text-[#4A5A72] mb-1.5">
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
                            ? 'bg-[#EAF6FD] text-[#0062CC] border-[#0062CC]'
                            : 'bg-white text-[#4A5A72] border-[#C9DCEB] hover:bg-white/90'
                        }`}
                      >
                        <span>{u.nickname}</span>
                        {selected && <Check className="w-3 h-3 text-[#0062CC]" />}
                      </button>
                    );
                  })}
                {users.filter((u) => !assigneeIds.includes(u.id)).length === 0 && (
                  <span className="text-[11px] text-[#4A5A72] italic">
                    Seluruh anggota telah dipilih sebagai penanggung jawab.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Prioritas & Tenggat Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs font-semibold text-[#0B1B33] bg-white outline-none focus:border-[#0062CC]"
              >
                {WO_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                Tenggat Waktu <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#6B7F99] text-xs font-semibold text-[#0B1B33] bg-white outline-none focus:border-[#0062CC]"
                required
              />
            </div>
          </div>

          {/* Informasi Minggu Proyek Otomatis & Peringatan di luar W1-W16 */}
          <div
            className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              weekInfo.isOutOfRange
                ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E]'
                : 'bg-[#EAF6FD] border-[#BAE6FD] text-[#0B1B33]'
            }`}
          >
            <div className="flex items-center gap-2">
              {weekInfo.isOutOfRange ? (
                <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
              ) : (
                <Calendar className="w-4 h-4 text-[#0062CC] shrink-0" />
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
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCEBF7] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#0062CC]" />
                <span className="text-xs font-bold text-[#0B1B33]">
                  Tautan Jadwal (Opsional, pilih salah satu)
                </span>
              </div>
              {isScheduleLocked && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E2E8F0] text-[#334155]">
                  Terkunci karena WO sudah Selesai
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: 'none' as const, label: 'Tidak Ditautkan' },
                { key: 'gantt' as const, label: 'Gantt Task' },
                { key: 'weeklyPlan' as const, label: 'Weekly Plan' },
              ].map((opt) => {
                const active = linkMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={isScheduleLocked}
                    onClick={() => setLinkMode(opt.key)}
                    className={`min-h-[44px] px-3 rounded-xl text-xs font-bold border transition-all disabled:opacity-60 ${
                      active
                        ? 'bg-[#0062CC] text-white border-[#0062CC]'
                        : 'bg-white text-[#334155] border-[#C9DCEB] hover:bg-[#EAF6FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {linkMode === 'gantt' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#4A5A72] mb-1">
                  Pilih Item Gantt Chart
                </label>
                <select
                  value={linkedGanttId}
                  disabled={isScheduleLocked}
                  onChange={(e) => setLinkedGanttId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] bg-white outline-none"
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
                <label className="block text-[11px] font-semibold text-[#4A5A72] mb-1">
                  Pilih Item Weekly Planner
                </label>
                <select
                  value={linkedPlanId}
                  disabled={isScheduleLocked}
                  onChange={(e) => setLinkedPlanId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs text-[#0B1B33] bg-white outline-none"
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
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCEBF7] space-y-2.5">
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-[#0062CC]" />
              <span className="text-xs font-bold text-[#0B1B33]">
                Checklist Langkah Kerja (Opsional)
              </span>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1.5">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#DCEBF7] text-xs"
                  >
                    <span className="text-[#0B1B33] font-medium">
                      {idx + 1}. {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistStep(item.id)}
                      className="w-8 h-8 rounded-full text-[#4A5A72] hover:bg-[#FEE2E2] hover:text-[#B91C1C] flex items-center justify-center shrink-0"
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
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs bg-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddChecklistStep}
                className="min-h-[44px] px-4 rounded-xl bg-white hover:bg-[#EAF6FD] text-[#0062CC] border border-[#C9DCEB] text-xs font-bold inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Toggle Bukti Wajib Saat Submit (Opsional per WO, default mati) */}
          <label className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#EAF6FD]/60 border border-[#C9DCEB] cursor-pointer">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-[#0062CC] mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#0B1B33] block">
                  Wajibkan Tautan Bukti Hasil Saat Submit
                </span>
                <span className="text-[11px] text-[#4A5A72]">
                  Jika aktif, penanggung jawab wajib melampirkan URL bukti (Drive/dokumen) sebelum mengajukan review ke PM.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requireEvidence}
              onChange={(e) => setRequireEvidence(e.target.checked)}
              className="w-5 h-5 accent-[#0062CC] rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAF6FD]">
            <button
              type="button"
              onClick={closeWorkOrderForm}
              className="min-h-[44px] px-5 rounded-full text-xs font-bold text-[#4A5A72] hover:bg-[#F1F5F9] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-6 rounded-full bg-[#0062CC] hover:bg-[#0057B8] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-all"
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
