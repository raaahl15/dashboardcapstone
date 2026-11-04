/**
 * Serah-terima draf logbook dari Meeting Log (Weekly MoM) ke modul Logbook (P2 audit, LOG-032).
 * Panduan Lampiran 2: logbook diisi maks. 1×24 jam setelah pertemuan, isi harus spesifik.
 * Disimpan di variabel modul (satu sesi SPA); tidak ada yang ditulis ke Firestore sampai pengguna menekan Simpan.
 */
export interface LogbookDraft {
  weekNumber: number;
  date: string;
  workDescription: string;
  issueSolution: string;
}

let pending: LogbookDraft | null = null;

export const requestLogbookDraft = (draft: LogbookDraft): void => {
  pending = draft;
};

export const consumeLogbookDraft = (): LogbookDraft | null => {
  const d = pending;
  pending = null;
  return d;
};
