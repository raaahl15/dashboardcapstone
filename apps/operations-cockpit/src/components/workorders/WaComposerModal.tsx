import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, MessageCircle, RotateCcw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkOrder } from '../../types';
import {
  WA_TEMPLATES,
  WaTemplateKey,
  buildWoMessage,
  formatWaPhone,
  normalizeWaPhone,
  personalizeForRecipient,
  suggestTemplate,
  waLinkTo,
} from '../../utils/waTemplates';

/**
 * Panel pesan WhatsApp satu Work Order (LOG-063).
 * PM memilih template (Ditugaskan / Direvisi / Disetujui), mengecek pratinjau,
 * lalu menekan tombol WA milik PIC: wa.me/<nomor PIC> terbuka dengan pesan terisi,
 * PM tinggal menekan Kirim. Nomor WA diambil dari Profil anggota.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  wo: WorkOrder;
  initialTemplate?: WaTemplateKey;
}

export const WaComposerModal: React.FC<Props> = ({ open, onClose, wo, initialTemplate }) => {
  const { getUser, config, weeklyPlans, currentUser } = useApp();

  const [templateKey, setTemplateKey] = useState<WaTemplateKey>('ditugaskan');
  const [text, setText] = useState('');
  const [edited, setEdited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [includeAiGuide, setIncludeAiGuide] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTemplateKey(initialTemplate || suggestTemplate(wo));
    setEdited(false);
    setCopied(false);
    setIncludeAiGuide(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wo.id]);

  const generated = useMemo(
    () =>
      buildWoMessage(templateKey, wo, {
        today: new Date(),
        getUser,
        weeklyPlans,
        projectStartDate: config.projectStartDate,
        pmName: currentUser.nickname || 'Rahul',
        includeAiGuide,
      }),
    [templateKey, wo, getUser, weeklyPlans, config.projectStartDate, currentUser.nickname, includeAiGuide]
  );

  // Pratinjau mengikuti template selama PM belum mengedit manual
  useEffect(() => {
    if (!edited) setText(generated);
  }, [generated, edited]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const recipients = wo.assigneeIds.map((id) => {
    const u = getUser(id);
    const phone = normalizeWaPhone(u?.phone);
    return { id, person: u, name: u?.nickname || u?.name || id, phone };
  });
  const missing = recipients.filter((r) => !r.phone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-ink/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-composer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[94vh] flex flex-col bg-surface rounded-[28px] shadow-cockpit-pop border border-glass-stroke overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-soft text-success">
                PESAN WHATSAPP · RAKAI
              </span>
              <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-ink text-on-ink">
                {wo.code}
              </span>
            </div>
            <h2 id="wa-composer-title" className="font-heading font-bold text-base text-fg mt-1.5 truncate">
              Kirim pesan ke PIC
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full hover:bg-muted text-fg-3 hover:text-fg flex items-center justify-center transition-colors shrink-0"
            aria-label="Tutup panel pesan WhatsApp"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Template */}
          <div>
            <span className="block text-xs font-bold text-fg mb-1.5">Template pesan</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {WA_TEMPLATES.map((t) => {
                const active = t.key === templateKey;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTemplateKey(t.key);
                      setEdited(false);
                    }}
                    className={`min-h-[52px] px-3 py-2 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-ink border-fg text-on-ink'
                        : 'bg-surface border-line text-fg hover:bg-muted'
                    }`}
                  >
                    <span className="block text-xs font-bold">{t.label}</span>
                    <span className={`block text-[10px] ${active ? 'text-on-ink/70' : 'text-fg-3'}`}>{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pratinjau */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="wa-composer-text" className="text-xs font-bold text-fg">
                Pratinjau pesan (bisa diedit)
              </label>
              {edited && (
                <button
                  type="button"
                  onClick={() => setEdited(false)}
                  className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Kembalikan ke template
                </button>
              )}
            </div>
            {templateKey !== 'disetujui' && (
              <label className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-fg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiGuide}
                  onChange={(e) => {
                    setIncludeAiGuide(e.target.checked);
                    setEdited(false);
                  }}
                  className="w-4 h-4 accent-primary"
                />
                Sertakan tutorial kerja dengan bantuan AI (prompt baca proyek + prompt WO)
              </label>
            )}
            <textarea
              id="wa-composer-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setEdited(true);
              }}
              rows={16}
              className="w-full min-h-[300px] p-3.5 rounded-xl border border-line-strong text-xs leading-relaxed font-mono text-fg bg-muted outline-none focus:border-primary focus:ring-2 focus:ring-focus/20"
            />
          </div>

          {/* Penerima */}
          <div className="p-4 rounded-2xl bg-muted border border-line space-y-2">
            <span className="block text-xs font-bold text-fg">Kirim ke PIC</span>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) =>
                r.phone ? (
                  <a
                    key={r.id}
                    href={text.trim() ? waLinkTo(r.phone, personalizeForRecipient(text, r.person)) : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-4 rounded-full bg-success-solid hover:bg-success-solid text-on-ink text-xs font-bold inline-flex items-center gap-2 shadow-xs"
                    title={`Buka WhatsApp ${r.name} (${formatWaPhone(r.phone)})`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{r.name}</span>
                    <span className="font-mono font-semibold text-on-ink/80">{formatWaPhone(r.phone)}</span>
                  </a>
                ) : (
                  <span
                    key={r.id}
                    className="min-h-[44px] px-4 rounded-full bg-muted text-fg-3 text-xs font-bold inline-flex items-center gap-2 border border-dashed border-line"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {r.name} · nomor belum ada
                  </span>
                )
              )}
            </div>
            {missing.length > 0 && (
              <p className="text-[11px] text-warm flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>
                  Isi nomor WA {missing.map((m) => m.name).join(', ')} di menu Profil (kolom Kontak / No. Telepon).
                </span>
              </p>
            )}
            <p className="text-[11px] text-fg-3">
              Tombol membuka chat PIC dengan pesan sudah terisi. Tinggal tekan Kirim.{' '}
              <code>{'{nama}'}</code> dan <code>{'{posisi}'}</code> di pratinjau otomatis diganti dengan nama dan jabatan
              tiap PIC (jabatan dari Profil).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-line flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 rounded-full text-xs font-bold text-fg-3 hover:bg-muted transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            className="min-h-[44px] px-4 rounded-full bg-surface border border-line hover:bg-muted disabled:opacity-50 text-primary text-xs font-bold inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin' : 'Salin pesan'}
          </button>
        </div>
      </div>
    </div>
  );
};
