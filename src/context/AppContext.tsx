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
  is_superuser?: boolean;
  can_manage_calendar?: boolean;
  can_manage_users?: boolean;
  role_names?: string[];
  role_ids?: string[];
  permissions_list?: string[];
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

export type SystemFontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type SystemFontFamily = 'sans' | 'serif';

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
  fontSize: SystemFontSize;
  setFontSize: (size: SystemFontSize) => void;
  fontFamily: SystemFontFamily;
  setFontFamily: (family: SystemFontFamily) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  eventNotifications: any[];
  unreadNotifCount: number;
  refreshEventNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>('');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [pageTitle, setPageTitle] = useState('Shema');
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

  // System-wide Font Size & Typography for ease of reading
  const [fontSize, setFontSizeState] = useState<SystemFontSize>('medium');
  const [fontFamily, setFontFamilyState] = useState<SystemFontFamily>('sans');

  const applyFontSize = (size: SystemFontSize) => {
    if (typeof window === 'undefined') return;
    const sizeMap: Record<SystemFontSize, string> = {
      small: '87.5%', // 14px
      medium: '100%', // 16px default
      large: '112.5%', // 18px comfortable
      xlarge: '125%', // 20px easy-read / high legibility
    };
    document.documentElement.style.fontSize = sizeMap[size] || '100%';
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('withgod_font_size', size);
  };

  const applyFontFamily = (family: SystemFontFamily) => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-font-family', family);
    localStorage.setItem('withgod_font_family', family);
  };

  const setFontSize = (size: SystemFontSize) => {
    setFontSizeState(size);
    applyFontSize(size);
    if (api.getAccessToken()) {
      api.updatePreferences({ font_size: size }).catch((err) => {
        console.warn('Failed to sync font size preference to server:', err);
      });
    }
  };

  const setFontFamily = (family: SystemFontFamily) => {
    setFontFamilyState(family);
    applyFontFamily(family);
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

      if (data.preference?.font_size) {
        const validSize = (['small', 'medium', 'large', 'xlarge'].includes(data.preference.font_size)
          ? data.preference.font_size
          : 'medium') as SystemFontSize;
        setFontSizeState(validSize);
        applyFontSize(validSize);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    // Also load system settings (e.g. admin-configured Gemini API key) for all users, including guests
    try {
      const sysSettings = await api.getSystemSettings();
      if (sysSettings?.gemini_api_key) {
        setGeminiApiKeyState(sysSettings.gemini_api_key);
        if (typeof window !== 'undefined') {
          localStorage.setItem('withgod_gemini_api_key', sysSettings.gemini_api_key);
        }
      }
    } catch {}
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('withgod_gemini_api_key', key);
      } else {
        localStorage.removeItem('withgod_gemini_api_key');
      }
    }
    // If the user is staff/admin, persist to backend system settings so all users can use Shalom AI
    if (user?.is_staff || user?.is_superuser) {
      api.saveSystemSettings({ gemini_api_key: key }).catch(() => {});
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

    // Restore System Font Size & Family immediately from localStorage
    const savedFontSize = (localStorage.getItem('withgod_font_size') as SystemFontSize) || 'medium';
    setFontSizeState(savedFontSize);
    applyFontSize(savedFontSize);

    const savedFontFamily = (localStorage.getItem('withgod_font_family') as SystemFontFamily) || 'sans';
    setFontFamilyState(savedFontFamily);
    applyFontFamily(savedFontFamily);

    // Restore Gemini API Key
    const savedGeminiKey = localStorage.getItem('withgod_gemini_api_key');
    if (savedGeminiKey) {
      setGeminiApiKeyState(savedGeminiKey);
    }

    // Load system settings (e.g. admin-configured Gemini API key) for all users, including guests
    api.getSystemSettings().then((sysSettings) => {
      if (sysSettings?.gemini_api_key) {
        setGeminiApiKeyState(sysSettings.gemini_api_key);
        if (typeof window !== 'undefined') {
          localStorage.setItem('withgod_gemini_api_key', sysSettings.gemini_api_key);
        }
      }
    }).catch(() => {});

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

    // Restore font size from user account preferences
    if (loggedInUser.preference?.font_size) {
      const validSize = (['small', 'medium', 'large', 'xlarge'].includes(loggedInUser.preference.font_size)
        ? loggedInUser.preference.font_size
        : 'medium') as SystemFontSize;
      setFontSizeState(validSize);
      applyFontSize(validSize);
    }
    // Also load system settings for Gemini API key
    api.getSystemSettings().then((sysSettings) => {
      if (sysSettings?.gemini_api_key) {
        setGeminiApiKeyState(sysSettings.gemini_api_key);
        if (typeof window !== 'undefined') {
          localStorage.setItem('withgod_gemini_api_key', sysSettings.gemini_api_key);
        }
      }
    }).catch(() => {});
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  // Event Notifications & Announcements State
  const [eventNotifications, setEventNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const refreshEventNotifications = React.useCallback(async () => {
    try {
      const data = await api.getEventNotifications();
      if (data && Array.isArray(data.notifications)) {
        setEventNotifications(data.notifications);
        setUnreadNotifCount(data.unread_count || 0);

        // Check for browser notification trigger if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const now = new Date().getTime();
          data.notifications.forEach((n: any) => {
            if (!n.is_read_by_user) {
              const sched = new Date(n.scheduled_for).getTime();
              if (now >= sched && now - sched < 5 * 60 * 1000) {
                const shownKey = `withgod_notif_shown_${n.id}`;
                if (!sessionStorage.getItem(shownKey)) {
                  sessionStorage.setItem(shownKey, 'true');
                  new Notification(n.title, {
                    body: n.message || `Event: ${n.event_title} on ${n.event_date}`,
                    icon: '/favicon.ico',
                  });
                }
              }
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const markNotificationRead = React.useCallback(async (id: string) => {
    try {
      if (user) {
        await api.markNotificationRead(id);
      }
      setEventNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read_by_user: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const markAllNotificationsRead = React.useCallback(async () => {
    if (!user) return;
    try {
      await api.markAllNotificationsRead();
      setEventNotifications((prev) => prev.map((n) => ({ ...n, is_read_by_user: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    refreshEventNotifications();
    const interval = setInterval(refreshEventNotifications, 45000);
    return () => clearInterval(interval);
  }, [user, refreshEventNotifications]);

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
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        geminiApiKey,
        setGeminiApiKey,
        isAiModalOpen,
        setIsAiModalOpen,
        eventNotifications,
        unreadNotifCount,
        refreshEventNotifications,
        markNotificationRead,
        markAllNotificationsRead,
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
