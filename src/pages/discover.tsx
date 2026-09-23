import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Calendar, Clock, MapPin, Lightbulb, BookOpen, ArrowRight } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { api } from '../services/api';

const TOPICS = [
  { name: 'Overcoming Anxiety', ref: 'Philippians 4:6-7', book: 'Philippians', chapter: 4 },
  { name: 'Finding Real Purpose', ref: 'John 6:27-35', book: 'John', chapter: 6 },
  { name: 'Grace & Truth', ref: 'John 1:1-14', book: 'John', chapter: 1 },
  { name: 'The Shepherd’s Care', ref: 'Psalms 23:1-6', book: 'Psalms', chapter: 23 },
];

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getUpcomingEvents();
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <>
      <PageLayout title="Discover" items={[{ label: 'Discover' }]} />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 sm:p-10 shadow-lg">
          <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
            Community & Exploration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-2">Explore Truth & Community</h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl font-serif">
            Join youth fellowships, discover topical scriptures addressing modern challenges, and deepen your spiritual journey.
          </p>
        </div>

        {/* Study Topics */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Youth Study Topics</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {TOPICS.map((topic, idx) => (
              <Link
                key={idx}
                href={`/bible`}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">{topic.name}</h4>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{topic.ref}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs text-stone-400 font-medium">
                  <span>Read Chapter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Upcoming Gatherings & Events</span>
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-stone-400 animate-pulse">Loading events...</div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">{evt.title}</h3>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40">
                      {evt.date}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-serif">
                    {evt.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-stone-400 border-t border-stone-100 dark:border-stone-800/80">
                    {evt.start_time && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {evt.start_time.slice(0, 5)} {evt.end_time && `- ${evt.end_time.slice(0, 5)}`}
                      </span>
                    )}
                    {evt.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {evt.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
              No upcoming events currently scheduled. Check back soon!
            </div>
          )}
        </section>
      </div>
    </>
  );
}
