import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BookOpen,
  Sparkles,
  Calendar,
  ArrowRight,
  Bookmark,
  Plus,
  Clock,
  MapPin,
  Scroll,
  Flame,
  Languages,
  Bell,
  Check,
  Sun,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { HighlightsCarousel } from '../components/HighlightsCarousel';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  getLocalISODate,
  getDaysAheadISODate,
  getEventStatus,
  filterUpcoming30DaysEvents,
  sortUpcomingEvents,
} from '../utils/eventUtils';

export default function Home() {
  const router = useRouter();
  const {
    user,
    currentBook,
    currentChapter,
    currentVersion,
    setCurrentBook,
    setCurrentChapter,
    setCurrentVersion,
    eventNotifications,
    unreadNotifCount,
    markNotificationRead,
  } = useApp();

  const [votd, setVotd] = useState<any>(null);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [reminderEvents, setReminderEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [recentDevotions, setRecentDevotions] = useState<any[]>([]);
  const [torahThisWeek, setTorahThisWeek] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const allEvts = await api.getEvents().catch(() => []);
      const eventList = Array.isArray(allEvts) ? allEvts : [];

      // 1. Community events & gatherings (Calendar Events tab: event_type !== 'reminder')
      // Rule: Home page strictly shows upcoming events starting today onwards within the 30-day window.
      // Past events are strictly excluded from the Home page.
      const comm = eventList.filter((e: any) => e.event_type !== 'reminder');
      const filteredComm = filterUpcoming30DaysEvents(comm);
      const sortedComm = sortUpcomingEvents(filteredComm);
      setCommunityEvents(sortedComm);

      // 2. Announcements & reminders (Calendar Reminder tab: event_type === 'reminder')
      const rem = eventList.filter((e: any) => e.event_type === 'reminder');
      const filteredRem = filterUpcoming30DaysEvents(rem);
      const sortedRem = sortUpcomingEvents(filteredRem);
      setReminderEvents(sortedRem);
    } catch {
      setCommunityEvents([]);
      setReminderEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const combinedAnnouncements = useMemo(() => {
    const today = getLocalISODate();
    const in30Days = getDaysAheadISODate(30);
    const items: any[] = [];

    // Reminders created from Calendar Reminder tab (strictly upcoming starting today onwards)
    for (const rem of reminderEvents) {
      const status = getEventStatus(rem.date, rem.end_date);
      if (status.isPast) continue;
      items.push({
        id: rem.id,
        title: rem.title,
        message: rem.description || '',
        event_date: status.formattedDateRange,
        event_color: rem.color || '#EC4899',
        isPast: false,
        isToday: status.isToday,
        is_read_by_user: true,
        sourceType: 'reminder',
      });
    }

    // EventNotifications (strictly upcoming starting today onwards)
    for (const notif of eventNotifications) {
      const dateStr = notif.event_date || (notif.scheduled_for ? notif.scheduled_for.slice(0, 10) : null);
      if (dateStr && dateStr < today) {
        continue;
      }
      const isToday = dateStr ? dateStr === today : false;
      items.push({
        id: notif.id,
        title: notif.title,
        message: notif.message || '',
        event_date: dateStr,
        event_color: notif.event_color || '#EC4899',
        isPast: false,
        isToday,
        is_read_by_user: notif.is_read_by_user,
        sourceType: 'notification',
      });
    }

    // Filter to 30-day window from today
    const valid = items.filter((item) => {
      if (!item.event_date) return true;
      const datePart = item.event_date.slice(0, 10);
      return datePart >= today && datePart <= in30Days;
    });

    // Sort: soonest first
    return valid.sort((a, b) => {
      return (a.event_date || '').localeCompare(b.event_date || '');
    });
  }, [reminderEvents, eventNotifications]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [votdData, devotionsData, torahData] = await Promise.allSettled([
          api.getTodayVOTD(),
          user ? api.getDevotions() : Promise.resolve([]),
          api.getTorahThisWeek(),
        ]);

        if (votdData.status === 'fulfilled') setVotd(votdData.value);
        if (devotionsData.status === 'fulfilled' && Array.isArray(devotionsData.value)) {
          setRecentDevotions(devotionsData.value.slice(0, 2));
        }
        if (torahData.status === 'fulfilled') setTorahThisWeek(torahData.value);
      } catch (err) {
        console.error('Failed loading dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    loadEvents();
  }, [user, router.asPath]);

  const handleReadVotd = () => {
    if (votd) {
      setCurrentBook(votd.book);
      setCurrentChapter(votd.chapter);
      if (votd.bible_version) setCurrentVersion(votd.bible_version);
      router.push('/bible');
    }
  };

  const handleVotdToDevotion = () => {
    if (votd) {
      router.push({
        pathname: '/devotions',
        query: {
          insert_verse: 'true',
          book: votd.book,
          chapter: votd.chapter,
          verse_start: votd.verse_start,
          verse_end: votd.verse_end,
          version: votd.bible_version,
          text: votd.verse_text,
        },
      });
    }
  };

  const extractSnippet = (content?: string | null): string => {
    if (!content) return '';
    let text = content.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, '');
    text = text.replace(/<(br|\/p|\/div|\/h[1-6]|\/li|\/tr|\/td|\/blockquote)[^>]*>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
  };

  return (
    <>
      <PageLayout title="Home" items={[]} />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-10 shadow-xl border border-stone-800">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Daily Walk with God
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}.
            </h1>
            <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-serif">
              “Your word is a lamp to my feet and a light to my path.” Take a quiet moment today to reflect, read, and write.
            </p>
          </div>
          {/* Subtle background glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Highlights Carousel (Slideshow) */}
        <HighlightsCarousel />

        {/* Grid: Verse of the Day & Continue Reading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Verse of the Day Card (2 Columns) */}
          <div className="md:col-span-2 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Verse of the Day
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {votd?.bible_version || 'KJV'}
                </span>
              </div>

              {votd ? (
                <>
                  <blockquote className="font-serif text-lg sm:text-xl text-stone-800 dark:text-stone-100 leading-relaxed italic">
                    “{votd.verse_text}”
                  </blockquote>
                  <p className="text-sm font-semibold text-stone-900 dark:text-amber-400">
                    — {votd.reference}
                  </p>
                  {votd.message && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal bg-stone-50 dark:bg-stone-800/70 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800/80">
                      {votd.message}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-6 text-stone-400 text-sm">Loading scripture...</div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6">
              <button
                type="button"
                onClick={handleReadVotd}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" /> Read Chapter
              </button>
              <button
                type="button"
                onClick={handleVotdToDevotion}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Insights
              </button>
            </div>
          </div>

          {/* Continue Reading Card (1 Column) */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Continue Reading
              </span>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {currentBook} {currentChapter}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Translation: {currentVersion}</p>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-serif">
                Pick up right where you left off in your study and reflection.
              </p>
            </div>

            <Link
              href="/bible"
              className="mt-6 inline-flex items-center justify-between w-full text-xs font-semibold px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
            >
              <span>Open Reader</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Torah Portion for this Week */}
        {torahThisWeek && (
          <section className="rounded-3xl bg-gradient-to-br from-amber-500/5 via-stone-50 to-stone-100 dark:from-amber-950/20 dark:via-stone-900/90 dark:to-stone-900 p-6 sm:p-8 border border-amber-200/70 dark:border-amber-900/40 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Scroll className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                    Torah Portion for this Week
                  </span>
                  {torahThisWeek.hdate && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                      {torahThisWeek.hdate}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 pt-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                    {torahThisWeek.name}
                  </h2>
                  {torahThisWeek.hebrew_name && (
                    <span className="text-xl sm:text-2xl font-serif text-amber-700 dark:text-amber-400" dir="rtl">
                      {torahThisWeek.hebrew_name}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/torah?portion=${torahThisWeek.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm hover:shadow transition-all self-start sm:self-center"
              >
                <span>Read Torah Portion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Exactly: Name, English translation, Tagalog translation, Torah verse, Prophet verse, Gospel verse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
                  English Translation
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  “{torahThisWeek.english_meaning}”
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
                  Tagalog Translation
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  “{torahThisWeek.tagalog_meaning}”
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                  📜 Torah Bible Verse
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {torahThisWeek.torah_ref}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  🎺 Prophet Bible Verse (Haftarah)
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {torahThisWeek.prophet_ref}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 sm:col-span-2 lg:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  ✝️ Gospel Bible Verse (B'rit Chadashah)
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {torahThisWeek.gospel_ref}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Announcements & Reminders Card (if any exist) */}
        {combinedAnnouncements.length > 0 && (
          <section className="rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h2 className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 truncate">
                  Announcements & Reminders
                </h2>
                {unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-red-500 text-white shrink-0">
                    {unreadNotifCount} NEW
                  </span>
                )}
              </div>
              <Link
                href="/calendar?tab=reminders"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {combinedAnnouncements.slice(0, 3).map((item) => {
                const isUnread = !item.is_read_by_user;
                return (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/calendar?tab=reminders&eventId=${item.id}`)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer block border ${
                      isUnread
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400/80 dark:border-amber-500/80 shadow-xs'
                        : 'bg-stone-50/80 dark:bg-stone-800/60 border-stone-200/70 dark:border-stone-700/70 hover:border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.event_color || '#EC4899' }}
                          />
                          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {item.title}
                          </h4>
                        </div>
                        {item.isPast ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            <Check className="w-2.5 h-2.5" /> Done
                          </span>
                        ) : item.isToday ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/18 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            Today
                          </span>
                        ) : null}
                      </div>
                      {item.event_date && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0 whitespace-nowrap self-start">
                          {item.event_date}
                        </span>
                      )}
                    </div>

                    {item.message ? (
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                        {item.message}
                      </p>
                    ) : null}

                    {user && item.sourceType === 'notification' && isUnread && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-amber-200/40 dark:border-amber-800/30">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(item.id);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Community Events Card */}
        <section className="rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h2 className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 truncate">
                Community Events & Gatherings
              </h2>
            </div>
            <Link
              href="/calendar?tab=upcoming"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              View All →
            </Link>
          </div>

          {eventsLoading ? (
            <div className="py-8 text-center text-xs text-stone-400 animate-pulse">
              Loading community events...
            </div>
          ) : communityEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {communityEvents.slice(0, 4).map((evt) => {
                const status = getEventStatus(evt.date, evt.end_date);
                return (
                  <div
                    key={evt.id}
                    onClick={() => router.push(`/calendar?tab=upcoming&eventId=${evt.id}`)}
                    className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 border-l-4 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all cursor-pointer shadow-xs flex flex-col justify-between space-y-2.5 group"
                    style={{ borderLeftColor: evt.color || '#D97706' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {evt.title}
                          </h4>
                          {status.isPast ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              <Check className="w-2.5 h-2.5" /> Done
                            </span>
                          ) : status.isToday ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/18 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                              Today
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                              Upcoming
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0 whitespace-nowrap self-start">
                          {status.formattedDateRange}
                        </span>
                      </div>

                      {evt.description ? (
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                          {evt.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                      {evt.is_all_day ? (
                        <span className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-500" /> All Day
                        </span>
                      ) : evt.start_time ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {evt.start_time.slice(0, 5)}
                          {evt.end_time ? ` - ${evt.end_time.slice(0, 5)}` : ''}
                        </span>
                      ) : null}

                      {evt.location ? (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {evt.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-stone-50/50 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
              No community events scheduled within the next 30 days. Check back soon for assemblies & gatherings.
            </div>
          )}
        </section>

        {/* Section: Recent Devotions (Logged-in only) */}
        {user ? (
          <section className="rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                  Recent Insights & Devotions
                </h2>
              </div>
              <Link href="/devotions" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                View all →
              </Link>
            </div>

            {recentDevotions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {recentDevotions.map((dev) => (
                  <Link
                    key={dev.id}
                    href={`/devotions?id=${dev.id}`}
                    className="block p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 hover:border-amber-500/60 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">{dev.title}</h4>
                      <span className="text-[11px] text-stone-400">{dev.date}</span>
                    </div>
                    {extractSnippet(dev.snippet) ? (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 font-serif">{extractSnippet(dev.snippet)}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-stone-50/50 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-3">
                <p className="text-xs text-stone-500">You haven't written an insight or devotion yet today.</p>
                <Link
                  href="/devotions?action=new"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Journaling
                </Link>
              </div>
            )}
          </section>
        ) : (
          /* Exploration Section for Guests / Unauthenticated Users */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/feasts"
              className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 hover:shadow-md transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  The Biblical Feasts (Moedim)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed font-serif">
                  Explore the 7 God-ordained feasts of Leviticus 23 and their prophetic fulfillments in Messiah.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Explore Feasts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/hebrew"
              className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 hover:shadow-md transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Learn Biblical Hebrew
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed font-serif">
                  Master the Alef-Bet, explore covenant word roots, and listen to authentic Hebrew pronunciations.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Start Learning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
