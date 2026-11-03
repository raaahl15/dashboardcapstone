import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { LogbookItem } from '../../types';
import { buildLogbookCsv, downloadText } from '../../utils/logbookExport';
import {
  Download,
  Plus,
  AlertTriangle,
  Clock,
  Info,
  Trash2,
  Check,
  Search,
  Filter,
  Users,
  Layers,
  RotateCcw,
  Edit2,
  Sparkles,
  CheckCircle2,
  X,
  BookOpen,
} from 'lucide-react';

interface EntityMeta {
  id: string; // 'team-area-1' or user UID
  name: string;
  shortName: string;
  roleTitle: string;
  category: 'kelompok' | 'anggota';
  avatarText: string;
  avatarBg: string;
}

export const LogbookView: React.FC = () => {
  const {
    logbooks,
    meetingLogs,
    addLogbook,
    updateLogbook,
    toggleLogbookVerification,
    deleteLogbook,
    resetLogbooksToDefault,
    currentUser,
    users,
    getUser,
    isPM,
  } = useApp();

  // Filter & Search states
  const [filterEntity, setFilterEntity] = useState<string>('All');
  const [filterWeek, setFilterWeek] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'verified' | 'unverified'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<LogbookItem | null>(null);

  // Form states
  const [formAuthorId, setFormAuthorId] = useState<string>(() => currentUser.id);
  const [formWeekNumber, setFormWeekNumber] = useState<number>(1);
  const [formDate, setFormDate] = useState(() =>
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  );
  const [formDesc, setFormDesc] = useState('');
  const [formIssue, setFormIssue] = useState('');
  const [formSolution, setFormSolution] = useState('');
  const [formVerified, setFormVerified] = useState(false);

  // 6 Target Entities: 1 Kelompok + 5 Anggota
  const entities: EntityMeta[] = useMemo(() => {
    const list: EntityMeta[] = [
      {
        id: 'team-area-1',
        name: 'Area 1 (Kelompok)',
        shortName: 'Kelompok A1',
        roleTitle: 'Unit Dehidrasi Metanol',
        category: 'kelompok',
        avatarText: 'A1',
        avatarBg: 'bg-gradient-to-tr from-[#0062CC] via-[#0B1B33] to-[#4338CA] text-white',
      },
    ];

    users.forEach((u) => {
      list.push({
        id: u.id,
        name: u.name,
        shortName: u.nickname || u.name.split(' ')[0],
        roleTitle: u.title || 'Engineer',
        category: 'anggota',
        avatarText: u.code || u.avatarInitial || u.name.slice(0, 2).toUpperCase(),
        avatarBg: u.avatarBg || 'bg-gradient-to-tr from-blue-700 to-indigo-800 text-white',
      });
    });

    return list;
  }, [users]);

  // Target constants
  const TARGET_PER_ENTITY = 12;
  const TOTAL_TARGET = TARGET_PER_ENTITY * entities.length; // 12 * 6 = 72

  // Statistics per entity (menghitung minggu unik 1..12 agar tidak terjadi false completion)
  const { statsByEntity, totalFilled } = useMemo(() => {
    const stats: Record<
      string,
      { total: number; verified: number; percent: number; isCompleted: boolean; uniqueWeeks: number }
    > = {};
    const entityWeeks: Record<string, Set<number>> = {};

    entities.forEach((ent) => {
      stats[ent.id] = { total: 0, verified: 0, percent: 0, isCompleted: false, uniqueWeeks: 0 };
      entityWeeks[ent.id] = new Set();
    });

    logbooks.forEach((log) => {
      const isTeam =
        log.authorId === 'team-area-1' ||
        log.authorId === 'kelompok' ||
        log.authorId === 'area-1' ||
        log.category === 'kelompok';

      const targetId = isTeam
        ? 'team-area-1'
        : (getUser(log.authorId || log.authorName || log.authorCode)?.id || log.authorId);

      if (stats[targetId]) {
        stats[targetId].total += 1;
        if (typeof log.weekNumber === 'number' && log.weekNumber >= 1 && log.weekNumber <= 12) {
          entityWeeks[targetId].add(log.weekNumber);
        }
        if (log.verifiedByLecturer) {
          stats[targetId].verified += 1;
        }
      }
    });

    let cappedFilledSum = 0;
    entities.forEach((ent) => {
      const s = stats[ent.id];
      const covered = entityWeeks[ent.id].size;
      s.uniqueWeeks = covered;
      s.percent = Math.min(100, Math.round((covered / TARGET_PER_ENTITY) * 100));
      s.isCompleted = covered >= TARGET_PER_ENTITY;
      cappedFilledSum += Math.min(TARGET_PER_ENTITY, covered);
    });

    return { statsByEntity: stats, totalFilled: cappedFilledSum };
  }, [entities, logbooks, getUser]);

  // Overall stats
  const totalVerified = useMemo(() => {
    return logbooks.filter((l) => l.verifiedByLecturer).length;
  }, [logbooks]);

  const overallVerifiedPercent = Math.min(100, Math.round((totalVerified / TOTAL_TARGET) * 100));
  const overallFilledPercent = Math.min(100, Math.round((totalFilled / TOTAL_TARGET) * 100));

  // Dynamic 24-Hour Rule Alert Box from MoM: periksa apakah MoM terbaru memiliki entri logbook kelompok untuk minggu tersebut
  const momLogbookStatus = useMemo(() => {
    if (!meetingLogs || meetingLogs.length === 0) {
      return { hasUnloggedMom: false, latestMomLabel: 'Belum ada MoM' };
    }
    const sortedMoms = [...meetingLogs].sort((a, b) => (b.week || 0) - (a.week || 0));
    const latestMom = sortedMoms[0];
    if (!latestMom) {
      return { hasUnloggedMom: false, latestMomLabel: 'Belum ada MoM' };
    }
    const hasMatchingLogbook = logbooks.some((l) => {
      const isTeam =
        l.authorId === 'team-area-1' ||
        l.authorId === 'kelompok' ||
        l.authorId === 'area-1' ||
        l.category === 'kelompok';
      return isTeam && l.weekNumber === latestMom.week;
    });
    return {
      hasUnloggedMom: !hasMatchingLogbook,
      latestMomLabel: latestMom.dayText || latestMom.weekLabel || `W${latestMom.week}`,
    };
  }, [meetingLogs, logbooks]);

  // Filtered logbooks list
  const filteredLogbooks = useMemo(() => {
    return logbooks.filter((log) => {
      const isTeam =
        log.authorId === 'team-area-1' ||
        log.authorId === 'kelompok' ||
        log.authorId === 'area-1' ||
        log.category === 'kelompok';

      const resolvedAuthorId = isTeam
        ? 'team-area-1'
        : (getUser(log.authorId || log.authorName || log.authorCode)?.id || log.authorId);

      // 1. Entity filter
      if (filterEntity !== 'All' && resolvedAuthorId !== filterEntity) {
        return false;
      }

      // 2. Week filter
      if (filterWeek !== 'All') {
        const weekNum = parseInt(filterWeek, 10);
        if (log.weekNumber !== weekNum) {
          return false;
        }
      }

      // 3. Status filter
      if (filterStatus === 'verified' && !log.verifiedByLecturer) return false;
      if (filterStatus === 'unverified' && log.verifiedByLecturer) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (log.workDescription || '').toLowerCase().includes(q);
        const issueMatch = (log.issueSolution || '').toLowerCase().includes(q);
        const dateMatch = (log.date || '').toLowerCase().includes(q);
        if (!descMatch && !issueMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [logbooks, filterEntity, filterWeek, filterStatus, searchQuery, getUser]);

  // Open Add modal with defaults
  const handleOpenAdd = (defaultEntityId?: string, defaultWeek?: number) => {
    setEditingLog(null);
    setFormAuthorId(defaultEntityId || (filterEntity !== 'All' ? filterEntity : currentUser.id));
    setFormWeekNumber(defaultWeek || (filterWeek !== 'All' ? parseInt(filterWeek, 10) : 1));
    setFormDate(
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    );
    setFormDesc('');
    setFormIssue('');
    setFormSolution('');
    setFormVerified(false);
    setShowAddModal(true);
  };

  // Close modal on Escape
  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditingLog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  // Open Edit modal
  const handleOpenEdit = (log: LogbookItem) => {
    setEditingLog(log);
    const isTeam =
      log.authorId === 'team-area-1' ||
      log.authorId === 'kelompok' ||
      log.authorId === 'area-1' ||
      log.category === 'kelompok';
    const resolvedId = isTeam
      ? 'team-area-1'
      : (getUser(log.authorId || log.authorName || log.authorCode)?.id || log.authorId);

    setFormAuthorId(resolvedId);
    setFormWeekNumber(log.weekNumber || 1);
    setFormDate(log.date || '');
    setFormDesc(log.workDescription || '');

    // Parse issue and solution
    const match = (log.issueSolution || '').match(/^Kendala:\s*([\s\S]*?);\s*Solusi:\s*([\s\S]*?)\.?$/i);
    if (match) {
      setFormIssue(match[1].trim());
      setFormSolution(match[2].trim());
    } else {
      const parts = (log.issueSolution || '').split(';');
      const rawIssue = parts[0] || '';
      const rawSol = parts.slice(1).join(';') || '';
      setFormIssue(rawIssue.replace(/^Kendala:\s*/i, '').trim());
      setFormSolution(rawSol.replace(/^Solusi:\s*/i, '').replace(/\.$/, '').trim());
    }
    setFormVerified(Boolean(log.verifiedByLecturer));
    setShowAddModal(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim()) return;

    const isTeam = formAuthorId === 'team-area-1' || formAuthorId === 'kelompok';
    const finalAuthorId = isTeam ? 'team-area-1' : (getUser(formAuthorId)?.id || formAuthorId);
    const finalCategory: 'kelompok' | 'anggota' = isTeam ? 'kelompok' : 'anggota';

    // Konfirmasi jika minggu ini sudah ada entri untuk entitas tersebut
    if (!editingLog) {
      const alreadyHasWeek = logbooks.some((l) => {
        const isTeamLog =
          l.authorId === 'team-area-1' ||
          l.authorId === 'kelompok' ||
          l.authorId === 'area-1' ||
          l.category === 'kelompok';
        const target = isTeamLog ? 'team-area-1' : (getUser(l.authorId || l.authorName || l.authorCode)?.id || l.authorId);
        return target === finalAuthorId && l.weekNumber === formWeekNumber;
      });
      if (alreadyHasWeek) {
        if (!window.confirm(`Entri logbook untuk Minggu ke-${formWeekNumber} sudah ada pada entitas ini. Buat entri tambahan untuk minggu yang sama?`)) {
          return;
        }
      }
    }

    const formattedIssueSolution = `Kendala: ${
      formIssue.trim() || 'Tidak ada kendala kritis'
    }; Solusi: ${formSolution.trim() || 'Melanjutkan sesuai jadwal'}.`;

    const nextVerified = isPM ? formVerified : Boolean(editingLog?.verifiedByLecturer);
    const nextVerifiedDate = nextVerified
      ? (editingLog?.verifiedDate || (isPM && formVerified ? formDate.trim() : undefined))
      : undefined;

    if (editingLog) {
      updateLogbook(editingLog.id, {
        authorId: finalAuthorId,
        category: finalCategory,
        weekNumber: formWeekNumber,
        date: formDate.trim(),
        workDescription: formDesc.trim(),
        issueSolution: formattedIssueSolution,
        verifiedByLecturer: nextVerified,
        verifiedDate: nextVerifiedDate,
      });
    } else {
      addLogbook({
        authorId: finalAuthorId,
        category: finalCategory,
        weekNumber: formWeekNumber,
        date: formDate.trim(),
        workDescription: formDesc.trim(),
        issueSolution: formattedIssueSolution,
      });
    }

    setShowAddModal(false);
    setEditingLog(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* TOP ZONE: Heading, Description & Action Buttons */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl xl:text-[44px] font-bold tracking-[-0.02em] leading-[1.1] text-[#0B1B33]">
              Engineering Logbook
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5A72] mt-1">
              Audit kedisiplinan logbook &amp; pemenuhan kuota <strong>12 entri untuk Area 1 (Kelompok)</strong> dan <strong>12 entri per anggota</strong> (Total 72 entri).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                downloadText(
                  `logbook_area1_${new Date().toISOString().slice(0, 10)}.csv`,
                  buildLogbookCsv(filteredLogbooks, (id) => getUser(id))
                )
              }
              disabled={filteredLogbooks.length === 0}
              className="min-h-[40px] px-4 py-2 bg-white/80 hover:bg-white text-[#0B1B33] border border-white rounded-full font-heading text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              title="Unduh entri yang sedang tampil (sesuai filter) sebagai CSV rekap untuk Simaster"
            >
              <Download className="w-3.5 h-3.5 text-[#0062CC]" />
              Ekspor CSV ({filteredLogbooks.length})
            </button>
            {isPM && totalFilled < TOTAL_TARGET && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Apakah Anda ingin melengkapi data logbook ke kuota ${TOTAL_TARGET} entri (12 Kelompok + 12 per anggota)? Seluruh catatan yang sudah dibuat tetap aman.`
                    )
                  ) {
                    resetLogbooksToDefault();
                  }
                }}
                className="min-h-[40px] px-4 py-2 bg-white/80 hover:bg-white text-[#0062CC] border border-[#0062CC]/30 rounded-full font-heading text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                title="Lengkapi data logbook menjadi 72 entri standar"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0062CC]" />
                Sinkronkan 72 Entri
              </button>
            )}

            <button
              onClick={() => handleOpenAdd()}
              className="min-h-[40px] px-5 py-2 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full font-heading text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Logbook
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL QUOTA SUMMARY & MOM ALERT */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Progress Global 72 Quota */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tabular-nums">
                  {totalFilled} / {TOTAL_TARGET}
                </span>
                <span className="text-xs font-semibold text-[#4A5A72]">
                  Entri Terisi ({totalVerified} Terparaf)
                </span>
              </div>
              <span className="text-xs font-bold text-[#0062CC] tabular-nums">
                {overallFilledPercent}% Terisi
              </span>
            </div>

            {/* Hatched bar */}
            <div className="w-full h-3.5 rounded-full bg-[#DCEBF7] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-hatch-pattern transition-all duration-500"
                style={{ width: `${overallFilledPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#4A5A72]">
              <span>Target: 12 Kelompok + 60 Anggota (5 × 12)</span>
              <span className="font-semibold text-[#047857]">
                {totalVerified} / {TOTAL_TARGET} ACC ({overallVerifiedPercent}%)
              </span>
            </div>
          </div>

          {/* Dynamic 24-Hour Rule Alert Box */}
          <div
            className={`lg:col-span-7 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
              momLogbookStatus.hasUnloggedMom
                ? 'bg-[#FEF3C7]/90 border border-[#B45309]/30 text-[#92400E]'
                : 'bg-[#D1FAE5]/90 border border-[#047857]/30 text-[#065F46]'
            }`}
          >
            {momLogbookStatus.hasUnloggedMom ? (
              <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            ) : (
              <Check className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold leading-relaxed">
                {momLogbookStatus.hasUnloggedMom
                  ? `Pengingat: MoM ${momLogbookStatus.latestMomLabel} belum memiliki entri logbook dalam 24 jam.`
                  : `Tersinkron: MoM mingguan terbaru (${momLogbookStatus.latestMomLabel}) telah memiliki entri logbook terkait.`}
              </p>
              <p className="text-[11px] opacity-85 mt-0.5">
                Struktur Capstone K2026 DTNTF mewajibkan setiap entri terparaf oleh dosen pembimbing resmi pada buku logbook fisik.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6 ENTITY MATRIX CARDS (Kelompok + 5 Anggota) */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-white/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-[#0B1B33] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0062CC]" />
              MATRIKS KUOTA 6 ENTITAS (1 KELOMPOK + 5 ANGGOTA × 12 ENTRI):
            </span>
            <span className="text-[11px] text-[#4A5A72]">
              Klik kartu untuk memfilter entri
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {entities.map((ent) => {
              const stat = statsByEntity[ent.id] || { total: 0, verified: 0, percent: 0, isCompleted: false };
              const isSelected = filterEntity === ent.id;

              return (
                <button
                  key={ent.id}
                  onClick={() => setFilterEntity(isSelected ? 'All' : ent.id)}
                  className={`p-3 rounded-2xl text-left transition-all border ${
                    isSelected
                      ? 'bg-white shadow-md border-[#0062CC] ring-2 ring-[#0062CC]/20'
                      : 'bg-white/70 hover:bg-white border-white/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-md font-heading font-bold text-[10px] flex items-center justify-center shrink-0 ${ent.avatarBg}`}
                    >
                      {ent.avatarText}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                        stat.isCompleted
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {stat.total}/12
                    </span>
                  </div>

                  <p className="font-heading font-bold text-xs text-[#0B1B33] truncate">
                    {ent.shortName}
                  </p>
                  <p className="text-[10px] text-[#4A5A72] truncate">
                    {ent.category === 'kelompok' ? 'Area 1 Unit' : ent.roleTitle}
                  </p>

                  {/* Mini progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stat.isCompleted ? 'bg-[#047857]' : 'bg-[#0062CC]'
                      }`}
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-[#4A5A72] mt-1 tabular-nums">
                    <span>ACC: {stat.verified}/12</span>
                    <span>{stat.percent}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Entity Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#0B1B33] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#0062CC]" />
              ENTITAS:
            </span>
            <button
              onClick={() => setFilterEntity('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterEntity === 'All'
                  ? 'bg-[#0B1B33] text-white shadow-xs'
                  : 'bg-white/70 text-[#4A5A72] border border-white hover:bg-white'
              }`}
            >
              Semua ({logbooks.length})
            </button>
            {entities.map((ent) => {
              const count = statsByEntity[ent.id]?.total || 0;
              const isSelected = filterEntity === ent.id;
              return (
                <button
                  key={ent.id}
                  onClick={() => setFilterEntity(ent.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#0B1B33] text-white shadow-xs'
                      : 'bg-white/70 text-[#4A5A72] border border-white hover:bg-white'
                  }`}
                >
                  <span>{ent.shortName}</span>
                  <span className="text-[10px] opacity-80 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] max-w-xs w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-[#6B7F99] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari uraian, kendala..."
              className="w-full h-8 pl-8 pr-3 bg-white/80 border border-white rounded-full text-xs outline-none focus:bg-white focus:ring-1 focus:ring-[#0062CC]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7F99] hover:text-[#0B1B33]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter: Week & Verification Status */}
        <div className="pt-2 border-t border-white/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Week Selector */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-semibold text-[#4A5A72] mr-1">Minggu:</span>
            <button
              onClick={() => setFilterWeek('All')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                filterWeek === 'All'
                  ? 'bg-[#0062CC] text-white'
                  : 'bg-white/60 text-[#4A5A72] hover:bg-white'
              }`}
            >
              Semua
            </button>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
              const isSelected = filterWeek === String(w);
              return (
                <button
                  key={w}
                  onClick={() => setFilterWeek(String(w))}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0062CC] text-white'
                      : 'bg-white/60 text-[#4A5A72] hover:bg-white'
                  }`}
                >
                  W{w < 10 ? `0${w}` : w}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#4A5A72] mr-1">Status Paraf:</span>
            {(['All', 'verified', 'unverified'] as const).map((st) => {
              const label =
                st === 'All'
                  ? 'Semua'
                  : st === 'verified'
                  ? 'Terverifikasi'
                  : 'Belum Diparaf';
              const isSelected = filterStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0B1B33] text-white'
                      : 'bg-white/60 text-[#4A5A72] hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOGBOOK TABLE */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-white/80 bg-white/60">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-white/80 bg-white/70 text-[10px] font-heading font-bold text-[#4A5A72] uppercase tracking-wider">
                <th className="p-3.5 w-28">Minggu &amp; Tgl</th>
                <th className="p-3.5 w-44">Kategori &amp; Entitas</th>
                <th className="p-3.5">Uraian Pekerjaan Teknis</th>
                <th className="p-3.5 w-72">Kendala dan Solusi</th>
                <th className="p-3.5 text-center w-40">Paraf Dosen</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/80 text-xs">
              {filteredLogbooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#4A5A72]">
                    <BookOpen className="w-8 h-8 text-[#6B7F99] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-[#0B1B33]">Tidak ada entri logbook yang cocok</p>
                    <p className="text-xs mt-1">Coba sesuaikan filter entitas atau kata kunci pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredLogbooks.map((log) => {
                  const isTeam =
                    log.authorId === 'team-area-1' ||
                    log.authorId === 'kelompok' ||
                    log.authorId === 'area-1' ||
                    log.category === 'kelompok';

                  const authorRef = isTeam ? 'team-area-1' : (log.authorId || log.authorName || log.authorCode);
                  const resolvedAuthor = getUser(authorRef);
                  const canEdit = isPM || isTeam || resolvedAuthor?.id === currentUser.id;
                  const canDelete = isPM || (!isTeam && resolvedAuthor?.id === currentUser.id);

                  // Parse issue and solution
                  const match = (log.issueSolution || '').match(/^Kendala:\s*([\s\S]*?);\s*Solusi:\s*([\s\S]*?)\.?$/i);
                  const issueText = match ? match[1].trim() : ((log.issueSolution || '').split(';')[0] || '');
                  const solutionText = match ? match[2].trim() : ((log.issueSolution || '').split(';').slice(1).join(';') || '');

                  return (
                    <tr key={log.id} className="hover:bg-white/70 transition-colors">
                      {/* Minggu & Tanggal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {log.weekNumber ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#EAF6FD] text-[#0062CC] w-fit">
                              W{log.weekNumber < 10 ? `0${log.weekNumber}` : log.weekNumber}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-600 w-fit">
                              ENTRI
                            </span>
                          )}
                          <span className="font-bold text-[#0B1B33] text-xs">
                            {log.date}
                          </span>
                        </div>
                      </td>

                      {/* Kategori & Entitas */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isTeam ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full font-heading font-bold text-xs bg-gradient-to-tr from-[#0062CC] via-[#0B1B33] to-[#4338CA] text-white flex items-center justify-center shadow-xs">
                              A1
                            </span>
                            <div className="flex flex-col leading-tight">
                              <span className="font-heading font-bold text-xs text-[#0B1B33]">
                                Area 1 (Kelompok)
                              </span>
                              <span className="text-[10px] text-[#0062CC] font-semibold">
                                Unit Capstone
                              </span>
                            </div>
                          </div>
                        ) : (
                          <UserChip
                            uid={authorRef}
                            variant="avatar-nama-jabatan"
                            size="md"
                            useNickname
                            avatarClassName="w-8 h-8 rounded-full font-heading font-bold text-xs"
                            nameClassName="font-heading !text-xs !font-bold !text-[#0B1B33]"
                            titleClassName="!text-[10px] !text-[#4A5A72]"
                          />
                        )}
                      </td>

                      {/* Uraian Pekerjaan Teknis */}
                      <td className="p-3.5 text-[#0B1B33] font-medium leading-relaxed">
                        {log.workDescription}
                      </td>

                      {/* Kendala dan Solusi */}
                      <td className="p-3.5 text-[11px] leading-relaxed">
                        <div className="p-2 rounded-xl bg-white/70 border border-white/90 space-y-1">
                          <p className="text-[#B45309] font-medium leading-snug">
                            {issueText}
                          </p>
                          {solutionText && (
                            <p className="text-[#047857] font-medium leading-snug">
                              {solutionText}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Paraf Dosen & Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {log.verifiedByLecturer ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#065F46] flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#047857]" />
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#B45309]" />
                              Belum Diparaf
                            </span>
                          )}

                          {/* Interactive Toggle Switch (PM Only) */}
                          {isPM && (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={Boolean(log.verifiedByLecturer)}
                              onClick={() => toggleLogbookVerification(log.id)}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                                log.verifiedByLecturer ? 'bg-[#0062CC]' : 'bg-[#C9DCEB]'
                              }`}
                              title="Toggle status verifikasi paraf dosen (PM)"
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  log.verifiedByLecturer ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action buttons (Edit & Delete) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(log)}
                              className="text-[#4A5A72] hover:text-[#0062CC] transition-colors p-1.5 rounded-lg hover:bg-[#EAF6FD]"
                              title="Edit Entri"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm('Hapus entri logbook ini?')) {
                                  deleteLogbook(log.id);
                                }
                              }}
                              className="text-[#4A5A72] hover:text-[#B91C1C] transition-colors p-1.5 rounded-lg hover:bg-[#FEE2E2]"
                              title="Hapus Entri"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Notes */}
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-[#4A5A72] border-t border-white/80">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-[#0062CC]" />
            <span>Status Terverifikasi merefleksikan paraf basah di logbook fisik resmi Capstone DTNTF.</span>
          </div>
          <span className="font-semibold text-[#0B1B33]">
            Menampilkan {filteredLogbooks.length} dari total {logbooks.length} entri • Kuota Target: 72 Entri (6 × 12)
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT LOGBOOK */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logbook-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF6FD]">
              <h3 id="logbook-modal-title" className="font-heading font-bold text-base text-[#0B1B33] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0062CC]" />
                {editingLog ? 'Edit Entri Logbook' : 'Tambah Entri Logbook Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLog(null);
                }}
                className="text-[#6B7F99] hover:text-[#0B1B33] p-1 rounded-lg"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Entitas / Pencatat */}
              <div>
                <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                  Entitas Pencatat (Kelompok / Anggota)
                </label>
                <select
                  value={formAuthorId}
                  onChange={(e) => setFormAuthorId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] bg-white text-xs font-medium text-[#0B1B33] outline-none focus:border-[#0062CC]"
                  required
                >
                  {entities
                    .filter((ent) => isPM || ent.id === 'team-area-1' || ent.id === currentUser.id)
                    .map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.category === 'kelompok'
                          ? `[Kelompok] ${ent.name} (Kuota 12)`
                          : `[Anggota] ${ent.name} (${ent.roleTitle})`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Grid: Minggu & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                    Minggu Perkuliahan
                  </label>
                  <select
                    value={formWeekNumber}
                    onChange={(e) => setFormWeekNumber(parseInt(e.target.value, 10))}
                    className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] bg-white text-xs font-medium text-[#0B1B33] outline-none focus:border-[#0062CC]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Minggu {w} (W{w < 10 ? `0${w}` : w})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B33] mb-1">Tanggal</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="Contoh: 14 Sep 2026"
                    className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#0062CC]"
                    required
                  />
                </div>
              </div>

              {/* Uraian Pekerjaan Teknis */}
              <div>
                <label className="block text-xs font-bold text-[#0B1B33] mb-1">
                  Uraian Pekerjaan Teknis
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Deskripsikan pekerjaan teknis rekayasa spesifik (simulasi DWSIM, piping P&ID, ISA-5.06, kalkulasi CAPEX/OPEX)..."
                  className="w-full p-3 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#0062CC] leading-relaxed"
                  required
                />
              </div>

              {/* Kendala */}
              <div>
                <label className="block text-xs font-bold text-[#B45309] mb-1">
                  Kendala Dihadapi
                </label>
                <input
                  type="text"
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="Contoh: Konvergensi simulasi lambat pada aliran recycle"
                  className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#0062CC]"
                />
              </div>

              {/* Solusi */}
              <div>
                <label className="block text-xs font-bold text-[#047857] mb-1">
                  Solusi / Tindak Lanjut
                </label>
                <input
                  type="text"
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  placeholder="Contoh: Ganti metode inisialisasi solver ke Newton-Raphson"
                  className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#0062CC]"
                />
              </div>

              {/* PM Verification Option */}
              {isPM && (
                <div className="pt-2 border-t border-[#EAF6FD] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0B1B33]">
                    Status Paraf Dosen Pembimbing
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formVerified}
                      onChange={(e) => setFormVerified(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0062CC] focus:ring-0"
                    />
                    <span className="text-xs font-medium text-[#4A5A72]">
                      Tandai Terverifikasi
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAF6FD]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLog(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5A72] hover:text-[#0B1B33]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0062CC] hover:bg-[#0057B8] text-white text-xs font-bold rounded-full shadow-xs transition-all"
                >
                  {editingLog ? 'Perbarui Entri' : 'Simpan Entri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
