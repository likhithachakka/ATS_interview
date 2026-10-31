import { CircleCheck, CircleX, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function KeywordGroup({ title, icon, keywords, variant, emptyLabel }) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        <span className="text-xs font-normal text-muted-foreground">({keywords.length})</span>
      </p>
      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge key={`${keyword}-${index}`} variant={variant} className="whitespace-normal text-left">
              {keyword}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function KeywordPanel({ analysis }) {
  const missing = analysis.missingKeywords || [];
  const matched = analysis.matchedKeywords || [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-primary" />
          Keyword coverage
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <KeywordGroup
          title="Missing from your resume"
          icon={<CircleX className="h-4 w-4 text-destructive" />}
          keywords={missing}
          variant="destructive"
          emptyLabel="No critical keywords are missing. Nice work."
        />

        <KeywordGroup
          title="Already matched"
          icon={<CircleCheck className="h-4 w-4 text-success" />}
          keywords={matched}
          variant="success"
          emptyLabel="No overlapping keywords were detected."
        />
      </CardContent>
    </Card>
  );
}
