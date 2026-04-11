import { useState, useEffect } from 'react';
import type { BibleData } from '@/lib/bibleUtils';

let cachedBible: BibleData | null = null;

export function useBible() {
  const [bible, setBible] = useState<BibleData | null>(cachedBible);
  const [loading, setLoading] = useState(!cachedBible);

  useEffect(() => {
    if (cachedBible) return;
    fetch('/bible.json')
      .then(r => r.json())
      .then((data: BibleData) => {
        cachedBible = data;
        setBible(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { bible, loading };
}
