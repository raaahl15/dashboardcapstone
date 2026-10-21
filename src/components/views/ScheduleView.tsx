import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Filter,
  ShieldCheck,
} from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const {
    weeklyPlans,
    addWeeklyPlan,
    updateWeeklyPlan,
    deleteWeeklyPlan,
    ganttTasks,
    addGanttTask,
    users,
    getUser,
    isPM,
  } = useApp();

  const [selectedPicFilter, setSelectedPicFilter] = useState<string>('All');

  // Modals
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanWeek, setNewPlanWeek] = useState(5);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanPic, setNewPlanPic] = useState('user-ihsan');
  const [newPlanOutput, setNewPlanOutput] = useState('');

  const [showAddGanttModal, setShowAddGanttModal] = useState(false);
  const [newGanttName, setNewGanttName] = useState('');
  const [newGanttPhase, setNewGanttPhase] = useState(2);
  const [newGanttPic, setNewGanttPic] = useState('user-ihsan');
  const [newGanttStart, setNewGanttStart] = useState(5);
  const [newGanttEnd, setNewGanttEnd] = useState(6);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    addWeeklyPlan({
      week: newPlanWeek,
      weekLabel: `Week ${newPlanWeek}: ${newPlanTitle}`,
      title: newPlanTitle,
      pic: newPlanPic,
      status: 'Planning',
      keyOutput: newPlanOutput || 'Deliverable draf teknis sesuai target sprint.',
      docTag: `W0${newPlanWeek} / DRAFT`,
    });
    setNewPlanTitle('');
    setNewPlanOutput('');
    setShowAddPlanModal(false);
  };

  const handleCreateGantt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGanttName.trim()) return;

    const phaseNames = [
      'FASE 1: INISIASI & KONSEPTUALISASI / URS (W1 - W3)',
      'FASE 2: BASIC ENGINEERING / FEED, PFD DAN DRAF P&ID (W4 - W7)',
      'FASE 3: SKEMATIK INSTRUMENTASI & TEKNO-EKONOMI (W8 - W11)',
      'FASE 4: FINALISASI LAPORAN, OTORISASI ACC & SIDANG TENDER (W12 - W16)',
    ];

    addGanttTask({
      phaseId: newGanttPhase,
      phaseName: phaseNames[newGanttPhase - 1],
      name: newGanttName,
      pic: newGanttPic,
      picCode: newGanttPic,
      startWeek: Number(newGanttStart),
      endWeek: Number(newGanttEnd),
    });
    setNewGanttName('');
    setShowAddGanttModal(false);
  };

  const selectedFilterUser = selectedPicFilter === 'All' ? undefined : getUser(selectedPicFilter);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* HEADER COCKPIT BAR */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 bg-[#DBEAFE] text-[#1E3A8A] rounded-full text-[10px] font-bold tracking-wider font-heading uppercase">
              DME UNIT 01 • OPERATIONS
            </span>
            <span className="text-xs text-[#4A5A72] font-semibold">
              Critical Path Baseline Rev-3.2
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B1B33]">
            This is your team Schedule!
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#EAF6FD] text-[#0062CC] rounded-full text-xs font-bold flex items-center gap-2 border border-[#C9DCEB]/50">
            <Clock className="w-3.5 h-3.5" />
            <span>Current Sprint: Week 4 - Conceptual &amp; Basic Engineering</span>
          </div>

          {isPM && (
            <button
              type="button"
              onClick={() => setShowAddPlanModal(true)}
              className="min-h-[44px] px-4 py-2 bg-white hover:bg-[#EAF6FD] text-[#0B1B33] rounded-full text-xs font-bold border border-white shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0062CC]" />
              Atur Jadwal
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN LAYOUT: Weekly Planner (Left) & Interactive Gantt (Right) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================== LEFT: Weekly Planner (4 cols) ==================== */}
        <div className="lg:col-span-4 bg-white/[0.88] backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white shadow-cockpit-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-[#0B1B33]">
                Weekly Planner
              </h2>
              <p className="text-xs text-[#4A5A72]">
                {weeklyPlans.length} Sprints • Target Q4 2026
              </p>
            </div>
            {isPM && (
              <button
                type="button"
                onClick={() => setShowAddPlanModal(true)}
                className="min-h-[44px] px-4 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Plan
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {weeklyPlans.map((plan) => {
              const picRef = plan.pic || plan.picCode;
              return (
                <div
                  key={plan.id}
                  className="p-4 rounded-2xl bg-white border border-[#EAF6FD] shadow-xs hover:shadow-sm transition-all"
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
                        <h4 className="font-heading font-bold text-xs text-[#0B1B33] truncate">
                          {plan.weekLabel}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-[#4A5A72] mt-0.5">
                          <span>PIC:</span>
                          <UserChip
                            uid={picRef}
                            variant="avatar-nama-jabatan"
                            size="xs"
                            useNickname
                            inlineTitle
                            avatarClassName="hidden"
                            nameClassName="!text-[11px] !font-medium !text-[#4A5A72]"
                            titleClassName="!text-[10px] !text-[#4A5A72]"
                          />
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                        plan.status === 'Done'
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : plan.status === 'In Progress'
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#E2E8F0] text-[#334155]'
                      }`}
                    >
                      {plan.status === 'Done' ? (
                        <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {plan.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-[#4A5A72]">
                    <span className="font-bold text-[#0B1B33] text-[10px] uppercase tracking-wider block mb-0.5">
                      KEY OUTPUT:
                    </span>
                    <p className="text-[11px] leading-relaxed">{plan.keyOutput}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#EAF6FD] flex items-center justify-between text-[10px] text-[#4A5A72]">
                    <span className="font-mono font-semibold">{plan.docTag}</span>
                    {isPM && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus =
                              plan.status === 'Done'
                                ? 'In Progress'
                                : plan.status === 'In Progress'
                                ? 'Planning'
                                : 'Done';
                            updateWeeklyPlan(plan.id, { status: nextStatus });
                          }}
                          className="hover:text-[#0062CC]"
                          title="Ubah Status"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWeeklyPlan(plan.id)}
                          className="hover:text-[#B91C1C]"
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
        </div>

        {/* ==================== RIGHT: Interactive Gantt Chart (8 cols) ==================== */}
        <div className="lg:col-span-8 bg-white/[0.88] backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white shadow-cockpit-card space-y-4">
          {/* Top Controls: Filter PIC & Add Task */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#0B1B33]">Filter PIC:</span>
              <button
                type="button"
                onClick={() => setSelectedPicFilter('All')}
                className={`min-h-[44px] px-3.5 rounded-full text-xs font-semibold transition-all ${
                  selectedPicFilter === 'All'
                    ? 'bg-[#0B1B33] text-white shadow-xs'
                    : 'bg-white text-[#4A5A72] border border-[#C9DCEB] hover:bg-[#EAF6FD]'
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
                        ? 'bg-[#0B1B33] text-white shadow-xs'
                        : 'bg-white text-[#4A5A72] border border-[#C9DCEB] hover:bg-[#EAF6FD]'
                    }`}
                  >
                    {u.nickname}
                  </button>
                );
              })}
            </div>

            {isPM && (
              <button
                type="button"
                onClick={() => setShowAddGanttModal(true)}
                className="min-h-[44px] px-4 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Task Gantt
              </button>
            )}
          </div>

          {/* Active Filter Notice Banner */}
          <div className="p-3 bg-[#EAF6FD] rounded-2xl border border-white flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#0062CC]" />
              <span className="text-[#0B1B33] font-medium text-[11px]">
                {selectedPicFilter === 'All'
                  ? 'Menampilkan seluruh lintasan rekayasa 16 minggu (Fase 1 - Fase 4)'
                  : `Filter aktif: ${selectedFilterUser?.nickname || selectedPicFilter} (task anggota lain ditampilkan transparan 35% dengan garis putus-putus)`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-[#0062CC]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#007BFF]"></span> Active Lead
              </span>
              <span className="flex items-center gap-1 text-[#4A5A72]">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#6B7F99]"></span> Peer
              </span>
              <span className="flex items-center gap-1 text-[#B91C1C]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]"></span> Critical Stage-Gate
              </span>
            </div>
          </div>

          {/* Gantt Table Container */}
          <div className="overflow-x-auto border border-[#EAF6FD] rounded-2xl bg-white relative">
            <div className="min-w-[880px]">
              {/* Header: Months & Weeks (4 label cols + 16 week cols = 20 cols) */}
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] text-center text-xs font-bold border-b border-[#EAF6FD] bg-[#F8FAFC]">
                <div className="col-span-4 p-2 text-left pl-3 text-[#0B1B33] uppercase text-[11px] font-heading">
                  WBS PHASE &amp; DELIVERABLE
                </div>
                <div className="col-span-4 p-2 text-[#0062CC] border-l border-[#EAF6FD]">
                  Sep 2026 (W1–W4)
                </div>
                <div className="col-span-4 p-2 text-[#0062CC] border-l border-[#EAF6FD] bg-[#EAF6FD]/50">
                  Okt 2026 (W5–W8 • Active)
                </div>
                <div className="col-span-4 p-2 text-[#0062CC] border-l border-[#EAF6FD]">
                  Nov 2026 (W9–W12)
                </div>
                <div className="col-span-4 p-2 text-[#0062CC] border-l border-[#EAF6FD]">
                  Des 2026 (W13–W16)
                </div>
              </div>

              {/* Sub-Header: Week numbers 1 to 16 */}
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] text-center text-[10px] font-mono font-bold text-[#4A5A72] border-b border-[#EAF6FD] bg-white">
                <div className="col-span-4 p-1.5 text-left pl-3 font-sans text-[#0B1B33] flex items-center justify-between pr-2">
                  <span>Task Name / Responsible</span>
                  <span className="text-[9px] font-bold text-[#4A5A72]">16 WEEKS</span>
                </div>
                {Array.from({ length: 16 }, (_, idx) => `W${idx + 1}`).map(
                  (wk) => (
                    <div
                      key={wk}
                      className={`p-1.5 border-l border-[#EAF6FD] ${
                        wk === 'W4' ? 'bg-[#DBEAFE] text-[#1E3A8A] font-extrabold' : ''
                      }`}
                    >
                      {wk}
                    </div>
                  )
                )}
              </div>

              {/* Stage Governance Banner */}
              <div className="p-1.5 bg-[#EAF6FD] text-[10px] font-bold text-[#0062CC] px-3 border-b border-[#EAF6FD] flex items-center justify-between">
                <span>STAGE GOVERNANCE</span>
                <span>• Tahap 2: Conceptual &amp; Basic Engineering (FEED)</span>
              </div>

              {/* Gantt Rows */}
              <div className="divide-y divide-[#EAF6FD] text-xs relative">
                {/* Vertical Red Milestone Lines at W3, W7 */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10 border-r-2 border-[#B91C1C]"
                  style={{ left: `${(4 / 20) * 100 + (2.5 / 16) * ((16 / 20) * 100)}%` }}
                  title="Milestone W3: Penguncian URS"
                ></div>
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10 border-r-2 border-[#B91C1C]"
                  style={{ left: `${(4 / 20) * 100 + (6.5 / 16) * ((16 / 20) * 100)}%` }}
                  title="Milestone W7: Finalisasi PFD ISO 10628"
                ></div>

                {/* Render Task Rows grouped by Phase */}
                {[1, 2, 3, 4].map((phId) => {
                  const tasksInPhase = ganttTasks.filter((t) => t.phaseId === phId);
                  const phaseHeader = tasksInPhase[0]?.phaseName || `FASE ${phId}`;

                  return (
                    <React.Fragment key={phId}>
                      {/* Phase Group Header */}
                      <div className="p-2 bg-[#F8FAFC] text-[11px] font-heading font-extrabold text-[#0B1B33] pl-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF]"></span>
                        {phaseHeader}
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

                        // Bar span calculation across W1-W16
                        const startCol = Math.max(1, Math.min(16, gt.startWeek));
                        const endCol = Math.max(startCol, Math.min(16, gt.endWeek));
                        const duration = endCol - startCol + 1;

                        const leftPercent = ((startCol - 1) / 16) * 100;
                        const widthPercent = (duration / 16) * 100;

                        return (
                          <div
                            key={gt.id}
                            className={`grid grid-cols-[repeat(20,minmax(0,1fr))] items-center py-2.5 transition-all ${
                              isMatchPic ? 'bg-white' : 'bg-gray-50/40 opacity-50'
                            }`}
                          >
                            {/* Task Label & PIC */}
                            <div className="col-span-4 pl-3 pr-2 flex items-center justify-between gap-1 text-xs font-semibold text-[#0B1B33]">
                              <span className="truncate">{gt.name}</span>
                              <UserChip
                                uid={rawRef}
                                variant="avatar"
                                size="xs"
                                className="ml-1 shrink-0"
                              />
                            </div>

                            {/* Gantt Bar Lane (Cols 5-20 = 16 weeks) */}
                            <div className="col-span-16 relative h-7 flex items-center px-1">
                              <div
                                className={`absolute h-6 rounded-lg text-[10px] font-bold text-white flex items-center justify-center px-2 shadow-xs transition-all ${
                                  gt.isCritical
                                    ? 'bg-[#B91C1C]'
                                    : gt.isStageGateMilestone
                                    ? 'bg-[#B45309]'
                                    : 'bg-[#007BFF]'
                                } ${!isMatchPic ? 'border border-dashed border-[#6B7F99]' : ''}`}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${Math.max(widthPercent, 6)}%`,
                                }}
                              >
                                <span className="truncate">{badgeCode}</span>
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

          {/* Footer Standards Compliance */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#4A5A72] border-t border-[#EAF6FD]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
              <span>ISO 10628 &amp; ISA-5.1 Instrumentation Compliance</span>
            </div>
            <span>Thermodynamic Baseline: Peng-Robinson EOS (DWSIM v8.7)</span>
            <span className="font-mono text-[10px]">Auto-saved to EPC Server • 14:42:09 WIB</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: Add Weekly Plan & Add Gantt Task */}
      {/* ========================================================================= */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Weekly Plan Baru
            </h3>
            <form onSubmit={handleCreatePlan} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Minggu Ke (1-16)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={newPlanWeek}
                    onChange={(e) => setNewPlanWeek(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">PIC</label>
                  <select
                    value={newPlanPic}
                    onChange={(e) => setNewPlanPic(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGanttModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
              Tambah Baris Task Gantt
            </h3>
            <form onSubmit={handleCreateGantt} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Fase WBS</label>
                <select
                  value={newGanttPhase}
                  onChange={(e) => setNewGanttPhase(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                >
                  <option value={1}>Fase 1: Inisiasi &amp; URS (W1 - W3)</option>
                  <option value={2}>Fase 2: FEED, PFD &amp; P&amp;ID (W4 - W7)</option>
                  <option value={3}>Fase 3: Instrumentasi &amp; Tekno-Ekonomi (W8 - W11)</option>
                  <option value={4}>Fase 4: Finalisasi &amp; Sidang (W12 - W16)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nama Task Deliverable</label>
                <input
                  type="text"
                  value={newGanttName}
                  onChange={(e) => setNewGanttName(e.target.value)}
                  placeholder="Contoh: 2.5 Lembar PFD Final"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">PIC</label>
                  <select
                    value={newGanttPic}
                    onChange={(e) => setNewGanttPic(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} ({u.nickname})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mulai Wk</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={newGanttStart}
                    onChange={(e) => setNewGanttStart(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Selesai Wk</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={newGanttEnd}
                    onChange={(e) => setNewGanttEnd(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGanttModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4A5A72] rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
                >
                  Simpan Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
