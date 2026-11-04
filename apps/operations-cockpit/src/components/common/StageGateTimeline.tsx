import React, { useMemo } from 'react';
import { Flag, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStaticData } from '../../utils/staticData';

/**
 * Pemetaan Stage-Gate G1–G4 ke titik kontrol Panduan Capstone (Blueprint §1.7, keputusan PM 2026-11-03).
 * Konfigurasi gate bersifat tetap (bukan data Firestore); tanggal G1 dihitung dari config.projectStartDate
 * (akhir minggu 13 PSTF 1), G2 dari config.tenderDeadline. Jadwal PSTF 2 belum dirilis.
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
  G1: 'akhir minggu 13 PSTF 1',
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
      G1: endOfProjectWeek(config.projectStartDate, 13),
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

  return (
    <section className="glass-card p-4 sm:p-6 space-y-4" aria-label="Pemetaan Stage-Gate G1 sampai G4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#0B1B33]">Stage-Gate G1–G4</h2>
          <p className="text-xs text-[#4A5A72]">
            Pemetaan ke titik kontrol Panduan Capstone (Blueprint §1.7). Gate berikutnya baru terbuka setelah gate sebelumnya lolos.
          </p>
        </div>
        <span className="h-8 px-3.5 rounded-full bg-white/70 border border-white text-[12px] font-semibold text-[#0062CC] inline-flex items-center">
          {lib.data ? `${ready} artefak berstatus Diajukan/ACC (syarat masuk bundel)` : 'Memuat status artefak...'}
        </span>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {GATES.map((g, i) => {
          const date = dates[g.id];
          const active = g.id === activeId;
          const past = GATES.findIndex((x) => x.id === activeId) > i;
          return (
            <li
              key={g.id}
              className={`p-4 rounded-2xl border space-y-2 ${active ? 'bg-white border-[#0062CC] shadow-xs' : 'bg-white/60 border-white'}`}
              aria-current={active ? 'step' : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading font-extrabold text-sm text-[#0B1B33] inline-flex items-center gap-1.5">
                  {past ? (
                    <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                  ) : active ? (
                    <Flag className="w-4 h-4 text-[#0062CC]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#94A3B8]" />
                  )}
                  {g.id}
                </span>
                <span className="text-[11px] font-semibold text-[#4A5A72] text-right leading-tight">
                  {fmt(date)}
                  <span className="block text-[10px] font-normal">{DATE_NOTE[g.id]}</span>
                </span>
              </div>
              <p className="text-xs font-bold text-[#0B1B33] leading-snug">{g.title}</p>
              <p className="text-[11px] text-[#4A5A72]">{g.control}</p>
              <p className="text-[11px]">
                <span className="text-[#4A5A72]">Penentu: </span>
                {g.decider}
              </p>
              <p className="text-[11px]">
                <span className="text-[#4A5A72]">Bukti: </span>
                {g.evidence}
              </p>
              <ul className="text-[11px] text-[#0B1B33] list-disc pl-4">
                {g.bundle.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {past && <p className="text-[10px] text-[#92400E]">Tanggal lewat; konfirmasi status lolos lewat MoM/berita acara.</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
