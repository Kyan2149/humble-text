import { useState, type ReactNode } from 'react';
import { getVerseRangeText } from '@/lib/bibleUtils';
import type { BibleData, ParsedRef } from '@/lib/bibleUtils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface VerseHoverCardProps {
  bible: BibleData;
  refData: ParsedRef;
  children: ReactNode;
}

export function VerseHoverCard({ bible, refData, children }: VerseHoverCardProps) {
  const text = getVerseRangeText(bible, refData);
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" side="top">
        <p className="font-serif text-xs font-semibold text-primary mb-1">
          {refData.book} {refData.chapter}:{refData.verseStart}
          {refData.verseEnd !== refData.verseStart && `–${refData.verseEnd}`}
        </p>
        <p className="text-sm leading-relaxed verse-text">{text || 'Verse not found'}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
