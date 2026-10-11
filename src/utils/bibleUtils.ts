/**
 * Utility functions for Bible translations and offline downloaded versions.
 */

export const DEFAULT_OFFLINE_VERSIONS = ['TLAB', 'ADB', 'SND'];

export interface CanonicalBibleBook {
  book_number: number;
  name: string;
  testament: 'OT' | 'NT';
  chapters_count: number;
}

export const CANONICAL_BIBLE_BOOKS: CanonicalBibleBook[] = [
  { book_number: 1, name: 'Genesis', testament: 'OT', chapters_count: 50 },
  { book_number: 2, name: 'Exodus', testament: 'OT', chapters_count: 40 },
  { book_number: 3, name: 'Leviticus', testament: 'OT', chapters_count: 27 },
  { book_number: 4, name: 'Numbers', testament: 'OT', chapters_count: 36 },
  { book_number: 5, name: 'Deuteronomy', testament: 'OT', chapters_count: 34 },
  { book_number: 6, name: 'Joshua', testament: 'OT', chapters_count: 24 },
  { book_number: 7, name: 'Judges', testament: 'OT', chapters_count: 21 },
  { book_number: 8, name: 'Ruth', testament: 'OT', chapters_count: 4 },
  { book_number: 9, name: '1 Samuel', testament: 'OT', chapters_count: 31 },
  { book_number: 10, name: '2 Samuel', testament: 'OT', chapters_count: 24 },
  { book_number: 11, name: '1 Kings', testament: 'OT', chapters_count: 22 },
  { book_number: 12, name: '2 Kings', testament: 'OT', chapters_count: 25 },
  { book_number: 13, name: '1 Chronicles', testament: 'OT', chapters_count: 29 },
  { book_number: 14, name: '2 Chronicles', testament: 'OT', chapters_count: 36 },
  { book_number: 15, name: 'Ezra', testament: 'OT', chapters_count: 10 },
  { book_number: 16, name: 'Nehemiah', testament: 'OT', chapters_count: 13 },
  { book_number: 17, name: 'Esther', testament: 'OT', chapters_count: 10 },
  { book_number: 18, name: 'Job', testament: 'OT', chapters_count: 42 },
  { book_number: 19, name: 'Psalms', testament: 'OT', chapters_count: 150 },
  { book_number: 20, name: 'Proverbs', testament: 'OT', chapters_count: 31 },
  { book_number: 21, name: 'Ecclesiastes', testament: 'OT', chapters_count: 12 },
  { book_number: 22, name: 'Song of Solomon', testament: 'OT', chapters_count: 8 },
  { book_number: 23, name: 'Isaiah', testament: 'OT', chapters_count: 66 },
  { book_number: 24, name: 'Jeremiah', testament: 'OT', chapters_count: 52 },
  { book_number: 25, name: 'Lamentations', testament: 'OT', chapters_count: 5 },
  { book_number: 26, name: 'Ezekiel', testament: 'OT', chapters_count: 48 },
  { book_number: 27, name: 'Daniel', testament: 'OT', chapters_count: 12 },
  { book_number: 28, name: 'Hosea', testament: 'OT', chapters_count: 14 },
  { book_number: 29, name: 'Joel', testament: 'OT', chapters_count: 3 },
  { book_number: 30, name: 'Amos', testament: 'OT', chapters_count: 9 },
  { book_number: 31, name: 'Obadiah', testament: 'OT', chapters_count: 1 },
  { book_number: 32, name: 'Jonah', testament: 'OT', chapters_count: 4 },
  { book_number: 33, name: 'Micah', testament: 'OT', chapters_count: 7 },
  { book_number: 34, name: 'Nahum', testament: 'OT', chapters_count: 3 },
  { book_number: 35, name: 'Habakkuk', testament: 'OT', chapters_count: 3 },
  { book_number: 36, name: 'Zephaniah', testament: 'OT', chapters_count: 3 },
  { book_number: 37, name: 'Haggai', testament: 'OT', chapters_count: 2 },
  { book_number: 38, name: 'Zechariah', testament: 'OT', chapters_count: 14 },
  { book_number: 39, name: 'Malachi', testament: 'OT', chapters_count: 4 },
  { book_number: 40, name: 'Matthew', testament: 'NT', chapters_count: 28 },
  { book_number: 41, name: 'Mark', testament: 'NT', chapters_count: 16 },
  { book_number: 42, name: 'Luke', testament: 'NT', chapters_count: 24 },
  { book_number: 43, name: 'John', testament: 'NT', chapters_count: 21 },
  { book_number: 44, name: 'Acts', testament: 'NT', chapters_count: 28 },
  { book_number: 45, name: 'Romans', testament: 'NT', chapters_count: 16 },
  { book_number: 46, name: '1 Corinthians', testament: 'NT', chapters_count: 16 },
  { book_number: 47, name: '2 Corinthians', testament: 'NT', chapters_count: 13 },
  { book_number: 48, name: 'Galatians', testament: 'NT', chapters_count: 6 },
  { book_number: 49, name: 'Ephesians', testament: 'NT', chapters_count: 6 },
  { book_number: 50, name: 'Philippians', testament: 'NT', chapters_count: 4 },
  { book_number: 51, name: 'Colossians', testament: 'NT', chapters_count: 4 },
  { book_number: 52, name: '1 Thessalonians', testament: 'NT', chapters_count: 5 },
  { book_number: 53, name: '2 Thessalonians', testament: 'NT', chapters_count: 3 },
  { book_number: 54, name: '1 Timothy', testament: 'NT', chapters_count: 6 },
  { book_number: 55, name: '2 Timothy', testament: 'NT', chapters_count: 4 },
  { book_number: 56, name: 'Titus', testament: 'NT', chapters_count: 3 },
  { book_number: 57, name: 'Philemon', testament: 'NT', chapters_count: 1 },
  { book_number: 58, name: 'Hebrews', testament: 'NT', chapters_count: 13 },
  { book_number: 59, name: 'James', testament: 'NT', chapters_count: 5 },
  { book_number: 60, name: '1 Peter', testament: 'NT', chapters_count: 5 },
  { book_number: 61, name: '2 Peter', testament: 'NT', chapters_count: 3 },
  { book_number: 62, name: '1 John', testament: 'NT', chapters_count: 5 },
  { book_number: 63, name: '2 John', testament: 'NT', chapters_count: 1 },
  { book_number: 64, name: '3 John', testament: 'NT', chapters_count: 1 },
  { book_number: 65, name: 'Jude', testament: 'NT', chapters_count: 1 },
  { book_number: 66, name: 'Revelation', testament: 'NT', chapters_count: 22 },
];


