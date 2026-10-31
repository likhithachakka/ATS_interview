import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, TriangleAlert, Trophy, TrendingUp, WandSparkles } from 'lucide-react';
import Header from '@/components/Header';
import AnalyzerForm from '@/components/AnalyzerForm';
import ScorePanel from '@/components/ScorePanel';
import KeywordPanel from '@/components/KeywordPanel';
import QuestionList from '@/components/QuestionList';
import HistoryList from '@/components/HistoryList';
import { ResultPlaceholder, ResultSkeleton } from '@/components/ResultStates';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { analyzeResume, deleteAnalysis, getAnalysis, listAnalyses } from '@/lib/api';

const HISTORY_LIMIT = 20;

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 px-4 py-3 backdrop-blur">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-lg font-semibold leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const resultRef = useRef(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(await listAnalyses(HISTORY_LIMIT));
    } catch (historyError) {
      toast.error('Could not load history', { description: historyError.message });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleAnalyze = useCallback(
    async (payload) => {
      setAnalyzing(true);
      setError(null);
      setAnalysis(null);

      try {
        const created = await analyzeResume(payload);
        setAnalysis(created);
        toast.success('Analysis ready', {
          description: `ATS score ${created.atsScore}/100 · ${created.matchLevel} match`,
        });
        await loadHistory();
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (analysisError) {
        setError(analysisError);
        toast.error('Analysis failed', { description: analysisError.message });
      } finally {
        setAnalyzing(false);
      }
    },
    [loadHistory]
  );

  const handleSelect = useCallback(async (id) => {
    setLoadingReport(true);
    setError(null);
    try {
      setAnalysis(await getAnalysis(id));
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (reportError) {
      toast.error('Could not open that report', { description: reportError.message });
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteAnalysis(id);
        setAnalysis((current) => (current?.id === id ? null : current));
        toast.success('Analysis deleted');
        await loadHistory();
      } catch (deleteError) {
        toast.error('Delete failed', { description: deleteError.message });
      }
    },
    [loadHistory]
  );

  const stats = useMemo(() => {
    if (history.length === 0) return { total: 0, average: '—', best: '—' };
    const scores = history.map((item) => item.atsScore);
    return {
      total: history.length,
      average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      best: Math.max(...scores),
    };
  }, [history]);

  const errorDetails = error?.details ? Object.values(error.details).filter(Boolean) : [];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container space-y-8 py-8">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="gap-1.5">
              <WandSparkles className="h-3 w-3" />
              Powered by Gemini + MongoDB
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Beat the ATS, then practice the <span className="text-gradient">interview</span>.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Drop in your resume and the job description. InterviewIQ scores the match, tells you which keywords an
              applicant tracking system is looking for, and writes three interview questions tailored to your specific
              gaps.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Analyses saved" value={stats.total} />
            <StatCard icon={<Sparkles className="h-4 w-4" />} label="Average score" value={stats.average} />
            <StatCard icon={<Trophy className="h-4 w-4" />} label="Best score" value={stats.best} />
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <AnalyzerForm onAnalyze={handleAnalyze} loading={analyzing} />
            <HistoryList
              items={history}
              loading={historyLoading}
              activeId={analysis?.id}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          </div>

          <div ref={resultRef} className="space-y-6 lg:col-span-7">
            {error && (
              <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>
                  <p>{error.message}</p>
                  {errorDetails.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {errorDetails.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {analyzing || loadingReport ? (
              <ResultSkeleton />
            ) : analysis ? (
              <>
                <ScorePanel analysis={analysis} />
                <KeywordPanel analysis={analysis} />
                <QuestionList analysis={analysis} />
              </>
            ) : (
              <ResultPlaceholder />
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>InterviewIQ · Express + Mongoose + @google/genai · React + Vite + Tailwind + shadcn/ui</p>
          <p>AI output is a guide, not a guarantee. Always review before you apply.</p>
        </div>
      </footer>
    </div>
  );
}
