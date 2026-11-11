import React, { useState } from 'react';
import { usePageAction } from '../layout/navigation';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { GanttTaskStatus, WeeklyPlanItem } from '../../types';
import {
  formatYmdToIndonesian,
  getDaysUntilDue,
  getLinkedScheduleProgress,
  getTodayLocalYmd,
  isWorkOrderOverdue,
} from '../../utils/workOrderHelpers';
import {
  WorkOrderOverdueBadge,
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from '../workorders/WorkOrderBadges';
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Filter,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  X,
} from 'lucide-react';

const GANTT_STATUSES: GanttTaskStatus[] = [
  'Selesai',
  'Berjalan',
  'Belum',
  'Terlambat',
  'Perlu dicek',
];

const GANTT_STATUS_STYLES: Record<GanttTaskStatus, string> = {
  Selesai: 'bg-success-solid',
  Berjalan: 'bg-primary',
  Belum: 'bg-fg-3',
  Terlambat: 'bg-danger-solid',
  'Perlu dicek': 'bg-warm-solid',
};

const GANTT_WEEK_COUNT = 18;
const GANTT_WEEKS: Array<{
  week: number;
  date: string;
  month: string;
  isHoliday?: boolean;
}> = [
  { week: 1, date: '17 Agu', month: 'Agustus' },
  { week: 2, date: '24 Agu', month: 'Agustus' },
  { week: 3, date: '31 Agu', month: 'Agustus' },
  { week: 4, date: '7 Sep', month: 'September' },
  { week: 5, date: '14 Sep', month: 'September' },
  { week: 6, date: '21 Sep', month: 'September' },
  { week: 7, date: '28 Sep', month: 'September' },
  { week: 8, date: '5 Okt', month: 'Oktober', isHoliday: true },
  { week: 9, date: '12 Okt', month: 'Oktober', isHoliday: true },
  { week: 10, date: '19 Okt', month: 'Oktober' },
  { week: 11, date: '26 Okt', month: 'Oktober' },
  { week: 12, date: '2 Nov', month: 'November' },
  { week: 13, date: '9 Nov', month: 'November' },
  { week: 14, date: '16 Nov', month: 'November' },
  { week: 15, date: '23 Nov', month: 'November' },
  { week: 16, date: '30 Nov', month: 'November' },
  { week: 17, date: '7 Des', month: 'Desember' },
  { week: 18, date: '14 Des', month: 'Desember' },
];

const GANTT_MONTHS = [
  { name: 'Agustus 2026', weeks: 3 },
  { name: 'September 2026', weeks: 4 },
  { name: 'Oktober 2026', weeks: 4 },
  { name: 'November 2026', weeks: 4 },
  { name: 'Desember 2026', weeks: 3 },
];

