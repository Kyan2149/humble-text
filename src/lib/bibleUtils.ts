// Bible reference parsing, book name normalization, verse index

export type BibleData = Record<string, Record<string, Record<string, string>>>;

const BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis", genesis: "Genesis",
  exo: "Exodus", exodus: "Exodus", ex: "Exodus",
  lev: "Leviticus", leviticus: "Leviticus",
  num: "Numbers", numbers: "Numbers",
  deu: "Deuteronomy", deut: "Deuteronomy", deuteronomy: "Deuteronomy",
  jos: "Joshua", josh: "Joshua", joshua: "Joshua",
  jdg: "Judges", judg: "Judges", judges: "Judges",
  rut: "Ruth", ruth: "Ruth",
  "1sa": "1 Samuel", "1sam": "1 Samuel", "1 samuel": "1 Samuel", "1 sam": "1 Samuel",
  "2sa": "2 Samuel", "2sam": "2 Samuel", "2 samuel": "2 Samuel", "2 sam": "2 Samuel",
  "1ki": "1 Kings", "1kings": "1 Kings", "1 kings": "1 Kings", "1 ki": "1 Kings",
  "2ki": "2 Kings", "2kings": "2 Kings", "2 kings": "2 Kings", "2 ki": "2 Kings",
  "1ch": "1 Chronicles", "1chr": "1 Chronicles", "1 chronicles": "1 Chronicles", "1 chr": "1 Chronicles",
  "2ch": "2 Chronicles", "2chr": "2 Chronicles", "2 chronicles": "2 Chronicles", "2 chr": "2 Chronicles",
  ezr: "Ezra", ezra: "Ezra",
  neh: "Nehemiah", nehemiah: "Nehemiah",
  est: "Esther", esther: "Esther",
  job: "Job",
  psa: "Psalms", psalm: "Psalms", psalms: "Psalms", ps: "Psalms",
  pro: "Proverbs", prov: "Proverbs", proverbs: "Proverbs",
  ecc: "Ecclesiastes", eccl: "Ecclesiastes", ecclesiastes: "Ecclesiastes",
  sol: "Song of Solomon", song: "Song of Solomon", "song of solomon": "Song of Solomon", sos: "Song of Solomon",
  isa: "Isaiah", isaiah: "Isaiah",
  jer: "Jeremiah", jeremiah: "Jeremiah",
  lam: "Lamentations", lamentations: "Lamentations",
  eze: "Ezekiel", ezek: "Ezekiel", ezekiel: "Ezekiel",
  dan: "Daniel", daniel: "Daniel",
  hos: "Hosea", hosea: "Hosea",
  joe: "Joel", joel: "Joel",
  amo: "Amos", amos: "Amos",
  oba: "Obadiah", obadiah: "Obadiah",
  jon: "Jonah", jonah: "Jonah",
  mic: "Micah", micah: "Micah",
  nah: "Nahum", nahum: "Nahum",
  hab: "Habakkuk", habakkuk: "Habakkuk",
  zep: "Zephaniah", zephaniah: "Zephaniah",
  hag: "Haggai", haggai: "Haggai",
  zec: "Zechariah", zech: "Zechariah", zechariah: "Zechariah",
  mal: "Malachi", malachi: "Malachi",
  mat: "Matthew", matt: "Matthew", matthew: "Matthew",
  mar: "Mark", mark: "Mark", mk: "Mark",
  luk: "Luke", luke: "Luke",
  joh: "John", john: "John", jn: "John",
  act: "Acts", acts: "Acts",
  rom: "Romans", romans: "Romans",
  "1co": "1 Corinthians", "1cor": "1 Corinthians", "1 corinthians": "1 Corinthians", "1 cor": "1 Corinthians",
  "2co": "2 Corinthians", "2cor": "2 Corinthians", "2 corinthians": "2 Corinthians", "2 cor": "2 Corinthians",
  gal: "Galatians", galatians: "Galatians",
  eph: "Ephesians", ephesians: "Ephesians",
  phi: "Philippians", phil: "Philippians", philippians: "Philippians",
  col: "Colossians", colossians: "Colossians",
  "1th": "1 Thessalonians", "1thess": "1 Thessalonians", "1 thessalonians": "1 Thessalonians", "1 thess": "1 Thessalonians",
  "2th": "2 Thessalonians", "2thess": "2 Thessalonians", "2 thessalonians": "2 Thessalonians", "2 thess": "2 Thessalonians",
  "1ti": "1 Timothy", "1tim": "1 Timothy", "1 timothy": "1 Timothy", "1 tim": "1 Timothy",
  "2ti": "2 Timothy", "2tim": "2 Timothy", "2 timothy": "2 Timothy", "2 tim": "2 Timothy",
  tit: "Titus", titus: "Titus",
  phm: "Philemon", philemon: "Philemon",
  heb: "Hebrews", hebrews: "Hebrews",
  jam: "James", james: "James", jas: "James",
  "1pe": "1 Peter", "1pet": "1 Peter", "1 peter": "1 Peter", "1 pet": "1 Peter",
  "2pe": "2 Peter", "2pet": "2 Peter", "2 peter": "2 Peter", "2 pet": "2 Peter",
  "1jo": "1 John", "1john": "1 John", "1 john": "1 John", "1 jn": "1 John",
  "2jo": "2 John", "2john": "2 John", "2 john": "2 John", "2 jn": "2 John",
  "3jo": "3 John", "3john": "3 John", "3 john": "3 John", "3 jn": "3 John",
  jud: "Jude", jude: "Jude",
  rev: "Revelation", revelation: "Revelation",
};

