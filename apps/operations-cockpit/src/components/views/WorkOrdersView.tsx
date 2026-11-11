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
      {/* BILAH ALAT v2.0: mode tampilan, lingkup, filter, dan ringkasan sebaris */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-line" role="tablist" aria-label="Mode tampilan Work Order">
            <button type="button" role="tab" aria-selected={viewMode === 'board'} onClick={() => setViewMode('board')} className={`min-h-[40px] px-4 rounded-full text-[13px] inline-flex items-center gap-1.5 whitespace-nowrap transition-all ${
                viewMode === 'board' ? 'bg-surface text-fg font-semibold shadow-xs' : 'text-fg-2 font-medium hover:text-fg'
              }`}>
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button type="button" role="tab" aria-selected={viewMode === 'list'} onClick={() => setViewMode('list')} className={`min-h-[40px] px-4 rounded-full text-[13px] inline-flex items-center gap-1.5 whitespace-nowrap transition-all ${
                viewMode === 'list' ? 'bg-surface text-fg font-semibold shadow-xs' : 'text-fg-2 font-medium hover:text-fg'
              }`}>
              <List className="w-3.5 h-3.5" />
              Daftar
            </button>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-line">
            <button type="button" onClick={() => setAssigneeFilter(currentUser.id)} className={`min-h-[40px] px-4 rounded-full text-[13px] inline-flex items-center gap-1.5 whitespace-nowrap transition-all ${
                assigneeFilter === currentUser.id ? 'bg-surface text-fg font-semibold shadow-xs' : 'text-fg-2 font-medium hover:text-fg'
              }`}>
              <UserCheck className="w-3.5 h-3.5" />
              Milik Saya
            </button>
            <button type="button" onClick={() => setAssigneeFilter('ALL')} className={`min-h-[40px] px-4 rounded-full text-[13px] inline-flex items-center gap-1.5 whitespace-nowrap transition-all ${
                assigneeFilter === 'ALL' ? 'bg-surface text-fg font-semibold shadow-xs' : 'text-fg-2 font-medium hover:text-fg'
              }`}>
              Semua Tim
            </button>
          </div>

          <span className="hidden xl:block w-px h-7 bg-line" aria-hidden="true" />

          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} aria-label="Filter Penanggung Jawab" className="min-h-[40px] w-[150px] pl-4 pr-2 rounded-full bg-surface border border-line text-[13px] font-medium text-fg outline-none focus:border-primary">
            <option value="ALL">PIC: Semua</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                PIC: {u.nickname} ({u.code})
              </option>
            ))}
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | WorkOrderPriority)} aria-label="Filter Prioritas" className="min-h-[40px] w-[150px] pl-4 pr-2 rounded-full bg-surface border border-line text-[13px] font-medium text-fg outline-none focus:border-primary">
            <option value="ALL">Prioritas: Semua</option>
            {WO_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Prioritas: {p}
              </option>
            ))}
          </select>

          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            aria-label="Filter Minggu Proyek"
            className={`min-h-[40px] w-[150px] pl-4 pr-2 rounded-full bg-surface border border-line text-[13px] font-medium text-fg outline-none focus:border-primary ${weekFilter !== 'ALL' ? '!bg-primary-soft !border-primary !text-fg-2' : ''}`}
          >
            <option value="ALL">Minggu: Semua</option>
            {availableWeekOptions.map((w) => (
              <option key={w} value={String(w)}>
                Minggu W{w}
                {w < PROJECT_MIN_WEEK || w > PROJECT_MAX_WEEK ? ' (Luar W1–16)' : ''}
              </option>
            ))}
          </select>

          <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value as OriginFilter)} aria-label="Filter Sumber Work Order" className="min-h-[40px] w-[150px] pl-4 pr-2 rounded-full bg-surface border border-line text-[13px] font-medium text-fg outline-none focus:border-primary">
            <option value="ALL">Sumber: Semua</option>
            <option value="manual">Sumber: Manual</option>
            <option value="mom">Sumber: Action MoM</option>
          </select>

          {viewMode === 'list' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | WorkOrderStatus)}
              aria-label="Filter Status Work Order"
              className="min-h-[40px] w-[150px] pl-4 pr-2 rounded-full bg-surface border border-line text-[13px] font-medium text-fg outline-none focus:border-primary"
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
              className="min-h-[40px] px-3.5 rounded-full text-[13px] font-semibold text-primary hover:bg-muted inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {isPM && (
            <button
              type="button"
              onClick={() => openWorkOrderForm()}
              className="ml-auto min-h-[44px] px-5 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-cockpit-card transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Work Order
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-fg-3 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode WO atau judul..."
              aria-label="Cari Work Order"
              className="w-full min-h-[40px] pl-10 pr-4 rounded-full bg-surface border border-line text-[13px] text-fg placeholder:text-fg-3 outline-none focus:border-primary"
            />
          </div>

          <label className="text-[13px] font-medium text-fg-2 inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-primary" />
            <span>Tampilkan dibatalkan</span>
          </label>

          {/* Ringkasan sebaris (menggantikan 4 kartu KPI) */}
          <p className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-sm tabular-nums" aria-live="polite">
            <span className="font-semibold text-fg">
              {kpiStats.activeCount} aktif{assigneeFilter === 'ALL' ? '' : ' (terfilter)'}
            </span>
            <span className={kpiStats.awaitingReviewCount > 0 ? 'font-semibold text-warm' : 'text-fg-2'}>
              {kpiStats.awaitingReviewCount} menunggu review
            </span>
            <span className={kpiStats.blockedCount > 0 ? 'font-semibold text-danger' : 'text-fg-2'}>
              {kpiStats.blockedCount} blocked
            </span>
            <span className={kpiStats.overdueCount > 0 ? 'font-semibold text-warm' : 'text-fg-2'}>
              {kpiStats.overdueCount} terlambat
            </span>
            <span className="text-fg-3">· {filteredWorkOrders.length} ditampilkan</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOADING / CONTENT */}
      {/* ========================================================================= */}
      {!isWorkOrdersLoaded ? (
        <div className="glass-card p-10 text-center text-xs font-semibold text-fg-3">
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
                className="glass-card p-3 flex flex-col gap-3 min-h-[340px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 px-2 pt-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colCfg.dot}`} />
                    <h2 className="text-sm font-semibold text-fg truncate !font-[Inter]">
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
                    <div className="py-10 px-3 text-center rounded-[24px] border border-dashed border-line-strong">
                      <p className="text-xs text-fg-2 font-medium">
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
                          className={`w-full text-left p-4 rounded-[24px] bg-surface border shadow-cockpit-card hover:shadow-cockpit-pop transition-all space-y-3 focus:outline-none focus:ring-2 focus:ring-focus ${
                            overdue
                              ? 'border-danger-line'
                              : wo.needsRevision && wo.status === 'Dikerjakan'
                              ? 'border-warm-line'
                              : 'border-transparent'
                          }`}
                        >
                          {/* Top Badges Row */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-xs font-semibold tracking-wide text-fg-3">
                              {wo.code}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {wo.needsRevision && wo.status === 'Dikerjakan' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warm-soft text-warm border border-warm-line">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Revisi
                                </span>
                              )}
                              <WorkOrderPriorityBadge priority={wo.priority} size="xs" />
                            </div>
                          </div>

                          {/* Title */}
                          <p className="text-sm font-semibold text-fg leading-snug line-clamp-3">{wo.title}</p>

                          {/* Callouts for Blocked / Revision */}
                          {wo.status === 'Blocked' && wo.blockedReason && (
                            <p className="text-[11px] text-danger bg-danger-soft/80 px-2.5 py-1.5 rounded-xl line-clamp-2">
                              <strong>Blocked:</strong> {wo.blockedReason}
                            </p>
                          )}
                          {wo.status === 'Dikerjakan' &&
                            wo.needsRevision &&
                            wo.revisionNote && (
                              <p className="text-[11px] text-warm bg-warm-soft/80 px-2.5 py-1.5 rounded-xl line-clamp-2">
                                <strong>Catatan PM:</strong> {wo.revisionNote}
                              </p>
                            )}

                          {/* Tags: Origin, Schedule, Checklist, Evidence */}
                          {(wo.origin.type === 'mom' || scheduleLabel || wo.requireEvidence) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {wo.origin.type === 'mom' && (
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-fg-2 font-semibold">
                                  MoM {wo.origin.trackerActionCode}
                                </span>
                              )}
                              {scheduleLabel && (
                                <span
                                  className="px-2.5 py-0.5 rounded-full bg-primary-soft text-fg-2 font-semibold inline-flex items-center gap-1 max-w-full truncate"
                                  title={scheduleLabel}
                                >
                                  <Link2 className="w-2.5 h-2.5 shrink-0 text-primary" />
                                  <span className="truncate">{scheduleLabel}</span>
                                </span>
                              )}
                              {wo.requireEvidence && (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                                    wo.evidenceUrl
                                      ? 'bg-success-soft text-success'
                                      : 'bg-warm-soft text-warm'
                                  }`}
                                >
                                  <FileCheck2 className="w-2.5 h-2.5" />
                                  {wo.evidenceUrl ? 'Bukti OK' : 'Bukti Wajib'}
                                </span>
                              )}
                            </div>
                          )}

                          {wo.checklist.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-fg-3">
                                <span>Checklist</span>
                                <span className="font-semibold text-fg-2 tabular-nums">
                                  {doneSteps}/{wo.checklist.length}
                                </span>
                              </div>
                              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${doneSteps === wo.checklist.length ? 'bg-success-solid' : 'bg-primary'}`}
                                  style={{ width: `${Math.max(3, Math.round((doneSteps / wo.checklist.length) * 100))}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Footer: penanggung jawab & tenggat */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center min-w-0">
                              {wo.assigneeIds.slice(0, 3).map((uid) => (
                                <UserChip
                                  key={`${wo.id}-pic-${uid}`}
                                  uid={uid}
                                  variant="avatar"
                                  size="xs"
                                  avatarClassName="w-7 h-7 -ml-1 first:ml-0 rounded-full text-[10px] font-semibold ring-2 ring-surface"
                                />
                              ))}
                              {wo.assigneeIds.length > 3 && (
                                <span className="-ml-1 w-7 h-7 rounded-full bg-ink text-on-ink text-[10px] font-semibold ring-2 ring-surface inline-flex items-center justify-center">
                                  +{wo.assigneeIds.length - 3}
                                </span>
                              )}
                              {wo.supporterIds.length > 0 && (
                                <span className="text-[11px] text-fg-3 font-medium ml-1.5 whitespace-nowrap" title={`${wo.supporterIds.length} pendukung`}>
                                  +{wo.supporterIds.length}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs tabular-nums shrink-0 ${overdue ? 'font-semibold text-warm' : isWeekOut ? 'text-warm' : 'text-fg-3'}`}
                              title={isWeekOut ? 'Tenggat berada di luar rentang minggu proyek W1–W16' : undefined}
                            >
                              {overdue
                                ? `Terlambat ${Math.abs(daysDelta)}h`
                                : `${formatYmdToIndonesian(wo.dueDate)} · W${wo.projectWeek}${isWeekOut ? ' (!)' : ''}`}
                            </span>
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
              <p className="font-heading font-bold text-sm text-fg">
                Tidak ada Work Order yang cocok dengan filter aktif
              </p>
              <p className="text-xs text-fg-3">
                Ubah filter di atas{isPM ? ' atau buat Work Order baru untuk menugaskan pekerjaan.' : '.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-glass-stroke bg-surface/75">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-line bg-muted text-[10px] font-heading font-bold uppercase tracking-wider text-fg-3">
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
                <tbody className="divide-y divide-line text-xs">
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
                        className="hover:bg-muted/55 transition-colors cursor-pointer"
                      >
                        <td className="p-3.5 font-mono font-extrabold text-primary whitespace-nowrap">
                          {wo.code}
                        </td>

                        <td className="p-3.5 max-w-[300px]">
                          <p className="font-heading font-bold text-xs text-fg leading-snug">
                            {wo.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {scheduleLabel && (
                              <span className="px-2 py-0.5 rounded-md bg-muted text-fg-2 text-[10px] font-semibold inline-flex items-center gap-1 max-w-[240px] truncate">
                                <Link2 className="w-2.5 h-2.5 shrink-0 text-primary" />
                                <span className="truncate">{scheduleLabel}</span>
                              </span>
                            )}
                            {wo.checklist.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-muted text-fg-2 text-[10px] font-bold inline-flex items-center gap-1">
                                <ListChecks className="w-2.5 h-2.5 text-primary" />
                                {doneSteps}/{wo.checklist.length}
                              </span>
                            )}
                            {wo.requireEvidence && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  wo.evidenceUrl
                                    ? 'bg-success-soft text-success'
                                    : 'bg-warm-soft text-warm'
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
                                nameClassName="!text-xs !font-semibold !text-fg"
                              />
                            ))}
                          </div>
                          {wo.supporterIds.length > 0 && (
                            <span className="text-[10px] text-fg-3 block mt-1">
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
                                overdue ? 'text-danger' : 'text-fg'
                              }`}
                            >
                              {formatYmdToIndonesian(wo.dueDate)}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isWeekOut
                                    ? 'bg-warm-soft text-warm'
                                    : 'bg-muted text-fg-2'
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
                            <span className="px-2.5 py-0.5 rounded-full bg-muted text-primary text-[10px] font-bold">
                              MoM • {wo.origin.trackerActionCode}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-muted text-fg-3 text-[10px] font-semibold">
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
                            className="min-h-[36px] px-3.5 rounded-full bg-surface hover:bg-primary hover:text-on-primary text-primary border border-line text-[11px] font-bold transition-colors"
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