const getCurrentGanttWeek = () => {
  const firstWeek = new Date(2026, 7, 17);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.min(
    GANTT_WEEK_COUNT,
    Math.max(1, Math.floor((today.getTime() - firstWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)
  );
};

export const ScheduleView: React.FC = () => {
  const {
    weeklyPlans,
    addWeeklyPlan,
    updateWeeklyPlan,
    deleteWeeklyPlan,
    ganttTasks,
    addGanttTask,
    updateGanttTask,
    deleteGanttTask,
    ganttPhases,
    addGanttPhase,
    updateGanttPhase,
    deleteGanttPhase,
    users,
    getUser,
    isPM,
    workOrders,
    setSelectedWorkOrderId,
    openWorkOrderForm,
  } = useApp();

  const [selectedPicFilter, setSelectedPicFilter] = useState<string>('All');
  const [inspectLinkedTarget, setInspectLinkedTarget] = useState<{
    linkType: 'gantt' | 'weeklyPlan';
    targetId: string;
    label: string;
  } | null>(null);
  const todayYmd = getTodayLocalYmd();
  const currentGanttWeek = getCurrentGanttWeek();
  // Weekly Planner = tampilan Gantt minggu berjalan (P2, LOG-032)
  const thisWeekTasks = ganttTasks.filter(
    (t) => t.startWeek <= currentGanttWeek && t.endWeek >= currentGanttWeek
  );

  // Modals
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanWeek, setNewPlanWeek] = useState(5);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanPic, setNewPlanPic] = useState('user-ihsan');
  const [newPlanOutput, setNewPlanOutput] = useState('');
  const [newPlanStatus, setNewPlanStatus] = useState<WeeklyPlanItem['status']>('Planning');
  const [newPlanDocTag, setNewPlanDocTag] = useState('');
  const [editingWeeklyPlanId, setEditingWeeklyPlanId] = useState<string | null>(null);

  const [showAddGanttModal, setShowAddGanttModal] = useState(false);
  const [newGanttName, setNewGanttName] = useState('');
  const [newGanttPhase, setNewGanttPhase] = useState(2);
  const [newGanttPic, setNewGanttPic] = useState('user-ihsan');
  const [newGanttStart, setNewGanttStart] = useState(5);
  const [newGanttEnd, setNewGanttEnd] = useState(6);
  const [newGanttIsStageGateMilestone, setNewGanttIsStageGateMilestone] = useState(false);
  const [newGanttStatus, setNewGanttStatus] = useState<GanttTaskStatus>('Belum');
  const [editingGanttTaskId, setEditingGanttTaskId] = useState<string | null>(null);
  const [ganttFormError, setGanttFormError] = useState('');
  const [showGanttPhaseModal, setShowGanttPhaseModal] = useState(false);
  const [editingGanttPhaseId, setEditingGanttPhaseId] = useState<number | null>(null);
  const [ganttPhaseName, setGanttPhaseName] = useState('');
  const [ganttPhaseFormError, setGanttPhaseFormError] = useState('');

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newPlanTitle.trim();
    const output = newPlanOutput.trim();
    if (!title || !output) return;

    const weekLabel = `Week ${newPlanWeek}: ${GANTT_WEEKS[newPlanWeek - 1]?.date} — ${title}`;
    const docTag = newPlanDocTag.trim() || `W${String(newPlanWeek).padStart(2, '0')}`;
    const planData = {
      week: newPlanWeek,
      weekLabel,
      title,
      pic: newPlanPic,
      status: newPlanStatus,
      keyOutput: output,
      docTag,
    };

    if (editingWeeklyPlanId) {
      updateWeeklyPlan(editingWeeklyPlanId, planData);
    } else {
      addWeeklyPlan(planData);
    }

    setEditingWeeklyPlanId(null);
    setNewPlanTitle('');
    setNewPlanOutput('');
    setNewPlanDocTag('');
    setNewPlanStatus('Planning');
    setShowAddPlanModal(false);
  };

  const openAddPlanModal = () => {
    setEditingWeeklyPlanId(null);
    setNewPlanWeek(5);
    setNewPlanTitle('');
    setNewPlanPic('user-ihsan');
    setNewPlanOutput('');
    setNewPlanStatus('Planning');
    setNewPlanDocTag('');
    setShowAddPlanModal(true);
  };

  const openEditPlanModal = (plan: WeeklyPlanItem) => {
    setEditingWeeklyPlanId(plan.id);
    setNewPlanWeek(plan.week);
    setNewPlanTitle(plan.title);
    setNewPlanPic(plan.pic || plan.picCode || 'user-ihsan');
    setNewPlanOutput(plan.keyOutput);
    setNewPlanStatus(plan.status);
    setNewPlanDocTag(plan.docTag.replace(/\s*\/?\s*DRAFT\b/gi, '').trim());
    setShowAddPlanModal(true);
  };

  const handleSaveGantt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGanttName.trim()) return;

    if (newGanttStart > newGanttEnd) {
      setGanttFormError('Minggu selesai harus sama dengan atau setelah minggu mulai.');
      return;
    }

    const taskData = {
      phaseId: newGanttPhase,
      phaseName: ganttPhases.find((phase) => phase.id === newGanttPhase)?.name || '',
      name: newGanttName.trim(),
      pic: newGanttPic,
      picCode: newGanttPic,
      startWeek: newGanttStart,
      endWeek: newGanttEnd,
      isStageGateMilestone: newGanttIsStageGateMilestone,
      status: newGanttStatus,
    };

    if (editingGanttTaskId) {
      updateGanttTask(editingGanttTaskId, taskData);
    } else {
      addGanttTask(taskData);
    }

    setNewGanttName('');
    setNewGanttIsStageGateMilestone(false);
    setNewGanttStatus('Belum');
    setEditingGanttTaskId(null);
    setGanttFormError('');
    setShowAddGanttModal(false);
  };

  const openAddGanttModal = () => {
    setEditingGanttTaskId(null);
    setNewGanttName('');
    setNewGanttPhase(ganttPhases[0]?.id ?? 1);
    setNewGanttPic('user-ihsan');
    setNewGanttStart(5);
    setNewGanttEnd(6);
    setNewGanttIsStageGateMilestone(false);
    setNewGanttStatus('Belum');
    setGanttFormError('');
    setShowAddGanttModal(true);
  };

  const openEditGanttModal = (task: (typeof ganttTasks)[number]) => {
    setEditingGanttTaskId(task.id);
    setNewGanttName(task.name);
    setNewGanttPhase(task.phaseId);
    setNewGanttPic(task.pic || task.picCode || task.picName || 'user-ihsan');
    setNewGanttStart(task.startWeek);
    setNewGanttEnd(task.endWeek);
    setNewGanttIsStageGateMilestone(Boolean(task.isStageGateMilestone));
    setNewGanttStatus(task.status || 'Belum');
    setGanttFormError('');
    setShowAddGanttModal(true);
  };

  const openAddGanttPhaseModal = () => {
    setEditingGanttPhaseId(null);
    setGanttPhaseName('');
    setGanttPhaseFormError('');
    setShowGanttPhaseModal(true);
  };

  const openEditGanttPhaseModal = (phaseId: number, name: string) => {
    setEditingGanttPhaseId(phaseId);
    setGanttPhaseName(name);
    setGanttPhaseFormError('');
    setShowGanttPhaseModal(true);
  };

  const handleSaveGanttPhase = (e: React.FormEvent) => {
    e.preventDefault();
    const name = ganttPhaseName.trim();
    if (!name) {
      setGanttPhaseFormError('Nama fase harus diisi.');
      return;
    }
    const duplicateName = ganttPhases.some(
      (phase) =>
        phase.id !== editingGanttPhaseId &&
        phase.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (duplicateName) {
      setGanttPhaseFormError('Nama fase tersebut sudah digunakan.');
      return;
    }

    if (editingGanttPhaseId === null) {
      const phaseId = addGanttPhase({ name });
      setNewGanttPhase(phaseId);
    } else {
      updateGanttPhase(editingGanttPhaseId, { name });
    }

    setShowGanttPhaseModal(false);
    setGanttPhaseFormError('');
  };

  const selectedFilterUser = selectedPicFilter === 'All' ? undefined : getUser(selectedPicFilter);

  usePageAction('schedule', () => isPM && openAddGanttModal());

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* STACKED LAYOUT: Weekly Planner (Top) & Interactive Gantt (Bottom) */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-5">
        {/* ==================== TOP: Rencana Minggu Ini (dari Gantt, P2 LOG-032) ==================== */}
        <div className="space-y-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <li className="bg-hero rounded-[32px] p-6 shadow-cockpit-pop flex flex-col justify-between gap-4 min-h-[200px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-ink-2">Rencana minggu ini</p>
              <p className="font-heading text-6xl font-extralight leading-none tabular-nums">W{currentGanttWeek}</p>
              <p className="text-[13px] leading-relaxed text-on-ink-2">
                {thisWeekTasks.length} task Gantt berjalan (mulai {GANTT_WEEKS[currentGanttWeek - 1]?.date} 2026). Diambil
                otomatis dari Gantt; dikerjakan lewat Work Order.
              </p>
            </li>
            {thisWeekTasks.length === 0 && (
              <li className="glass-card !rounded-[28px] p-5 text-[13px] text-fg-3 flex items-center xl:col-span-4">
                Tidak ada task Gantt yang berjalan di W{currentGanttWeek}.
              </li>
            )}
            {thisWeekTasks.map((task) => {
              const woProgress = getLinkedScheduleProgress(workOrders, 'gantt', task.id, todayYmd);
              const picRef = task.pic || task.picCode;
              return (
                <li
                  key={task.id}
                  className={`glass-card !rounded-[28px] p-5 flex flex-col justify-between gap-4 min-h-[200px] ${
                    task.isCritical ? '!border-warm' : ''
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.12em] truncate ${
                        task.isCritical ? 'text-warm' : 'text-fg-3'
                      }`}
                      title={task.phaseName}
                    >
                      {task.isCritical ? 'Jalur kritis · ' : ''}
                      {task.phaseName}
                    </p>
                    <p className="text-sm font-semibold leading-snug text-fg line-clamp-3">{task.name}</p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-fg-3">
                      {picRef && picRef !== 'ALL' ? (
                        <UserChip uid={picRef} variant="avatar-nama" size="xs" useNickname />
                      ) : (
                        <span>Semua anggota</span>
                      )}
                      <span className="tabular-nums shrink-0">
                        W{task.startWeek}–W{task.endWeek}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {woProgress.total > 0 ? (
                        <button
                          type="button"
                          onClick={() => setInspectLinkedTarget({ linkType: 'gantt', targetId: task.id, label: task.name })}
                          className="min-h-[32px] px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 bg-primary-soft text-fg-2"
                        >
                          <ClipboardList className="w-3 h-3 shrink-0" />
                          {woProgress.completed}/{woProgress.total} WO
                          {woProgress.overdue > 0 ? ` · ${woProgress.overdue} terlambat` : ''}
                        </button>
                      ) : (
                        <span className="text-[11px] text-fg-3">Belum ada WO</span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-on-ink shrink-0 ${
                          GANTT_STATUS_STYLES[task.status || 'Belum']
                        }`}
                      >
                        {task.status || 'Belum'}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {weeklyPlans.length > 0 && (
            <details className="rounded-2xl bg-surface/50 border border-glass-stroke p-3">
              <summary className="cursor-pointer text-xs font-bold text-fg-2 min-h-[32px] flex items-center">
                Arsip Weekly Plan lama ({weeklyPlans.length}) — tidak lagi ditambah; WO yang tertaut tetap berlaku
              </summary>
          <div
            className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {weeklyPlans.map((plan) => {
              const picRef = plan.pic || plan.picCode;
              const woProgress = getLinkedScheduleProgress(
                workOrders,
                'weeklyPlan',
                plan.id,
                todayYmd
              );
              return (
                <div
                  key={plan.id}
                  className="p-4 rounded-2xl bg-surface/70 border border-glass-stroke shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserChip
                        uid={picRef}
                        variant="avatar"
                        size="md"
                        avatarClassName="w-8 h-8 rounded-full font-heading font-bold text-xs"
                      />
                      <div className="min-w-0">
                        <h4 className="font-heading font-bold text-xs text-fg truncate">
                          {plan.weekLabel}
                        </h4>
                        <p className="text-[10px] text-fg-3 mt-0.5">
                          {GANTT_WEEKS[plan.week - 1]?.date} 2026
                          {GANTT_WEEKS[plan.week - 1]?.isHoliday ? ' • UTS, Libur' : ''}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-fg-3 mt-0.5">
                          <span>PIC:</span>
                          <UserChip
                            uid={picRef}
                            variant="avatar-nama-jabatan"
                            size="xs"
                            useNickname
                            inlineTitle
                            avatarClassName="hidden"
                            nameClassName="!text-[11px] !font-medium !text-fg-3"
                            titleClassName="!text-[10px] !text-fg-3"
                          />
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                        plan.status === 'Done'
                          ? 'bg-success-soft text-success'
                          : plan.status === 'In Progress'
                          ? 'bg-warm-soft text-warm'
                          : 'bg-muted text-fg-2'
                      }`}
                    >
                      {plan.status === 'Done' ? (
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {plan.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-fg-3">
                    <span className="font-bold text-fg text-[10px] uppercase tracking-wider block mb-0.5">
                      KEY OUTPUT:
                    </span>
                    <p className="text-[11px] leading-relaxed">{plan.keyOutput}</p>
                  </div>

                  {woProgress.total > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setInspectLinkedTarget({
                            linkType: 'weeklyPlan',
                            targetId: plan.id,
                            label: plan.weekLabel,
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border transition-all hover:shadow-xs ${
                          woProgress.completed === woProgress.total
                            ? 'bg-success-soft text-success border-success-line'
                            : 'bg-muted text-primary border-line'
                        }`}
                      >
                        <ClipboardList className="w-3 h-3 shrink-0" />
                        <span>
                          {woProgress.completed}/{woProgress.total} WO selesai
                        </span>
                      </button>
                      {woProgress.overdue > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setInspectLinkedTarget({
                              linkType: 'weeklyPlan',
                              targetId: plan.id,
                              label: plan.weekLabel,
                            })
                          }
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-solid text-on-ink inline-flex items-center gap-1"
                        >
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>{woProgress.overdue} terlambat</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[10px] text-fg-3">
                    <span className="font-mono font-semibold">
                      {plan.docTag.replace(/\s*\/?\s*DRAFT\b/gi, '').trim()}
                    </span>
                    {isPM && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditPlanModal(plan)}
                          className="hover:text-primary"
                          title="Edit Weekly Plan"
                          aria-label={`Edit Weekly Plan ${plan.title}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWeeklyPlan(plan.id)}
                          className="hover:text-danger"
                          title="Hapus Plan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
            </details>
          )}
        </div>

        {/* ==================== BOTTOM: Full-width Interactive Gantt Chart ==================== */}
        <div className="glass-card w-full p-5 sm:p-6 space-y-4">
          {/* Top Controls: Filter PIC & Add Task */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-fg">Filter PIC:</span>
              <button
                type="button"
                onClick={() => setSelectedPicFilter('All')}
                className={`min-h-[44px] px-3.5 rounded-full text-xs font-semibold transition-all ${
                  selectedPicFilter === 'All'
                    ? 'bg-ink text-on-ink shadow-xs'
                    : 'bg-surface text-fg-3 border border-line hover:bg-muted'
                }`}
              >
                All
              </button>
              {users.map((u) => {
                const isSelected = selectedPicFilter === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedPicFilter(u.id)}
                    className={`min-h-[44px] px-3.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-ink text-on-ink shadow-xs'
                        : 'bg-surface text-fg-3 border border-line hover:bg-muted'
                    }`}
                  >
                    {u.nickname}
                  </button>
                );
              })}
            </div>

            {isPM && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openAddGanttPhaseModal}
                  className="min-h-[44px] px-4 bg-surface hover:bg-muted text-primary rounded-full text-xs font-bold flex items-center gap-1.5 border border-line transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Fase
                </button>
                <button
                  type="button"
                  onClick={openAddGanttModal}
                  disabled={ganttPhases.length === 0}
                  className="min-h-[44px] px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-on-primary rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Task Gantt
                </button>
              </div>
            )}
          </div>

          {/* Active Filter Notice Banner */}
          <div className="p-3 bg-muted rounded-2xl border border-glass-stroke flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span className="text-fg font-medium text-[11px]">
                {selectedPicFilter === 'All'
                  ? 'Menampilkan 18 minggu: 17 Agustus–14 Desember 2026 (5 & 12 Oktober libur UTS)'
                  : `Filter aktif: ${selectedFilterUser?.nickname || selectedPicFilter} (task anggota lain ditampilkan transparan 35% dengan garis putus-putus)`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold">
              {GANTT_STATUSES.map((status) => (
                <span key={status} className="flex items-center gap-1 text-fg-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${GANTT_STATUS_STYLES[status]}`}
                  />
                  {status}
                </span>
              ))}
              <span className="flex items-center gap-1 text-warm">
                <span className="w-2.5 h-2.5 rounded-sm bg-warm-solid"></span>
                Stage-gate milestone
              </span>
              <span className="flex items-center gap-1 text-fg-2">
                <span className="w-0.5 h-3 bg-primary"></span>
                Minggu berjalan (W{currentGanttWeek})
              </span>
            </div>
          </div>

          {/* Gantt Table Container */}
          <div className="overflow-x-auto border border-line rounded-2xl bg-surface relative">
            <div className="min-w-[1440px]">
              {/* Header: Months & Weeks (6 label cols + 18 week cols = 24 cols) */}
              <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] text-center text-xs font-bold border-b border-line bg-muted">
                <div className="col-span-6 p-2 text-left pl-3 text-fg uppercase text-[11px] font-heading">
                  WBS PHASE &amp; DELIVERABLE
                </div>
                {GANTT_MONTHS.map((month) => (
                  <div
                    key={month.name}
                    className="p-2 text-primary border-l border-line"
                    style={{ gridColumn: `span ${month.weeks} / span ${month.weeks}` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>

              {/* Sub-Header: Weekly dates */}
              <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] text-center text-[10px] font-mono font-bold text-fg-3 border-b border-line bg-surface">
                <div className="col-span-6 p-1.5 text-left pl-3 font-sans text-fg flex items-center justify-between pr-2">
                  <span>Task Name / Responsible</span>
                  <span className="text-[9px] font-bold text-fg-3">18 WEEKS</span>
                </div>
                {GANTT_WEEKS.map((week) => (
                  <div
                    key={week.week}
                    className={`p-1 border-l border-line leading-tight ${
                      week.week === currentGanttWeek
                        ? 'bg-primary-soft text-fg-2 font-extrabold'
                        : week.isHoliday
                        ? 'bg-warm-soft text-warm'
                        : ''
                    }`}
                    title={`W${week.week}: ${week.date} 2026${week.isHoliday ? ' — UTS, Libur' : ''}`}
                  >
                    <span className="block">W{week.week}</span>
                    <span className="block text-[8px] font-sans">{week.date}</span>
                    {week.isHoliday && (
                      <span className="block text-[7px] font-sans font-extrabold">UTS</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Stage Governance Banner */}
              <div className="p-1.5 bg-muted text-[10px] font-bold text-primary px-3 border-b border-line flex items-center justify-between">
                <span>STAGE GOVERNANCE</span>
                <span>• Tahap 2: Conceptual &amp; Basic Engineering (FEED)</span>
              </div>

              {/* Gantt Rows */}
              <div className="divide-y divide-line text-xs relative">
                {/* Current week marker */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10 border-r-2 border-primary"
                  style={{
                    left: `${(6 / 24) * 100 + ((currentGanttWeek - 1) / GANTT_WEEK_COUNT) * ((GANTT_WEEK_COUNT / 24) * 100)}%`,
                  }}
                  title={`Minggu berjalan: W${currentGanttWeek}`}
                />

                {/* Render Task Rows grouped by Phase */}
                {ganttPhases.map((phase) => {
                  const tasksInPhase = ganttTasks.filter((t) => t.phaseId === phase.id);

                  return (
                    <React.Fragment key={phase.id}>
                      {/* Phase Group Header */}
                      <div className="min-h-10 p-2 bg-muted text-[11px] font-heading font-extrabold text-fg pl-3 flex items-center justify-between gap-2">
                        <span className="min-w-0 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                          <span className="truncate">{phase.name}</span>
                        </span>
                        {isPM && (
                          <span className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditGanttPhaseModal(phase.id, phase.name)}
                              className="w-7 h-7 rounded-full text-fg-3 hover:bg-muted hover:text-primary flex items-center justify-center"
                              title={`Edit fase ${phase.name}`}
                              aria-label={`Edit fase ${phase.name}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={ganttPhases.length <= 1}
                              onClick={() => {
                                const taskCount = tasksInPhase.length;
                                const taskWarning = taskCount
                                  ? ` ${taskCount} task di fase ini juga akan dihapus.`
                                  : '';
                                if (
                                  window.confirm(
                                    `Hapus fase "${phase.name}"?${taskWarning}`
                                  )
                                ) {
                                  deleteGanttPhase(phase.id);
                                }
                              }}
                              className="w-7 h-7 rounded-full text-fg-3 hover:bg-danger-soft hover:text-danger disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg-3 flex items-center justify-center"
                              title={
                                ganttPhases.length <= 1
                                  ? 'Minimal satu fase harus tersedia'
                                  : `Hapus fase ${phase.name}`
                              }
                              aria-label={`Hapus fase ${phase.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>

                      {tasksInPhase.map((gt) => {
                        const rawRef = gt.pic || gt.picCode || gt.picName;
                        const isAllTeam = rawRef?.toUpperCase() === 'ALL';
                        const resolvedOwner = isAllTeam ? undefined : getUser(rawRef);
                        const isMatchPic =
                          selectedPicFilter === 'All' ||
                          isAllTeam ||
                          resolvedOwner?.id === selectedPicFilter;

                        const badgeCode = isAllTeam
                          ? 'ALL'
                          : resolvedOwner?.code || '?';

                        // Bar span calculation across W1-W18
                        const startCol = Math.max(1, Math.min(GANTT_WEEK_COUNT, gt.startWeek));
                        const endCol = Math.max(startCol, Math.min(GANTT_WEEK_COUNT, gt.endWeek));
                        const duration = endCol - startCol + 1;
                        const status = GANTT_STATUSES.find((item) => item === gt.status) || 'Belum';

                        const leftPercent = ((startCol - 1) / GANTT_WEEK_COUNT) * 100;
                        const widthPercent = (duration / GANTT_WEEK_COUNT) * 100;
                        const woProgress = getLinkedScheduleProgress(
                          workOrders,
                          'gantt',
                          gt.id,
                          todayYmd
                        );

                        return (
                          <div
                            key={gt.id}
                            className={`grid grid-cols-[repeat(24,minmax(0,1fr))] items-center py-2.5 transition-all ${
                              isMatchPic ? 'bg-surface' : 'bg-muted/40 opacity-50'
                            }`}
                          >
                            {/* Task Label & PIC */}
                            <div className="col-span-6 pl-3 pr-2 flex items-start justify-between gap-2 text-fg">
                              <div className="min-w-0 space-y-1">
                                <span
                                  className="block whitespace-normal break-words text-[11px] font-semibold leading-snug"
                                  title={gt.name}
                                >
                                  {gt.name}
                                </span>
                                {woProgress.total > 0 && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInspectLinkedTarget({
                                          linkType: 'gantt',
                                          targetId: gt.id,
                                          label: gt.name,
                                        })
                                      }
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border transition-colors ${
                                        woProgress.completed === woProgress.total
                                          ? 'bg-success-soft text-success border-success-line'
                                          : 'bg-muted text-primary border-line hover:bg-primary-soft'
                                      }`}
                                    >
                                      <ClipboardList className="w-2.5 h-2.5 shrink-0" />
                                      <span>
                                        {woProgress.completed}/{woProgress.total} WO selesai
                                      </span>
                                    </button>
                                    {woProgress.overdue > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInspectLinkedTarget({
                                            linkType: 'gantt',
                                            targetId: gt.id,
                                            label: gt.name,
                                          })
                                        }
                                        className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-danger-solid text-on-ink inline-flex items-center gap-0.5"
                                        title={`${woProgress.overdue} Work Order terlambat`}
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                        <span>{woProgress.overdue}</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {isPM && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openEditGanttModal(gt)}
                                      className="w-7 h-7 rounded-full text-fg-3 hover:bg-muted hover:text-primary flex items-center justify-center"
                                      title={`Edit task ${gt.name}`}
                                      aria-label={`Edit task ${gt.name}`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Hapus task "${gt.name}" dari Gantt chart?`)) {
                                          deleteGanttTask(gt.id);
                                        }
                                      }}
                                      className="w-7 h-7 rounded-full text-fg-3 hover:bg-danger-soft hover:text-danger flex items-center justify-center"
                                      title={`Hapus task ${gt.name}`}
                                      aria-label={`Hapus task ${gt.name}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                                <UserChip
                                  uid={rawRef}
                                  variant="avatar"
                                  size="xs"
                                  className="ml-1 shrink-0"
                                />
                              </div>
                            </div>

                            {/* Gantt Bar Lane (Cols 7-24 = 18 weeks) */}
                            <div className="col-span-18 relative h-7 flex items-center px-1">
                              {GANTT_WEEKS.filter((week) => week.isHoliday).map((week) => (
                                <span
                                  key={week.week}
                                  className="absolute inset-y-0 bg-warm-soft"
                                  style={{
                                    left: `${((week.week - 1) / GANTT_WEEK_COUNT) * 100}%`,
                                    width: `${(1 / GANTT_WEEK_COUNT) * 100}%`,
                                  }}
                                  aria-hidden="true"
                                />
                              ))}
                              <div
                                onClick={
                                  woProgress.total > 0
                                    ? () =>
                                        setInspectLinkedTarget({
                                          linkType: 'gantt',
                                          targetId: gt.id,
                                          label: gt.name,
                                        })
                                    : undefined
                                }
                                className={`absolute h-6 rounded-lg text-[10px] font-bold text-on-ink flex items-center justify-center gap-1 px-2 shadow-xs transition-all ${
                                  gt.isStageGateMilestone
                                    ? 'bg-warm-solid'
                                    : GANTT_STATUS_STYLES[status]
                                } ${!isMatchPic ? 'border border-dashed border-line-strong' : ''} ${
                                  woProgress.total > 0 ? 'cursor-pointer hover:brightness-105' : ''
                                }`}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${Math.max(widthPercent, 6)}%`,
                                }}
                                title={`${gt.name} — ${status}${
                                  woProgress.total > 0
                                    ? ` • ${woProgress.completed}/${woProgress.total} WO selesai`
                                    : ''
                                }${gt.isStageGateMilestone ? ' • Stage-gate milestone' : ''}`}
                              >
                                <span className="truncate">
                                  {badgeCode}
                                  {woProgress.total > 0 && duration >= 2
                                    ? ` · ${woProgress.completed}/${woProgress.total} WO`
                                    : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer: sumber data jadwal (teks klaim statis dihapus, audit Fase 4 / LOG-028) */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-fg-3 border-t border-line">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Jadwal tersimpan di Firestore dan tersinkron antar-perangkat secara real-time.</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: Weekly Plan & Gantt Task */}
      {/* ========================================================================= */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Jadwal · Gantt PSTF 1</p>
                <h3 className="v2-modal-title">
              {editingWeeklyPlanId ? 'Edit Weekly Plan' : 'Tambah Weekly Plan Baru'}
            </h3>
              </div>
              <button type="button" onClick={() => {
                    setShowAddPlanModal(false);
                    setEditingWeeklyPlanId(null);
                  }} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSavePlan} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Minggu Ke (1-18)</label>
                  <input
                    type="number"
                    min="1"
                    max={GANTT_WEEK_COUNT}
                    value={newPlanWeek}
                    onChange={(e) => setNewPlanWeek(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">PIC</label>
                  <select
                    value={newPlanPic}
                    onChange={(e) => setNewPlanPic(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname} — {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Judul Agenda</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="Contoh: Pengujian URS dan Bab 1"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Key Output</label>
                <textarea
                  rows={2}
                  value={newPlanOutput}
                  onChange={(e) => setNewPlanOutput(e.target.value)}
                  placeholder="Luaran teknis utama yang harus diserahkan..."
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    value={newPlanStatus}
                    onChange={(e) =>
                      setNewPlanStatus(e.target.value as WeeklyPlanItem['status'])
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tag Dokumen</label>
                  <input
                    type="text"
                    value={newPlanDocTag}
                    onChange={(e) => setNewPlanDocTag(e.target.value)}
                    placeholder={`W${String(newPlanWeek).padStart(2, '0')}`}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  />
                </div>
              </div>

              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlanModal(false);
                    setEditingWeeklyPlanId(null);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  {editingWeeklyPlanId ? 'Simpan Perubahan' : 'Simpan Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGanttPhaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Jadwal · Gantt PSTF 1</p>
                <h3 className="v2-modal-title">
              {editingGanttPhaseId === null ? 'Tambah Fase Gantt' : 'Edit Nama Fase Gantt'}
            </h3>
              </div>
              <button type="button" onClick={() => {
                    setShowGanttPhaseModal(false);
                    setGanttPhaseFormError('');
                  }} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveGanttPhase} className="mt-4 space-y-3">
              <div>
                <label htmlFor="gantt-phase-name" className="block text-xs font-semibold mb-1">
                  Nama Fase
                </label>
                <input
                  id="gantt-phase-name"
                  type="text"
                  value={ganttPhaseName}
                  onChange={(e) => {
                    setGanttPhaseName(e.target.value);
                    setGanttPhaseFormError('');
                  }}
                  placeholder="Contoh: FASE 5: FINAL REVIEW (W17 - W20)"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                  autoFocus
                />
              </div>
              {ganttPhaseFormError && (
                <p className="text-xs font-medium text-danger" role="alert">
                  {ganttPhaseFormError}
                </p>
              )}
              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => {
                    setShowGanttPhaseModal(false);
                    setGanttPhaseFormError('');
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  Simpan Fase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGanttModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop v2-modal v2-form">
            <div className="v2-modal-head">
              <div className="min-w-0">
                <p className="v2-modal-eyebrow">Jadwal · Gantt PSTF 1</p>
                <h3 className="v2-modal-title">
              {editingGanttTaskId ? 'Edit Task Gantt' : 'Tambah Baris Task Gantt'}
            </h3>
              </div>
              <button type="button" onClick={() => {
                    setShowAddGanttModal(false);
                    setGanttFormError('');
                  }} className="v2-modal-close" aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveGantt} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Fase WBS</label>
                <select
                  value={newGanttPhase}
                  onChange={(e) => setNewGanttPhase(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                >
                  {ganttPhases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nama Task Deliverable</label>
                <input
                  type="text"
                  value={newGanttName}
                  onChange={(e) => setNewGanttName(e.target.value)}
                  placeholder="Contoh: 2.5 Lembar PFD Final"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">PIC</label>
                  <select
                    value={newGanttPic}
                    onChange={(e) => setNewGanttPic(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                  >
                    <option value="ALL">All Team</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} ({u.nickname})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mulai Wk (1-18)</label>
                  <input
                    type="number"
                    min="1"
                    max={newGanttEnd}
                    value={newGanttStart}
                    onChange={(e) => {
                      setNewGanttStart(Number(e.target.value));
                      setGanttFormError('');
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Selesai Wk (1-18)</label>
                  <input
                    type="number"
                    min={newGanttStart}
                    max={GANTT_WEEK_COUNT}
                    value={newGanttEnd}
                    onChange={(e) => {
                      setNewGanttEnd(Number(e.target.value));
                      setGanttFormError('');
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Status Task</label>
                <select
                  value={newGanttStatus}
                  onChange={(e) => setNewGanttStatus(e.target.value as GanttTaskStatus)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-line-strong text-xs outline-none"
                >
                  {GANTT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="min-h-[44px] px-3 rounded-xl bg-warm-soft text-warm text-xs font-semibold flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGanttIsStageGateMilestone}
                    onChange={(e) => setNewGanttIsStageGateMilestone(e.target.checked)}
                    className="accent-warm"
                  />
                  Stage-gate milestone
                </label>
              </div>

              {ganttFormError && (
                <p className="text-xs font-medium text-danger" role="alert">
                  {ganttFormError}
                </p>
              )}

              <div className="v2-modal-foot">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGanttModal(false);
                    setGanttFormError('');
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-fg-3 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  {editingGanttTaskId ? 'Simpan Perubahan' : 'Simpan Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Daftar Work Order Tertaut ke Item Jadwal */}
      {inspectLinkedTarget && (() => {
        const linkedStats = getLinkedScheduleProgress(
          workOrders,
          inspectLinkedTarget.linkType,
          inspectLinkedTarget.targetId,
          todayYmd
        );

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-linked-wo-title"
          >
            <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto bg-surface rounded-[32px] shadow-cockpit-pop space-y-4 v2-modal v2-form">
              <div className="v2-modal-head">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                    {inspectLinkedTarget.linkType === 'gantt'
                      ? 'WORK ORDER TERTAUT • GANTT TASK'
                      : 'WORK ORDER TERTAUT • WEEKLY PLAN'}
                  </span>
                  <h3
                    id="schedule-linked-wo-title"
                    className="v2-modal-title"
                  >
                    {inspectLinkedTarget.label}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-primary">
                      {linkedStats.completed}/{linkedStats.total} WO selesai
                    </span>
                    {linkedStats.overdue > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-danger-solid text-on-ink">
                        {linkedStats.overdue} terlambat
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectLinkedTarget(null)}
                  className="w-11 h-11 rounded-full bg-muted text-fg flex items-center justify-center shrink-0"
                  aria-label="Tutup daftar Work Order tertaut"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {linkedStats.items.length === 0 ? (
                <p className="text-xs text-fg-3 py-4 text-center">
                  Tidak ada Work Order aktif atau selesai pada item jadwal ini.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {linkedStats.items.map((wo) => {
                    const overdue = isWorkOrderOverdue(wo, todayYmd);
                    const daysDelta = getDaysUntilDue(wo.dueDate, todayYmd);
                    return (
                      <button
                        key={wo.id}
                        type="button"
                        onClick={() => {
                          setInspectLinkedTarget(null);
                          setSelectedWorkOrderId(wo.id);
                        }}
                        className="w-full text-left p-3.5 rounded-2xl bg-muted hover:bg-muted/70 border border-line transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-extrabold text-primary">
                              {wo.code}
                            </span>
                            <WorkOrderStatusBadge
                              status={wo.status}
                              needsRevision={wo.needsRevision}
                              size="xs"
                            />
                            <WorkOrderPriorityBadge priority={wo.priority} size="xs" />
                          </div>
                          {overdue && (
                            <WorkOrderOverdueBadge
                              daysLate={Math.abs(daysDelta)}
                              size="xs"
                            />
                          )}
                        </div>

                        <p className="font-heading font-bold text-xs text-fg leading-snug">
                          {wo.title}
                        </p>

                        <div className="v2-modal-foot">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {wo.assigneeIds.map((uid) => (
                              <UserChip
                                key={`${wo.id}-sched-${uid}`}
                                uid={uid}
                                variant="avatar-nama"
                                size="xs"
                                useNickname
                                avatarClassName="w-5 h-5 rounded-full text-[9px]"
                                nameClassName="!text-[11px] !font-semibold !text-fg-2"
                              />
                            ))}
                          </div>
                          <span
                            className={`text-[11px] font-semibold shrink-0 ${
                              overdue ? 'text-danger' : 'text-fg-3'
                            }`}
                          >
                            Tenggat: {formatYmdToIndonesian(wo.dueDate)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
                {isPM ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = inspectLinkedTarget;
                      setInspectLinkedTarget(null);
                      openWorkOrderForm({
                        scheduleLink:
                          target.linkType === 'gantt'
                            ? { type: 'gantt', taskId: target.targetId }
                            : { type: 'weeklyPlan', planId: target.targetId },
                      });
                    }}
                    className="min-h-[44px] px-4 rounded-full bg-muted hover:bg-primary-soft text-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah WO ke Jadwal Ini
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setInspectLinkedTarget(null)}
                  className="min-h-[44px] px-5 rounded-full bg-ink text-on-ink text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
