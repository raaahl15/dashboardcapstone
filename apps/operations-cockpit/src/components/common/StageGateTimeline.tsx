import React, { useMemo } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStaticData } from '../../utils/staticData';

/**
 * Pemetaan Stage-Gate G1–G4 ke titik kontrol Panduan Capstone (Blueprint §1.7, keputusan PM 2026-11-03).
 * Konfigurasi gate bersifat tetap (bukan data Firestore); tanggal G1 dihitung dari config.projectStartDate
 * (akhir minggu 13 PSTF 1, dihitung dalam minggu EFEKTIF: 2 minggu UTS W8–W9 tidak dihitung, keputusan PM\n * dikonfirmasi dosen, LOG-044 → 29 Nov 2026), G2 dari config.tenderDeadline. Jadwal PSTF 2 belum dirilis.
 */
interface Gate {
  id: 'G1' | 'G2' | 'G3' | 'G4';
  title: string;
  control: string;
  decider: string;
  evidence: string;
  bundle: string[];
}

const GATES: Gate[] = [
  {
    id: 'G1',
    title: 'ACC Pembimbing draf Laporan PSTF 1',
    control: 'Lampiran 1 Tahap 2, syarat maju presentasi',
    decider: 'Dosen Pembimbing',
    evidence: 'Paraf/ACC tercatat di MoM',
    bundle: ['Laporan PSTF 1 Bab 1–4', 'PFD + neraca massa & panas', 'Draf P&ID A3', 'Tekno-ekonomi', 'Logbook'],
  },
  {
    id: 'G2',
    title: 'Evaluasi PSTF 1',
    control: 'Tahap 3, panel Koordinator + Pembimbing + Praktisi',
    decider: 'Panel evaluasi: Layak / Revisi Mayor',
    evidence: 'Berita acara / nilai Lampiran 4A–4B',
    bundle: ['Bundel G1 versi final', 'Slide presentasi tender'],
  },
  {
    id: 'G3',
    title: 'ACC final Pembimbing sizing & DED',
    control: 'Lampiran 1 Tahap 4',
    decider: 'Dosen Pembimbing',
    evidence: 'Paraf/ACC tercatat di MoM',
    bundle: ['Laporan PSTF 2 Bab 1–6', 'P&ID Final', 'ISA-20', 'Loop & logic', 'Hook-up', 'BoM', 'Virtual FAT'],
  },
  {
    id: 'G4',
    title: 'Evaluasi Akhir PSTF 2',
    control: 'Tahap 5',
    decider: 'Panel evaluasi',
    evidence: 'Nilai Lampiran 5A–5B',
    bundle: ['Bundel G3 final', 'Cetak biru A3'],
  },
];

/** RFP KAK-IC-DME-2026-001: batas penawaran FEED 15-12-2026 (= G2) dan DED 30-06-2027 (acuan G4). */
export const RFP_DED_DEADLINE = new Date(2027, 5, 30);
const DATE_NOTE: Record<Gate['id'], string> = {
  G1: 'akhir minggu efektif 13 PSTF 1 (tanpa 2 minggu UTS)',
  G2: 'tenggat FEED (RFP)',
  G3: 'jadwal PSTF 2 belum dirilis',
  G4: 'tenggat DED (RFP)',
};

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Agt: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };

/** "15 Des 2026, 23:59 WIB" -> Date (lokal); null bila tidak terbaca. */
export const parseIndoDate = (text: string): Date | null => {
  const m = text.match(/(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})/);
  if (!m || !(m[2] in MONTHS)) return null;
  return new Date(Number(m[3]), MONTHS[m[2]], Number(m[1]));
};

/** Minggu UTS PSTF 1 (W8–W9, 5–18 Okt 2026) yang tidak dihitung sebagai minggu Panduan (LOG-044). */
export const UTS_BREAK_WEEKS = 2;

/** Akhir minggu ke-n proyek (minggu 1 dimulai projectStartDate). */
export const endOfProjectWeek = (startYmd: string, week: number): Date | null => {
  const [y, mo, d] = startYmd.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d + week * 7 - 1);
};

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

