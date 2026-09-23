import React from 'react';
import Link from 'next/link';
import { Sun, Moon, ChevronRight, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { pageTitle, breadcrumbs, pageActions, theme, toggleTheme } = useApp();

  return (
    <header className="sticky top-0 z-20 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-white/75 dark:bg-stone-900/75 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 sm:px-8">
        {/* Left side: Breadcrumbs & Mobile Brand */}
        <div className="flex items-center space-x-3">
          {/* Mobile brand indicator */}
          <Link href="/" className="md:hidden flex items-center space-x-2 mr-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-base text-stone-900 dark:text-stone-100">WithGod</span>
          </Link>

          {/* Breadcrumbs with gap-1.5 */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Link href="/" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />
                {crumb.href ? (
                  <Link href={crumb.href} className="flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
                    {crumb.icon && <crumb.icon className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{crumb.label}</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                    {crumb.icon && <crumb.icon className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{crumb.label}</span>
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right side: Actions & Theme toggle */}
        <div className="flex items-center space-x-3">
          {/* Dynamic action buttons if passed from page */}
          {pageActions && <div className="flex items-center space-x-2">{pageActions}</div>}

          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
