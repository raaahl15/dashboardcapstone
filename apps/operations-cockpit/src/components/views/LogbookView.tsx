import React, { useState, useMemo, useEffect } from 'react';
import { consumeLogbookDraft } from '../../utils/logbookDraft';
import { usePageAction } from '../layout/navigation';
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

  // 6 logbook (keputusan PM, LOG-053): 1 logbook kelompok Area 1 + 5 logbook per anggota
  // (arahan Bimbingan 4: tiap orang punya logbook sendiri).
  const entities: EntityMeta[] = useMemo(() => {
    const list: EntityMeta[] = [
      {
        id: 'team-area-1',
        name: 'Area 1 (Kelompok)',
        shortName: 'Kelompok A1',
        roleTitle: 'Logbook kelompok',
        category: 'kelompok',
        avatarText: 'A1',
        avatarBg: 'bg-gradient-to-tr from-hero-1 via-ink to-hero-2 text-on-ink',
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
        avatarBg: u.avatarBg || 'bg-gradient-to-tr from-blue-700 to-indigo-800 text-on-ink',
      });
    });

    return list;
  }, [users]);

  // Target constants (Panduan Lampiran 2: 12 baris per mahasiswa, diambil dari minggu proyek 1..18)
  const TARGET_PER_ENTITY = 12;
  const MAX_WEEK = 18;
  const TOTAL_TARGET = TARGET_PER_ENTITY * entities.length; // 12 * 6 = 72

  // Statistics per entity (menghitung minggu unik agar tidak terjadi false completion)
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
        if (typeof log.weekNumber === 'number' && log.weekNumber >= 1 && log.weekNumber <= MAX_WEEK) {
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

  // Aturan 1x24 jam (Panduan Lampiran 2): setiap logbook (kelompok + anggota) wajib punya entri untuk minggu MoM terbaru
  const momLogbookStatus = useMemo(() => {
    if (!meetingLogs || meetingLogs.length === 0) {
      return { hasUnloggedMom: false, latestMomLabel: 'Belum ada MoM', missingNames: [] as string[] };
    }
    const sortedMoms = [...meetingLogs].sort((a, b) => (b.week || 0) - (a.week || 0));
    const latestMom = sortedMoms[0];
    if (!latestMom) {
      return { hasUnloggedMom: false, latestMomLabel: 'Belum ada MoM', missingNames: [] as string[] };
    }
    const missingNames = entities
      .filter(
        (ent) =>
          !logbooks.some((l) => {
            const isTeamLog =
              l.authorId === 'team-area-1' ||
              l.authorId === 'kelompok' ||
              l.authorId === 'area-1' ||
              l.category === 'kelompok';
            const authorRef = isTeamLog
              ? 'team-area-1'
              : (getUser(l.authorId || l.authorName || l.authorCode)?.id || l.authorId);
            return authorRef === ent.id && l.weekNumber === latestMom.week;
          })
      )
      .map((ent) => ent.shortName);
    return {
      hasUnloggedMom: missingNames.length > 0,
      latestMomLabel: latestMom.dayText || latestMom.weekLabel || `W${latestMom.week}`,
      missingNames,
    };
  }, [meetingLogs, logbooks, entities, getUser]);

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

  // Draf dari Meeting Log (tombol "Buat draf logbook dari MoM ini", P2 LOG-032): buka form logbook
  // milik pengguna yang login (logbook per orang); tidak ada yang tersimpan sampai pengguna menekan Simpan.
  useEffect(() => {
    const draft = consumeLogbookDraft();
    if (!draft) return;
    handleOpenAdd(currentUser.id, Math.min(MAX_WEEK, Math.max(1, draft.weekNumber || 1)));
    if (draft.date) setFormDate(draft.date);
    setFormDesc(draft.workDescription);
    setFormIssue(draft.issueSolution);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  usePageAction('logbook', () => handleOpenAdd());

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Pengingat 1×24 jam (strip tipis) */}
      <div
        className={`rounded-full px-4 py-2.5 flex items-center gap-2.5 text-xs ${
          momLogbookStatus.hasUnloggedMom ? 'bg-warm-soft text-warm' : 'bg-success-soft text-success'
        }`}
        title="Gunakan tombol &quot;Buat draf logbook&quot; di halaman Rapat, lalu lengkapi uraian pekerjaanmu sendiri. Paraf dosen tetap di buku logbook fisik."
      >
        {momLogbookStatus.hasUnloggedMom ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
        <span className="font-medium">
          {momLogbookStatus.hasUnloggedMom
            ? `Pengingat 1×24 jam: untuk MoM ${momLogbookStatus.latestMomLabel}, belum ada entri dari ${momLogbookStatus.missingNames.join(', ')}.`
            : `Lengkap: semua anggota sudah mengisi logbook untuk MoM terbaru (${momLogbookStatus.latestMomLabel}).`}
        </span>
        <span className="ml-auto shrink-0 tabular-nums font-semibold">
          {totalFilled}/{TOTAL_TARGET} terisi · {totalVerified} terparaf ({overallVerifiedPercent}%)
        </span>
      </div>

      {/* Kuota 6 logbook × 12 baris (klik untuk memfilter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {entities.map((ent) => {
          const stat = statsByEntity[ent.id] || { total: 0, verified: 0, percent: 0, isCompleted: false };
          const isSelected = filterEntity === ent.id;
          const accPct = Math.round((stat.verified / 12) * 100);
          return (
            <button
              key={ent.id}
              type="button"
              onClick={() => setFilterEntity(isSelected ? 'All' : ent.id)}
              aria-pressed={isSelected}
              className={`glass-card !rounded-[26px] p-4 text-left transition-all ${isSelected ? '!border-primary ring-2 ring-focus/30' : 'hover:shadow-cockpit-pop'}`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`w-10 h-10 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${ent.avatarBg}`}>
                  {ent.avatarText}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg truncate">{ent.shortName}</span>
                  <span className="block text-[11px] text-fg-3 truncate">{ent.category === 'kelompok' ? 'Area 1 Unit' : ent.roleTitle}</span>
                </span>
              </span>
              <span className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-semibold text-fg tabular-nums">
                  {stat.total}/12
                </span>
                <span className="text-[11px] font-semibold text-success tabular-nums">ACC {accPct}%</span>
              </span>
              <span className="mt-2 block h-1.5 rounded-full bg-muted overflow-hidden">
                <span className={`block h-full rounded-full ${stat.isCompleted ? 'bg-success-solid' : 'bg-success-solid/80'}`} style={{ width: `${stat.percent}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Entri logbook: filter ringkas + tabel */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-heading text-2xl font-normal text-fg mr-auto">Entri logbook</h2>
          <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} aria-label="Filter entitas" className="min-h-[38px] pl-3.5 pr-2 rounded-full border border-line bg-surface text-xs font-medium text-fg outline-none focus:border-primary">
            <option value="All">Entitas: Semua ({logbooks.length})</option>
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.shortName} ({statsByEntity[ent.id]?.total || 0})
              </option>
            ))}
          </select>
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            aria-label="Filter minggu"
            className={`min-h-[38px] pl-3.5 pr-2 rounded-full border border-line bg-surface text-xs font-medium text-fg outline-none focus:border-primary ${filterWeek !== 'All' ? '!bg-primary-soft !border-primary' : ''}`}
          >
            <option value="All">Minggu: Semua</option>
            {Array.from({ length: MAX_WEEK }, (_, i) => i + 1).map((w) => (
              <option key={w} value={String(w)}>
                Minggu: W{w}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} aria-label="Filter status paraf" className="min-h-[38px] pl-3.5 pr-2 rounded-full border border-line bg-surface text-xs font-medium text-fg outline-none focus:border-primary">
            <option value="All">Paraf: Semua</option>
            <option value="verified">Paraf: Terverifikasi</option>
            <option value="unverified">Paraf: Belum diparaf</option>
          </select>
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-fg-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari uraian, kendala..."
              aria-label="Cari logbook"
              className="w-full min-h-[38px] pl-9 pr-8 bg-surface border border-line rounded-full text-xs text-fg outline-none focus:border-primary"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg" aria-label="Hapus pencarian">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              downloadText(`logbook_area1_${new Date().toISOString().slice(0, 10)}.csv`, buildLogbookCsv(filteredLogbooks, (id) => getUser(id)))
            }
            disabled={filteredLogbooks.length === 0}
            className="min-h-[38px] px-3 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 disabled:opacity-50"
            title="Unduh entri yang sedang tampil (sesuai filter) sebagai CSV rekap untuk Simaster"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV ({filteredLogbooks.length})
          </button>
          {/* Tombol "Sinkronkan 72 Entri" dihapus (LOG-052): mengisi logbook dengan entri contoh sama dengan memalsukan logbook. */}
        </div>
        <p className="text-xs text-fg-3">
          6 logbook (1 kelompok + 5 anggota) × 12 baris. Diisi maksimal 1×24 jam setelah pertemuan dan diparaf dosen tiap minggu (Panduan Lampiran 2). Format uraian: <em>Judul Uraian: Isi Uraian</em>.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-glass-stroke bg-surface/60">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-glass-stroke bg-surface/70 text-[10px] font-heading font-bold text-fg-3 uppercase tracking-wider">
                <th className="p-3.5 w-28">Minggu &amp; Tgl</th>
                <th className="p-3.5 w-44">Kategori &amp; Entitas</th>
                <th className="p-3.5">Uraian Pekerjaan Teknis</th>
                <th className="p-3.5 w-72">Kendala dan Solusi</th>
                <th className="p-3.5 text-center w-40">Paraf Dosen</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-xs">
              {filteredLogbooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-fg-3">
                    <BookOpen className="w-8 h-8 text-fg-3 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-fg">Tidak ada entri logbook yang cocok</p>
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
                    <tr key={log.id} className="hover:bg-surface/70 transition-colors">
                      {/* Minggu & Tanggal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {log.weekNumber ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-muted text-primary w-fit">
                              W{log.weekNumber < 10 ? `0${log.weekNumber}` : log.weekNumber}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-muted text-fg-3 w-fit">
                              ENTRI
                            </span>
                          )}
                          <span className="font-bold text-fg text-xs">
                            {log.date}
                          </span>
                        </div>
                      </td>

                      {/* Kategori & Entitas */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isTeam ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full font-heading font-bold text-xs bg-gradient-to-tr from-hero-1 via-ink to-hero-2 text-on-ink flex items-center justify-center shadow-xs">
                              A1
                            </span>
                            <div className="flex flex-col leading-tight">
                              <span className="font-heading font-bold text-xs text-fg">
                                Area 1 (Kelompok)
                              </span>
                              <span className="text-[10px] text-primary font-semibold">
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
                            nameClassName="font-heading !text-xs !font-bold !text-fg"
                            titleClassName="!text-[10px] !text-fg-3"
                          />
                        )}
                      </td>

                      {/* Uraian Pekerjaan Teknis */}
                      <td className="p-3.5 text-fg font-medium leading-relaxed">
                        {log.workDescription}
                      </td>

                      {/* Kendala dan Solusi */}
                      <td className="p-3.5 text-[11px] leading-relaxed">
                        <div className="p-2 rounded-xl bg-surface/70 border border-glass-stroke space-y-1">
                          <p className="text-warm font-medium leading-snug">
                            {issueText}
                          </p>
                          {solutionText && (
                            <p className="text-success font-medium leading-snug">
                              {solutionText}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Paraf Dosen & Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {log.verifiedByLecturer ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-success-soft text-success flex items-center gap-1">
                              <Check className="w-3 h-3 text-success" />
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-warm-soft text-warm flex items-center gap-1">
                              <Clock className="w-3 h-3 text-warm" />
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
                                log.verifiedByLecturer ? 'bg-primary' : 'bg-line'
                              }`}
                              title="Toggle status verifikasi paraf dosen (PM)"
                            >
                              <div
                                className={`bg-surface w-4 h-4 rounded-full shadow-md transform transition-transform ${
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
                              className="text-fg-3 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-muted"
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
                              className="text-fg-3 hover:text-danger transition-colors p-1.5 rounded-lg hover:bg-danger-soft"
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
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-fg-3 border-t border-glass-stroke">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-primary" />
            <span>Status Terverifikasi merefleksikan paraf basah di logbook fisik resmi Capstone DTNTF.</span>
          </div>
          <span className="font-semibold text-fg">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 id="logbook-modal-title" className="font-heading font-bold text-base text-fg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {editingLog ? 'Edit Entri Logbook' : 'Tambah Entri Logbook Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLog(null);
                }}
                className="text-fg-3 hover:text-fg p-1 rounded-lg"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Entitas / Pencatat */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  Pemilik Logbook
                </label>
                <select
                  value={formAuthorId}
                  onChange={(e) => setFormAuthorId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-line-strong bg-surface text-xs font-medium text-fg outline-none focus:border-primary"
                  required
                >
                  {entities
                    .filter((ent) => isPM || ent.id === 'team-area-1' || ent.id === currentUser.id)
                    .map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.category === 'kelompok'
                          ? `[Kelompok] ${ent.name}`
                          : `[Anggota] ${ent.name} (${ent.roleTitle})`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Grid: Minggu & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1">
                    Minggu Perkuliahan
                  </label>
                  <select
                    value={formWeekNumber}
                    onChange={(e) => setFormWeekNumber(parseInt(e.target.value, 10))}
                    className="w-full h-10 px-3 rounded-xl border border-line-strong bg-surface text-xs font-medium text-fg outline-none focus:border-primary"
                  >
                    {Array.from({ length: MAX_WEEK }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Minggu {w} (W{w < 10 ? `0${w}` : w})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1">Tanggal</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="Contoh: 14 Sep 2026"
                    className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Uraian Pekerjaan Teknis */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  Uraian Pekerjaan Teknis
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Judul Uraian: Isi Uraian (contoh: Sizing FV-101: menghitung Kv normal/maks. dengan ISA-75.01 ...)"
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary leading-relaxed"
                  required
                />
              </div>

              {/* Kendala */}
              <div>
                <label className="block text-xs font-bold text-warm mb-1">
                  Kendala Dihadapi
                </label>
                <input
                  type="text"
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="Contoh: Konvergensi simulasi lambat pada aliran recycle"
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Solusi */}
              <div>
                <label className="block text-xs font-bold text-success mb-1">
                  Solusi / Tindak Lanjut
                </label>
                <input
                  type="text"
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  placeholder="Contoh: Ganti metode inisialisasi solver ke Newton-Raphson"
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                />
              </div>

              {/* PM Verification Option */}
              {isPM && (
                <div className="pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg">
                    Status Paraf Dosen Pembimbing
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formVerified}
                      onChange={(e) => setFormVerified(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0"
                    />
                    <span className="text-xs font-medium text-fg-3">
                      Tandai Terverifikasi
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLog(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-fg-3 hover:text-fg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold rounded-full shadow-xs transition-all"
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