export const StageGateTimeline: React.FC = () => {
  const { config } = useApp();
  const lib = useStaticData<{ documents: { status: string }[] }>('library_manifest.json');

  const dates = useMemo<Record<Gate['id'], Date | null>>(
    () => ({
      G1: endOfProjectWeek(config.projectStartDate, 13 + UTS_BREAK_WEEKS),
      G2: parseIndoDate(config.tenderDeadline),
      G3: null,
      G4: RFP_DED_DEADLINE,
    }),
    [config.projectStartDate, config.tenderDeadline]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // gate aktif = gate pertama yang tanggalnya belum lewat (G3/G4 aktif setelah G2 lewat)
  const activeId = (GATES.find((g) => dates[g.id] === null || (dates[g.id] as Date) >= today) ?? GATES[3]).id;
  const ready = (lib.data?.documents ?? []).filter((d) => d.status === 'Diajukan' || d.status === 'ACC Pembimbing').length;

  const activeIdx = GATES.findIndex((x) => x.id === activeId);
  const daysTo = (d: Date | null) => (d ? Math.ceil((d.getTime() - today.getTime()) / 86400000) : null);

  return (
    <section className="space-y-2" aria-label="Pemetaan Stage-Gate G1 sampai G4">
      <ol className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {GATES.map((g, i) => {
          const date = dates[g.id];
          const active = i === activeIdx;
          const past = i < activeIdx;
          const next = i === activeIdx + 1;
          const locked = i > activeIdx + 1;
          const left = daysTo(date);
          return (
            <li
              key={g.id}
              aria-current={active ? 'step' : undefined}
              className={`rounded-[32px] p-6 min-h-[250px] flex flex-col gap-2 ${
                active
                  ? 'bg-hero shadow-cockpit-pop'
                  : locked
                  ? 'border-2 border-dashed border-line-strong text-fg-3'
                  : 'glass-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-heading text-5xl font-extralight leading-none ${active ? '' : locked ? 'text-fg-3' : 'text-fg'}`}>{g.id}</span>
                {active ? (
                  <span className="px-3 py-1 rounded-full bg-surface text-fg-2 text-[11px] font-semibold uppercase tracking-wide">Berikutnya</span>
                ) : past ? (
                  <span className="px-3 py-1 rounded-full bg-success-soft text-success text-[11px] font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lewat
                  </span>
                ) : next ? (
                  <span className="px-3 py-1 rounded-full bg-warm-soft text-warm text-[11px] font-semibold uppercase tracking-wide">{DATE_NOTE[g.id]}</span>
                ) : (
                  <Lock className="w-4 h-4" aria-label="Terkunci" />
                )}
              </div>
              <p className={`text-xs ${active ? 'text-on-ink-2' : 'text-fg-3'}`}>
                {fmt(date)}
                {active && left !== null ? ` · ${left} hari lagi` : ` · ${DATE_NOTE[g.id]}`}
              </p>
              <p className={`text-lg font-semibold leading-snug ${active ? '' : locked ? 'text-fg-2' : 'text-fg'}`}>{g.title}</p>
              <p className={`text-xs leading-relaxed ${active ? 'text-on-ink-2' : 'text-fg-3'}`}>
                {g.control} · Penentu: {g.decider} · Bukti: {g.evidence}
              </p>
              <p className={`mt-auto pt-3 text-xs leading-relaxed ${active ? 'text-on-ink' : 'text-fg-2'}`}>{g.bundle.join(' · ')}</p>
              {past && <p className="text-[11px] text-warm">Tanggal lewat; konfirmasi status lolos lewat MoM/berita acara.</p>}
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-fg-3">
        Gate berikutnya baru terbuka setelah gate sebelumnya lolos (Blueprint §1.7).{' '}
        {lib.data ? `${ready} artefak berstatus Diajukan/ACC (syarat masuk bundel).` : 'Memuat status artefak...'}
      </p>
    </section>
  );
};
