import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MigrationPreviewResult } from '../../utils/migrateUserRefs';
import { Download, Upload, RefreshCw, X, Check, AlertCircle, Database } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const {
    exportDataToJson,
    importDataFromJson,
    resetToDefaults,
    isPM,
    previewUserMigration,
    executeUserMigration,
  } = useApp();
  const [importText, setImportText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [migrationPreview, setMigrationPreview] = useState<MigrationPreviewResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const jsonStr = exportDataToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `area1-dme-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'File cadangan JSON berhasil diunduh!' });
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan data JSON terlebih dahulu.' });
      return;
    }
    const result = importDataFromJson(importText);
    if (result === 'success') {
      setStatusMessage({ type: 'success', text: 'Data proyek berhasil dipulihkan!' });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
        setImportText('');
      }, 1200);
    } else if (result === 'users-unavailable') {
      setStatusMessage({
        type: 'error',
        text: 'Impor dibatalkan tanpa mengubah data: backup memuat profil pengguna, tetapi profil tidak dapat dipulihkan saat koleksi pengguna aktif.',
      });
    } else {
      setStatusMessage({ type: 'error', text: 'Format JSON tidak valid atau struktur rusak.' });
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset seluruh data bersama ke pengaturan awal (initial seed)? Perubahan semua anggota tim akan dikembalikan.'
      )
    ) {
      resetToDefaults();
      setStatusMessage({ type: 'success', text: 'Data dikembalikan ke pengaturan awal pabrik.' });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1000);
    }
  };

  const handlePreviewMigration = () => {
    const preview = previewUserMigration();
    setMigrationPreview(preview);
    setStatusMessage(null);
  };

  const handleConfirmMigration = async () => {
    if (!migrationPreview) return;
    setIsMigrating(true);
    try {
      const result = await executeUserMigration();
      setMigrationPreview(null);
      setStatusMessage({
        type: 'success',
        text:
          result.totalRecordsToChange > 0
            ? `Migrasi selesai! ${result.firestoreDocumentsToChange} dokumen utama (${result.totalRecordsToChange} entri referensi) berhasil dikonversi ke UID.`
            : 'Data sudah sinkron menggunakan UID (0 dokumen diubah).',
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Gagal menjalankan migrasi referensi pengguna.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface rounded-[32px] shadow-cockpit-pop sm:p-8 max-h-[90vh] overflow-y-auto v2-modal v2-form">
        <div className="v2-modal-head">
          <div>
            <h3 className="v2-modal-title">
              Cadangan & Pemulihan Data
            </h3>
            <p className="text-xs text-fg-3 mt-0.5">
              Ekspor atau impor dataset lengkap proyek Capstone Area 1
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-muted text-fg flex items-center justify-center hover:bg-muted transition-colors"
            title="Tutup Modal"
            aria-label="Tutup modal cadangan dan pemulihan data"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-success-soft text-success'
                : 'bg-danger-soft text-danger'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Export Section */}
          <div className="p-4 rounded-2xl bg-muted border border-glass-stroke flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-xs text-fg">
                Ekspor Cadangan (.JSON)
              </p>
              <p className="text-[11px] text-fg-3">
                Simpan status rekayasa, RACI, logbook, dan timeline.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </button>
          </div>

          {/* Import Section (Admin only) */}
          {isPM && (
            <div className="space-y-2">
              <label className="block font-heading font-bold text-xs text-fg">
                Impor Cadangan JSON
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Tempelkan isi file JSON cadangan di sini..."
                rows={4}
                className="w-full p-3 text-xs font-mono rounded-xl border border-line-strong focus:border-primary focus:ring-1 focus:ring-focus outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-ink hover:bg-ink-2 text-on-ink rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pulihkan Data
                </button>
              </div>
            </div>
          )}

          {/* Admin-Only One-Time User Reference Migration Section */}
          {isPM && (
            <div className="pt-3 border-t border-line space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-heading font-bold text-xs text-fg">
                    Migrasi Referensi Nama ke UID (Admin)
                  </p>
                  <p className="text-[11px] text-fg-3">
                    Konversi referensi nama/kode lama menjadi UID (`users/&#123;uid&#125;`) secara idempotent tanpa menghapus field lama.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePreviewMigration}
                  className="px-3.5 py-1.5 bg-muted hover:bg-muted text-primary rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all"
                >
                  <Database className="w-3.5 h-3.5" />
                  Cek Migrasi
                </button>
              </div>

              {migrationPreview && (
                <div className="p-3.5 rounded-2xl bg-muted border border-line-strong space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-fg">
                       hasil Pemeriksaan Migrasi:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-primary">
                      {migrationPreview.firestoreDocumentsToChange} Dokumen ({migrationPreview.totalRecordsToChange} Entri) Akan Diubah
                    </span>
                  </div>

                  {migrationPreview.breakdown.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-fg-3 list-disc list-inside">
                      {migrationPreview.breakdown.map((item) => (
                        <li key={item.category}>
                          {item.category}: <strong>{item.count}</strong> entri
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-success font-medium">
                      Seluruh referensi pengguna sudah memakai UID kanonik (0 dokumen perlu diubah).
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMigrationPreview(null)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-fg-3 hover:bg-muted/60 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isMigrating}
                      onClick={() => {
                        void handleConfirmMigration();
                      }}
                      className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-primary hover:bg-primary-hover text-on-primary transition-colors disabled:opacity-50"
                    >
                      {isMigrating
                        ? 'Memproses...'
                        : `Konfirmasi & Eksekusi (${migrationPreview.totalRecordsToChange} perubahan)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset Section (Admin only) */}
          {isPM && (
            <div className="pt-3 border-t border-line flex items-center justify-between">
              <div>
                <p className="font-heading font-bold text-xs text-danger">
                  Reset Data Awal
                </p>
                <p className="text-[11px] text-fg-3">
                  Reset data bersama di Firestore ke data standar KAK & PRD.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 border border-danger-line text-danger hover:bg-danger-soft rounded-full text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
