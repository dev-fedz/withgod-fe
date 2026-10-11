/**
 * Utility functions for Bible translations and offline downloaded versions.
 */

export const DEFAULT_OFFLINE_VERSIONS = ['TLAB', 'ADB', 'SND'];

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
