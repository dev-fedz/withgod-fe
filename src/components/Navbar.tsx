import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sun, Moon, ChevronRight, BookOpen, Bell, Check, Calendar, Clock, MapPin, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { pageTitle, breadcrumbs, pageActions, theme, toggleTheme, user } = useApp();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getEventNotifications();
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);

        // Check for browser notification trigger if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          // Find unread notification scheduled recently (within last 5 minutes)
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
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read_by_user: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    if (!user) return;
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read_by_user: true } : n)));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error(err);
    }
  };

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

        {/* Right side: Actions, Notifications & Theme toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dynamic action buttons if passed from page */}
          {pageActions && <div className="flex items-center space-x-2">{pageActions}</div>}

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={handleToggleNotif}
              aria-label="Notifications"
              className="relative p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100">Event Reminders</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {user && unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors flex items-start justify-between gap-3 ${
                          !n.is_read_by_user ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setIsNotifOpen(false);
                            router.push('/calendar');
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: n.event_color || '#ec4899' }}
                            />
                            <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                              {n.title}
                            </h5>
                          </div>
                          {n.message && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 font-serif mb-1.5">
                              {n.message}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-stone-400">
                            {n.event_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> {n.event_date}
                              </span>
                            )}
                            {n.event_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {n.event_time.slice(0, 5)}
                              </span>
                            )}
                            {n.event_location && (
                              <span className="flex items-center gap-1 truncate max-w-[100px]">
                                <MapPin className="w-2.5 h-2.5" /> {n.event_location}
                              </span>
                            )}
                          </div>
                        </div>

                        {user && !n.is_read_by_user && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkOneRead(n.id);
                            }}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                      <Bell className="w-6 h-6 mx-auto text-stone-300 dark:text-stone-600 mb-1" />
                      <p>No active event reminders</p>
                      <p className="text-[10px] text-stone-400">You will be notified when scheduled event reminders occur.</p>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-stone-100 dark:border-stone-800 text-center">
                  <Link
                    href="/calendar"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline block py-1"
                  >
                    View All Calendar Events →
                  </Link>
                </div>
              </div>
            )}
          </div>

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

export default Navbar;
