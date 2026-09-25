import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, Sparkles, Calendar, ArrowRight, Bookmark, Plus, Clock, MapPin, Scroll } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function Home() {
  const router = useRouter();
  const { user, currentBook, currentChapter, currentVersion, setCurrentBook, setCurrentChapter, setCurrentVersion } = useApp();

  const [votd, setVotd] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [recentDevotions, setRecentDevotions] = useState<any[]>([]);
  const [torahThisWeek, setTorahThisWeek] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [votdData, eventsData, devotionsData, torahData] = await Promise.allSettled([
          api.getTodayVOTD(),
          api.getUpcomingEvents(),
          user ? api.getDevotions() : Promise.resolve([]),
          api.getTorahThisWeek(),
        ]);

        if (votdData.status === 'fulfilled') setVotd(votdData.value);
        if (eventsData.status === 'fulfilled') setEvents(eventsData.value.slice(0, 3));
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
                  <blockquote className="font-serif text-lg sm:text-xl text-stone-800 dark:text-stone-150 leading-relaxed italic">
                    “{votd.verse_text}”
                  </blockquote>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-200">
                    — {votd.reference}
                  </p>
                  {votd.message && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
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
                <Plus className="w-3.5 h-3.5" /> Add to Devotion
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
                <p className="text-xs text-stone-500 mt-1">Translation: {currentVersion}</p>
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
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
                  English Translation
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  “{torahThisWeek.english_meaning}”
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
                  Tagalog Translation
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  “{torahThisWeek.tagalog_meaning}”
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                  📜 Torah Bible Verse
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {torahThisWeek.torah_ref}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  🎺 Prophet Bible Verse (Haftarah)
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {torahThisWeek.prophet_ref}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750 sm:col-span-2 lg:col-span-2">
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

        {/* Section: Recent Devotions & Upcoming Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Devotions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Recent Devotions</h2>
              <Link href="/devotions" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                View all
              </Link>
            </div>

            {recentDevotions.length > 0 ? (
              <div className="space-y-3">
                {recentDevotions.map((dev) => (
                  <Link
                    key={dev.id}
                    href={`/devotions?id=${dev.id}`}
                    className="block p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 transition-all shadow-sm"
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
              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-3">
                <p className="text-xs text-stone-500">You haven't written a devotion yet today.</p>
                <Link
                  href="/devotions?action=new"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Journaling
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Upcoming Events</h2>
              <Link href="/discover" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                Discover
              </Link>
            </div>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{evt.title}</h4>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{evt.date}</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">{evt.description}</p>
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-stone-400">
                      {evt.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" /> {evt.start_time.slice(0, 5)}
                        </span>
                      )}
                      {evt.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-stone-400" /> {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                No upcoming community events currently scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
