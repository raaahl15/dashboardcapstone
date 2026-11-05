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
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#0B1B33]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-composer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[94vh] flex flex-col bg-white rounded-[28px] shadow-cockpit-pop border border-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAF6FD] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534]">
                PESAN WHATSAPP · RAKAI
              </span>
              <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#0B1B33] text-white">
                {wo.code}
              </span>
            </div>
            <h2 id="wa-composer-title" className="font-heading font-bold text-base text-[#0B1B33] mt-1.5 truncate">
              Kirim pesan ke PIC
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full hover:bg-[#EAF6FD] text-[#4A5A72] hover:text-[#0B1B33] flex items-center justify-center transition-colors shrink-0"
            aria-label="Tutup panel pesan WhatsApp"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Template */}
          <div>
            <span className="block text-xs font-bold text-[#0B1B33] mb-1.5">Template pesan</span>
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
                        ? 'bg-[#0B1B33] border-[#0B1B33] text-white'
                        : 'bg-white border-[#C9DCEB] text-[#0B1B33] hover:bg-[#EAF6FD]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{t.label}</span>
                    <span className={`block text-[10px] ${active ? 'text-white/70' : 'text-[#4A5A72]'}`}>{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pratinjau */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="wa-composer-text" className="text-xs font-bold text-[#0B1B33]">
                Pratinjau pesan (bisa diedit)
              </label>
              {edited && (
                <button
                  type="button"
                  onClick={() => setEdited(false)}
                  className="text-[11px] font-bold text-[#0062CC] hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Kembalikan ke template
                </button>
              )}
            </div>
            {templateKey !== 'disetujui' && (
              <label className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#0B1B33] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiGuide}
                  onChange={(e) => {
                    setIncludeAiGuide(e.target.checked);
                    setEdited(false);
                  }}
                  className="w-4 h-4 accent-[#0062CC]"
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
              className="w-full min-h-[300px] p-3.5 rounded-xl border border-[#6B7F99] text-xs leading-relaxed font-mono text-[#0B1B33] bg-[#F8FAFC] outline-none focus:border-[#0062CC] focus:ring-2 focus:ring-[#0062CC]/20"
            />
          </div>

          {/* Penerima */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCEBF7] space-y-2">
            <span className="block text-xs font-bold text-[#0B1B33]">Kirim ke PIC</span>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) =>
                r.phone ? (
                  <a
                    key={r.id}
                    href={text.trim() ? waLinkTo(r.phone, personalizeForRecipient(text, r.person)) : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs"
                    title={`Buka WhatsApp ${r.name} (${formatWaPhone(r.phone)})`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{r.name}</span>
                    <span className="font-mono font-semibold text-white/80">{formatWaPhone(r.phone)}</span>
                  </a>
                ) : (
                  <span
                    key={r.id}
                    className="min-h-[44px] px-4 rounded-full bg-[#F1F5F9] text-[#4A5A72] text-xs font-bold inline-flex items-center gap-2 border border-dashed border-[#C9DCEB]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {r.name} · nomor belum ada
                  </span>
                )
              )}
            </div>
            {missing.length > 0 && (
              <p className="text-[11px] text-[#92400E] flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>
                  Isi nomor WA {missing.map((m) => m.name).join(', ')} di menu Profil (kolom Kontak / No. Telepon).
                </span>
              </p>
            )}
            <p className="text-[11px] text-[#4A5A72]">
              Tombol membuka chat PIC dengan pesan sudah terisi. Tinggal tekan Kirim.{' '}
              <code>{'{nama}'}</code> dan <code>{'{posisi}'}</code> di pratinjau otomatis diganti dengan nama dan jabatan
              tiap PIC (jabatan dari Profil).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#EAF6FD] flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 rounded-full text-xs font-bold text-[#4A5A72] hover:bg-[#F1F5F9] transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            className="min-h-[44px] px-4 rounded-full bg-white border border-[#C9DCEB] hover:bg-[#EAF6FD] disabled:opacity-50 text-[#0062CC] text-xs font-bold inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin' : 'Salin pesan'}
          </button>
        </div>
      </div>
    </div>
  );
};
