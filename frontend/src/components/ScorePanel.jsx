import { Lightbulb, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const TONES = {
  High: { text: 'text-success', stroke: 'stroke-success', ring: 'via-success', variant: 'success' },
  Medium: { text: 'text-warning', stroke: 'stroke-warning', ring: 'via-warning', variant: 'warning' },
  Low: { text: 'text-destructive', stroke: 'stroke-destructive', ring: 'via-destructive', variant: 'destructive' },
};

const RESUME_TRANSLATIONS = {
  High: 'Strong match',
  Medium: 'Partial match',
  Low: 'Weak match',
};

function ScoreRing({ score, tone }) {
  const radius = 56;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative grid h-[140px] w-[140px] shrink-0 place-items-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', tone.stroke)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className={cn('text-4xl font-bold tabular-nums', tone.text)}>{score}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">ATS score</p>
        </div>
      </div>
    </div>
  );
}

export default function ScorePanel({ analysis }) {
  const tone = TONES[analysis.matchLevel] || TONES.Medium;
  const suggestions = analysis.suggestions || [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          ATS compatibility
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing score={analysis.atsScore} tone={tone} />

          <div className="w-full space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={tone.variant}>{analysis.matchLevel} match</Badge>
              <span className="text-sm text-muted-foreground">{RESUME_TRANSLATIONS[analysis.matchLevel]}</span>
            </div>
            {analysis.summary && <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>}
          </div>
        </div>

        {suggestions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-primary" />
                Suggested improvements
              </p>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
