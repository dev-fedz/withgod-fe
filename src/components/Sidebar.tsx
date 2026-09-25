import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, Home, Edit3, Compass, Bookmark, Settings, Shield, Languages, Scroll, Calendar, Users, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useApp();

  const navItems = user
    ? [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Bible', href: '/bible', icon: BookOpen },
        { label: 'Torah Portion', href: '/torah', icon: Scroll },
        { label: 'Biblical Feasts', href: '/feasts', icon: Flame },
        { label: 'Calendar', href: '/calendar', icon: Calendar },
        { label: 'Devotions', href: '/devotions', icon: Edit3 },
        { label: 'Insights', href: '/study', icon: Bookmark },
        { label: 'Learn Hebrew', href: '/hebrew', icon: Languages },
        { label: 'Discover', href: '/discover', icon: Compass },
        { label: 'Profile', href: '/profile', icon: Settings },
      ]
    : [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Bible', href: '/bible', icon: BookOpen },
        { label: 'Torah Portion', href: '/torah', icon: Scroll },
        { label: 'Biblical Feasts', href: '/feasts', icon: Flame },
        { label: 'Learn Hebrew', href: '/hebrew', icon: Languages },
        { label: 'Profile', href: '/profile', icon: Settings },
      ];

  if (user?.is_staff || user?.can_manage_users) {
    navItems.push({ label: 'User Roles', href: '/user-management', icon: Users });
    navItems.push({ label: 'Admin', href: '/admin', icon: Shield });
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (router.pathname === href) {
      e.preventDefault();
      router.replace(href);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md h-screen sticky top-0 z-30 select-none">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-stone-100 dark:border-stone-800/80">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-stone-900 dark:text-stone-100">WithGod</span>
            <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 block -mt-1 tracking-wider">Bible & Journal</span>
          </div>
        </Link>
      </div>

      {/* Navigation links */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div className="p-4 border-t border-stone-100 dark:border-stone-800">
        {user ? (
          <Link
            href="/profile"
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-stone-300">
              {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{user.full_name}</p>
              <p className="text-xs text-stone-400 truncate">{user.email}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/profile"
            className="flex items-center justify-center w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Sign In / Register
          </Link>
        )}
      </div>
    </aside>
  );
};
