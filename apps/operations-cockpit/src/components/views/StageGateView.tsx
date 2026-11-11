import React, { useState, useEffect } from 'react';
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

  const [expandedParam, setExpandedParam] = useState<string>('rubric-1');
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

  const filteredQuestions = defenseQuestions.filter((q) => {
    if (activeDossierAxis === 'all') return true;
    return q.axis === activeDossierAxis;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* TOP ZONE: Heading, description, and Stage-Gate actions */}
      {/* ========================================================================= */}
      <div className="space-y-3">

        <div className="space-y-2.5">
          <div className="max-w-4xl">
            <p className="text-[13px] leading-relaxed text-fg-3">
              Evaluasi kematangan teknis internal dan verifikasi berkas tender sebelum G2 Evaluasi PSTF 1 ({config.tenderDeadline})
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-8 px-3.5 rounded-full bg-surface/70 border border-glass-stroke text-fg text-[12px] font-medium tracking-normal inline-flex items-center">
                G2 Evaluasi PSTF 1: {config.tenderDeadline}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.print()}
                className="min-h-[44px] px-4 py-2 bg-surface/70 hover:bg-surface text-fg rounded-full text-xs font-bold border border-glass-stroke flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                Cetak Rubrik Form
              </button>

              {isPM && (
                <button
                  onClick={handleToggleLock}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                    config.readinessLocked
                      ? 'bg-ink text-on-ink hover:bg-ink-2'
                      : 'bg-primary hover:bg-primary-hover text-on-primary'
                  }`}
                >
                  {config.readinessLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Status Terkunci
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Kunci Status Final
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PEMETAAN STAGE-GATE G1–G4 (Blueprint §1.7) */}
      <StageGateTimeline />

      {/* ========================================================================= */}
      {/* MASTER READINESS GAUGE & METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-fg-3 uppercase tracking-wider mb-2">
            INDEKS KESIAPAN BERKAS & SIDANG
          </span>

          {/* Semicircle Gauge Graphic */}
          <div className="relative w-64 sm:w-80 aspect-[21/11] flex items-end justify-center">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 420 220"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M 50 210 A 160 160 0 0 1 370 210"
                pathLength="100"
                stroke="var(--muted)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 50 210 A 160 160 0 0 1 370 210"
                pathLength="100"
                strokeDasharray="70 30"
                strokeDashoffset="0"
                stroke="var(--danger)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 50 210 A 160 160 0 0 1 370 210"
                pathLength="100"
                strokeDasharray="15 85"
                strokeDashoffset="-70"
                stroke="var(--warm)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 50 210 A 160 160 0 0 1 370 210"
                pathLength="100"
                strokeDasharray="15 85"
                strokeDashoffset="-85"
                stroke="var(--success)"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Threshold flags */}
              <text x="312" y="65" fill="var(--warm)" fontSize="13" fontWeight="bold" fontFamily="Inter">
                70%
              </text>
              <text x="365" y="128" fill="var(--success)" fontSize="13" fontWeight="bold" fontFamily="Inter">
                85%
              </text>
              <text x="40" y="215" fill="var(--danger)" fontSize="11" fontWeight="bold" fontFamily="Inter">
                0%
              </text>
              <text x="360" y="215" fill="var(--success)" fontSize="11" fontWeight="bold" fontFamily="Inter">
                100%
              </text>

              {/* Dynamic Needle pointing to stageGateReadinessPercent (0%..100%) */}
              <g
                transform={`translate(210, 210) rotate(${Math.max(
                  0,
                  Math.min(180, (stageGateReadinessPercent / 100) * 180)
                )})`}
              >
                <polygon fill="var(--text)" points="0,-5 0,5 -135,0" />
                <circle cx="0" cy="0" r="14" fill="var(--text)" />
                <circle cx="0" cy="0" r="5" fill="white" />
              </g>
            </svg>

            {/* Central Dial Value */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-fg tabular-nums">
                {stageGateReadinessPercent}%
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                stageGateReadinessPercent >= 85
                  ? 'bg-success-soft text-success'
                  : stageGateReadinessPercent >= 70
                  ? 'bg-warm-soft text-warm'
                  : 'bg-danger-soft text-danger'
              }`}
            >
              {stageGateReadinessPercent >= 85 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {stageGateReadinessPercent >= 85
                ? 'READY FOR STAGE-GATE DEFENSE'
                : stageGateReadinessPercent >= 70
                ? 'CONDITIONAL READY / NEED REVISION'
                : 'NOT READY / CRITICAL GAP'}
            </span>
          </div>

          <p className="text-[11px] text-fg-3 mt-2">
            Ambang hijau: ≥ 85% (Ready for Stage-Gate Defense & Tender Submission) • Target KAK: ≥ 80%
          </p>
        </div>

        {/* 3 Mini Score Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-glass-stroke">
          <div className="p-4 rounded-2xl bg-surface/70 border border-glass-stroke text-center shadow-xs">
            <span className="text-[10px] font-bold text-fg-3 uppercase tracking-wider block">
              RUBRIK MANDIRI
            </span>
            <span className="font-heading text-2xl font-extrabold text-fg block mt-1 tabular-nums">
              {averageRubricScore} / 100
            </span>
            <span className="text-[11px] text-warm font-medium block mt-0.5">
              {rubricParameters.filter((p) => p.score < 70).length} parameter skor &lt; 70
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface/70 border border-glass-stroke text-center shadow-xs">
            <span className="text-[10px] font-bold text-fg-3 uppercase tracking-wider block">
              DEFENSE BANK
            </span>
            <span className="font-heading text-2xl font-extrabold text-fg block mt-1 tabular-nums">
              {defenseQuestions.length} Butir
            </span>
            <span className="text-[11px] text-success font-medium block mt-0.5">
              {defenseQuestions.filter((q) => !q.verifiedResponse.trim()).length} belum ada jawaban
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface/70 border border-glass-stroke text-center shadow-xs">
            <span className="text-[10px] font-bold text-fg-3 uppercase tracking-wider block">
              HARDCOPY BERKAS
            </span>
            <span className="font-heading text-2xl font-extrabold text-fg block mt-1 tabular-nums">
              {readyPhysicalCount} / {physicalChecklist.length} Bundel
            </span>
            <span className="text-[11px] text-primary font-medium block mt-0.5">
              {physicalChecklist.length
                ? Math.round((readyPhysicalCount / physicalChecklist.length) * 100)
                : 0}
              % Cetak Beres
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKSI 1: AUDIT RUBRIK MANDIRI */}
      {/* ========================================================================= */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base sm:text-lg text-fg">
                Audit Rubrik Mandiri
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warm-soft text-warm tabular-nums">
                Rata-rata Skor: {averageRubricScore}
              </span>
            </div>
            <p className="text-xs text-fg-3">
              5 Parameter Rubrik Capstone DTNTF
            </p>
          </div>
          <span className="text-[11px] text-fg-3">
            {config.readinessLocked ? 'Status Terkunci oleh PM' : 'Belum dikunci PM'}
          </span>
        </div>

        {/* 5 Parameters Accordion Cards */}
        <div className="space-y-3">
          {rubricParameters.map((param) => {
            const isExpanded = expandedParam === param.id;
            const picRef = param.pic || param.picCode || param.picName;

            return (
              <div
                key={param.id}
                className="rounded-2xl border border-glass-stroke bg-surface/60 overflow-hidden shadow-xs"
              >
                {/* Header Bar */}
                <div
                  onClick={() => setExpandedParam(isExpanded ? '' : param.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-surface/70 text-primary font-heading font-extrabold text-xs flex items-center justify-center shrink-0">
                      {param.num}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-fg truncate">
                        {param.title}
                      </h4>
                      <p className="text-[11px] text-fg-3 truncate">
                        {param.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${
                        param.score >= 85
                          ? 'bg-success-soft text-success'
                          : param.score >= 70
                          ? 'bg-warm-soft text-warm'
                          : 'bg-danger-soft text-danger'
                      }`}
                    >
                      Skor: {param.score}
                    </span>
                    <div className="hidden sm:inline-flex">
                      <UserChip
                        uid={picRef}
                        variant="avatar-nama-jabatan"
                        size="xs"
                        useNickname
                        inlineTitle
                        nameClassName="!text-[11px] !font-semibold !text-fg-3"
                        titleClassName="!text-[10px] !text-fg-3"
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-fg-3" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-fg-3" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-glass-stroke bg-surface/40 space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-[10px] text-primary uppercase tracking-wider block mb-2">
                        KRITERIA VERIFIKASI PARAMETER
                      </span>
                      <div className="space-y-2">
                        {param.items.map((it, idx) => (
                          <div
                            key={idx}
                            onClick={() => !config.readinessLocked && toggleRubricItem(param.id, idx)}
                            className={`p-2.5 rounded-xl bg-surface/70 border border-glass-stroke flex items-center justify-between gap-3 transition-colors ${
                              config.readinessLocked
                                ? 'opacity-75 cursor-not-allowed'
                                : 'cursor-pointer hover:bg-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {it.checked ? (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-fg-3 shrink-0" />
                              )}
                              <span
                                className={
                                  it.checked
                                    ? 'text-fg font-semibold'
                                    : 'text-fg-3'
                                }
                              >
                                {it.text}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                it.checked
                                  ? 'bg-success-soft text-success'
                                  : 'bg-warm-soft text-warm'
                              }`}
                            >
                              {it.statusText}
                            </span>
                          </div>
                        ))}
                      </div>
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
              </div>
            );
          })}
        </div>
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
