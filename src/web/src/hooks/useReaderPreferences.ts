import { useState, useEffect, useCallback, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ReaderPreferences {
  fontSize: number;
  theme: ThemeMode;
}

const PREFS_KEY = 'readwise_reader_prefs';
const DEFAULT_PREFS: ReaderPreferences = { fontSize: 18, theme: 'system' };
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 24;
const FONT_STEP = 2;

function loadPrefs(): ReaderPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: ReaderPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function useReaderPreferences() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Subscribe to OS theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Derive resolved theme from prefs + system state — no effect needed
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (prefs.theme !== 'system') return prefs.theme;
    return systemIsDark ? 'dark' : 'light';
  }, [prefs.theme, systemIsDark]);

  const update = useCallback((partial: Partial<ReaderPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      savePrefs(next);
      return next;
    });
  }, []);

  const increaseFontSize = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, fontSize: Math.min(prev.fontSize + FONT_STEP, MAX_FONT_SIZE) };
      savePrefs(next);
      return next;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, fontSize: Math.max(prev.fontSize - FONT_STEP, MIN_FONT_SIZE) };
      savePrefs(next);
      return next;
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setPrefs((prev) => {
      const order: ThemeMode[] = ['light', 'dark', 'system'];
      const idx = order.indexOf(prev.theme);
      const next = { ...prev, theme: order[(idx + 1) % order.length] };
      savePrefs(next);
      return next;
    });
  }, []);

  return {
    fontSize: prefs.fontSize,
    theme: prefs.theme,
    resolvedTheme,
    increaseFontSize,
    decreaseFontSize,
    cycleTheme,
    canIncrease: prefs.fontSize < MAX_FONT_SIZE,
    canDecrease: prefs.fontSize > MIN_FONT_SIZE,
    update,
  };
}
