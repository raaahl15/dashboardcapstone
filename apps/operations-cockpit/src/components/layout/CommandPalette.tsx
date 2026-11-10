import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ClipboardCheck, CornerDownLeft, LayoutGrid } from 'lucide-react';
import { useApp, type NavTab } from '../../context/AppContext';
import { NAV_GROUPS } from './navigation';
import { NAV_ICONS } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type Item =
  | { kind: 'menu'; id: string; label: string; hint: string; tab: NavTab; groupKey: string }
  | { kind: 'wo'; id: string; label: string; hint: string; woId: string };

/** Pencarian cepat (Ctrl K): lompat ke menu/sub-tab atau buka Work Order. Hanya membaca data yang sudah dimuat. */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { setActiveTab, workOrders, openWorkOrderDetail } = useApp();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const items = useMemo<Item[]>(() => {
    const menus: Item[] = NAV_GROUPS.flatMap((g) =>
      g.tabs.map((t) => ({
        kind: 'menu' as const,
        id: `menu-${t.key}`,
        label: g.tabs.length > 1 ? `${g.label} › ${t.label}` : g.label,
        hint: 'Menu',
        tab: t.key,
        groupKey: g.key,
      }))
    );
    const wos: Item[] = workOrders.map((w) => ({
      kind: 'wo' as const,
      id: `wo-${w.id}`,
      label: `${w.code} · ${w.title}`,
      hint: w.status,
      woId: w.id,
    }));
    const q = query.trim().toLowerCase();
    if (!q) return [...menus, ...wos.slice(0, 5)];
    return [...menus, ...wos].filter((it) => it.label.toLowerCase().includes(q)).slice(0, 12);
  }, [query, workOrders]);

  if (!isOpen) return null;

  const run = (it: Item | undefined) => {
    if (!it) return;
    if (it.kind === 'menu') setActiveTab(it.tab);
    else openWorkOrderDetail(it.woId);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[cursor]);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
      <button type="button" className="absolute inset-0 bg-[#021024]/45 backdrop-blur-xs" aria-label="Tutup pencarian" onClick={onClose} />
      <div className="anim-pop relative w-full max-w-xl bg-surface rounded-[28px] border border-line shadow-cockpit-pop overflow-hidden" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 px-5 h-14 border-b border-line">
          <Search className="w-4 h-4 text-fg-3 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Cari menu atau Work Order…"
            className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-fg-3"
            aria-label="Kata kunci pencarian"
          />
          <kbd className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-fg-3">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <li className="px-4 py-8 text-center text-xs text-fg-3">Tidak ada hasil untuk “{query}”.</li>}
          {items.map((it, i) => {
            const Icon = it.kind === 'menu' ? NAV_ICONS[it.groupKey] ?? LayoutGrid : ClipboardCheck;
            const active = i === cursor;
            return (
              <li key={it.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => run(it)}
                  className={`w-full min-h-[44px] px-3 rounded-2xl flex items-center gap-3 text-left ${active ? 'bg-muted' : ''}`}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 min-w-0 truncate text-sm font-medium text-fg">{it.label}</span>
                  <span className="text-[11px] text-fg-3 shrink-0">{it.hint}</span>
                  {active && <CornerDownLeft className="w-3.5 h-3.5 text-fg-3 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
