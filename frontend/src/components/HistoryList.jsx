import { Clock, LoaderCircle, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

const scoreVariant = (score) => (score >= 70 ? 'success' : score >= 40 ? 'warning' : 'destructive');

export default function HistoryList({ items, loading, activeId, onSelect, onDelete }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Recent analyses
        </CardTitle>
        <CardDescription>Saved in MongoDB. Click one to reopen the full report.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No analyses yet. Run your first one to see it saved here.
          </p>
        )}

        {!loading &&
          items.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(item.id);
                }
              }}
              className={cn(
                'group flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-accent/50',
                activeId === item.id && 'border-primary/40 bg-primary/5'
              )}
            >
              <Badge variant={scoreVariant(item.atsScore)} className="mt-0.5 shrink-0 tabular-nums">
                {item.atsScore}
              </Badge>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.fileName || 'Pasted resume'}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {item.interviewQuestionCount} Q
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.jobPreview}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {dateFormatter.format(new Date(item.createdAt))}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete analysis"
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(item.id);
                }}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

        {loading && items.length > 0 && (
          <p className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <LoaderCircle className="h-3 w-3 animate-spin" /> refreshing
          </p>
        )}
      </CardContent>
    </Card>
  );
}