export const BOOK_ORDER = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
  "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James",
  "1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];

export function resolveBookName(input: string): string | null {
  const lower = input.toLowerCase().trim();
  return BOOK_ALIASES[lower] || null;
}

export interface ParsedRef {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  raw: string;
  isCapitalized: boolean;
}

// Matches patterns like: "mat 5:5", "Mat 5:5-7", "1 cor 13:4-8", "john 3:16"
const REF_REGEX = /\b((?:\d\s*)?[a-zA-Z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;

export function parseReferences(text: string): ParsedRef[] {
  const results: ParsedRef[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(REF_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    const bookInput = match[1];
    const book = resolveBookName(bookInput);
    if (!book) continue;

    const chapter = parseInt(match[2], 10);
    const verseStart = parseInt(match[3], 10);
    const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;
    const isCapitalized = bookInput[0] === bookInput[0].toUpperCase() && bookInput[0] !== bookInput[0].toLowerCase();

    results.push({
      book,
      chapter,
      verseStart,
      verseEnd,
      raw: match[0],
      isCapitalized,
    });
  }

  return results;
}

export function getVerseKey(book: string, chapter: number, verse: number): string {
  return `${book.toLowerCase().replace(/\s/g, '-')}-${chapter}-${verse}`;
}

export function getVerseText(bible: BibleData, book: string, chapter: number, verse: number): string | null {
  return bible[book]?.[String(chapter)]?.[String(verse)] || null;
}

export function getVerseRangeText(bible: BibleData, ref: ParsedRef): string {
  const verses: string[] = [];
  for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
    const text = getVerseText(bible, ref.book, ref.chapter, v);
    if (text) verses.push(`${v} ${text}`);
  }
  return verses.join(' ');
}

export function formatRef(ref: ParsedRef): string {
  const bookAbbrev = getShortName(ref.book);
  if (ref.verseStart === ref.verseEnd) {
    return `${bookAbbrev} ${ref.chapter}:${ref.verseStart}`;
  }
  return `${bookAbbrev} ${ref.chapter}:${ref.verseStart}–${ref.verseEnd}`;
}

function getShortName(book: string): string {
  const shorts: Record<string, string> = {
    "Genesis": "Gen", "Exodus": "Exo", "Leviticus": "Lev", "Numbers": "Num",
    "Deuteronomy": "Deut", "Joshua": "Josh", "Judges": "Judg", "Ruth": "Ruth",
    "1 Samuel": "1 Sam", "2 Samuel": "2 Sam", "1 Kings": "1 Ki", "2 Kings": "2 Ki",
    "1 Chronicles": "1 Chr", "2 Chronicles": "2 Chr", "Ezra": "Ezra", "Nehemiah": "Neh",
    "Esther": "Est", "Job": "Job", "Psalms": "Ps", "Proverbs": "Prov",
    "Ecclesiastes": "Eccl", "Song of Solomon": "Song", "Isaiah": "Isa", "Jeremiah": "Jer",
    "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan", "Hosea": "Hos",
    "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obad", "Jonah": "Jonah",
    "Micah": "Mic", "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zeph",
    "Haggai": "Hag", "Zechariah": "Zech", "Malachi": "Mal",
    "Matthew": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John",
    "Acts": "Acts", "Romans": "Rom", "1 Corinthians": "1 Cor", "2 Corinthians": "2 Cor",
    "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Phil", "Colossians": "Col",
    "1 Thessalonians": "1 Thess", "2 Thessalonians": "2 Thess",
    "1 Timothy": "1 Tim", "2 Timothy": "2 Tim", "Titus": "Titus", "Philemon": "Phlm",
    "Hebrews": "Heb", "James": "Jas", "1 Peter": "1 Pet", "2 Peter": "2 Pet",
    "1 John": "1 John", "2 John": "2 John", "3 John": "3 John", "Jude": "Jude",
    "Revelation": "Rev"
  };
  return shorts[book] || book;
}
