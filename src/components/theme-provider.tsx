'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  set: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sak-examples-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Read the persisted theme on mount. Default to dark.
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
    setMounted(true);
  }, []);

  // Apply the theme to <html>.
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
  }, [theme, mounted]);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const set = (next: Theme) => {
    setTheme(next);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle, set }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe default during SSR — before the provider mounts.
    return {
      theme: 'dark',
      toggle: () => {},
      set: () => {},
    };
  }
  return ctx;
}
