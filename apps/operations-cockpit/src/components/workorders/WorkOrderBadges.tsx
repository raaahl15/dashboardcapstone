import React from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Send,
} from 'lucide-react';
import { WorkOrderPriority, WorkOrderStatus } from '../../types';

export const STATUS_BADGE_CONFIG: Record<
  WorkOrderStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Ditugaskan: {
    bg: 'bg-[#E2E8F0]',
    text: 'text-[#334155]',
    border: 'border-[#CBD5E1]',
    dot: 'bg-[#64748B]',
    Icon: Clock,
  },
  Dikerjakan: {
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1E3A8A]',
    border: 'border-[#93C5FD]',
    dot: 'bg-[#1D4ED8]',
    Icon: PlayCircle,
  },
  Blocked: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FCA5A5]',
    dot: 'bg-[#B91C1C]',
    Icon: PauseCircle,
  },
  Diajukan: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-[#FCD34D]',
    dot: 'bg-[#B45309]',
    Icon: Send,
  },
  Selesai: {
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#065F46]',
    border: 'border-[#6EE7B7]',
    dot: 'bg-[#047857]',
    Icon: CheckCircle2,
  },
  Dibatalkan: {
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#475569]',
    border: 'border-[#CBD5E1]',
    dot: 'bg-[#94A3B8]',
    Icon: Ban,
  },
};

export const PRIORITY_BADGE_CONFIG: Record<
  WorkOrderPriority,
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  Rendah: {
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#334155]',
    border: 'border-[#CBD5E1]',
  },
  Normal: {
    bg: 'bg-[#EAF6FD]',
    text: 'text-[#0062CC]',
    border: 'border-[#BAE6FD]',
  },
  Tinggi: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
  },
  Kritis: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FECACA]',
  },
};

export const WorkOrderStatusBadge: React.FC<{
  status: WorkOrderStatus;
  needsRevision?: boolean;
  size?: 'xs' | 'sm';
}> = ({ status, needsRevision = false, size = 'xs' }) => {
  const cfg = STATUS_BADGE_CONFIG[status];
  const Icon = cfg.Icon;
  const sizeCls =
    size === 'sm' ? 'px-3 py-1 text-[11px]' : 'px-2.5 py-0.5 text-[10px]';

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeCls}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{status}</span>
      </span>
      {needsRevision && status === 'Dikerjakan' && (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold border bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] ${sizeCls}`}
        >
          <RotateCcw className="w-2.5 h-2.5 shrink-0" />
          <span>Revisi</span>
        </span>
      )}
    </span>
  );
};

export const WorkOrderPriorityBadge: React.FC<{
  priority: WorkOrderPriority;
  size?: 'xs' | 'sm';
}> = ({ priority, size = 'xs' }) => {
  const cfg = PRIORITY_BADGE_CONFIG[priority];
  const sizeCls =
    size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeCls}`}
    >
      {priority}
    </span>
  );
};

export const WorkOrderOverdueBadge: React.FC<{
  daysLate?: number;
  size?: 'xs' | 'sm';
}> = ({ daysLate, size = 'xs' }) => {
  const sizeCls =
    size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold bg-[#B91C1C] text-white ${sizeCls}`}
    >
      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
      <span>
        Terlambat{typeof daysLate === 'number' && daysLate > 0 ? ` ${daysLate}h` : ''}
      </span>
    </span>
  );
};
