import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'interviewiq-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
};

let currentTheme = getInitialTheme();
const listeners = new Set();

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function setTheme(next) {
  currentTheme = next;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

applyTheme(currentTheme);

/**
 * Tiny lazy-initialised theme store ("dark" | "light") shared by the whole app.
 */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => currentTheme,
    () => 'dark'
  );

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, []);

  return { theme, toggleTheme };
}