export const getDownloadedBibleVersions = (): string[] => {
  if (typeof window === 'undefined') return [...DEFAULT_OFFLINE_VERSIONS];
  try {
    const uninstalledSaved = localStorage.getItem('withgod_uninstalled_bible_versions');
    const uninstalledList: string[] = uninstalledSaved ? JSON.parse(uninstalledSaved) : [];

    const saved = localStorage.getItem('withgod_offline_bible_versions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .map((id: string) => String(id).toUpperCase())
          .filter((id) => !uninstalledList.includes(id));
        return cleaned.length > 0 ? cleaned : [...DEFAULT_OFFLINE_VERSIONS];
      }
    }

    const defaults = DEFAULT_OFFLINE_VERSIONS.filter((id) => !uninstalledList.includes(id));
    return defaults.length > 0 ? defaults : [...DEFAULT_OFFLINE_VERSIONS];
  } catch (e) {
    console.warn('Failed reading offline versions from storage', e);
    return [...DEFAULT_OFFLINE_VERSIONS];
  }
};

export const saveDownloadedBibleVersion = (verId: string): string[] => {
  if (typeof window === 'undefined') return [...DEFAULT_OFFLINE_VERSIONS];
  const upper = verId.toUpperCase();
  const current = getDownloadedBibleVersions();
  const next = Array.from(new Set([...current, upper]));
  try {
    localStorage.setItem('withgod_offline_bible_versions', JSON.stringify(next));
    const uninstalledSaved = localStorage.getItem('withgod_uninstalled_bible_versions');
    if (uninstalledSaved) {
      const uninstalledList: string[] = JSON.parse(uninstalledSaved);
      const filtered = uninstalledList.filter((id) => id !== upper);
      localStorage.setItem('withgod_uninstalled_bible_versions', JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Failed saving downloaded version to storage', e);
  }
  return next;
};

export const removeDownloadedBibleVersion = (verId: string): string[] => {
  if (typeof window === 'undefined') return [];
  const upper = verId.toUpperCase();
  const current = getDownloadedBibleVersions();
  const next = current.filter((id) => id !== upper);
  try {
    localStorage.setItem('withgod_offline_bible_versions', JSON.stringify(next));
    const uninstalledSaved = localStorage.getItem('withgod_uninstalled_bible_versions');
    const uninstalledList: string[] = uninstalledSaved ? JSON.parse(uninstalledSaved) : [];
    const updatedUninstalled = Array.from(new Set([...uninstalledList, upper]));
    localStorage.setItem('withgod_uninstalled_bible_versions', JSON.stringify(updatedUninstalled));
  } catch (e) {
    console.warn('Failed removing downloaded version from storage', e);
  }
  return next;
};
