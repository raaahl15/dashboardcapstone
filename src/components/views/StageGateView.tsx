import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserChip } from '../common/UserChip';
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* HEADER COCKPIT BAR */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 bg-[#DBEAFE] text-[#1E3A8A] rounded-full text-[10px] font-bold tracking-wider font-heading uppercase">
              AUDIT INTERNAL TAHAP 3
            </span>
            <span className="text-xs text-[#4A5A72] font-semibold">
              Sidang Akhir: 15 Des 2026
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B1B33]">
            Stage-Gate Readiness & Self-Audit
          </h1>
          <p className="text-xs text-[#4A5A72] mt-0.5 max-w-2xl">
            Evaluasi kematangan teknis internal dan verifikasi berkas tender sebelum sidang Stage-Gate 15 Des 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-[#EAF6FD] text-[#0B1B33] rounded-full text-xs font-bold border border-[#C9DCEB] flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-[#0062CC]" />
            Cetak Rubrik Form
          </button>

          {isPM && (
            <button
              onClick={handleToggleLock}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                config.readinessLocked
                  ? 'bg-[#0B1B33] text-white hover:bg-[#22314a]'
                  : 'bg-[#0062CC] hover:bg-[#0057B8] text-white'
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

      {/* ========================================================================= */}
      {/* MASTER READINESS GAUGE & METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card space-y-5">
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-[#4A5A72] uppercase tracking-wider mb-2">
            INDEKS KESIAPAN BERKAS & SIDANG
          </span>

          {/* Semicircle Gauge Graphic */}
          <div className="relative w-64 sm:w-80 h-36 sm:h-44 flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 420 220" fill="none">
              {/* Red Zone (0 - 70%) */}
              <path
                d="M 50 210 A 160 160 0 0 1 120 95"
                stroke="#B91C1C"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Amber Zone (70 - 85%) */}
              <path
                d="M 130 87 A 160 160 0 0 1 245 55"
                stroke="#B45309"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Green Zone (85 - 100%) */}
              <path
                d="M 255 57 A 160 160 0 0 1 370 210"
                stroke="#047857"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Threshold flags */}
              <text x="110" y="75" fill="#B45309" fontSize="13" fontWeight="bold" fontFamily="Inter">
                70%
              </text>
              <text x="260" y="45" fill="#047857" fontSize="13" fontWeight="bold" fontFamily="Inter">
                85%
              </text>
              <text x="40" y="215" fill="#991B1B" fontSize="11" fontWeight="bold" fontFamily="Inter">
                0%
              </text>
              <text x="360" y="215" fill="#065F46" fontSize="11" fontWeight="bold" fontFamily="Inter">
                100%
              </text>

              {/* Needle pointing to ~78% */}
              <g transform="translate(210, 210)">
                <polygon fill="#0B1B33" points="-4,4 4,-4 95,-105 90,-110" />
                <circle cx="0" cy="0" r="14" fill="#0B1B33" />
                <circle cx="0" cy="0" r="5" fill="white" />
              </g>
            </svg>

            {/* Central Dial Value */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0B1B33] tabular-nums">
                {stageGateReadinessPercent}%
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                stageGateReadinessPercent >= 85
                  ? 'bg-[#D1FAE5] text-[#065F46]'
                  : stageGateReadinessPercent >= 70
                  ? 'bg-[#FEF3C7] text-[#92400E]'
                  : 'bg-[#FEE2E2] text-[#991B1B]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {stageGateReadinessPercent >= 85
                ? 'READY FOR STAGE-GATE DEFENSE'
                : 'CONDITIONAL READY / NEED REVISION'}
            </span>
          </div>

          <p className="text-[11px] text-[#4A5A72] mt-2">
            Ambang hijau: ≥ 85% (Ready for Stage-Gate Defense & Tender Submission) • Target KAK: ≥ 80%
          </p>
        </div>

        {/* 3 Mini Score Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#EAF6FD]">
          <div className="p-4 rounded-2xl bg-white border border-[#EAF6FD] text-center shadow-xs">
            <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
              RUBRIK MANDIRI
            </span>
            <span className="font-heading text-2xl font-extrabold text-[#0B1B33] block mt-1 tabular-nums">
              {averageRubricScore} / 100
            </span>
            <span className="text-[11px] text-[#92400E] font-medium block mt-0.5">
              Revisi Bab 3 & 4
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAF6FD] text-center shadow-xs">
            <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
              DEFENSE BANK
            </span>
            <span className="font-heading text-2xl font-extrabold text-[#0B1B33] block mt-1 tabular-nums">
              {defenseQuestions.length} Butir Siap
            </span>
            <span className="text-[11px] text-[#065F46] font-medium block mt-0.5">
              100% Diselaraskan
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAF6FD] text-center shadow-xs">
            <span className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider block">
              HARDCOPY BERKAS
            </span>
            <span className="font-heading text-2xl font-extrabold text-[#0B1B33] block mt-1 tabular-nums">
              {readyPhysicalCount} / {physicalChecklist.length} Bundel
            </span>
            <span className="text-[11px] text-[#0062CC] font-medium block mt-0.5">
              {Math.round((readyPhysicalCount / physicalChecklist.length) * 100)}% Cetak Beres
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKSI 1: AUDIT RUBRIK MANDIRI */}
      {/* ========================================================================= */}
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33]">
                Audit Rubrik Mandiri
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E]">
                Rata-rata Skor: {averageRubricScore}
              </span>
            </div>
            <p className="text-xs text-[#4A5A72]">
              5 Parameter Rubrik Capstone DTNTF
            </p>
          </div>
          <span className="text-[11px] text-[#4A5A72]">
            Terakhir diperbarui: Hari ini, 09:42 WIB
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
                className="rounded-2xl border border-[#EAF6FD] bg-white overflow-hidden shadow-xs"
              >
                {/* Header Bar */}
                <div
                  onClick={() => setExpandedParam(isExpanded ? '' : param.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#EAF6FD] text-[#0062CC] font-heading font-extrabold text-xs flex items-center justify-center shrink-0">
                      {param.num}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33] truncate">
                        {param.title}
                      </h4>
                      <p className="text-[11px] text-[#4A5A72] truncate">
                        {param.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${
                        param.score >= 80
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : param.score >= 65
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
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
                        nameClassName="!text-[11px] !font-semibold !text-[#4A5A72]"
                        titleClassName="!text-[10px] !text-[#4A5A72]"
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#4A5A72]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#4A5A72]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-[#EAF6FD] bg-[#F8FAFC]/50 space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-[10px] text-[#0062CC] uppercase tracking-wider block mb-2">
                        KRITERIA VERIFIKASI PARAMETER
                      </span>
                      <div className="space-y-2">
                        {param.items.map((it, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleRubricItem(param.id, idx)}
                            className="p-2.5 rounded-xl bg-white border border-[#EAF6FD] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#EAF6FD]/30 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              {it.checked ? (
                                <CheckCircle2 className="w-4 h-4 text-[#0062CC] shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#6B7F99] shrink-0" />
                              )}
                              <span
                                className={
                                  it.checked
                                    ? 'text-[#0B1B33] font-semibold'
                                    : 'text-[#4A5A72]'
                                }
                              >
                                {it.text}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                it.checked
                                  ? 'bg-[#D1FAE5] text-[#065F46]'
                                  : 'bg-[#FEF3C7] text-[#92400E]'
                              }`}
                            >
                              {it.statusText}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-[#0B1B33] mb-1">
                          Skor Mandiri (0 - 100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={param.score}
                          onChange={(e) => updateRubricScore(param.id, Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-[#0B1B33] mb-1">
                          Catatan Mitigasi
                        </label>
                        <input
                          type="text"
                          value={param.mitigation}
                          onChange={(e) => updateRubricMitigation(param.id, e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                        />
                      </div>
                    </div>
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
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33]">
              Defense Dossier
            </h2>
            <p className="text-xs text-[#4A5A72]">
              Bank pertanyaan sidang bimbingan & dewan penguji Capstone
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveDossierAxis('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeDossierAxis === 'all'
                  ? 'bg-[#0B1B33] text-white shadow-xs'
                  : 'bg-white text-[#4A5A72] border border-[#C9DCEB]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveDossierAxis('koordinator')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeDossierAxis === 'koordinator'
                  ? 'bg-[#0B1B33] text-white shadow-xs'
                  : 'bg-white text-[#4A5A72] border border-[#C9DCEB]'
              }`}
            >
              Dosen Koordinator / Akademik
            </button>
            <button
              onClick={() => setActiveDossierAxis('praktisi')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeDossierAxis === 'praktisi'
                  ? 'bg-[#0B1B33] text-white shadow-xs'
                  : 'bg-white text-[#4A5A72] border border-[#C9DCEB]'
              }`}
            >
              Praktisi Industri / EPC Expert
            </button>
            {isPM && (
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-3.5 py-1.5 bg-[#0062CC] hover:bg-[#0057B8] text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
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
              className="p-5 rounded-2xl bg-white border border-[#EAF6FD] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#0062CC] mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#EAF6FD]">
                    {q.chapterTag}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[#4A5A72] normal-case">
                    <span className="uppercase">PIC:</span>
                    <UserChip
                      uid={q.pic}
                      variant="avatar-nama"
                      size="xs"
                      useNickname
                      nameClassName="!text-[10px] !font-bold !text-[#4A5A72]"
                    />
                  </div>
                </div>

                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33] leading-snug mb-3">
                  "{q.question}"
                </h4>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EAF6FD]">
                  <span className="text-[10px] font-bold text-[#4A5A72] uppercase block mb-1">
                    CATATAN RESPON TERVERIFIKASI:
                  </span>
                  <p className="text-xs text-[#0B1B33] font-medium leading-relaxed">
                    {q.verifiedResponse}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAF6FD] flex items-center justify-between text-xs">
                <span className="text-[#065F46] font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" /> Siap Sidang
                </span>
                <button
                  onClick={() => {
                    setEditingQuestion(q);
                    setEditedResponse(q.verifiedResponse);
                  }}
                  className="text-[#0062CC] hover:underline font-semibold flex items-center gap-1"
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
      <div className="bg-white/[0.88] backdrop-blur-md rounded-[28px] p-6 border border-white shadow-cockpit-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33]">
              Checklist Berkas Fisik
            </h2>
            <p className="text-xs text-[#4A5A72]">
              Verifikasi kelengkapan hardcopy & paket arsip digital untuk penyerahan tender 15 Des 2026
            </p>
          </div>
          <span className="font-heading font-bold text-xs text-[#0062CC] tabular-nums">
            {readyPhysicalCount} dari {physicalChecklist.length} Berkas Siap (
            {Math.round((readyPhysicalCount / physicalChecklist.length) * 100)}%)
          </span>
        </div>

        <div className="space-y-3">
          {physicalChecklist.map((item) => (
            <div
              key={item.id}
              onClick={() => isPM && togglePhysicalItem(item.id)}
              className={`p-4 rounded-2xl bg-white border border-[#EAF6FD] shadow-xs flex items-center justify-between gap-4 transition-all ${
                isPM ? 'cursor-pointer hover:bg-[#F8FAFC]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {item.ready ? (
                  <CheckCircle2 className="w-5 h-5 text-[#0062CC] shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#6B7F99] shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0B1B33]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#4A5A72] mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                  item.ready
                    ? 'bg-[#D1FAE5] text-[#065F46]'
                    : item.statusBadge.includes('Plotting')
                    ? 'bg-[#FEF3C7] text-[#92400E]'
                    : 'bg-[#FEE2E2] text-[#991B1B]'
                }`}
              >
                {item.statusBadge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 rounded-2xl bg-white/70 border border-white text-xs text-[#4A5A72] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#0062CC] shrink-0" />
        <span>
          Sesuai Rubrik Penilaian Tahap 3 (Evaluasi Proposal) Capstone PSTF DTNTF K2026 • Penyerahan Berkas Tender:{' '}
          <strong className="text-[#0B1B33]">{config.tenderDeadline}</strong>
        </span>
      </div>

      {/* Edit Defense Response Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-2 border-b border-[#EAF6FD]">
              Edit Respon Sidang
            </h3>
            <p className="text-xs text-[#4A5A72] my-2">
              "{editingQuestion.question}"
            </p>
            <form onSubmit={handleSaveResponse} className="space-y-3">
              <textarea
                rows={4}
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none focus:border-[#0062CC]"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5A72]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B33]/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-cockpit-pop border border-white">
            <h3 className="font-heading font-bold text-sm text-[#0B1B33] pb-3 border-b border-[#EAF6FD]">
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
                    className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                    className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full h-10 px-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
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
                  className="w-full p-3 rounded-xl border border-[#6B7F99] text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5A72]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0062CC] text-white text-xs font-bold rounded-full"
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
