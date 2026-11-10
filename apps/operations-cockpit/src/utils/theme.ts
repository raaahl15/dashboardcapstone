import { useSyncExternalStore } from 'react';

/** Tema cockpit v2.0: Light (default) / Dark. Disimpan per perangkat di localStorage. */
export type Theme = 'light' | 'dark';

const KEY = 'cockpit-theme';
const listeners = new Set<() => void>();

const read = (): Theme => {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

let current: Theme = typeof window === 'undefined' ? 'light' : read();

const apply = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
};

apply(current);

export const setTheme = (theme: Theme) => {
  current = theme;
  apply(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* penyimpanan diblokir: tema tetap berlaku untuk sesi ini */
  }
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useTheme = (): [Theme, () => void] => {
  const theme = useSyncExternalStore(subscribe, () => current, () => 'light' as Theme);
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')];
};
