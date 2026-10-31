import { LoaderCircle, ScanSearch, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ResultPlaceholder() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <ScanSearch className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">Your report will appear here</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your resume and a job description, then run the analysis to get an ATS score, missing keywords and 3
            tailored interview questions.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-3 py-1">ATS score</span>
          <span className="rounded-full border border-border px-3 py-1">Missing keywords</span>
          <span className="rounded-full border border-border px-3 py-1">3 interview questions</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultSkeleton() {
  return (
    <>
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          <Skeleton className="h-[140px] w-[140px] rounded-full" />
          <div className="w-full space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-6 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            Gemini is reading your resume and writing tailored questions...
          </p>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> usually a few seconds
          </p>
        </CardContent>
      </Card>
    </>
  );
}
