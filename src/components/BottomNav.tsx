import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  BookOpen,
  MessageCircle,
  MoreHorizontal,
  Calendar,
  Scroll,
  Flame,
  Edit3,
  Bookmark,
  Languages,
  Users,
  Settings,
  ChevronRight,
  X,
  Images,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AiAnimatedEye } from './AiAnimatedEye';

interface OverflowMenuItem {
  name: string;
  label: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  requireAuth?: boolean;
  staffOnly?: boolean;
}

const OVERFLOW_ITEMS: OverflowMenuItem[] = [
  {
    name: 'Events',
    label: 'Events & Announcements',
    subtitle: 'Community gatherings, calendar & reminders',
    href: '/calendar',
    icon: Calendar,
    accentColor: '#EC4899',
    requireAuth: false,
  },
  {
    name: 'Torah',
    label: 'Torah Portions & Haftarah',
    subtitle: 'Weekly readings, Parashiot & Gospels',
    href: '/torah',
    icon: Scroll,
    accentColor: '#D97706',
    requireAuth: false,
  },
  {
    name: 'Feasts',
    label: 'Biblical Feasts',
    subtitle: 'Prophetic timeline, Moedim & holy days',
    href: '/feasts',
    icon: Flame,
    accentColor: '#F59E0B',
    requireAuth: false,
  },
  {
    name: 'Devotions',
    label: 'Insights & Devotions',
    subtitle: 'Personal notes, prayers & reflections',
    href: '/devotions',
    icon: Edit3,
    accentColor: '#F59E0B',
    requireAuth: false,
  },
  {
    name: 'Highlights',
    label: 'Highlighted Verses',
    subtitle: 'All your saved verse highlights',
    href: '/study',
    icon: Bookmark,
    accentColor: '#10B981',
    requireAuth: false,
  },
  {
    name: 'Hebrew',
    label: 'Learn Hebrew',
    subtitle: 'Alphabet, roots & vocabulary tools',
    href: '/hebrew',
    icon: Languages,
    accentColor: '#0284C7',
    requireAuth: false,
  },
  {
    name: 'Highlights',
    label: 'Highlights Management',
    subtitle: 'Featured media & Home carousel slideshow',
    href: '/highlights',
    icon: Images,
    accentColor: '#F59E0B',
    requireAuth: true,
    staffOnly: true,
  },
  {
    name: 'UserManagement',
    label: 'User Roles & Permissions',
    subtitle: 'Manage members, roles & permissions',
    href: '/user-management',
    icon: Users,
    accentColor: '#EA580C',
    requireAuth: true,
    staffOnly: true,
  },
  {
    name: 'Profile',
    label: 'Profile & Settings',
    subtitle: 'Account, Gemini key & app preferences',
    href: '/profile',
    icon: Settings,
    accentColor: '#7C3AED',
    requireAuth: false,
  },
];

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const { user, setIsAiModalOpen } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const visibleOverflowItems = OVERFLOW_ITEMS.filter((item) => {
    if (item.requireAuth && !user) return false;
    if (item.staffOnly && !user?.is_staff && !user?.can_manage_users) return false;
    return true;
  });

  const isMoreActive =
    isMoreOpen ||
    OVERFLOW_ITEMS.some(
      (item) => router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href))
    );

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    setIsMoreOpen(false);
    if (router.pathname === href) {
      e.preventDefault();
      router.replace(href);
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 pb-safe select-none">
        <div className="grid grid-cols-5 items-center">
          {/* 1. Home Tab */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className={`flex flex-col items-center py-1 transition-all ${
              router.pathname === '/'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. Bible Tab */}
          <Link
            href="/bible"
            onClick={(e) => handleNavClick(e, '/bible')}
            className={`flex flex-col items-center py-1 transition-all ${
              router.pathname.startsWith('/bible')
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Bible</span>
          </Link>

          {/* 3. Center Elevated Shalom AI Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex flex-col items-center -mt-5 group focus:outline-none cursor-pointer"
            aria-label="Open Shalom AI Assistant"
          >
            <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-900 border-2 border-amber-500 shadow-lg shadow-amber-500/25 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform">
              <AiAnimatedEye size={22} glowColor="#F59E0B" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-0.5">
              Shalom
            </span>
          </button>

          {/* 4. Chats Tab */}
          <Link
            href="/chat"
            onClick={(e) => handleNavClick(e, '/chat')}
            className={`flex flex-col items-center py-1 transition-all ${
              router.pathname.startsWith('/chat')
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
            }`}
          >
            <MessageCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Chats</span>
          </Link>

          {/* 5. More Options Tab */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center py-1 transition-all focus:outline-none cursor-pointer ${
              isMoreActive
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
            }`}
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-stone-900 rounded-t-3xl border-t border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">More</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Select a section to continue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overflow List */}
            <div className="overflow-y-auto p-4 space-y-2.5 pb-8">
              {visibleOverflowItems.map((item) => {
                const Icon = item.icon;
                const isSelected =
                  router.pathname === item.href ||
                  (item.href !== '/' && router.pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30'
                        : 'border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 hover:border-amber-500/40 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${item.accentColor}1A`,
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{
                            color: item.accentColor,
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4
                            className={`font-semibold text-xs truncate ${
                              isSelected
                                ? 'text-amber-800 dark:text-amber-300 font-bold'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {item.label}
                          </h4>
                          {isSelected && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isSelected
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
