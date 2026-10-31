import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  Filter,
  LayoutGrid,
  Link2,
  List,
  ListChecks,
  PauseCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus } from '../../types';
import {
  PROJECT_MAX_WEEK,
  PROJECT_MIN_WEEK,
  WO_ACTIVE_STATUSES,
  WO_ALL_STATUSES,
  WO_BOARD_COLUMNS,
  WO_PRIORITIES,
  extractWorkOrderSeq,
  formatYmdToIndonesian,
  getDaysUntilDue,
  getTodayLocalYmd,
  isUserWorkOrderAssignee,
  isWorkOrderOverdue,
  sortWorkOrdersForCockpit,
} from '../../utils/workOrderHelpers';
import {
  STATUS_BADGE_CONFIG,
  WorkOrderOverdueBadge,
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from '../workorders/WorkOrderBadges';

type ViewMode = 'board' | 'list';
type OriginFilter = 'ALL' | 'manual' | 'mom';

export const WorkOrdersView: React.FC = () => {
  const {
    workOrders,
    isWorkOrdersLoaded,
    setSelectedWorkOrderId,
    openWorkOrderForm,
    currentUser,
    users,
    getUser,
    isPM,
    ganttTasks,
    weeklyPlans,
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [assigneeFilter, setAssigneeFilter] = useState<string>(() =>
    isPM ? 'ALL' : currentUser.id
  );
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | WorkOrderPriority>('ALL');
  const [weekFilter, setWeekFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | WorkOrderStatus>('ALL');
  const [showCancelled, setShowCancelled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Anggota membuka menu dengan filter default "Milik saya", sedangkan PM membuka "Semua"
  useEffect(() => {
    setAssigneeFilter(isPM ? 'ALL' : currentUser.id);
  }, [currentUser.id, isPM]);

  const todayYmd = getTodayLocalYmd();

  // Metrik ringkasan operasional (mengikuti cakupan seluruh WO proyek atau milik pengguna)
  const kpiStats = useMemo(() => {
    const scoped =
      assigneeFilter === 'ALL'
        ? workOrders
        : workOrders.filter((wo) =>
            isUserWorkOrderAssignee(wo, assigneeFilter, getUser)
          );

    const active = scoped.filter((wo) => WO_ACTIVE_STATUSES.includes(wo.status));
    const awaitingReview = scoped.filter((wo) => wo.status === 'Diajukan');
    const blocked = scoped.filter((wo) => wo.status === 'Blocked');
    const overdue = active.filter((wo) => isWorkOrderOverdue(wo, todayYmd));

    return {
      activeCount: active.length,
      awaitingReviewCount: awaitingReview.length,
      blockedCount: blocked.length,
      overdueCount: overdue.length,
    };
  }, [workOrders, assigneeFilter, getUser, todayYmd]);

  const availableWeekOptions = useMemo(() => {
    const weeks = new Set<number>();
    for (let w = PROJECT_MIN_WEEK; w <= PROJECT_MAX_WEEK; w++) {
      weeks.add(w);
    }
    workOrders.forEach((wo) => {
      if (typeof wo.projectWeek === 'number' && !Number.isNaN(wo.projectWeek)) {
        weeks.add(wo.projectWeek);
      }
    });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [workOrders]);

  const resolveScheduleLabel = (wo: WorkOrder): string | null => {
    if (wo.scheduleLink.type === 'gantt') {
      const taskId = wo.scheduleLink.taskId;
      const gt = ganttTasks.find((t) => t.id === taskId);
      return gt ? `Gantt: ${gt.name}` : `Gantt (${taskId})`;
    }
    if (wo.scheduleLink.type === 'weeklyPlan') {
      const planId = wo.scheduleLink.planId;
      const wp = weeklyPlans.find((p) => p.id === planId);
      return wp ? `Plan W${wp.week}: ${wp.title}` : `Weekly Plan (${planId})`;
    }
    return null;
  };

  const filteredWorkOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return workOrders.filter((wo) => {
      if (!showCancelled && wo.status === 'Dibatalkan' && statusFilter !== 'Dibatalkan') {
        return false;
      }

      if (assigneeFilter !== 'ALL') {
        if (!isUserWorkOrderAssignee(wo, assigneeFilter, getUser)) {
          return false;
        }
      }

      if (priorityFilter !== 'ALL' && wo.priority !== priorityFilter) {
        return false;
      }

      if (weekFilter !== 'ALL' && wo.projectWeek !== Number(weekFilter)) {
        return false;
      }

      if (originFilter !== 'ALL' && wo.origin.type !== originFilter) {
        return false;
      }

      if (viewMode === 'list') {
        if (statusFilter === 'ACTIVE' && !WO_ACTIVE_STATUSES.includes(wo.status)) {
          return false;
        }
        if (
          statusFilter !== 'ALL' &&
          statusFilter !== 'ACTIVE' &&
          wo.status !== statusFilter
        ) {
          return false;
        }
      }

      if (q) {
        const hay = `${wo.code} ${wo.title} ${wo.description} ${
          wo.origin.type === 'mom' ? wo.origin.trackerActionCode : ''
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    workOrders,
    showCancelled,
    statusFilter,
    assigneeFilter,
    getUser,
    priorityFilter,
    weekFilter,
    originFilter,
    viewMode,
    searchQuery,
  ]);

  const boardColumns = useMemo<WorkOrderStatus[]>(
    () =>
      showCancelled
        ? [...WO_BOARD_COLUMNS, 'Dibatalkan']
        : WO_BOARD_COLUMNS,
    [showCancelled]
  );

  const groupedBoardItems = useMemo(() => {
    const map: Record<WorkOrderStatus, WorkOrder[]> = {
      Ditugaskan: [],
      Dikerjakan: [],
      Blocked: [],
      Diajukan: [],
      Selesai: [],
      Dibatalkan: [],
    };

    filteredWorkOrders.forEach((wo) => {
      map[wo.status].push(wo);
    });

    (Object.keys(map) as WorkOrderStatus[]).forEach((st) => {
      if (st === 'Selesai' || st === 'Dibatalkan') {
        map[st].sort((a, b) => {
          const bTs = Date.parse(b.completedAt || b.cancelledAt || b.updatedAt) || 0;
          const aTs = Date.parse(a.completedAt || a.cancelledAt || a.updatedAt) || 0;
          if (bTs !== aTs) return bTs - aTs;
          return extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code);
        });
      } else {
        map[st] = sortWorkOrdersForCockpit(map[st], todayYmd);
      }
    });

    return map;
  }, [filteredWorkOrders, todayYmd]);

  const sortedListItems = useMemo(() => {
    const activePart = sortWorkOrdersForCockpit(
      filteredWorkOrders.filter((wo) => WO_ACTIVE_STATUSES.includes(wo.status)),
      todayYmd
    );
    const closedPart = filteredWorkOrders
      .filter((wo) => !WO_ACTIVE_STATUSES.includes(wo.status))
      .sort((a, b) => {
        const bTs = Date.parse(b.completedAt || b.cancelledAt || b.updatedAt) || 0;
        const aTs = Date.parse(a.completedAt || a.cancelledAt || a.updatedAt) || 0;
        if (bTs !== aTs) return bTs - aTs;
        return extractWorkOrderSeq(b.code) - extractWorkOrderSeq(a.code);
      });
    return [...activePart, ...closedPart];
  }, [filteredWorkOrders, todayYmd]);

  const defaultAssignee = isPM ? 'ALL' : currentUser.id;
  const hasCustomFilter =
    assigneeFilter !== defaultAssignee ||
    priorityFilter !== 'ALL' ||
    weekFilter !== 'ALL' ||
    originFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    showCancelled ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setAssigneeFilter(defaultAssignee);
    setPriorityFilter('ALL');
    setWeekFilter('ALL');
    setOriginFilter('ALL');
    setStatusFilter('ALL');
    setShowCancelled(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* HEADER COCKPIT BAR */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-8 px-3.5 rounded-full bg-[#0B1B33] text-white text-[12px] font-medium tracking-normal inline-flex items-center">
            WORK ORDER • SINGLE SOURCE OF TRUTH
          </span>
          <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[#0062CC] text-[12px] font-semibold tracking-normal inline-flex items-center">
            Alur Satu Arah → Homepage • Schedule • Weekly MoM
          </span>
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.02em] leading-[1.08] text-[#0B1B33]">
              Work Order Operations
            </h1>
            <p className="text-xs sm:text-[13.5px] text-[#334155] mt-1.5">
              Pusat penugasan resmi Project Manager, pelacakan eksekusi anggota, dan persetujuan penyelesaian pekerjaan Area 1 DME.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isPM && (
              <button
                type="button"
                onClick={() => openWorkOrderForm()}
                className="min-h-[44px] px-5 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Buat Work Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 KPI SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="glass-card px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-[#4A5A72] block">
              WO Aktif ({assigneeFilter === 'ALL' ? 'Tim' : 'Terfilter'})
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B1B33] tabular-nums mt-0.5 block">
              {kpiStats.activeCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EAF6FD] text-[#0062CC] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-[#4A5A72] block">
              Menunggu Review PM
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-[#92400E] tabular-nums mt-0.5 block">
              {kpiStats.awaitingReviewCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-[#4A5A72] block">
              Status Blocked
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-[#991B1B] tabular-nums mt-0.5 block">
              {kpiStats.blockedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center shrink-0">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`rounded-[28px] px-4 py-3.5 border shadow-cockpit-card flex items-center justify-between gap-3 transition-colors ${
            kpiStats.overdueCount > 0
              ? 'bg-[#FEE2E2] border-[#FCA5A5]'
              : 'glass-card'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-semibold block ${
                kpiStats.overdueCount > 0 ? 'text-[#991B1B]' : 'text-[#4A5A72]'
              }`}
            >
              Melewati Tenggat
            </span>
            <span
              className={`font-heading text-2xl sm:text-3xl font-extrabold tabular-nums mt-0.5 block ${
                kpiStats.overdueCount > 0 ? 'text-[#B91C1C]' : 'text-[#0B1B33]'
              }`}
            >
              {kpiStats.overdueCount}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              kpiStats.overdueCount > 0
                ? 'bg-[#B91C1C] text-white'
                : 'bg-[#D1FAE5] text-[#047857]'
            }`}
          >
            {kpiStats.overdueCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW SWITCHER & FILTER CONTROLS */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Board / Daftar Tabs + Quick Scope Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="inline-flex items-center p-1 rounded-full bg-white/80 border border-[#C9DCEB]"
              role="tablist"
              aria-label="Mode tampilan Work Order"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'board'}
                onClick={() => setViewMode('board')}
                className={`min-h-[40px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                  viewMode === 'board'
                    ? 'bg-[#0B1B33] text-white shadow-xs'
                    : 'text-[#4A5A72] hover:text-[#0B1B33]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`min-h-[40px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#0B1B33] text-white shadow-xs'
                    : 'text-[#4A5A72] hover:text-[#0B1B33]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Daftar
              </button>
            </div>

            {/* Ownership Quick Switch */}
            <div className="inline-flex items-center p-1 rounded-full bg-white/80 border border-[#C9DCEB]">
              <button
                type="button"
                onClick={() => setAssigneeFilter(currentUser.id)}
                className={`min-h-[40px] px-3.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                  assigneeFilter === currentUser.id
                    ? 'bg-[#0062CC] text-white shadow-xs'
                    : 'text-[#4A5A72] hover:text-[#0B1B33]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Milik Saya
              </button>
              <button
                type="button"
                onClick={() => setAssigneeFilter('ALL')}
                className={`min-h-[40px] px-3.5 rounded-full text-xs font-bold transition-all ${
                  assigneeFilter === 'ALL'
                    ? 'bg-[#0062CC] text-white shadow-xs'
                    : 'text-[#4A5A72] hover:text-[#0B1B33]'
                }`}
              >
                Semua Tim
              </button>
            </div>
          </div>

          {/* Right: Search & Cancelled Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:flex-initial justify-end">
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#4A5A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode WO atau judul..."
                aria-label="Cari Work Order"
                className="w-full min-h-[44px] pl-9 pr-3.5 rounded-full bg-white/90 border border-[#C9DCEB] text-xs text-[#0B1B33] outline-none focus:border-[#0062CC]"
              />
            </div>

            <label className="min-h-[44px] px-3.5 rounded-full bg-white/85 border border-[#C9DCEB] text-xs font-semibold text-[#334155] inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="accent-[#0062CC]"
              />
              <span>Tampilkan Dibatalkan</span>
            </label>
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="pt-3 border-t border-[#C9DCEB]/60 flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-[#334155] inline-flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#0062CC]" />
            Filter:
          </span>

          {/* Penanggung Jawab */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Filter Penanggung Jawab"
            className="min-h-[40px] px-3 rounded-xl bg-white/90 border border-[#C9DCEB] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
          >
            <option value="ALL">Penanggung Jawab: Semua</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                PIC: {u.nickname} ({u.code})
              </option>
            ))}
          </select>

          {/* Prioritas */}
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as 'ALL' | WorkOrderPriority)
            }
            aria-label="Filter Prioritas"
            className="min-h-[40px] px-3 rounded-xl bg-white/90 border border-[#C9DCEB] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
          >
            <option value="ALL">Prioritas: Semua</option>
            {WO_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Prioritas: {p}
              </option>
            ))}
          </select>

          {/* Minggu Proyek */}
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            aria-label="Filter Minggu Proyek"
            className="min-h-[40px] px-3 rounded-xl bg-white/90 border border-[#C9DCEB] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
          >
            <option value="ALL">Minggu: Semua</option>
            {availableWeekOptions.map((w) => (
              <option key={w} value={String(w)}>
                Minggu W{w}
                {w < PROJECT_MIN_WEEK || w > PROJECT_MAX_WEEK ? ' (Luar W1–16)' : ''}
              </option>
            ))}
          </select>

          {/* Sumber */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as OriginFilter)}
            aria-label="Filter Sumber Work Order"
            className="min-h-[40px] px-3 rounded-xl bg-white/90 border border-[#C9DCEB] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
          >
            <option value="ALL">Sumber: Semua</option>
            <option value="manual">Sumber: Manual</option>
            <option value="mom">Sumber: Action MoM</option>
          </select>

          {/* Status (Khusus Tab Daftar) */}
          {viewMode === 'list' && (
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'ACTIVE' | WorkOrderStatus
                )
              }
              aria-label="Filter Status Work Order"
              className="min-h-[40px] px-3 rounded-xl bg-white/90 border border-[#C9DCEB] text-xs font-semibold text-[#0B1B33] outline-none focus:border-[#0062CC]"
            >
              <option value="ALL">Status: Semua</option>
              <option value="ACTIVE">Status: Aktif Saja</option>
              {WO_ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          )}

          {hasCustomFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[40px] px-3.5 rounded-full text-xs font-bold text-[#0062CC] hover:bg-[#EAF6FD] inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}

          <span className="ml-auto text-[11px] font-semibold text-[#4A5A72]">
            Menampilkan <strong className="text-[#0B1B33]">{filteredWorkOrders.length}</strong> Work Order
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOADING / CONTENT */}
      {/* ========================================================================= */}
      {!isWorkOrdersLoaded ? (
        <div className="glass-card p-10 text-center text-xs font-semibold text-[#4A5A72]">
          Memuat daftar Work Order...
        </div>
      ) : viewMode === 'board' ? (
        /* ==================== TAB BOARD ==================== */
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-start ${
            showCancelled ? 'xl:grid-cols-6' : 'xl:grid-cols-5'
          }`}
        >
          {boardColumns.map((colStatus) => {
            const items = groupedBoardItems[colStatus];
            const colCfg = STATUS_BADGE_CONFIG[colStatus];

            return (
              <div
                key={colStatus}
                className="glass-card p-3.5 flex flex-col gap-3 min-h-[340px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#C9DCEB]/70">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colCfg.dot}`} />
                    <h2 className="font-heading font-bold text-xs text-[#0B1B33] truncate">
                      {colStatus}
                    </h2>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums border ${colCfg.bg} ${colCfg.text} ${colCfg.border}`}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {items.length === 0 ? (
                    <div className="py-8 px-3 text-center rounded-2xl border border-dashed border-[#C9DCEB] bg-white/40">
                      <p className="text-[11px] text-[#4A5A72] font-medium">
                        Tidak ada WO di kolom {colStatus}
                      </p>
                    </div>
                  ) : (
                    items.map((wo) => {
                      const overdue = isWorkOrderOverdue(wo, todayYmd);
                      const daysDelta = getDaysUntilDue(wo.dueDate, todayYmd);
                      const isWeekOut =
                        wo.projectWeek < PROJECT_MIN_WEEK ||
                        wo.projectWeek > PROJECT_MAX_WEEK;
                      const doneSteps = wo.checklist.filter((c) => c.done).length;
                      const scheduleLabel = resolveScheduleLabel(wo);

                      return (
                        <button
                          key={wo.id}
                          type="button"
                          onClick={() => setSelectedWorkOrderId(wo.id)}
                          className={`w-full text-left p-3.5 rounded-2xl bg-white/85 hover:bg-white border shadow-xs hover:shadow-sm transition-all space-y-2.5 focus:outline-none focus:ring-2 focus:ring-[#0062CC] ${
                            overdue
                              ? 'border-[#FCA5A5]'
                              : wo.needsRevision && wo.status === 'Dikerjakan'
                              ? 'border-[#FCD34D]'
                              : 'border-white/90'
                          }`}
                        >
                          {/* Top Badges Row */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-mono text-[11px] font-extrabold text-[#0062CC]">
                              {wo.code}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {overdue && (
                                <WorkOrderOverdueBadge
                                  daysLate={Math.abs(daysDelta)}
                                  size="xs"
                                />
                              )}
                              {wo.needsRevision && wo.status === 'Dikerjakan' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Revisi
                                </span>
                              )}
                              <WorkOrderPriorityBadge priority={wo.priority} size="xs" />
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="font-heading font-bold text-xs text-[#0B1B33] leading-snug line-clamp-2">
                            {wo.title}
                          </h3>

                          {/* Callouts for Blocked / Revision */}
                          {wo.status === 'Blocked' && wo.blockedReason && (
                            <p className="text-[11px] text-[#991B1B] bg-[#FEE2E2]/80 px-2.5 py-1.5 rounded-xl line-clamp-2">
                              <strong>Blocked:</strong> {wo.blockedReason}
                            </p>
                          )}
                          {wo.status === 'Dikerjakan' &&
                            wo.needsRevision &&
                            wo.revisionNote && (
                              <p className="text-[11px] text-[#92400E] bg-[#FEF3C7]/80 px-2.5 py-1.5 rounded-xl line-clamp-2">
                                <strong>Catatan PM:</strong> {wo.revisionNote}
                              </p>
                            )}

                          {/* Tags: Origin, Schedule, Checklist, Evidence */}
                          {(wo.origin.type === 'mom' ||
                            scheduleLabel ||
                            wo.checklist.length > 0 ||
                            wo.requireEvidence) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {wo.origin.type === 'mom' && (
                                <span className="px-2 py-0.5 rounded-md bg-[#EAF6FD] text-[#0062CC] font-bold">
                                  MoM {wo.origin.trackerActionCode}
                                </span>
                              )}
                              {scheduleLabel && (
                                <span
                                  className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] font-semibold inline-flex items-center gap-1 max-w-full truncate"
                                  title={scheduleLabel}
                                >
                                  <Link2 className="w-2.5 h-2.5 shrink-0 text-[#0062CC]" />
                                  <span className="truncate">{scheduleLabel}</span>
                                </span>
                              )}
                              {wo.checklist.length > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] font-bold inline-flex items-center gap-1">
                                  <ListChecks className="w-2.5 h-2.5 text-[#0062CC]" />
                                  {doneSteps}/{wo.checklist.length}
                                </span>
                              )}
                              {wo.requireEvidence && (
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${
                                    wo.evidenceUrl
                                      ? 'bg-[#D1FAE5] text-[#065F46]'
                                      : 'bg-[#FEF3C7] text-[#92400E]'
                                  }`}
                                >
                                  <FileCheck2 className="w-2.5 h-2.5" />
                                  {wo.evidenceUrl ? 'Bukti OK' : 'Bukti Wajib'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Footer: Assignees & Due Date */}
                          <div className="pt-2 border-t border-[#EAF6FD] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 flex-wrap min-w-0">
                              {wo.assigneeIds.slice(0, 3).map((uid) => (
                                <UserChip
                                  key={`${wo.id}-pic-${uid}`}
                                  uid={uid}
                                  variant="avatar"
                                  size="xs"
                                  avatarClassName="w-6 h-6 rounded-full text-[9px] font-bold ring-1 ring-white"
                                />
                              ))}
                              {wo.assigneeIds.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#334155] text-[9px] font-bold">
                                  +{wo.assigneeIds.length - 3}
                                </span>
                              )}
                              {wo.supporterIds.length > 0 && (
                                <span
                                  className="text-[10px] text-[#4A5A72] font-medium ml-0.5"
                                  title={`${wo.supporterIds.length} pendukung`}
                                >
                                  (+{wo.supporterIds.length})
                                </span>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-[10px] font-bold inline-flex items-center gap-1 ${
                                  overdue ? 'text-[#B91C1C]' : 'text-[#334155]'
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {formatYmdToIndonesian(wo.dueDate)}
                              </span>
                              <span
                                className={`block text-[10px] font-bold ${
                                  isWeekOut ? 'text-[#B45309]' : 'text-[#4A5A72]'
                                }`}
                                title={
                                  isWeekOut
                                    ? 'Tenggat berada di luar rentang minggu proyek W1–W16'
                                    : undefined
                                }
                              >
                                W{wo.projectWeek}
                                {isWeekOut ? ' (!)' : ''}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== TAB DAFTAR ==================== */
        <div className="glass-card p-4 sm:p-5">
          {sortedListItems.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <p className="font-heading font-bold text-sm text-[#0B1B33]">
                Tidak ada Work Order yang cocok dengan filter aktif
              </p>
              <p className="text-xs text-[#4A5A72]">
                Ubah filter di atas{isPM ? ' atau buat Work Order baru untuk menugaskan pekerjaan.' : '.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/80 bg-white/75">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#EAF6FD] bg-[#F8FAFC] text-[10px] font-heading font-bold uppercase tracking-wider text-[#4A5A72]">
                    <th className="p-3.5">Kode</th>
                    <th className="p-3.5">Judul &amp; Konteks</th>
                    <th className="p-3.5">Penanggung Jawab</th>
                    <th className="p-3.5">Prioritas</th>
                    <th className="p-3.5">Tenggat &amp; Minggu</th>
                    <th className="p-3.5">Sumber</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF6FD] text-xs">
                  {sortedListItems.map((wo) => {
                    const overdue = isWorkOrderOverdue(wo, todayYmd);
                    const daysDelta = getDaysUntilDue(wo.dueDate, todayYmd);
                    const isWeekOut =
                      wo.projectWeek < PROJECT_MIN_WEEK ||
                      wo.projectWeek > PROJECT_MAX_WEEK;
                    const scheduleLabel = resolveScheduleLabel(wo);
                    const doneSteps = wo.checklist.filter((c) => c.done).length;

                    return (
                      <tr
                        key={wo.id}
                        onClick={() => setSelectedWorkOrderId(wo.id)}
                        className="hover:bg-[#EAF6FD]/55 transition-colors cursor-pointer"
                      >
                        <td className="p-3.5 font-mono font-extrabold text-[#0062CC] whitespace-nowrap">
                          {wo.code}
                        </td>

                        <td className="p-3.5 max-w-[300px]">
                          <p className="font-heading font-bold text-xs text-[#0B1B33] leading-snug">
                            {wo.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {scheduleLabel && (
                              <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] text-[10px] font-semibold inline-flex items-center gap-1 max-w-[240px] truncate">
                                <Link2 className="w-2.5 h-2.5 shrink-0 text-[#0062CC]" />
                                <span className="truncate">{scheduleLabel}</span>
                              </span>
                            )}
                            {wo.checklist.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] text-[10px] font-bold inline-flex items-center gap-1">
                                <ListChecks className="w-2.5 h-2.5 text-[#0062CC]" />
                                {doneSteps}/{wo.checklist.length}
                              </span>
                            )}
                            {wo.requireEvidence && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  wo.evidenceUrl
                                    ? 'bg-[#D1FAE5] text-[#065F46]'
                                    : 'bg-[#FEF3C7] text-[#92400E]'
                                }`}
                              >
                                {wo.evidenceUrl ? 'Bukti Terisi' : 'Bukti Wajib'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {wo.assigneeIds.map((uid) => (
                              <UserChip
                                key={`${wo.id}-row-pic-${uid}`}
                                uid={uid}
                                variant="avatar-nama"
                                size="xs"
                                useNickname
                                avatarClassName="w-5 h-5 rounded-full text-[9px]"
                                nameClassName="!text-xs !font-semibold !text-[#0B1B33]"
                              />
                            ))}
                          </div>
                          {wo.supporterIds.length > 0 && (
                            <span className="text-[10px] text-[#4A5A72] block mt-1">
                              +{wo.supporterIds.length} pendukung
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <WorkOrderPriorityBadge priority={wo.priority} size="xs" />
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-xs font-bold ${
                                overdue ? 'text-[#B91C1C]' : 'text-[#0B1B33]'
                              }`}
                            >
                              {formatYmdToIndonesian(wo.dueDate)}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isWeekOut
                                    ? 'bg-[#FEF3C7] text-[#92400E]'
                                    : 'bg-[#E2E8F0] text-[#334155]'
                                }`}
                              >
                                W{wo.projectWeek}
                                {isWeekOut ? ' • Luar W1–16' : ''}
                              </span>
                              {overdue && (
                                <WorkOrderOverdueBadge
                                  daysLate={Math.abs(daysDelta)}
                                  size="xs"
                                />
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {wo.origin.type === 'mom' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF6FD] text-[#0062CC] text-[10px] font-bold">
                              MoM • {wo.origin.trackerActionCode}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] font-semibold">
                              Manual
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <WorkOrderStatusBadge
                            status={wo.status}
                            needsRevision={wo.needsRevision}
                            size="xs"
                          />
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkOrderId(wo.id);
                            }}
                            className="min-h-[36px] px-3.5 rounded-full bg-white hover:bg-[#0062CC] hover:text-white text-[#0062CC] border border-[#C9DCEB] text-[11px] font-bold transition-colors"
                          >
                            Buka
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
