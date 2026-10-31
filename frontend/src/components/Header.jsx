import { useCallback, useEffect, useState } from 'react';
import { Moon, RefreshCw, Sun, Sparkles } from 'lucide-react';
import { getHealth } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  loading: 'bg-muted text-muted-foreground',
  ok: 'bg-success/15 text-success',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-destructive/15 text-destructive',
};

function useBackendStatus() {
  const [status, setStatus] = useState({ state: 'loading', label: 'Checking API...', detail: '' });

  const check = useCallback(async () => {
    setStatus((prev) => ({ ...prev, state: 'loading', label: 'Checking API...' }));
    try {
      const health = await getHealth();
      const databaseReady = health.database === 'connected';
      const geminiReady = health.gemini?.configured;

      if (databaseReady && geminiReady) {
        setStatus({
          state: 'ok',
          label: 'API online',
          detail: `MongoDB connected · ${health.gemini.model}`,
        });
      } else {
        const issues = [!databaseReady && 'MongoDB offline', !geminiReady && 'GEMINI_API_KEY missing'].filter(Boolean);
        setStatus({ state: 'degraded', label: 'API degraded', detail: issues.join(' · ') });
      }
    } catch (error) {
      setStatus({ state: 'down', label: 'API unreachable', detail: error.message });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, recheck: check };
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { status, recheck } = useBackendStatus();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">
              Interview<span className="text-gradient">IQ</span>
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              AI Mock Interview Platform &amp; Resume Analyzer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recheck}
            title={status.detail || status.label}
            className={cn(
              'group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              STATUS_STYLES[status.state]
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                status.state === 'ok' && 'bg-success',
                status.state === 'loading' && 'bg-muted-foreground animate-pulse',
                status.state === 'degraded' && 'bg-warning',
                status.state === 'down' && 'bg-destructive'
              )}
            />
            <span className="hidden sm:inline">{status.label}</span>
            <RefreshCw className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
          </button>

          <Badge variant="outline" className="hidden lg:inline-flex">
            Gemini powered
          </Badge>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
