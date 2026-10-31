import { MessageSquareQuote } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuestionList({ analysis }) {
  const questions = analysis.interviewQuestions || [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          Your tailored mock interview
        </CardTitle>
        <CardDescription>
          {questions.length} question{questions.length === 1 ? '' : 's'} generated from your resume and this job
          description. Expand a question to see what the interviewer is testing.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interview questions were generated.</p>
        ) : (
          <Accordion type="single" collapsible defaultValue="question-0" className="w-full">
            {questions.map((item, index) => (
              <AccordionItem key={index} value={`question-${index}`}>
                <AccordionTrigger>
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="space-y-2">
                      <span className="block leading-relaxed">{item.question}</span>
                      {item.category && (
                        <Badge variant="secondary" className="font-normal">
                          {item.category}
                        </Badge>
                      )}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-9">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">What they are testing: </span>
                    {item.whyItMatters || 'Not specified.'}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
