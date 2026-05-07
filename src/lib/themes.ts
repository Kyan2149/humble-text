// Lightweight thematic synonym map for "smart" search.
// Maps a query term to related words/themes so a search for "love"
// also surfaces verses about "compassion", "kindness", etc.

const THEMES: Record<string, string[]> = {
  love: ['love', 'beloved', 'charity', 'compassion', 'kindness', 'mercy', 'affection', 'devoted'],
  faith: ['faith', 'believe', 'trust', 'belief', 'faithful', 'confidence'],
  hope: ['hope', 'expectation', 'await', 'wait', 'longing'],
  fear: ['fear', 'afraid', 'terror', 'dread', 'tremble', 'awe', 'reverence'],
  peace: ['peace', 'rest', 'calm', 'still', 'quiet', 'tranquil'],
  joy: ['joy', 'rejoice', 'glad', 'delight', 'happy', 'cheerful'],
  prayer: ['pray', 'prayer', 'intercede', 'supplication', 'petition', 'cry out'],
  forgiveness: ['forgive', 'pardon', 'mercy', 'absolve', 'remit'],
  sin: ['sin', 'iniquity', 'transgression', 'wickedness', 'evil', 'trespass'],
  salvation: ['salvation', 'saved', 'savior', 'deliver', 'redeem', 'redemption', 'rescue'],
  grace: ['grace', 'favor', 'gift', 'mercy', 'kindness'],
  wisdom: ['wisdom', 'wise', 'understanding', 'discernment', 'knowledge', 'prudent'],
  strength: ['strength', 'strong', 'mighty', 'power', 'might', 'fortitude'],
  suffering: ['suffer', 'affliction', 'tribulation', 'trial', 'pain', 'distress', 'persecution'],
  healing: ['heal', 'healed', 'cure', 'restore', 'whole', 'recover'],
  light: ['light', 'lamp', 'shine', 'bright', 'illumine'],
  darkness: ['darkness', 'dark', 'shadow', 'night', 'gloom'],
  shepherd: ['shepherd', 'flock', 'sheep', 'pasture', 'lamb'],
  king: ['king', 'kingdom', 'reign', 'throne', 'royal', 'lord'],
  spirit: ['spirit', 'holy spirit', 'comforter', 'breath', 'wind'],
  heaven: ['heaven', 'heavens', 'paradise', 'eternal', 'glory'],
  judgment: ['judgment', 'judge', 'justice', 'righteous', 'condemn'],
  creation: ['create', 'creation', 'made', 'formed', 'beginning', 'heavens and earth'],
  resurrection: ['resurrection', 'risen', 'raised', 'rose', 'alive', 'life'],
  cross: ['cross', 'crucified', 'crucify', 'sacrifice', 'blood'],
  enemy: ['enemy', 'enemies', 'foe', 'adversary', 'oppose'],
  poor: ['poor', 'needy', 'afflicted', 'humble', 'lowly'],
  wealth: ['rich', 'wealth', 'riches', 'mammon', 'money', 'treasure'],
  family: ['father', 'mother', 'son', 'daughter', 'children', 'family', 'household'],
  marriage: ['marriage', 'wife', 'husband', 'wedding', 'bride', 'bridegroom'],
  worship: ['worship', 'praise', 'adore', 'glorify', 'exalt', 'bow'],
  truth: ['truth', 'true', 'truthful', 'honest', 'sincere'],
  patience: ['patience', 'patient', 'longsuffering', 'endure', 'perseverance'],
  humility: ['humble', 'humility', 'meek', 'lowly'],
  pride: ['pride', 'proud', 'arrogant', 'haughty', 'boast'],
  anger: ['anger', 'angry', 'wrath', 'rage', 'fury', 'indignation'],
};

// Build reverse index: word -> set of themes
const REVERSE: Record<string, Set<string>> = {};
for (const [theme, words] of Object.entries(THEMES)) {
  for (const w of words) {
    if (!REVERSE[w]) REVERSE[w] = new Set();
    REVERSE[w].add(theme);
  }
}

/**
 * Expand a search query into a list of related terms (themes).
 * Returns lowercase terms, including the original query tokens.
 */
export function expandQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  const out = new Set<string>([q, ...tokens]);

  for (const tok of tokens) {
    // direct theme
    if (THEMES[tok]) THEMES[tok].forEach(w => out.add(w));
    // word belongs to a theme -> add siblings
    if (REVERSE[tok]) {
      for (const t of REVERSE[tok]) THEMES[t].forEach(w => out.add(w));
    }
    // partial: theme name contains token
    for (const theme of Object.keys(THEMES)) {
      if (theme.includes(tok) || tok.includes(theme)) {
        THEMES[theme].forEach(w => out.add(w));
      }
    }
  }
  return Array.from(out).filter(Boolean);
}

/** Score: higher when verse text matches more expansion terms / exact phrase. */
export function scoreText(text: string, terms: string[], original: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  if (lower.includes(original)) score += 10;
  for (const t of terms) {
    if (t === original) continue;
    if (lower.includes(t)) score += t.split(/\s+/).length > 1 ? 3 : 1;
  }
  return score;
}
