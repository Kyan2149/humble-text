// Auto-correct common Bible book typos and spacing issues
const TYPO_MAP: Record<string, string> = {
  mathew: 'Matthew',
  matthews: 'Matthew',
  mathhew: 'Matthew',
  marc: 'Mark',
  marck: 'Mark',
  jhon: 'John',
  johnn: 'John',
  luk: 'Luke',
  lukke: 'Luke',
  genisis: 'Genesis',
  genesys: 'Genesis',
  exodos: 'Exodus',
  leviticus: 'Leviticus',
  proverb: 'Proverbs',
  psalm: 'Psalms',
  pslams: 'Psalms',
  romanss: 'Romans',
  ephesian: 'Ephesians',
  philipians: 'Philippians',
  philippian: 'Philippians',
  collosians: 'Colossians',
  collosian: 'Colossians',
  revelations: 'Revelation',
  revealation: 'Revelation',
  hebrew: 'Hebrews',
  acts: 'Acts',
  isiah: 'Isaiah',
  isaih: 'Isaiah',
  jermiah: 'Jeremiah',
  jeremaiah: 'Jeremiah',
  danial: 'Daniel',
  hosia: 'Hosea',
  zecharia: 'Zechariah',
  malichi: 'Malachi',
};

// Fix "mat5:5" -> "mat 5:5", and typos -> proper book name (preserving case intent)
export function autoCorrectChunk(text: string): string {
  // Insert space between letters and digits where a colon follows shortly: e.g. mathew5:5
  let out = text.replace(/([a-zA-Z])(\d+:\d+(?:-\d+)?)/g, '$1 $2');

  // Fix typos (word boundary, case-insensitive). Preserve capitalization of first letter from original.
  out = out.replace(/\b([a-zA-Z]{3,})(?=\s+\d+:\d+)/g, (m) => {
    const lower = m.toLowerCase();
    const fix = TYPO_MAP[lower];
    if (!fix) return m;
    // If user typed Capitalized, return fix capitalized; else lowercase
    return /^[A-Z]/.test(m) ? fix : fix.toLowerCase();
  });

  return out;
}
