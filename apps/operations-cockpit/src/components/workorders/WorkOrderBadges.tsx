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
    bg: 'bg-muted',
    text: 'text-fg-2',
    border: 'border-line-strong',
    dot: 'bg-fg-3',
    Icon: Clock,
  },
  Dikerjakan: {
    bg: 'bg-primary-soft',
    text: 'text-fg-2',
    border: 'border-line',
    dot: 'bg-primary',
    Icon: PlayCircle,
  },
  Blocked: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    border: 'border-danger-line',
    dot: 'bg-danger-solid',
    Icon: PauseCircle,
  },
  Diajukan: {
    bg: 'bg-warm-soft',
    text: 'text-warm',
    border: 'border-warm-line',
    dot: 'bg-warm-solid',
    Icon: Send,
  },
  Selesai: {
    bg: 'bg-success-soft',
    text: 'text-success',
    border: 'border-success-line',
    dot: 'bg-success-solid',
    Icon: CheckCircle2,
  },
  Dibatalkan: {
    bg: 'bg-muted',
    text: 'text-fg-3',
    border: 'border-line-strong',
    dot: 'bg-fg-3',
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
    bg: 'bg-muted',
    text: 'text-fg-2',
    border: 'border-line-strong',
  },
  Normal: {
    bg: 'bg-muted',
    text: 'text-primary',
    border: 'border-line',
  },
  Tinggi: {
    bg: 'bg-warm-soft',
    text: 'text-warm',
    border: 'border-warm-line',
  },
  Kritis: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    border: 'border-danger-line',
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
          className={`inline-flex items-center gap-1 rounded-full font-bold border bg-warm-soft text-warm border-warm-line ${sizeCls}`}
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
      className={`inline-flex items-center gap-1 rounded-full font-bold bg-danger-solid text-on-ink ${sizeCls}`}
    >
      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
      <span>
        Terlambat{typeof daysLate === 'number' && daysLate > 0 ? ` ${daysLate}h` : ''}
      </span>
    </span>
  );
};
