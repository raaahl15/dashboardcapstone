import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * Jalur notifikasi utama Blueprint §3.5: tautan wa.me berisi pesan siap kirim.
 * Tanpa server, tanpa token, tanpa risiko blokir nomor; pengirim tetap menekan "Kirim" sendiri.
 */
export const buildWaLink = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;

interface Props {
  text: string;
  label?: string;
  compact?: boolean;
}

export const WhatsAppShareButton: React.FC<Props> = ({ text, label = 'Bagikan ke WhatsApp', compact }) => (
  <a
    href={buildWaLink(text)}
    target="_blank"
    rel="noreferrer"
    title={label}
    aria-label={label}
    className="min-h-[44px] px-3.5 rounded-full bg-success-soft hover:bg-success-soft text-success text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
  >
    <MessageCircle className="w-3.5 h-3.5" />
    {!compact && <span className="hidden sm:inline">WhatsApp</span>}
  </a>
);
