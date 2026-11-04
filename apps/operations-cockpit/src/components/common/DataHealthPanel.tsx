import React, { useMemo } from 'react';
import { Activity, Calculator, Tags, FileCheck2, HardDrive } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStaticData, fmtNum, fmtDateTime, daysSince } from '../../utils/staticData';

interface Health {
  generated_at: string;
  hmb: { extracted_at: string; solver_status: string; mass_balance_max_error_pct: number; warnings: number };
  calc: { total: number; pass: number; fail: number; not_calculated: number; placeholder: number };
  tags: { ERROR: number; WARNING: number; pid_checked: number };
  companions: { covered: number | null; total: number | null; pass: boolean };
}

type Tone = 'ok' | 'warn' | 'bad';
const TONE: Record<Tone, string> = {
  ok: 'text-[#047857] bg-[#D1FAE5]',
  warn: 'text-[#92400E] bg-[#FEF3C7]',
  bad: 'text-[#991B1B] bg-[#FEE2E2]',
};

/** Panel "Kesehatan Data" (Blueprint BAB IV, tambahan v2.0). Data dari public/data/health.json. */
/** Batas aturan proyek untuk dokumen projectData/area1 (Blueprint §3.6; batas keras Firestore 1 MiB). */
const PROJECT_DOC_LIMIT_KB = 500;

/**
 * Perkiraan ukuran dokumen Firestore projectData/area1: seluruh seksi bersama KECUALI `users` dan
 * `workOrders` (koleksi terpisah), diukur sebagai byte UTF-8 JSON. Ini pendekatan (format penyimpanan
 * Firestore berbeda), cukup untuk memantau tren terhadap batas 500 KB (DoD Fase 5).
 */
export const estimateProjectDocKb = (exportJson: string): number => {
  const parsed = JSON.parse(exportJson) as Record<string, unknown>;
  for (const k of ['users', 'workOrders', 'schema_version', 'exported_at']) delete parsed[k];
  return new TextEncoder().encode(JSON.stringify(parsed)).length / 1024;
};

export const DataHealthPanel: React.FC = () => {
  const { setActiveTab, exportDataToJson } = useApp();
  const { data, error } = useStaticData<Health>('health.json');
  const docKb = useMemo(() => {
    try {
      return estimateProjectDocKb(exportDataToJson());
    } catch {
      return null;
    }
  }, [exportDataToJson]);

  if (error) return <div className="glass-card p-4 text-xs text-[#991B1B]">Panel Kesehatan Data: {error}</div>;
  if (!data) return null;

  const age = daysSince(data.hmb.extracted_at) ?? 0;
  const tiles: { key: string; icon: React.ReactNode; title: string; value: string; detail: string; tone: Tone; tab: 'dwsim' | 'library' | 'homepage' }[] = [
    {
      key: 'hmb',
      icon: <Activity className="w-4 h-4" />,
      title: 'Umur HMB DWSIM',
      value: `${age} hari`,
      detail: `${data.hmb.solver_status} · neraca maks ${fmtNum(data.hmb.mass_balance_max_error_pct, 3)} %`,
      tone: data.hmb.solver_status !== 'AllObjectsCalculated' || data.hmb.mass_balance_max_error_pct > 0.5 ? 'bad' : age > 14 ? 'warn' : 'ok',
      tab: 'dwsim',
    },
    {
      key: 'calc',
      icon: <Calculator className="w-4 h-4" />,
      title: 'Kalkulator',
      value: `${data.calc.fail} FAIL`,
      detail: `${data.calc.pass}/${data.calc.total} PASS · ${data.calc.placeholder} masih PLACEHOLDER · ${data.calc.not_calculated} belum dihitung`,
      tone: data.calc.fail > 0 ? 'bad' : data.calc.placeholder > 0 || data.calc.not_calculated > 0 ? 'warn' : 'ok',
      tab: 'library',
    },
    {
      key: 'tags',
      icon: <Tags className="w-4 h-4" />,
      title: 'Inkonsistensi tag',
      value: `${data.tags.ERROR} error`,
      detail: `${data.tags.WARNING} peringatan · P&ID diperiksa: ${data.tags.pid_checked}`,
      tone: data.tags.ERROR > 0 ? 'bad' : data.tags.WARNING > 0 ? 'warn' : 'ok',
      tab: 'library',
    },
    {
      key: 'comp',
      icon: <FileCheck2 className="w-4 h-4" />,
      title: 'Companion .md',
      value: data.companions.total ? `${data.companions.covered}/${data.companions.total}` : '–',
      detail: data.companions.pass ? 'npm run check: PASS' : 'npm run check: FAIL',
      tone: data.companions.pass ? 'ok' : 'bad',
      tab: 'library',
    },
    {
      key: 'doc',
      icon: <HardDrive className="w-4 h-4" />,
      title: 'Ukuran projectData/area1',
      value: docKb === null ? '–' : `≈ ${fmtNum(docKb, 0)} KB`,
      detail: `Batas aturan ${PROJECT_DOC_LIMIT_KB} KB (batas Firestore 1 MiB); lebih → pindah MoM/logbook ke koleksi sendiri`,
      tone: docKb === null ? 'warn' : docKb > PROJECT_DOC_LIMIT_KB ? 'bad' : docKb > PROJECT_DOC_LIMIT_KB * 0.7 ? 'warn' : 'ok',
      tab: 'homepage',
    },
  ];

  return (
    <section className="glass-card p-4 sm:p-5" aria-label="Kesehatan Data">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-heading font-bold text-base text-[#0B1B33]">Kesehatan Data Rekayasa</h2>
        <span className="text-[11px] text-[#4A5A72]">Dibundel {fmtDateTime(data.generated_at)}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.tab)}
            className="text-left min-h-[44px] p-3.5 rounded-2xl bg-white/80 border border-white hover:bg-white transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#4A5A72] inline-flex items-center gap-1.5">
                {t.icon} {t.title}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${TONE[t.tone].split(' ')[1]}`} aria-hidden />
            </div>
            <p className={`mt-1 inline-block px-2 py-0.5 rounded-full font-heading font-bold text-sm ${TONE[t.tone]}`}>{t.value}</p>
            <p className="mt-1 text-[11px] text-[#4A5A72] leading-snug">{t.detail}</p>
          </button>
        ))}
      </div>
    </section>
  );
};
