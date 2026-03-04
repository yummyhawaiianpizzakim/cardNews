'use client';

import type { ResearchSource } from '@/components/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface ResearchResultsProps {
  sources: ResearchSource[];
}

export function ResearchResults({ sources }: ResearchResultsProps) {
  if (sources.length === 0) {
    return (
      <div className="p-6 border rounded-md bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">리서치 결과가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">리서치 결과</h2>
      <Accordion type="multiple" className="w-full">
        {sources.map((source, index) => (
          <AccordionItem key={index} value={`source-${index}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">출처 {index + 1}</Badge>
                <span className="font-medium">{source.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              <p className="text-sm text-muted-foreground">{source.summary}</p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                원문 보기
              </a>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
