import { useState, useEffect, useCallback } from 'react';

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

function getResolvedTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useReaderPreferences() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    getResolvedTheme(prefs.theme)
  );

  useEffect(() => {
    setResolvedTheme(getResolvedTheme(prefs.theme));

    if (prefs.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [prefs.theme]);

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
