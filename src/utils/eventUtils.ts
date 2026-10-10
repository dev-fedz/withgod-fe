/**
 * Utility helpers for event and reminder filtering and date calculations.
 * Supports:
 * - 30-day window starting from current date
 * - Past / already done detection
 * - Event type separation: Community Events ('event') vs Announcements/Reminders ('reminder')
 */

export function getLocalISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysAheadISODate(daysAhead: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + daysAhead);
  return getLocalISODate(d);
}

export interface EventStatusInfo {
  isPast: boolean;
  isToday: boolean;
  isWithin30Days: boolean;
  isBeyond30Days: boolean;
  statusLabel: 'Done' | 'Today' | 'Upcoming' | 'Future';
  formattedDateRange: string;
}

export function getEventStatus(date: string, endDate?: string | null): EventStatusInfo {
  const today = getLocalISODate();
  const in30Days = getDaysAheadISODate(30);
  const end = endDate || date;

  const isPast = end < today;
  const isToday = !isPast && date <= today && end >= today;
  const isWithin30Days = !isPast && date <= in30Days;
  const isBeyond30Days = !isPast && date > in30Days;

  let statusLabel: 'Done' | 'Today' | 'Upcoming' | 'Future' = 'Upcoming';
  if (isPast) {
    statusLabel = 'Done';
  } else if (isToday) {
    statusLabel = 'Today';
  } else if (isBeyond30Days) {
    statusLabel = 'Future';
  } else {
    statusLabel = 'Upcoming';
  }

  const formattedDateRange = endDate && endDate !== date ? `${date} – ${endDate}` : date;

  return {
    isPast,
    isToday,
    isWithin30Days,
    isBeyond30Days,
    statusLabel,
    formattedDateRange,
  };
}

/**
 * Filter events according to rule:
 * - Shows events for the 30 days starting from current date (inclusive of today)
 * - Also shows past events (meaning already done)
 * - Excludes events beyond 30 days into the future
 */
export function filter30DaysAndPastEvents<T extends { date: string; end_date?: string | null }>(
  items: T[]
): T[] {
  const today = getLocalISODate();
  const in30Days = getDaysAheadISODate(30);

  return items.filter((item) => {
    const end = item.end_date || item.date;
    const isPast = end < today;
    const isWithin30 = !isPast && item.date <= in30Days;
    return isPast || isWithin30;
  });
}

/**
 * Sorts filtered events:
 * 1. Active / Upcoming within 30 days first (ascending: soonest first)
 * 2. Past / Done events second (descending: most recently finished first)
 */
export function sortEvents30DaysAndPast<T extends { date: string; end_date?: string | null }>(
  items: T[]
): T[] {
  const today = getLocalISODate();

  const active: T[] = [];
  const past: T[] = [];

  for (const item of items) {
    const end = item.end_date || item.date;
    if (end < today) {
      past.push(item);
    } else {
      active.push(item);
    }
  }

  // Active sorted soonest first
  active.sort((a, b) => a.date.localeCompare(b.date));
  // Past sorted most recent first
  past.sort((a, b) => (b.end_date || b.date).localeCompare(a.end_date || a.date));

  return [...active, ...past];
}

export function isEventPast(date: string, endDate?: string | null): boolean {
  const today = getLocalISODate();
  const end = endDate || date;
  return end < today;
}

/**
 * Filter events specifically for the Home Page:
 * Shows ONLY active/upcoming events starting today onwards within the 30-day window.
 * Past events are strictly EXCLUDED (will not be shown on home page).
 * Events scheduled beyond 30 days are excluded.
 */
export function filterUpcoming30DaysEvents<T extends { date: string; end_date?: string | null }>(
  items: T[]
): T[] {
  const today = getLocalISODate();
  const in30Days = getDaysAheadISODate(30);

  return items.filter((item) => {
    const end = item.end_date || item.date;
    // Must not be past (concluded before today)
    const isNotPast = end >= today;
    // Must start within the 30-day window
    const startsWithin30 = item.date <= in30Days;
    return isNotPast && startsWithin30;
  });
}

/**
 * Sorts upcoming events soonest first (ascending by date, then start_time if available)
 */
export function sortUpcomingEvents<T extends { date: string; start_time?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });
}
