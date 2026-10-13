import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function useTheme(storageKey = 'ritsu-theme', defaultTheme: ThemePreference = 'system') {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = localStorage.getItem(storageKey);
    return (stored as ThemePreference) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const attr = document.documentElement.getAttribute('data-theme');
    return (attr as ResolvedTheme) || 'dark';
  });

  const applyTheme = useCallback((pref: ThemePreference) => {
    let resolved: ResolvedTheme = 'dark';
    if (pref === 'light' || pref === 'dark') {
      resolved = pref;
    } else {
      // System mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
    setResolvedTheme(resolved);

    // Update browser theme-color meta tag
    const meta = document.getElementById('theme-color-meta');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#141414' : '#FFF9EE');
    }
  }, []);

  const setTheme = useCallback(
    (newPref: ThemePreference) => {
      setPreference(newPref);
      localStorage.setItem(storageKey, newPref);
      applyTheme(newPref);
    },
    [storageKey, applyTheme]
  );

  useEffect(() => {
    applyTheme(preference);

    // Listen for OS theme preference changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (preference === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [preference, applyTheme]);

  return {
    theme: preference,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };
}
