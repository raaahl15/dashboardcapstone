import React, { useState, useEffect } from 'react';
import { usePageAction } from '../layout/navigation';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
import { StageGateTimeline } from '../common/StageGateTimeline';
import {
  ShieldCheck,
  Printer,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
} from 'lucide-react';
import { DefenseQuestion } from '../../types';

interface RubricInputsProps {
  paramId: string;
  initialScore: number;
  initialMitigation: string;
  disabled: boolean;
  onSaveScore: (id: string, score: number) => void;
  onSaveMitigation: (id: string, mitigation: string) => void;
}

const RubricInputs: React.FC<RubricInputsProps> = ({
  paramId,
  initialScore,
  initialMitigation,
  disabled,
  onSaveScore,
  onSaveMitigation,
}) => {
  const [score, setScore] = useState(initialScore);
  const [mitigation, setMitigation] = useState(initialMitigation);

  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    setMitigation(initialMitigation);
  }, [initialMitigation]);

  const handleScoreBlur = () => {
    if (score !== initialScore) {
      onSaveScore(paramId, score);
    }
  };

  const handleMitigationBlur = () => {
    if (mitigation.trim() !== (initialMitigation || '').trim()) {
      onSaveMitigation(paramId, mitigation.trim());
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
      <div className="sm:col-span-1">
        <label className="block text-[11px] font-semibold text-fg mb-1">
          Skor Mandiri (0 - 100)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          disabled={disabled}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          onBlur={handleScoreBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs font-bold outline-none disabled:opacity-60 disabled:bg-muted focus:border-primary"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-[11px] font-semibold text-fg mb-1">
          Catatan Mitigasi
        </label>
        <input
          type="text"
          disabled={disabled}
          value={mitigation}
          onChange={(e) => setMitigation(e.target.value)}
          onBlur={handleMitigationBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none disabled:opacity-60 disabled:bg-muted focus:border-primary"
        />
      </div>
    </div>
  );
};

export const StageGateView: React.FC = () => {
  const {
    rubricParameters,
    updateRubricScore,
    toggleRubricItem,
    updateRubricMitigation,
    defenseQuestions,
    updateDefenseResponse,
    addDefenseQuestion,
    physicalChecklist,
    togglePhysicalItem,
    stageGateReadinessPercent,
    averageRubricScore,
    config,
    updateConfig,
    users,
    isPM,
  } = useApp();

  const [expandedParam, setExpandedParam] = useState<string>('');
  const [activeDossierAxis, setActiveDossierAxis] = useState<'all' | 'koordinator' | 'praktisi'>('all');

  // Modals / Editing state
  const [editingQuestion, setEditingQuestion] = useState<DefenseQuestion | null>(null);
  const [editedResponse, setEditedResponse] = useState('');

  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQAxis, setNewQAxis] = useState<'koordinator' | 'praktisi'>('koordinator');
  const [newQTag, setNewQTag] = useState('BAB 2: FDS');
  const [newQPic, setNewQPic] = useState('user-althaf');
  const [newQText, setNewQText] = useState('');
  const [newQResp, setNewQResp] = useState('');

  const readyPhysicalCount = physicalChecklist.filter((b) => b.ready).length;

  const handleToggleLock = () => {
    if (!isPM) return;
    updateConfig({ readinessLocked: !config.readinessLocked });
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    updateDefenseResponse(editingQuestion.id, editedResponse);
    setEditingQuestion(null);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return;
    addDefenseQuestion({
      axis: newQAxis,
      chapterTag: newQTag,
      pic: newQPic,
      question: newQText,
      verifiedResponse: newQResp || 'Tanggapan telah diselaraskan dengan dokumen teknis.',
    });
    setNewQText('');
    setNewQResp('');
    setShowAddQuestionModal(false);
  };

  usePageAction('stage-gate', () => window.print());

  const filteredQuestions = defenseQuestions.filter((q) => {
    if (activeDossierAxis === 'all') return true;
    return q.axis === activeDossierAxis;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Kartu gate G1–G4 */}
      <StageGateTimeline />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Indeks kesiapan (cincin) */}
        <section className="xl:col-span-4 glass-card p-6 flex flex-col">
          <h2 className="font-heading text-2xl font-normal text-fg">Indeks kesiapan berkas &amp; sidang</h2>
          <div className="relative mx-auto my-6 w-52 h-52">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={stageGateReadinessPercent >= 85 ? 'var(--success)' : stageGateReadinessPercent >= 70 ? 'var(--chart-1)' : 'var(--warm)'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="263.9"
                strokeDashoffset={(263.9 * (1 - Math.min(100, Math.max(0, stageGateReadinessPercent)) / 100)).toFixed(1)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-5xl font-light text-fg tabular-nums">{stageGateReadinessPercent}%</span>
              <span className="text-xs text-fg-3 mt-1">target ≥ 85%</span>
            </div>
          </div>
          <span
            className={`self-center px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
              stageGateReadinessPercent >= 85
                ? 'bg-success-soft text-success'
                : stageGateReadinessPercent >= 70
                ? 'bg-primary-soft text-fg-2'
                : 'bg-warm-soft text-warm'
            }`}
          >
            {stageGateReadinessPercent >= 85 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {stageGateReadinessPercent >= 85
              ? 'Siap untuk Stage-Gate'
              : stageGateReadinessPercent >= 70
              ? 'Siap bersyarat · perlu revisi'
              : 'Belum siap · critical gap'}
          </span>
          <div className="mt-auto pt-6 grid grid-cols-3 gap-2.5">
            {[
              [`${averageRubricScore}/100`, 'Rubrik mandiri', ''],
              [`${defenseQuestions.length} butir`, 'Defense bank', ''],
              [`${readyPhysicalCount}/${physicalChecklist.length}`, 'Hardcopy', readyPhysicalCount < physicalChecklist.length ? 'text-warm' : ''],
            ].map(([v, l, tone]) => (
              <div key={l} className="rounded-[20px] bg-surface p-3">
                <p className={`text-lg font-semibold tabular-nums ${tone || 'text-fg'}`}>{v}</p>
                <p className="text-[11px] text-fg-3">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Audit rubrik mandiri */}
        <section className="xl:col-span-8 glass-card p-6 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-normal text-fg">
              Audit rubrik mandiri · {rubricParameters.length} parameter
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-soft text-fg-2 text-xs font-semibold">
                {config.readinessLocked ? 'Terkunci oleh PM' : 'Belum dikunci PM'}
              </span>
              {isPM && (
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`min-h-[40px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                    config.readinessLocked ? 'bg-ink text-on-ink' : 'bg-primary text-on-primary hover:bg-primary-hover'
                  }`}
                >
                  {config.readinessLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {config.readinessLocked ? 'Status terkunci' : 'Kunci status final'}
                </button>
              )}
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 flex-1">
            {rubricParameters.map((param) => {
              const isExpanded = expandedParam === param.id;
              const picRef = param.pic || param.picCode || param.picName;
              const tone = param.score >= 85 ? 'success' : param.score >= 70 ? 'primary' : 'warm';
              return (
                <li key={param.id} className="rounded-[22px] bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedParam(isExpanded ? '' : param.id)}
                    aria-expanded={isExpanded}
                    className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <span className="w-9 h-9 rounded-xl bg-primary-soft text-fg-2 text-sm font-semibold flex items-center justify-center shrink-0">
                      {param.num}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-fg truncate">{param.title}</span>
                      <span className="block text-xs text-fg-3 truncate">{param.subtitle}</span>
                    </span>
                    <span className="hidden md:inline-flex shrink-0">
                      <UserChip uid={picRef} variant="avatar" size="sm" avatarClassName="w-8 h-8 rounded-full text-[10px]" />
                    </span>
                    <span className="w-32 sm:w-40 shrink-0">
                      <span className="flex items-baseline justify-between">
                        <span className="text-xs text-fg-3">Skor</span>
                        <span className={`text-xl font-semibold tabular-nums ${tone === 'warm' ? 'text-warm' : tone === 'success' ? 'text-success' : 'text-primary'}`}>
                          {param.score}
                        </span>
                      </span>
                      <span className="mt-1 block h-1.5 rounded-full bg-muted overflow-hidden">
                        <span
                          className={`block h-full rounded-full ${tone === 'warm' ? 'bg-warm-solid' : tone === 'success' ? 'bg-success-solid' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, param.score)}%` }}
                        />
                      </span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-fg-3 shrink-0" /> : <ChevronDown className="w-4 h-4 text-fg-3 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-4 text-xs">
                      <div className="space-y-2">
                        {param.items.map((it, idx) => (
                          <button
                            type="button"
                            key={idx}
                            disabled={Boolean(config.readinessLocked)}
                            onClick={() => toggleRubricItem(param.id, idx)}
                            className="w-full p-2.5 rounded-2xl bg-muted/60 flex items-center justify-between gap-3 text-left disabled:opacity-75 disabled:cursor-not-allowed hover:bg-muted"
                          >
                            <span className="flex items-center gap-2.5">
                              {it.checked ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-fg-3 shrink-0" />}
                              <span className={it.checked ? 'text-fg font-medium' : 'text-fg-3'}>{it.text}</span>
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.checked ? 'bg-success-soft text-success' : 'bg-warm-soft text-warm'}`}>
                              {it.statusText}
                            </span>
                          </button>
                        ))}
                      </div>
                      <RubricInputs
                        paramId={param.id}
                        initialScore={param.score}
                        initialMitigation={param.mitigation}
                        disabled={Boolean(config.readinessLocked)}
                        onSaveScore={updateRubricScore}
                        onSaveMitigation={updateRubricMitigation}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-fg-3">
            Rata-rata {averageRubricScore} · {rubricParameters.filter((p) => p.score < 70).length} parameter di bawah 70 · ambang hijau ≥ 85% (target KAK ≥ 80%).
            Klik parameter untuk kriteria, skor, dan mitigasi.
          </p>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* SEKSI 2: DEFENSE DOSSIER */}
      {/* ========================================================================= */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-fg">
              Defense Dossier
            </h2>
            <p className="text-xs text-fg-3">
              Bank pertanyaan sidang bimbingan & dewan penguji Capstone
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveDossierAxis('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeDossierAxis === 'all'
                  ? 'bg-ink text-on-ink shadow-xs'
                  : 'bg-surface text-fg-3 border border-line'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveDossierAxis('koordinator')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeDossierAxis === 'koordinator'
                  ? 'bg-ink text-on-ink shadow-xs'
                  : 'bg-surface text-fg-3 border border-line'
              }`}
            >
              Dosen Koordinator / Akademik
            </button>
            <button
              onClick={() => setActiveDossierAxis('praktisi')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeDossierAxis === 'praktisi'
                  ? 'bg-ink text-on-ink shadow-xs'
                  : 'bg-surface text-fg-3 border border-line'
              }`}
            >
              Praktisi Industri / EPC Expert
            </button>
            {isPM && (
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Q&A
              </button>
            )}
          </div>
        </div>

        {/* Defense Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-surface/70 border border-glass-stroke shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-primary mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-surface/70">
                    {q.chapterTag}
                  </span>
                  <div className="inline-flex items-center gap-1 text-fg-3 normal-case">
                    <span className="uppercase">PIC:</span>
                    <UserChip
                      uid={q.pic}
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!text-[10px] !font-bold !text-fg-3"
                    />
                  </div>
                </div>

                <h4 className="font-heading font-bold text-xs sm:text-sm text-fg leading-snug mb-3">
                  "{q.question}"
                </h4>

                <div className="p-3 rounded-xl bg-surface/50 border border-glass-stroke">
                  <span className="text-[10px] font-bold text-fg-3 uppercase block mb-1">
                    CATATAN RESPON TERVERIFIKASI:
                  </span>
                  <p className="text-xs text-fg font-medium leading-relaxed">
                    {q.verifiedResponse}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-glass-stroke flex items-center justify-between text-xs">
                <span className="text-success font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Siap Sidang
                </span>
                <button
                  onClick={() => {
                    setEditingQuestion(q);
                    setEditedResponse(q.verifiedResponse);
                  }}
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit Respon
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKSI 3: CHECKLIST BERKAS FISIK */}
      {/* ========================================================================= */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-fg">
              Checklist Berkas Fisik
            </h2>
            <p className="text-xs text-fg-3">
              Verifikasi kelengkapan hardcopy & paket arsip digital untuk penyerahan tender 15 Des 2026
            </p>
          </div>
          <span className="font-heading font-bold text-xs text-primary tabular-nums">
            {readyPhysicalCount} dari {physicalChecklist.length} Berkas Siap (
            {Math.round((readyPhysicalCount / physicalChecklist.length) * 100)}%)
          </span>
        </div>

        <div className="space-y-3">
          {physicalChecklist.map((item) => (
            <div
              key={item.id}
              onClick={() => isPM && !config.readinessLocked && togglePhysicalItem(item.id)}
              className={`p-4 rounded-2xl bg-surface/70 border border-glass-stroke shadow-xs flex items-center justify-between gap-4 transition-all ${
                isPM && !config.readinessLocked ? 'cursor-pointer hover:bg-surface' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {item.ready ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-fg-3 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-fg">
                    {item.title}
                  </h4>
                  <p className="text-xs text-fg-3 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                  item.ready
                    ? 'bg-success-soft text-success'
                    : item.statusBadge.includes('Plotting')
                    ? 'bg-warm-soft text-warm'
                    : 'bg-danger-soft text-danger'
                }`}
              >
                {item.statusBadge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 rounded-2xl bg-surface/70 border border-glass-stroke text-xs text-fg-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        <span>
          Sesuai Rubrik Penilaian Tahap 3 (Evaluasi Proposal) Capstone PSTF DTNTF K2026 • Penyerahan Berkas Tender:{' '}
          <strong className="text-fg">{config.tenderDeadline}</strong>
        </span>
      </div>

      {/* Edit Defense Response Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
            <h3 className="font-heading font-bold text-sm text-fg pb-2 border-b border-line">
              Edit Respon Sidang
            </h3>
            <p className="text-xs text-fg-3 my-2">
              "{editingQuestion.question}"
            </p>
            <form onSubmit={handleSaveResponse} className="space-y-3">
              <textarea
                rows={4}
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none focus:border-primary"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-xs font-semibold text-fg-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  Simpan Respon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Defense Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-[28px] p-6 shadow-cockpit-pop border border-glass-stroke">
            <h3 className="font-heading font-bold text-sm text-fg pb-3 border-b border-line">
              Tambah Pertanyaan Defense Dossier
            </h3>
            <form onSubmit={handleAddQuestion} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Poros Evaluasi</label>
                  <select
                    value={newQAxis}
                    onChange={(e) =>
                      setNewQAxis(e.target.value as 'koordinator' | 'praktisi')
                    }
                    className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                  >
                    <option value="koordinator">Dosen Koordinator / Akademik</option>
                    <option value="praktisi">Praktisi Industri / EPC Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">PIC Respon</label>
                  <select
                    value={newQPic}
                    onChange={(e) => setNewQPic(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname} ({u.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Label Bab / Topik</label>
                <input
                  type="text"
                  value={newQTag}
                  onChange={(e) => setNewQTag(e.target.value)}
                  placeholder="Contoh: BAB 3: PFD & NERACA"
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Pertanyaan Sidang</label>
                <input
                  type="text"
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Contoh: Bagaimana proteksi overpressure pada bejana V-01?"
                  className="w-full h-10 px-3 rounded-xl border border-line-strong text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Respon Teknis Terverifikasi</label>
                <textarea
                  rows={3}
                  value={newQResp}
                  onChange={(e) => setNewQResp(e.target.value)}
                  placeholder="Uraikan respon yang didukung data kalkulasi dan rujukan standar..."
                  className="w-full p-3 rounded-xl border border-line-strong text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-fg-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
                >
                  Simpan Q&A
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
