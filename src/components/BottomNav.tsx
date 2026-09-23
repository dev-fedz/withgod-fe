import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, BookOpen, Edit3, Compass, User as UserIcon, Languages, Scroll } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const router = useRouter();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Bible', href: '/bible', icon: BookOpen },
    { label: 'Torah', href: '/torah', icon: Scroll },
    { label: 'Devotions', href: '/devotions', icon: Edit3 },
    { label: 'Hebrew', href: '/hebrew', icon: Languages },
    { label: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (router.pathname === href) {
      e.preventDefault();
      router.replace(href);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 px-3 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
