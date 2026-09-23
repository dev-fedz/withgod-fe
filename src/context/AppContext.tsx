import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: any;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  profile?: {
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
  };
  preference?: {
    preferred_translation: string;
    theme: string;
    font_size: string;
    daily_reminder: boolean;
  };
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access: string; refresh: string }, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  pageActions: React.ReactNode;
  setPageMeta: (meta: { title: string; items?: BreadcrumbItem[]; actions?: React.ReactNode }) => void;
  currentVersion: string;
  setCurrentVersion: (ver: string) => void;
  currentBook: string;
  setCurrentBook: (b: string) => void;
  currentChapter: number;
  setCurrentChapter: (ch: number) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('WithGod');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [pageActions, setPageActions] = useState<React.ReactNode>(null);

  // Bible Reader persistent state
  const [currentVersion, setCurrentVersionState] = useState('KJV');
  const [currentBook, setCurrentBookState] = useState('John');
  const [currentChapter, setCurrentChapterState] = useState(6);

  const setCurrentVersion = (ver: string) => {
    if (!ver) return;
    setCurrentVersionState(ver);
    if (typeof window !== 'undefined') {
      localStorage.setItem('withgod_bible_version', ver);
    }
    // Sync with backend user preference if authenticated
    if (api.getAccessToken()) {
      api.updatePreferences({ preferred_translation: ver }).catch((err) => {
        console.warn('Failed to sync preferred version to server:', err);
      });
    }
  };

  const setCurrentBook = (book: string) => {
    if (!book) return;
    setCurrentBookState(book);
    if (typeof window !== 'undefined') {
      localStorage.setItem('withgod_bible_book', book);
    }
  };

  const setCurrentChapter = (chapter: number) => {
    if (!chapter) return;
    setCurrentChapterState(chapter);
    if (typeof window !== 'undefined') {
      localStorage.setItem('withgod_bible_chapter', chapter.toString());
    }
  };

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('withgod_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data);
      if (data.preference?.preferred_translation) {
        setCurrentVersionState(data.preference.preferred_translation);
        if (typeof window !== 'undefined') {
          localStorage.setItem('withgod_bible_version', data.preference.preferred_translation);
        }
      } else {
        // User has no preference set in backend; save current client version to backend
        const savedVer = typeof window !== 'undefined' ? localStorage.getItem('withgod_bible_version') : null;
        if (savedVer) {
          api.updatePreferences({ preferred_translation: savedVer }).catch(() => {});
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Restore theme
    const savedTheme = localStorage.getItem('withgod_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    }

    // Restore Bible Reader position and version immediately from localStorage
    const savedVersion = localStorage.getItem('withgod_bible_version');
    if (savedVersion) {
      setCurrentVersionState(savedVersion);
    }
    const savedBook = localStorage.getItem('withgod_bible_book');
    if (savedBook) {
      setCurrentBookState(savedBook);
    }
    const savedChapter = localStorage.getItem('withgod_bible_chapter');
    if (savedChapter) {
      const parsed = parseInt(savedChapter, 10);
      if (!isNaN(parsed)) setCurrentChapterState(parsed);
    }

    refreshUser();
  }, []);

  const login = (tokens: { access: string; refresh: string }, loggedInUser: User) => {
    api.setTokens(tokens.access, tokens.refresh);
    setUser(loggedInUser);
    // On login / relogin, restore user's preferred version from backend profile
    if (loggedInUser.preference?.preferred_translation) {
      setCurrentVersionState(loggedInUser.preference.preferred_translation);
      if (typeof window !== 'undefined') {
        localStorage.setItem('withgod_bible_version', loggedInUser.preference.preferred_translation);
      }
    } else {
      // If user profile did not have one set, sync client's version to their account
      const savedVer = typeof window !== 'undefined' ? localStorage.getItem('withgod_bible_version') : null;
      if (savedVer) {
        api.updatePreferences({ preferred_translation: savedVer }).catch(() => {});
      }
    }
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  const setPageMeta = React.useCallback(
    (meta: { title: string; items?: BreadcrumbItem[]; actions?: React.ReactNode }) => {
      setPageTitle(meta.title);
      if (meta.items) setBreadcrumbs(meta.items);
      setPageActions(meta.actions || null);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        pageTitle,
        breadcrumbs,
        pageActions,
        setPageMeta,
        currentVersion,
        setCurrentVersion,
        currentBook,
        setCurrentBook,
        currentChapter,
        setCurrentChapter,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
